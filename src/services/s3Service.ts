interface S3Config {
  region: string;
  bucketName: string;
}

class S3Service {
  private bucketName: string;
  private region: string;
  private s3PostUrl: string;

  constructor(config: S3Config) {
    this.bucketName = config.bucketName;
    this.region = config.region;
    this.s3PostUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/`;
  }

  private createFormData(file: File): FormData {
    const formData = new FormData();
    const key = file.name;
    
    // Create POST policy
    const policy = {
      expiration: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      conditions: [
        { bucket: this.bucketName },
        { key: key },
        { 'Content-Type': file.type },
        { 'x-amz-server-side-encryption': 'AES256' },
        ['content-length-range', 0, 104857600], // 100MB max
      ],
    };

    const encodedPolicy = btoa(JSON.stringify(policy));
    
    formData.append('key', key);
    formData.append('Content-Type', file.type);
    formData.append('x-amz-server-side-encryption', 'AES256');
    formData.append('policy', encodedPolicy);
    formData.append('x-amz-meta-original-name', file.name);
    formData.append('x-amz-meta-uploaded-at', new Date().toISOString());
    formData.append('file', file);

    return formData;
  }

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const key = file.name;
    const formData = this.createFormData(file);
    
    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentage = Math.round((e.loaded / e.total) * 100);
            onProgress(percentage);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 204) {
            resolve(key);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        });

        xhr.open('POST', this.s3PostUrl);
        xhr.send(formData);
      });
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
      const response = await fetch(`https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      return false;
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
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

export default S3Service;