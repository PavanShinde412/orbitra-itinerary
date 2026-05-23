import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Plane,
  Hotel, Utensils, Navigation, Loader
} from 'lucide-react';
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

const ShareView = () => {
  const { token } = useParams();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get(`/itinerary/share/${token}`);
        setItinerary(res.data.data.itinerary);
      } catch (err) {
        setError(err.response?.data?.error || 'Link is invalid or expired');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  if (loading) {
    return (
      <div className="loading-center">
        <Loader size={32} className="spin" />
        <p>Loading shared itinerary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-center">
        <p style={{ fontSize: 48 }}>🔗</p>
        <h2 style={{ color: '#1e293b' }}>Link Unavailable</h2>
        <p style={{ color: '#64748b' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-navbar">
        <div style={{ fontWeight: 700, fontSize: 18 }}>✈️ Orbitra</div>
        <span style={{ fontSize: 13, color: '#64748b' }}>Shared Itinerary</span>
      </div>

      <div className="detail-container">
        <div className="detail-hero">
          <h1>{itinerary.title}</h1>
          <div className="hero-meta">
            {itinerary.destination && (
              <span><MapPin size={15} /> {itinerary.destination}</span>
            )}
            {itinerary.startDate && (
              <span>
                <Calendar size={15} />
                {itinerary.startDate} → {itinerary.endDate}
              </span>
            )}
            {itinerary.duration && (
              <span>🌙 {itinerary.duration} days</span>
            )}
          </div>
        </div>

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
            {itinerary.summary.hotel && (
              <div className="summary-card">
                <Hotel size={18} color="#667eea" />
                <div>
                  <p className="summary-label">Hotel</p>
                  <p className="summary-value">{itinerary.summary.hotel}</p>
                </div>
              </div>
            )}
          </div>
        )}

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
                <div className="day-notes">💡 {day.notes}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareView;