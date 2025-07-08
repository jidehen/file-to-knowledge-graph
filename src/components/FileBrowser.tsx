import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  Code, 
  File,
  Grid3X3,
  List,
  Calendar,
  HardDrive,
  SortAsc,
  SortDesc
} from 'lucide-react';
import S3BrowserService, { S3Object } from '../services/s3BrowserService';

interface FileBrowserProps {
  bucketName: string;
  region: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'size' | 'date';
type SortOrder = 'asc' | 'desc';

const FileBrowser: React.FC<FileBrowserProps> = ({ bucketName, region }) => {
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [s3Service] = useState(() => new S3BrowserService({ bucketName, region }));

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    filterAndSortObjects();
  }, [objects, searchTerm, sortField, sortOrder, selectedType]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedObjects = await s3Service.listObjects();
      setObjects(fetchedObjects);
    } catch (err) {
      setError(`Failed to load files: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortObjects = () => {
    let filtered = objects.filter(obj => {
      const matchesSearch = obj.key.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || s3Service.getFileTypeIcon(obj.key) === selectedType;
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = s3Service.getFileName(a.key).toLowerCase();
          bValue = s3Service.getFileName(b.key).toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'date':
          aValue = a.lastModified.getTime();
          bValue = b.lastModified.getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredObjects(filtered);
  };

  const getFileIcon = (obj: S3Object) => {
    const type = s3Service.getFileTypeIcon(obj.key);
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'image': return <Image className={`${iconClass} text-green-500`} />;
      case 'video': return <Video className={`${iconClass} text-red-500`} />;
      case 'audio': return <Music className={`${iconClass} text-purple-500`} />;
      case 'document': return <FileText className={`${iconClass} text-blue-500`} />;
      case 'archive': return <Archive className={`${iconClass} text-yellow-500`} />;
      case 'code': return <Code className={`${iconClass} text-green-600`} />;
      default: return <File className={`${iconClass} text-gray-500`} />;
    }
  };

  const getLargeFileIcon = (obj: S3Object) => {
    const type = s3Service.getFileTypeIcon(obj.key);
    const iconClass = "w-8 h-8";
    
    switch (type) {
      case 'image': return <Image className={`${iconClass} text-green-500`} />;
      case 'video': return <Video className={`${iconClass} text-red-500`} />;
      case 'audio': return <Music className={`${iconClass} text-purple-500`} />;
      case 'document': return <FileText className={`${iconClass} text-blue-500`} />;
      case 'archive': return <Archive className={`${iconClass} text-yellow-500`} />;
      case 'code': return <Code className={`${iconClass} text-green-600`} />;
      default: return <File className={`${iconClass} text-gray-500`} />;
    }
  };


  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const fileTypes = [
    { value: 'all', label: 'All Files', icon: File },
    { value: 'image', label: 'Images', icon: Image },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'audio', label: 'Audio', icon: Music },
    { value: 'document', label: 'Documents', icon: FileText },
    { value: 'archive', label: 'Archives', icon: Archive },
    { value: 'code', label: 'Code', icon: Code },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg text-gray-600">Loading files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadFiles}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">File Browser</h2>
            <p className="opacity-90">Bucket: {bucketName}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{filteredObjects.length}</div>
            <div className="text-sm opacity-90">
              {filteredObjects.length === 1 ? 'file' : 'files'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {fileTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadFiles}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <div className="border-l pl-2 ml-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File Display */}
      {filteredObjects.length === 0 ? (
        <div className="text-center py-12">
          <HardDrive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'No files in this bucket yet'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredObjects.map((obj) => (
            <div
              key={obj.key}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <div className="flex items-center justify-center mb-3">
                {getLargeFileIcon(obj)}
              </div>
              
              <h3 className="font-medium text-sm text-gray-900 mb-2 truncate" title={s3Service.getFileName(obj.key)}>
                {s3Service.getFileName(obj.key)}
              </h3>
              
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  {s3Service.formatFileSize(obj.size)}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {obj.lastModified.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-1"></div>
              <div 
                className="col-span-6 cursor-pointer flex items-center gap-1 hover:text-blue-600"
                onClick={() => toggleSort('name')}
              >
                Name
                {sortField === 'name' && (
                  sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </div>
              <div 
                className="col-span-3 cursor-pointer flex items-center gap-1 hover:text-blue-600"
                onClick={() => toggleSort('size')}
              >
                Size
                {sortField === 'size' && (
                  sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </div>
              <div 
                className="col-span-3 cursor-pointer flex items-center gap-1 hover:text-blue-600"
                onClick={() => toggleSort('date')}
              >
                Modified
                {sortField === 'date' && (
                  sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                )}
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredObjects.map((obj) => (
              <div
                key={obj.key}
                className="px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    {getFileIcon(obj)}
                  </div>
                  <div className="col-span-6">
                    <div className="font-medium text-gray-900 truncate" title={s3Service.getFileName(obj.key)}>
                      {s3Service.getFileName(obj.key)}
                    </div>
                  </div>
                  <div className="col-span-3 text-sm text-gray-600">
                    {s3Service.formatFileSize(obj.size)}
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {obj.lastModified.toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileBrowser;