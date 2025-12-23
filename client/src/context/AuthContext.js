import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('film_user');
    return saved ? JSON.parse(saved) : null;
  });

  // NEW: The ID of the club currently in view
  const [currentClubID, setCurrentClubID] = useState(() => {
    const saved = localStorage.getItem('current_club_id');
    return saved ? saved : null;
  });

  const updateClubContext = (selectedClubID, selectedClubName) => {
    if (!user || user.role !== 'dbAdministrator') return;

    // We construct the club object to match what the 'member' table 
    // usually returns for regular users.
    const updatedUser = {
      ...user,
      clubs: [{ 
        clubID: selectedClubID, 
        name: selectedClubName 
      }]
    };

    // Set the custom header globally instantly
    // to avoid race condition with page refresh and 
    // header attachment
    axios.defaults.headers.common['x-user-role'] = updatedUser.role;
    setUser(updatedUser);
    
    // Persist the whole user object so it survives refresh
    localStorage.setItem('film_user', JSON.stringify(updatedUser));
    localStorage.setItem('current_club_id', selectedClubID);
  };

  // Log the active club ID whenever the user state changes
  useEffect(() => {
    const activeID = user?.clubs?.[0]?.clubID;
    console.log("Current User Context ClubID:", activeID);
  }, [user]);

  const [isReady, setIsReady] = useState(false);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('film_user', JSON.stringify(userData));
    // If regular user, default to their first club
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


  useEffect(() => {
    console.log("From inside authcontext useEffect: user role is " + user?.role);
    console.log("From inside authcontext useEffect: user is " + user);
    const interceptor = axios.interceptors.request.use((config) => {
      if (user && user.role) {
        // 1. Attach to headers (Standard for Auth/Roles)
        config.headers.set('x-user-role', user.role);
        
        // 2. Keep existing param attachment for backward compatibility
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