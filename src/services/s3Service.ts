import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: S3Config) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucketName = config.bucketName;
  }

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const key = file.name;
    
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: file.type,
          Metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      if (onProgress) {
        upload.on('httpUploadProgress', (progress) => {
          if (progress.loaded && progress.total) {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            onProgress(percentage);
          }
        });
      }

      await upload.done();
      return key;
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Failed to upload ${file.name}: ${error}`);
    }
  }

  async uploadMultipleFiles(
    files: File[],
    onProgress?: (fileName: string, progress: number) => void,
    onComplete?: (fileName: string, success: boolean, key?: string) => void
  ): Promise<{ success: string[]; failed: string[] }> {
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };
    
    const uploadPromises = files.map(async (file) => {
      try {
        const key = await this.uploadFile(file, (progress) => {
          onProgress?.(file.name, progress);
        });
        results.success.push(key);
        onComplete?.(file.name, true, key);
      } catch (error) {
        results.failed.push(file.name);
        onComplete?.(file.name, false);
        console.error(`Failed to upload ${file.name}:`, error);
      }
    });

    await Promise.all(uploadPromises);
    return results;
  }

  async checkFileExists(fileName: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async checkMultipleFilesExist(fileNames: string[]): Promise<{ existing: string[]; new: string[] }> {
    const results: { existing: string[]; new: string[] } = { existing: [], new: [] };
    
    const checkPromises = fileNames.map(async (fileName) => {
      const exists = await this.checkFileExists(fileName);
      if (exists) {
        results.existing.push(fileName);
      } else {
        results.new.push(fileName);
      }
    });

    await Promise.all(checkPromises);
    return results;
  }

  async uploadMultipleFilesWithConflictDetection(
    files: File[],
    onProgress?: (fileName: string, progress: number) => void,
    onComplete?: (fileName: string, success: boolean, key?: string) => void,
    onConflict?: (conflictingFiles: string[]) => Promise<string[]>
  ): Promise<{ success: string[]; failed: string[]; conflicts: string[] }> {
    const results: { success: string[]; failed: string[]; conflicts: string[] } = { 
      success: [], 
      failed: [], 
      conflicts: [] 
    };

    const fileNames = files.map(file => file.name);
    const existenceCheck = await this.checkMultipleFilesExist(fileNames);

    if (existenceCheck.existing.length > 0 && onConflict) {
      const filesToOverwrite = await onConflict(existenceCheck.existing);
      
      const filesToUpload = files.filter(file => 
        existenceCheck.new.includes(file.name) || filesToOverwrite.includes(file.name)
      );
      
      const skippedFiles = existenceCheck.existing.filter(fileName => 
        !filesToOverwrite.includes(fileName)
      );
      
      results.conflicts = skippedFiles;

      if (filesToUpload.length > 0) {
        const uploadResults = await this.uploadMultipleFiles(
          filesToUpload,
          onProgress,
          onComplete
        );
        results.success = uploadResults.success;
        results.failed = uploadResults.failed;
      }
    } else {
      const uploadResults = await this.uploadMultipleFiles(files, onProgress, onComplete);
      results.success = uploadResults.success;
      results.failed = uploadResults.failed;
    }

    return results;
  }

  getFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}

export default S3Service;