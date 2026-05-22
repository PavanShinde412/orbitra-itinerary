import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload as UploadIcon, FileText, Image, X, Loader } from 'lucide-react';
import API from '../api/axios';
import './Upload.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Only PDF, JPG and PNG files are allowed (max 10MB)');
      return;
    }
    setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file first');

    setLoading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await API.post('/itinerary/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Itinerary generated successfully! 🎉');
      navigate(`/itinerary/${res.data.data.itinerary._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Try again.');
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    if (file.type === 'application/pdf') return <FileText size={32} color="#ef4444" />;
    return <Image size={32} color="#3b82f6" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        {/* Back button */}
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>

        <div className="upload-card">
          <div className="upload-header">
            <h2>Generate AI Itinerary</h2>
            <p>Upload your flight ticket, hotel booking or any travel document</p>
          </div>

          {loading ? (
            <div className="processing-skeleton">
              <div className="skeleton-header">
                <div className="skeleton-icon pulse"></div>
                <div className="skeleton-title pulse"></div>
                <div className="skeleton-subtitle pulse"></div>
              </div>
              <div className="skeleton-steps">
                <div className="skeleton-step pulse delay-1">
                  <div className="step-indicator"></div>
                  <div className="step-text">Extracting document data...</div>
                </div>
                <div className="skeleton-step pulse delay-2">
                  <div className="step-indicator"></div>
                  <div className="step-text">Analyzing travel dates & locations...</div>
                </div>
                <div className="skeleton-step pulse delay-3">
                  <div className="step-indicator"></div>
                  <div className="step-text">Structuring your intelligent itinerary...</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              >
            <input {...getInputProps()} />
            {!file ? (
              <div className="dropzone-content">
                <UploadIcon size={40} color="#667eea" />
                <p className="drop-text">
                  {isDragActive
                    ? 'Drop your file here...'
                    : 'Drag & drop your document here'}
                </p>
                <p className="drop-sub">or click to browse files</p>
                <div className="supported-formats">
                  <span>PDF</span>
                  <span>JPG</span>
                  <span>PNG</span>
                  <span>Max 10MB</span>
                </div>
              </div>
            ) : (
              <div className="file-preview">
                {getFileIcon()}
                <div className="file-info">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{formatSize(file.size)}</p>
                </div>
                <button
                  className="remove-file"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

              {/* What AI will do */}
              <div className="ai-info">
                <h4>What happens next?</h4>
                <div className="ai-steps">
                  <div className="ai-step">
                    <span>1</span>
                    <p>AI reads and extracts info from your document</p>
                  </div>
                  <div className="ai-step">
                    <span>2</span>
                    <p>Generates a structured day-by-day itinerary</p>
                  </div>
                  <div className="ai-step">
                    <span>3</span>
                    <p>You can view, edit and share your itinerary</p>
                  </div>
                </div>
              </div>

              <button
                className="btn-generate"
                onClick={handleUpload}
                disabled={!file}
              >
                <UploadIcon size={18} />
                Generate Itinerary
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;