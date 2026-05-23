import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Flame, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './Auth.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.data.user, res.data.data.token);
      toast.success(`Welcome back, ${res.data.data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Section - Branding and Copy */}
      <div className="auth-left">
        <motion.div
          className="auth-brand"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="auth-brand-logo">
            <Flame size={32} color="#fff" style={{ marginLeft: 4 }} />
          </div>
          <div className="auth-brand-subtitle">BY TRIPCRAFT TECHNOLOGIES</div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 className="auth-title" variants={itemVariants}>
            <span className="highlight">Modernizing</span> <br />
            the way people <br />
            plan journeys
          </motion.h1>

          <motion.p className="auth-description" variants={itemVariants}>
            From flight schedules to destination planning, manage complete travel experiences through one seamless intelligent platform.
          </motion.p>

        </motion.div>
      </div>

      {/* Right Section - Login Card */}
      <div className="auth-right">
        <motion.div
          className="auth-card glass-panel"
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, type: 'spring', bounce: 0.4 }}
        >
          <div className="auth-header">
            <h2>Login Now</h2>
            <p>View and manage all tours and travellers in one place</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email or Mobile Number</label>
              <input
                type="email"
                name="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login with Password'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register Now</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;