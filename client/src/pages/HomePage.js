import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaCalendarDay, FaMapMarkerAlt, FaTicketAlt, FaSearch, 
  FaUserTie, FaArrowRight, FaStar
} from 'react-icons/fa';

const HomePage = () => {
  const { user } = useAuth();
  const [_, setSchedule] = useState([]);
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const navigate = useNavigate();

  // ==========================================
  //  DATA FETCHING & FILTERING
  // ==========================================

  // Debounce search requests
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSchedule();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchDate]);

  const fetchSchedule = async () => {
    try {
      const params = {};
      if (searchTerm) params.q = searchTerm;
      if (searchDate) params.date = searchDate;
      
      const res = await axios.get('http://localhost:3001/api/schedule', { params });
      setSchedule(res.data);
      setFilteredSchedule(res.data); 
    } catch (err) {
      console.error("Error fetching schedule", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // ==========================================
  //  SCHEDULE SEGMENTATION
  // ==========================================
  
  let myClubScreenings = [];
  let otherScreenings = filteredSchedule;

  // Separate user's club screenings from general feed
  if (user && user.clubs && user.clubs.length > 0) {
    const myClubNames = user.clubs.map(c => c.name);
    myClubScreenings = filteredSchedule.filter(s => myClubNames.includes(s.club_name));
    otherScreenings = filteredSchedule.filter(s => !myClubNames.includes(s.club_name));
  }

  const ScreeningGrid = ({ list }) => (
    <div className="grid-layout">
      {list.length > 0 ? (
        list.map((s, idx) => (
          <div key={idx} className="card" onClick={() => navigate(`/screening/${s.screeningID}`)} style={{cursor: 'pointer'}}>
            <FaTicketAlt className="card-icon-bg" />
            <div style={{ marginBottom: '15px' }}>
              <span className="status-badge role" style={{ marginBottom: '10px', background: user?.clubs?.some(c => c.name === s.club_name) ? 'rgba(229, 9, 20, 0.2)' : '' }}>
                {s.club_name || 'Film Club'}
              </span>
              <h3 className="card-title" style={{ fontSize: '1.4rem' }}>{s.film_title}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
              <div className="card-meta"><FaCalendarDay color="var(--accent-primary)" /><span>{formatDate(s.screening_date)}</span></div>
              <div className="card-meta"><FaMapMarkerAlt color="var(--text-muted)" /><span>{s.venue_name}</span></div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <FaUserTie size={12}/> <span>{s.director ? s.director : 'Director Unknown'}</span>
                </div>
                <FaArrowRight size={12} />
            </div>
          </div>
        ))
      ) : <p style={{color: 'var(--text-muted)'}}>No screenings found in this section.</p>}
    </div>
  );

  return (
    <div className="container">
      <div className="page-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '20px'}}>
        <h1 className="page-title">Screening Schedule</h1>
        <div style={{display: 'flex', gap: '15px', width: '100%', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)'}}>
          <div style={{flex: 2, minWidth: '250px', position: 'relative'}}>
            <FaSearch style={{position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)'}} />
            <input className="form-control" style={{paddingLeft: '35px'}} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div style={{flex: 1, minWidth: '150px'}}><input type="date" className="form-control" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} /></div>
          <button className="btn-ghost" onClick={() => { setSearchTerm(''); setSearchDate(''); }} style={{border: '1px solid var(--border-color)'}}>Clear</button>
        </div>
      </div>
      {user && user.clubs && user.clubs.length > 0 ? (
        <>
          <h2 style={{fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)'}}>
            <FaStar /> My Club Screenings
          </h2>
          <ScreeningGrid list={myClubScreenings} />
          <div style={{margin: '40px 0', borderBottom: '1px solid var(--border-color)'}}></div>
          <h2 style={{fontSize: '1.4rem', marginBottom: '20px', color: 'var(--text-main)'}}>
            All Other Screenings
          </h2>
          <ScreeningGrid list={otherScreenings} />
        </>
      ) : (
        <ScreeningGrid list={filteredSchedule} />
      )}
    </div>
  );
};

export default HomePage;