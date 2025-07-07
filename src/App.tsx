import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ConflictResolution from './components/ConflictResolution';
import S3Service from './services/s3Service';
import { Database, Upload, AlertCircle } from 'lucide-react';

function App() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error' | 'skipped'>>({});
  const [s3Service, setS3Service] = useState<S3Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflictingFiles, setConflictingFiles] = useState<string[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // Remove unused variable warning
  console.log(pendingFiles.length > 0 ? 'Files pending upload' : 'No pending files');

  React.useEffect(() => {
    const region = process.env.REACT_APP_AWS_REGION;
    const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.REACT_APP_S3_BUCKET_NAME;

    if (region && accessKeyId && secretAccessKey && bucketName) {
      const service = new S3Service({
        region,
        accessKeyId,
        secretAccessKey,
        bucketName,
      });
      setS3Service(service);
    } else {
      setError('AWS configuration is missing. Please check your environment variables.');
    }
  }, []);

  const handleFileUpload = async (files: File[]) => {
    if (!s3Service) {
      setError('S3 service is not initialized');
      return;
    }

    setUploading(true);
    setError(null);
    setPendingFiles(files);

    const initialStatus: Record<string, 'pending' | 'uploading' | 'success' | 'error' | 'skipped'> = {};
    const initialProgress: Record<string, number> = {};
    
    files.forEach(file => {
      initialStatus[file.name] = 'pending';
      initialProgress[file.name] = 0;
    });

    setUploadStatus(initialStatus);
    setUploadProgress(initialProgress);

    try {
      await s3Service.uploadMultipleFilesWithConflictDetection(
        files,
        (fileName, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileName]: progress,
          }));
        },
        (fileName, success) => {
          setUploadStatus(prev => ({
            ...prev,
            [fileName]: success ? 'success' : 'error',
          }));
        },
        async (conflictingFileNames) => {
          setConflictingFiles(conflictingFileNames);
          setShowConflictDialog(true);
          setUploading(false);

          return new Promise((resolve) => {
            window.conflictResolver = resolve;
          });
        }
      );

      if (!showConflictDialog) {
        setUploading(false);
      }
    } catch (err) {
      setError(`Upload failed: ${err}`);
      setUploading(false);
    }
  };

  const handleConflictResolution = async (filesToOverwrite: string[]) => {
    setShowConflictDialog(false);
    setUploading(true);

    if (window.conflictResolver) {
      window.conflictResolver(filesToOverwrite);
      window.conflictResolver = undefined;
    }

    const skippedFiles = conflictingFiles.filter(fileName => !filesToOverwrite.includes(fileName));
    skippedFiles.forEach(fileName => {
      setUploadStatus(prev => ({
        ...prev,
        [fileName]: 'skipped',
      }));
    });

    setUploading(false);
  };

  const handleConflictCancel = () => {
    setShowConflictDialog(false);
    setUploading(false);
    
    conflictingFiles.forEach(fileName => {
      setUploadStatus(prev => ({
        ...prev,
        [fileName]: 'skipped',
      }));
    });

    if (window.conflictResolver) {
      window.conflictResolver([]);
      window.conflictResolver = undefined;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Database className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Knowledge Graph Uploader</h1>
          </div>
          <p className="text-lg text-gray-600">
            Upload files to build your knowledge graph with OpenLink Software
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <FileUpload
              onFileUpload={handleFileUpload}
              uploading={uploading}
              uploadProgress={uploadProgress}
              uploadStatus={uploadStatus}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <Upload className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              How it works
            </h3>
            <p className="text-blue-700">
              Upload your documents, images, and media files. They'll be stored in your AWS S3 bucket
              and integrated into your knowledge graph powered by OpenLink Software AMI.
            </p>
          </div>
        </div>

        {showConflictDialog && (
          <ConflictResolution
            conflictingFiles={conflictingFiles}
            onResolve={handleConflictResolution}
            onCancel={handleConflictCancel}
          />
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    conflictResolver?: (filesToOverwrite: string[]) => void;
  }
}

export default App;
