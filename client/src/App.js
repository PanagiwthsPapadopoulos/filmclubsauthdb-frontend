import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; 

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Equipment from './pages/Equipment';
import Members from './pages/ClubPage';
import ScreeningDetails from './pages/ScreeningDetails';
import ContentManagerPage from './pages/ContentManagerPage';
import SystemAdminPage from './pages/SystemAdminPage';
import TeamPage from './pages/TeamPage'; 
import './App.css';

// Child component to handle Routing logic
const AppRoutes = () => {
  const { user } = useAuth(); 
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((curr) => (curr === 'light' ? 'dark' : 'light'));
  };

  // --- 1. ROLE CHECKER ---
  const hasRole = (allowedRoles) => {
    if (!user) return false;
    
    // Super Admins access everything
    if (['dbAdministrator', 'clubAdmin'].includes(user.role)) return true;

    // Normal check
    return allowedRoles.includes(user.role);
  };

  // --- 2. CLUB MEMBERSHIP CHECK ---
  // FIX: Added 'equipmentManager' here so Pepa isn't kicked out
  const isClubMember = user && [
    'clubMember', 
    'contentManager', 
    'equipmentManager', 
    'clubAdmin', 
    'dbAdministrator'
  ].includes(user.role);

  return (
    <div className="App">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/screening/:id" element={<ScreeningDetails />} />

        {/* MY TEAM: Available to anyone in a club */}
        <Route path="/my-team" element={
          isClubMember ? <TeamPage /> : <Navigate to="/login" replace />
        } />

        {/* CONTENT DASHBOARD: Content Managers & Admins */}
        <Route path="/content-manager" element={
          hasRole(['contentManager']) ? <ContentManagerPage /> : <Navigate to="/login" replace />
        } />

        {/* ADD SCREENING (Legacy Admin Page): Content Managers & Admins */}
        <Route path="/manage-screenings" element={
          hasRole(['contentManager']) ? <Admin /> : <Navigate to="/login" replace />
        } />
        
        {/* EQUIPMENT: Equipment Managers & Admins */}
        <Route path="/manage-equipment" element={
          hasRole(['equipmentManager']) ? <Equipment /> : <Navigate to="/login" replace />
        } />
        
        {/* MEMBERS: Club Admins Only */}
        <Route path="/manage-members" element={
          hasRole(['clubAdmin']) ? <Members /> : <Navigate to="/login" replace />
        } />

        {/* SYSTEM ADMIN: Only for dbAdministrator */}
          <Route path="/system-admin" element={
            hasRole(['dbAdministrator']) ? <SystemAdminPage /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </div>
  );
};

// Main App Wrapper
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;