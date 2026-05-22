import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Plus, Trash2, Eye, Calendar, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './Dashboard.css';

const Dashboard = () => {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      const res = await API.get('/itinerary');
      setItineraries(res.data.data.itineraries);
    } catch (err) {
      toast.error('Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this itinerary?')) return;
    try {
      await API.delete(`/itinerary/${id}`);
      setItineraries(itineraries.filter((i) => i._id !== id));
      toast.success('Deleted successfully');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      completed: { label: 'Ready', className: 'badge-success' },
      processing: { label: 'Processing', className: 'badge-warning' },
      failed: { label: 'Failed', className: 'badge-error' },
    };
    return map[status] || map.completed;
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">✈️ Orbitra</div>
        <div className="navbar-right">
          <span className="welcome-text">Hi, {user?.name} 👋</span>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h2>My Itineraries</h2>
            <p>{itineraries.length} trip{itineraries.length !== 1 ? 's' : ''} planned</p>
          </div>
          <button
            className="btn-new"
            onClick={() => navigate('/upload')}
          >
            <Plus size={18} />
            New Itinerary
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-center">
            <Loader size={32} className="spin" />
            <p>Loading your trips...</p>
          </div>
        ) : itineraries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <h3>No itineraries yet</h3>
            <p>Upload a flight ticket or hotel booking to get started</p>
            <button className="btn-primary" onClick={() => navigate('/upload')}>
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className="itinerary-grid">
            {itineraries.map((item) => {
              const badge = getStatusBadge(item.status);
              return (
                <div
                  key={item._id}
                  className="itinerary-card"
                  onClick={() =>
                    item.status === 'completed' &&
                    navigate(`/itinerary/${item._id}`)
                  }
                >
                  <div className="card-top">
                    <span className={`badge ${badge.className}`}>
                      {badge.label}
                    </span>
                    <div className="card-actions">
                      {item.status === 'completed' && (
                        <button
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/itinerary/${item._id}`);
                          }}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button
                        className="icon-btn danger"
                        onClick={(e) => handleDelete(item._id, e)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="card-title">{item.title}</h3>

                  {item.destination && (
                    <div className="card-meta">
                      <MapPin size={14} />
                      <span>{item.destination}</span>
                    </div>
                  )}

                  {item.startDate && (
                    <div className="card-meta">
                      <Calendar size={14} />
                      <span>
                        {item.startDate}
                        {item.endDate ? ` → ${item.endDate}` : ''}
                      </span>
                    </div>
                  )}

                  {item.duration && (
                    <div className="card-duration">
                      {item.duration} day{item.duration !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;