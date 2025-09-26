import { useEffect, useState } from 'react';
import { Upload, FileText, MessageSquare, Trash2, Plus } from 'lucide-react';
import { bankStatementAPI } from '../services/api';

const BankStatements = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const loadFiles = async () => {
    try {
      setLoadingFiles(true);
      const res = await bankStatementAPI.listFiles();
      if (res.success) {
        setFiles(res.data.files || []);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    try {
      setUploading(true);
      const res = await bankStatementAPI.uploadFile(file);
      if (res.success) {
        await loadFiles(); // Reload files list
        alert('Bank statement uploaded successfully!');
      } else {
        alert(res.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this bank statement?')) return;

    try {
      const res = await bankStatementAPI.deleteFile(fileId);
      if (res.success) {
        await loadFiles(); // Reload files list
        alert('Bank statement deleted successfully!');
      } else {
        alert(res.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  const handleChatWithFile = (fileId) => {
    // This could trigger opening the chatbot with the specific file selected
    // For now, we'll just show an alert
    alert(`Chat with file ${fileId} - This will be integrated with the chatbot`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Bank Statements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload and manage your bank statements for AI-powered analysis
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload Bank Statement
          </h2>
          
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex flex-col items-center">
              <Upload size={32} className="text-gray-400 mb-2" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {uploading ? 'Uploading...' : 'Click to upload PDF bank statement'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Supported format: PDF only
              </div>
            </div>
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Bank Statements
          </h2>
        </div>
        
        <div className="p-6">
          {loadingFiles ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Loading bank statements...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium mb-2">No bank statements uploaded yet</h3>
              <p className="text-sm">Upload your first bank statement to get started with AI-powered analysis</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <FileText size={24} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.metadata?.original_name || `Statement ${file.id}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded on {file.metadata?.upload_date ? new Date(file.metadata.upload_date).toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleChatWithFile(file.id)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Chat with this statement"
                    >
                      <MessageSquare size={16} />
                      <span>Chat</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="Delete statement"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankStatements;
