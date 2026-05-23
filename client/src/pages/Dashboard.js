import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Eye, Calendar, Loader, Flame, LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './Dashboard.css';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15, delay: i * 0.1 }
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

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
      {/* Floating Navbar */}
      <motion.nav
        className="navbar glass-panel"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="navbar-brand">
          <Flame size={24} color="var(--brand-color)" style={{ marginLeft: 4 }} />
        </div>
        <div className="navbar-right">
          <span className="welcome-text">Hi, <span className="font-semibold">{user?.name}</span></span>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </motion.nav>

      <div className="dashboard-container">
        {/* Header */}
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <h2 className="text-shimmer">My Itineraries</h2>
            <p>{itineraries.length} trip{itineraries.length !== 1 ? 's' : ''} planned</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-new"
            onClick={() => navigate('/upload')}
          >
            <Plus size={18} />
            New Itinerary
          </motion.button>
        </motion.div>

        {/* Content */}
        {loading ? (
          <motion.div className="loading-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Loader size={40} className="spin" color="var(--brand-color)" />
            <p>Loading your trips...</p>
          </motion.div>
        ) : itineraries.length === 0 ? (
          <motion.div
            className="empty-state glass-panel"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
          >
            <div className="empty-icon-wrap">
              <LayoutGrid size={48} className="empty-icon" />
            </div>
            <h3>No itineraries yet</h3>
            <p>Upload a flight ticket or hotel booking to instantly generate a full itinerary.</p>
            <motion.button
              className="btn-primary"
              onClick={() => navigate('/upload')}
              whileHover={{ scale: 1.05, boxShadow: '0 8px 24px var(--brand-glow)' }}
              whileTap={{ scale: 0.95 }}
            >
              Upload Your First Document
            </motion.button>
          </motion.div>
        ) : (
          <div className="bento-grid">
            <AnimatePresence>
              {itineraries.map((item, index) => {
                const badge = getStatusBadge(item.status);
                return (
                  <motion.div
                    layout
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={index}
                    key={item._id}
                    className="bento-card glass-panel"
                    whileHover={{ y: -8, scale: 1.02 }}
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
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/itinerary/${item._id}`);
                            }}
                            title="View"
                          >
                            <Eye size={16} />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="icon-btn danger"
                          onClick={(e) => handleDelete(item._id, e)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </div>

                    <h3 className="card-title">{item.title}</h3>

                    <div className="card-details">
                      {item.destination && (
                        <div className="card-meta">
                          <MapPin size={14} className="meta-icon" />
                          <span>{item.destination}</span>
                        </div>
                      )}

                      {item.startDate && (
                        <div className="card-meta">
                          <Calendar size={14} className="meta-icon" />
                          <span>
                            {item.startDate}
                            {item.endDate ? ` → ${item.endDate}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.duration && (
                      <div className="card-duration">
                        {item.duration} day{item.duration !== 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Hover Glow Effect */}
                    <div className="card-glow"></div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;