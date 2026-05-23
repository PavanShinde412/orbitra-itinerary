import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, FileText, Image, X, ArrowLeft, Wand2 } from 'lucide-react';
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
    if (file.type === 'application/pdf') return <FileText size={40} color="#ef4444" />;
    return <Image size={40} color="var(--brand-color)" />;
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
        <motion.button 
          className="back-btn glass-pill" 
          onClick={() => navigate('/')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </motion.button>

        <motion.div 
          className="upload-card glass-panel"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.4 }}
        >
          <div className="upload-header">
            <h2 className="text-shimmer">Generate AI Itinerary</h2>
            <p>Upload your flight ticket, hotel booking or any travel document</p>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                className="processing-skeleton"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="skeleton-header">
                  <div className="skeleton-icon pulse"><Wand2 size={24} color="var(--brand-color)"/></div>
                  <div className="skeleton-title pulse"></div>
                  <div className="skeleton-subtitle pulse"></div>
                </div>
                <div className="skeleton-steps">
                  <div className="skeleton-step pulse delay-1 glass-panel">
                    <div className="step-indicator"></div>
                    <div className="step-text">Extracting document data...</div>
                  </div>
                  <div className="skeleton-step pulse delay-2 glass-panel">
                    <div className="step-indicator"></div>
                    <div className="step-text">Analyzing travel dates & locations...</div>
                  </div>
                  <div className="skeleton-step pulse delay-3 glass-panel">
                    <div className="step-indicator"></div>
                    <div className="step-text">Structuring your intelligent itinerary...</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="upload-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                >
                  <input {...getInputProps()} />
                  {!file ? (
                    <div className="dropzone-content">
                      <motion.div 
                        className="upload-icon-wrapper"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <UploadIcon size={48} color="var(--brand-color)" />
                      </motion.div>
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
                    <motion.div 
                      className="file-preview"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {getFileIcon()}
                      <div className="file-info">
                        <p className="file-name">{file.name}</p>
                        <p className="file-size">{formatSize(file.size)}</p>
                      </div>
                      <button
                        className="remove-file"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      >
                        <X size={20} />
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* What AI will do */}
                <div className="ai-info glass-panel">
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

                <motion.button
                  whileHover={file ? { scale: 1.02 } : {}}
                  whileTap={file ? { scale: 0.98 } : {}}
                  className="btn-generate"
                  onClick={handleUpload}
                  disabled={!file}
                >
                  <Wand2 size={20} />
                  Generate Itinerary
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Upload;