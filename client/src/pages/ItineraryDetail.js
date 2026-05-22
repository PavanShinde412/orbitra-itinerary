import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import {
  MapPin, Calendar, Clock, Share2, Copy,
  Trash2, ArrowLeft, Plane, Hotel, Utensils,
  Navigation, Loader, X, Download, MessageCircle
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

  const handleDownloadPDF = () => {
    toast.success('Generating PDF...', { duration: 2000 });
    const element = document.querySelector('.detail-container');
    const opt = {
      margin:       0.5,
      filename:     `${itinerary.title.replace(/\s+/g, '_')}_Itinerary.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
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

  if (loading) {
    return (
      <div className="loading-center">
        <Loader size={32} className="spin" />
        <p>Loading itinerary...</p>
      </div>
    );
  }

  if (!itinerary) return null;

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="detail-navbar">
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
      </div>

      <div className="detail-container">
        {/* Hero */}
        <div className="detail-hero">
          <h1>{itinerary.title}</h1>
          <div className="hero-meta">
            {itinerary.destination && (
              <span><MapPin size={15} /> {itinerary.destination}</span>
            )}
            {itinerary.startDate && (
              <span><Calendar size={15} /> {itinerary.startDate} → {itinerary.endDate}</span>
            )}
            {itinerary.duration && (
              <span>🌙 {itinerary.duration} days</span>
            )}
          </div>
        </div>

        {/* Summary cards */}
        {itinerary.summary && (
          <div className="summary-grid">
            {itinerary.summary.airline && (
              <div className="summary-card">
                <Plane size={18} color="#667eea" />
                <div>
                  <p className="summary-label">Airline</p>
                  <p className="summary-value">{itinerary.summary.airline}</p>
                </div>
              </div>
            )}
            {itinerary.summary.flightNumber && (
              <div className="summary-card">
                <span style={{ fontSize: 18 }}>🎫</span>
                <div>
                  <p className="summary-label">Flight</p>
                  <p className="summary-value">{itinerary.summary.flightNumber}</p>
                </div>
              </div>
            )}
            {itinerary.summary.hotel && (
              <div className="summary-card">
                <Hotel size={18} color="#667eea" />
                <div>
                  <p className="summary-label">Hotel</p>
                  <p className="summary-value">{itinerary.summary.hotel}</p>
                </div>
              </div>
            )}
            {itinerary.summary.bookingReference && (
              <div className="summary-card">
                <span style={{ fontSize: 18 }}>📋</span>
                <div>
                  <p className="summary-label">Booking Ref</p>
                  <p className="summary-value">{itinerary.summary.bookingReference}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Day by day */}
        <div className="days-section">
          <h2>Day-by-Day Itinerary</h2>
          {itinerary.days?.map((day) => (
            <div key={day.day} className="day-card">
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

              <div className="activities-list">
                {day.activities?.map((act, idx) => (
                  <div key={idx} className={`activity-item type-${act.type}`}>
                    <div className="activity-icon">
                      {activityIcon(act.type)}
                    </div>
                    <div className="activity-body">
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
                ))}
              </div>

              {day.accommodation && (
                <div className="day-hotel">
                  <Hotel size={14} />
                  <span>Staying at: {day.accommodation}</span>
                </div>
              )}

              {day.notes && (
                <div className="day-notes">
                  💡 {day.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && shareData && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
              <button className="btn-copy" onClick={copyLink}>
                <Copy size={16} />
                Copy
              </button>
            </div>

            <a 
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out my travel itinerary! ✈️ ' + shareData.shareUrl)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <MessageCircle size={18} />
              Share via WhatsApp
            </a>

            <p className="expiry-note">
              🕐 Link expires in 7 days
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDetail;