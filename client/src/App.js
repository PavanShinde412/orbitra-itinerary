import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Moon, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import ItineraryDetail from './pages/ItineraryDetail';
import ShareView from './pages/ShareView';

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
      <Route path="/itinerary/:id" element={<PrivateRoute><ItineraryDetail /></PrivateRoute>} />
      <Route path="/share/:token" element={<ShareView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button 
      className="theme-toggle-btn"
      onClick={() => setIsDark(!isDark)}
      title="Toggle Theme"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
        <ThemeToggle />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;