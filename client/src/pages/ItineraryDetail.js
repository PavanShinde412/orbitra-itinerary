import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  MapPin, Calendar, Clock, Share2, Copy,
  Trash2, ArrowLeft, Plane, Hotel, Utensils,
  Navigation, Loader, X, Download, MessageCircle, GripVertical
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import API from '../api/axios';
import './ItineraryDetail.css';

const activityIcon = (type) => {
  const map = {
    flight: <Plane size={14} />,  
    hotel: <Hotel size={14} />,
    meal: <Utensils size={14} />,
    transport: <Navigation size={14} />,
  };
  return map[type] || <MapPin size={14} />;
};

const ItineraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchItinerary();
  }, [id]);

  const fetchItinerary = async () => {
    try {
      const res = await API.get(`/itinerary/${id}`);
      setItinerary(res.data.data.itinerary);
    } catch (err) {
      toast.error('Itinerary not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const res = await API.post(`/itinerary/${id}/share`, { expiryDays: 7 });
      setShareData(res.data.data);
      setShowShareModal(true);
    } catch (err) {
      toast.error('Failed to generate share link');
    } finally {
      setShareLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareData.shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleDownloadPDF = async () => {
    toast.success('Generating PDF...', { duration: 2000 });
    const element = document.querySelector('.detail-container');
    
    // Temporarily force light theme
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
      document.body.classList.remove('dark-theme');
    }

    const opt = {
      margin:       0.5,
      filename:     `${itinerary.title.replace(/\s+/g, '_')}_Itinerary.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'], avoid: ['.day-card', '.summary-grid', '.activity-item'] }
    };
    
    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      // Restore dark theme if it was active
      if (isDark) {
        document.body.classList.add('dark-theme');
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this itinerary?')) return;
    try {
      await API.delete(`/itinerary/${id}`);
      toast.success('Deleted');
      navigate('/');
    } catch {
      toast.error('Delete failed');
    }
  };

  const onDragEnd = (result, dayIndex) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const newItinerary = { ...itinerary };
    const day = newItinerary.days[dayIndex];
    const newActivities = Array.from(day.activities);
    
    const [removed] = newActivities.splice(source.index, 1);
    newActivities.splice(destination.index, 0, removed);
    
    day.activities = newActivities;
    setItinerary(newItinerary);
    // Ideally we would send an API request to save the new order here
  };

  if (loading) {
    return (
      <div className="loading-center">
        <Loader size={40} className="spin" color="var(--brand-color)" />
        <p>Loading your premium itinerary...</p>
      </div>
    );
  }

  if (!itinerary) return null;

  return (
    <div className="detail-page">
      {/* Header */}
      <motion.div 
        className="detail-navbar glass-panel"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="detail-actions">
          <button className="btn-download" onClick={handleDownloadPDF}>
            <Download size={16} /> PDF
          </button>
          <button
            className="btn-share"
            onClick={handleShare}
            disabled={shareLoading}
          >
            {shareLoading ? <Loader size={16} className="spin" /> : <Share2 size={16} />}
            Share
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </motion.div>

      <div className="detail-container">
        {/* Hero */}
        <motion.div 
          className="detail-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-shimmer">{itinerary.title}</h1>
          <div className="hero-meta">
            {itinerary.destination && (
              <span className="glass-pill"><MapPin size={15} /> {itinerary.destination}</span>
            )}
            {itinerary.startDate && (
              <span className="glass-pill"><Calendar size={15} /> {itinerary.startDate} → {itinerary.endDate}</span>
            )}
            {itinerary.duration && (
              <span className="glass-pill text-accent">🌙 {itinerary.duration} days</span>
            )}
          </div>
        </motion.div>

        {/* Summary cards */}
        {itinerary.summary && (
          <motion.div 
            className="summary-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {itinerary.summary.airline && (
              <div className="summary-card glass-panel">
                <Plane size={24} color="var(--brand-color)" />
                <div>
                  <p className="summary-label">Airline</p>
                  <p className="summary-value">{itinerary.summary.airline}</p>
                </div>
              </div>
            )}
            {itinerary.summary.flightNumber && (
              <div className="summary-card glass-panel">
                <span style={{ fontSize: 24 }}>🎫</span>
                <div>
                  <p className="summary-label">Flight</p>
                  <p className="summary-value">{itinerary.summary.flightNumber}</p>
                </div>
              </div>
            )}
            {itinerary.summary.hotel && (
              <div className="summary-card glass-panel">
                <Hotel size={24} color="var(--brand-color)" />
                <div>
                  <p className="summary-label">Hotel</p>
                  <p className="summary-value">{itinerary.summary.hotel}</p>
                </div>
              </div>
            )}
            {itinerary.summary.bookingReference && (
              <div className="summary-card glass-panel">
                <span style={{ fontSize: 24 }}>📋</span>
                <div>
                  <p className="summary-label">Booking Ref</p>
                  <p className="summary-value">{itinerary.summary.bookingReference}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Day by day */}
        <div className="days-section">
          <h2>Day-by-Day Experience</h2>
          {itinerary.days?.map((day, dayIndex) => (
            <motion.div 
              key={day.day} 
              className="day-card glass-panel"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
            >
              <div className="day-header">
                <div className="day-number">Day {day.day}</div>
                <div>
                  <h3>{day.title}</h3>
                  {day.date && (
                    <p className="day-date">
                      <Calendar size={12} /> {day.date}
                    </p>
                  )}
                </div>
              </div>

              {day.activities && day.activities.length > 0 && (
                <DragDropContext onDragEnd={(result) => onDragEnd(result, dayIndex)}>
                  <Droppable droppableId={`day-${dayIndex}`}>
                    {(provided) => (
                      <div 
                        className="activities-list"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {day.activities.map((act, idx) => (
                          <Draggable key={`${day.day}-${idx}`} draggableId={`${day.day}-${idx}`} index={idx}>
                            {(provided, snapshot) => (
                              <div 
                                className={`activity-item type-${act.type} ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <div 
                                  className="drag-handle"
                                  {...provided.dragHandleProps}
                                >
                                  <GripVertical size={16} />
                                </div>
                                <div className="activity-icon">
                                  {activityIcon(act.type)}
                                </div>
                                <div className="activity-body glass-panel">
                                  <div className="activity-top">
                                    <span className="activity-title">{act.title}</span>
                                    {act.time && (
                                      <span className="activity-time">
                                        <Clock size={11} /> {act.time}
                                      </span>
                                    )}
                                  </div>
                                  {act.description && (
                                    <p className="activity-desc">{act.description}</p>
                                  )}
                                  {act.location && (
                                    <p className="activity-location">
                                      <MapPin size={11} /> {act.location}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}

              {day.accommodation && (
                <div className="day-hotel">
                  <Hotel size={16} />
                  <span>Staying at: {day.accommodation}</span>
                </div>
              )}

              {day.notes && (
                <div className="day-notes">
                  💡 {day.notes}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && shareData && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowShareModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal glass-panel" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              <div className="modal-header">
                <h3>Share Itinerary</h3>
                <button onClick={() => setShowShareModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="qr-section">
                <QRCode value={shareData.shareUrl} size={160} />
                <p className="qr-hint">Scan to open on any device</p>
              </div>

              <div className="share-link-box">
                <input
                  type="text"
                  value={shareData.shareUrl}
                  readOnly
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-copy" 
                  onClick={copyLink}
                >
                  <Copy size={16} />
                  Copy
                </motion.button>
              </div>

              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out my travel itinerary! ✈️ ' + shareData.shareUrl)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-whatsapp"
              >
                <MessageCircle size={18} />
                Share via WhatsApp
              </motion.a>

              <p className="expiry-note">
                🕐 Link expires in 7 days
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ItineraryDetail;