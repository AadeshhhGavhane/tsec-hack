import { useEffect, useState } from 'react';
import { Upload, FileText, Trash2, Plus } from 'lucide-react';
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


  return (
        <div className="h-full p-4 space-y-6 overflow-y-auto" style={{ backgroundColor: 'var(--gray-light)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-3 uppercase tracking-wider">
          Bank Statements
        </h1>
        <p className="text-black font-bold text-base">
          Upload and manage your bank statements for AI-powered analysis
        </p>
      </div>

      {/* Upload Section */}
      <div className="brutal-card p-4">
        <h2 className="text-lg font-black text-black mb-4 uppercase tracking-wide">
          Upload Bank Statement
        </h2>
        
        <label className="flex items-center justify-center w-full h-32 brutal-border brutal-shadow brutal-shadow-hover cursor-pointer bg-orange-100 dark:bg-orange-200 transition-all duration-200">
          <div className="flex flex-col items-center">
            <Upload size={32} className="mb-2 font-bold" style={{ color: '#1a1a1a' }} />
            <div className="text-sm font-black uppercase tracking-wide text-center" style={{ color: '#1a1a1a' }}>
              {uploading ? 'Uploading...' : 'Click to upload PDF bank statement'}
            </div>
            <div className="text-xs font-bold mt-1" style={{ color: '#1a1a1a' }}>
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

      {/* Files List */}
      <div className="brutal-card">
        <div className="p-4 brutal-border-b-3">
          <h2 className="text-lg font-black text-black uppercase tracking-wide">
            Your Bank Statements
          </h2>
        </div>
        
        <div className="p-4">
          {loadingFiles ? (
            <div className="text-center text-black py-8">
              <div className="w-10 h-10 bg-orange-500 brutal-border brutal-shadow mx-auto mb-3 animate-brutal-pulse"></div>
              <div className="text-base font-black uppercase tracking-wide">Loading bank statements...</div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center text-black py-8">
              <FileText size={48} className="mx-auto mb-4 text-orange-500" />
              <h3 className="text-lg font-black mb-3 uppercase tracking-wide">No bank statements uploaded yet</h3>
              <p className="text-sm font-bold">Upload your first bank statement to get started with AI-powered analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="brutal-card bg-orange-50 dark:bg-orange-100">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0">
                        <FileText size={24} className="text-orange-500 font-bold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-black text-black truncate uppercase tracking-wide">
                          {file.metadata?.original_name || `Statement ${file.id}`}
                        </div>
                        <div className="text-xs text-black font-bold">
                          Uploaded on {file.metadata?.upload_date ? new Date(file.metadata.upload_date).toLocaleDateString() : 'Unknown date'}
                        </div>
                      </div>
                    </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs bg-red-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce w-full"
                            title="Delete statement"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
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
