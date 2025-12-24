import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaFilm, FaCalendarAlt, FaTools, FaUsers, 
  FaSignOutAlt, FaUserCircle, FaSignInAlt, 
  FaSun, FaMoon, FaUserFriends,
  FaDatabase, FaBars, FaTimes // Added Icons
} from 'react-icons/fa';
import ClubSearchSelector from './ClubSearchSelector';

const Navbar = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu

  const handleLogout = () => {
    logout();
    setIsOpen(false); // Close menu on logout
    navigate('/login'); 
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => location.pathname === path ? 'var(--accent-primary)' : 'var(--text-muted)';
  const isMember = user && ['clubMember', 'contentManager', 'clubAdmin'].includes(user.role);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" onClick={closeMenu}>
        <FaFilm /> FilmClubs<span className="brand-suffix">DB</span>
      </Link>
      
      {/* Hamburger Icon (Visible only on mobile via CSS) */}
      <div className="menu-icon" onClick={toggleMenu}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </div>

      {/* Nav Menu */}
      <div className={isOpen ? "nav-menu active" : "nav-menu"}>
        <Link to="/" className="nav-link" style={{color: isActive('/')}} onClick={closeMenu}>
          <FaCalendarAlt /> Feed
        </Link>
        
        <div className="nav-center"> <ClubSearchSelector /> </div>
        
        {!user ? (
          <div className="nav-auth-group">
             <button onClick={() => { toggleTheme(); closeMenu(); }} className="btn-ghost" title="Switch Theme">
              {theme === 'dark' ? <FaSun size={18} color="#fbbf24" /> : <FaMoon size={18} color="#4b5563" />}
            </button>
            <Link to="/login" className="btn-primary" style={{padding: '8px 16px'}} onClick={closeMenu}>
              <FaSignInAlt /> Login
            </Link>
          </div>
        ) : (
          <>
            {['dbAdministrator'].includes(user.role) && (
              <Link to="/system-admin" className="nav-link" style={{color: isActive('/system-admin')}} onClick={closeMenu}>
                <FaDatabase /> Admin
              </Link>
            )}
            {isMember && (
              <Link to="/my-team" className="nav-link" style={{color: isActive('/my-team')}} onClick={closeMenu}>
                <FaUserFriends /> My Team
              </Link>
            )}

            {['contentManager', 'clubAdmin', 'dbAdministrator'].includes(user.role) && (
              <Link to="/content-manager" className="nav-link" style={{color: isActive('/content-manager')}} onClick={closeMenu}>
                <FaFilm /> Manage
              </Link>
            )}
            {['equipmentManager', 'clubAdmin', 'dbAdministrator'].includes(user.role) && (
              <Link to="/manage-equipment" className="nav-link" style={{color: isActive('/manage-equipment')}} onClick={closeMenu}>
                <FaTools /> Equipment
              </Link>
            )}
             {['clubAdmin', 'dbAdministrator'].includes(user.role) && (
              <Link to="/manage-members" className="nav-link" style={{color: isActive('/manage-members')}} onClick={closeMenu}>
                <FaUsers /> Members
              </Link>
            )}

            <div className="nav-user-actions">
              <div className="user-badge"><FaUserCircle /><span>{user.username}</span></div>
              <button onClick={() => { toggleTheme(); closeMenu(); }} className="btn-ghost" title="Switch Theme">
                {theme === 'dark' ? <FaSun size={18} color="#fbbf24" /> : <FaMoon size={18} color="#4b5563" />}
              </button>
              <button onClick={handleLogout} className="btn-ghost" title="Logout"><FaSignOutAlt /></button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;