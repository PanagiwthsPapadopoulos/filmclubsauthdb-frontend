import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// ==========================================
//  AUTH PROVIDER
// ==========================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('film_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Track active club ID for context switching
  const [currentClubID, setCurrentClubID] = useState(() => {
    const saved = localStorage.getItem('current_club_id');
    return saved ? saved : null;
  });

  // Update club context for admin operations
  const updateClubContext = (selectedClubID, selectedClubName) => {
    if (!user || user.role !== 'dbAdministrator') return;

    // Construct club object mimicking member table format
    const updatedUser = {
      ...user,
      clubs: [{ 
        clubID: selectedClubID, 
        name: selectedClubName 
      }]
    };

    // Apply header immediately to prevent race conditions
    axios.defaults.headers.common['x-user-role'] = updatedUser.role;
    setUser(updatedUser);
    
    // Persist state
    localStorage.setItem('film_user', JSON.stringify(updatedUser));
    localStorage.setItem('current_club_id', selectedClubID);
  };

  // Monitor active club changes
  useEffect(() => {
    const activeID = user?.clubs?.[0]?.clubID;
    console.log("Current User Context ClubID:", activeID);
  }, [user]);

  const [isReady, setIsReady] = useState(false);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('film_user', JSON.stringify(userData));
    // Default to first club for regular users
    if (userData.clubs && userData.clubs.length > 0) {
      updateClubContext(userData.clubs[0].clubID);
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentClubID(null);
    localStorage.removeItem('film_user');
    localStorage.removeItem('current_club_id');
  };

  // ==========================================
  //  AXIOS INTERCEPTOR
  // ==========================================
  useEffect(() => {
    console.log("From inside authcontext useEffect: user role is " + user?.role);
    console.log("From inside authcontext useEffect: user is " + user);
    
    const interceptor = axios.interceptors.request.use((config) => {
      if (user && user.role) {
        // Attach standard auth header
        config.headers.set('x-user-role', user.role);
        
        // Attach role param for legacy compatibility
        if (config.method === 'get') {
          config.params = { ...config.params, role: user.role };
        } else {
          config.data = { ...config.data, role: user.role };
        }
      }
      return config;
    }, (error) => Promise.reject(error));

    setIsReady(true);
    return () => axios.interceptors.request.eject(interceptor);
  }, [user, currentClubID]);

  if (!isReady) return null; 

  return (
    <AuthContext.Provider value={{ user, login, logout, currentClubID, updateClubContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);