import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; 

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import EquipmentPage from './pages/EquipmentPage';
import MembersPage from './pages/ClubPage';
import ScreeningDetailsPage from './pages/ScreeningDetailsPage';
import ContentManagerPage from './pages/ContentManagerPage';
import SystemAdminPage from './pages/SystemAdminPage';
import TeamPage from './pages/TeamPage'; 
import './App.css';

// ==========================================
//  ROUTING & GUARDS
// ==========================================
const AppRoutes = () => {
  const { user } = useAuth(); 
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((curr) => (curr === 'light' ? 'dark' : 'light'));
  };

  // Check valid roles
  const hasRole = (allowedRoles) => {
    if (!user) return false;
    
    // Grant full access to super admins
    if (['dbAdministrator', 'clubAdmin'].includes(user.role)) return true;

    // Check specific role
    return allowedRoles.includes(user.role);
  };

  // Verify club membership status
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
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/screening/:id" element={<ScreeningDetailsPage />} />

        {/* Team: Accessible to all club members */}
        <Route path="/my-team" element={
          isClubMember ? <TeamPage /> : <Navigate to="/login" replace />
        } />

        {/* Content: Managers and Admins only */}
        <Route path="/content-manager" element={
          hasRole(['contentManager']) ? <ContentManagerPage /> : <Navigate to="/login" replace />
        } />

        {/* Screenings: Managers and Admins only */}
        <Route path="/manage-screenings" element={
          hasRole(['contentManager']) ? <AdminPage /> : <Navigate to="/login" replace />
        } />
        
        {/* Equipment: Managers and Admins only */}
        <Route path="/manage-equipment" element={
          hasRole(['equipmentManager']) ? <EquipmentPage /> : <Navigate to="/login" replace />
        } />
        
        {/* Members: Club Admins only */}
        <Route path="/manage-members" element={
          hasRole(['clubAdmin']) ? <MembersPage /> : <Navigate to="/login" replace />
        } />

        {/* System: DB Administrator only */}
          <Route path="/system-admin" element={
            hasRole(['dbAdministrator']) ? <SystemAdminPage /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </div>
  );
};

// Main Wrapper
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