import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import FileBrowser from './components/FileBrowser';
import ConflictResolution from './components/ConflictResolution';
import S3Service from './services/s3Service';
import { Database, Upload, AlertCircle, FolderOpen, Home } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Upload', icon: Upload },
    { path: '/browse', label: 'Browse Files', icon: FolderOpen },
  ];

  return (
    <nav className="bg-white shadow-sm border-b mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Database className="w-8 h-8 text-blue-600 mr-3" />
            <span className="text-xl font-bold text-gray-900">Knowledge Graph</span>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function UploadPage() {
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
    const bucketName = process.env.REACT_APP_S3_BUCKET_NAME;

    if (region && bucketName) {
      const service = new S3Service({
        region,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Files</h1>
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
  );
}

function BrowsePage() {
  const region = process.env.REACT_APP_AWS_REGION;
  const bucketName = process.env.REACT_APP_S3_BUCKET_NAME;

  if (!region || !bucketName) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">AWS configuration is missing. Please check your environment variables.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <FileBrowser bucketName={bucketName} region={region} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/browse" element={<BrowsePage />} />
        </Routes>
      </div>
    </Router>
  );
}

declare global {
  interface Window {
    conflictResolver?: (filesToOverwrite: string[]) => void;
  }
}

export default App;