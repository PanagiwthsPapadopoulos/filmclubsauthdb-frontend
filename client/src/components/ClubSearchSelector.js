import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaCaretDown, FaBuilding } from 'react-icons/fa';

const ClubSearchSelector = () => {
  const { user, updateClubContext } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(''); 
  const [options, setOptions] = useState([]);
  const dropdownRef = useRef(null);

  // ==========================================
  //  SYNCHRONIZATION LOGIC
  // ==========================================

  // Initialize input with the active club name on mount
  useEffect(() => {
    if (user?.clubs && user.clubs.length > 0) {
      setInputValue(user.clubs[0].name); 
    }
  }, [user]); 

  // Reset input value to active club when dropdown closes
  useEffect(() => {
    if (!isOpen && user?.clubs?.length > 0) {
      setInputValue(user.clubs[0].name);
    }
  }, [isOpen, user]);

  // ==========================================
  //  SEARCH HANDLER
  // ==========================================

  // Execute SQL search on input change
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/admin/search-clubs`, {
          params: { searchTerm: inputValue } 
        });
        setOptions(res.data);
      } catch (err) { console.error(err); }
    };
    
    if (user?.role === 'dbAdministrator' && isOpen) {
      fetchClubs();
    }
  }, [inputValue, user, isOpen]);

  if (user?.role !== 'dbAdministrator') return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '320px' }}>
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px',
        background: 'var(--bg-input)', border: '1px solid var(--border-color)',
        borderRadius: isOpen ? '8px 8px 0 0' : '8px', transition: '0.2s'
      }}>
        <FaBuilding color="var(--accent-primary)" size={14} />
        <input 
          type="text"
          value={inputValue}
          onFocus={() => {
            setIsOpen(true);
            setInputValue(''); // Clear input to trigger full list retrieval
          }}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search Clubs..."
          style={{
            flex: 1, padding: '12px 0', background: 'transparent', 
            border: 'none', color: 'white', outline: 'none'
          }}
        />
        <FaCaretDown 
          style={{ cursor: 'pointer', transform: isOpen ? 'rotate(180deg)' : 'none' }} 
          onClick={() => {
            if (!isOpen) setInputValue(''); 
            setIsOpen(!isOpen);
          }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderTop: 'none', zIndex: 10000, borderRadius: '0 0 8px 8px',
          maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {options.map(club => (
            <div 
              key={club.clubID} 
              className="custom-select-option"
              onClick={() => {
                updateClubContext(club.clubID, club.name); 
                setIsOpen(false);
                setInputValue(club.name); 
              }}
            >
              {club.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubSearchSelector;