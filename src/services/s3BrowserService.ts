export interface S3Object {
  key: string;
  lastModified: Date;
  size: number;
  etag: string;
  storageClass: string;
}

interface S3Config {
  region: string;
  bucketName: string;
}

class S3BrowserService {
  private bucketName: string;
  private region: string;
  private baseUrl: string;

  constructor(config: S3Config) {
    this.bucketName = config.bucketName;
    this.region = config.region;
    this.baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
  }

  async listObjects(): Promise<S3Object[]> {
    try {
      const response = await fetch(`${this.baseUrl}?list-type=2&max-keys=1000`, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list objects: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      return this.parseListObjectsResponse(xmlText);
    } catch (error) {
      console.error('Error listing S3 objects:', error);
      throw error;
    }
  }

  private parseListObjectsResponse(xmlText: string): S3Object[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    
    const contents = doc.getElementsByTagName('Contents');
    const objects: S3Object[] = [];

    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      const key = content.getElementsByTagName('Key')[0]?.textContent || '';
      const lastModified = content.getElementsByTagName('LastModified')[0]?.textContent || '';
      const size = content.getElementsByTagName('Size')[0]?.textContent || '0';
      const etag = content.getElementsByTagName('ETag')[0]?.textContent || '';
      const storageClass = content.getElementsByTagName('StorageClass')[0]?.textContent || 'STANDARD';

      objects.push({
        key,
        lastModified: new Date(lastModified),
        size: parseInt(size, 10),
        etag: etag.replace(/"/g, ''),
        storageClass,
      });
    }

    return objects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  getFileUrl(key: string): string {
    return `${this.baseUrl}/${encodeURIComponent(key)}`;
  }

  getFileName(key: string): string {
    return key.split('/').pop() || key;
  }

  getFileExtension(key: string): string {
    const fileName = this.getFileName(key);
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileTypeIcon(key: string): string {
    const extension = this.getFileExtension(key);
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return 'image';
    }
    
    // Video files
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return 'video';
    }
    
    // Audio files
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension)) {
      return 'audio';
    }
    
    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return 'document';
    }
    
    // Spreadsheet files
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return 'spreadsheet';
    }
    
    // Presentation files
    if (['ppt', 'pptx'].includes(extension)) {
      return 'presentation';
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive';
    }
    
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c'].includes(extension)) {
      return 'code';
    }
    
    return 'file';
  }
}

export default S3BrowserService;