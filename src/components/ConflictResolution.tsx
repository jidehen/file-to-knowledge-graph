import React, { useState } from 'react';
import { AlertTriangle, Check, FileText, RotateCcw } from 'lucide-react';

interface ConflictResolutionProps {
  conflictingFiles: string[];
  onResolve: (filesToOverwrite: string[]) => void;
  onCancel: () => void;
}

const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  conflictingFiles,
  onResolve,
  onCancel,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const toggleFile = (fileName: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    setSelectedFiles(new Set(conflictingFiles));
  };

  const selectNone = () => {
    setSelectedFiles(new Set());
  };

  const handleResolve = () => {
    onResolve(Array.from(selectedFiles));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                File Conflicts Detected
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                The following files already exist in your S3 bucket. Select which files you want to overwrite and create new versions.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {conflictingFiles.length} conflicting file{conflictingFiles.length !== 1 ? 's' : ''}
            </span>
            <div className="space-x-2">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={selectNone}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Select None
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {conflictingFiles.map((fileName) => (
              <div
                key={fileName}
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedFiles.has(fileName)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleFile(fileName)}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fileName}</p>
                    <p className="text-xs text-gray-500">
                      {selectedFiles.has(fileName) 
                        ? 'Will be overwritten (new version created)'
                        : 'Will be skipped'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedFiles.has(fileName) && (
                    <RotateCcw className="w-4 h-4 text-blue-500" />
                  )}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedFiles.has(fileName)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedFiles.has(fileName) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedFiles.size > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">
                    S3 Versioning Notice
                  </p>
                  <p className="text-yellow-700 mt-1">
                    {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} will be overwritten. 
                    If S3 versioning is enabled, previous versions will be preserved.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel Upload
          </button>
          <button
            onClick={handleResolve}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue Upload
            {selectedFiles.size > 0 && (
              <span className="ml-1">({selectedFiles.size} to overwrite)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolution;