import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Hook
import { FaUser, FaLock, FaUserSecret, FaVideo, FaTools, FaCrown, FaDatabase } from 'react-icons/fa';

const Login = () => {
  const { login } = useAuth(); // Context
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const performLogin = async (username, password) => {
    try {
      const res = await axios.post('http://localhost:3001/api/login', { username, password });
      login(res.data); // Save to Global State
      navigate('/');
    } catch (err) {
      setError('Login Failed: Database rejected credentials.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(creds.username, creds.password);
  };

  const handleGuest = () => {
    // Set a "Virtual Guest" identity
    login({ username: 'Guest', role: 'guest', clubs: [] });
    navigate('/');
  };

  // --- DEV SHORTCUT: DB ADMIN LOGIN ---
  const handleAdminShortcut = async () => {
    try {
      login({ username: 'admin', role: 'dbAdministrator', clubs: [] });
      navigate('/system-admin'); // Go straight to the Admin Dashboard
    } catch (err) {
      setError('DB Admin Login Failed. Did you run the SQL script to create the user?');
    }
  };

  // ... (Render code remains the same, just remove props from DemoBtn calls)
  
  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="form-card">
        {/* ... (Header and Form Inputs are same as before) ... */}
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-main)' }}>Authentication</h2>
        
        {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Database Username</label>
            <div style={{ position: 'relative' }}>
              <FaUser style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
              <input className="form-control" style={{ paddingLeft: '35px' }} value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} placeholder="username" />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
              <input type="password" className="form-control" style={{ paddingLeft: '35px' }} value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} placeholder="••••••••" />
            </div>
          </div>
          <button className="btn-primary" style={{ width: '100%' }}>Sign In</button>
        </form>

        <div style={{ textAlign: 'center', margin: '20px 0', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <button onClick={handleGuest} className="btn-ghost" style={{ width: '100%', border: '1px solid var(--border-color)' }}>Continue as Guest</button>
        </div>

        <div style={{ marginTop: '20px' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Access</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <DemoBtn icon={<FaUserSecret />} label="Member" user="SpongeBob" pass="SpongePassword123" onClick={performLogin} />
            <DemoBtn icon={<FaVideo />} label="Content" user="jodorowsky" pass="Alejandro1929" onClick={performLogin} />
            <DemoBtn icon={<FaTools />} label="Equipment" user="pepa" pass="PepaPig123" onClick={performLogin} />
            <DemoBtn icon={<FaCrown />} label="Admin" user="alex" pass="Alex_Pass_123" onClick={performLogin} />
            
          </div>
          <button 
            onClick={handleAdminShortcut}
            className="btn-ghost" 
            style={{ 
              width: '100%', 
              border: '1px dashed var(--accent-primary)', 
              color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            <FaDatabase /> Login as DB Admin
          </button>
        </div>
      </div>
    </div>
  );
};

const DemoBtn = ({ icon, label, user, pass, onClick }) => (
  <button className="demo-btn" onClick={() => onClick(user, pass)}>
    <span style={{ color: 'var(--accent-primary)', fontSize: '1.2rem' }}>{icon}</span>
    <span>{label}</span>
  </button>
);

export default Login;