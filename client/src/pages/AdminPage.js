import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlusCircle, FaFilm, FaCalendarPlus } from 'react-icons/fa';

const AdminPage = () => {
  const [films, setFilms] = useState([]);
  const [venues, setVenues] = useState([]);
  const [clubs, setClubs] = useState([]);
  
  const [form, setForm] = useState({ filmID: '', venueID: '', clubID: '', date: '' });
  const [message, setMessage] = useState('');

  // ==========================================
  //  DATA FETCHING
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      const [f, v, c] = await Promise.all([
        axios.get('http://localhost:3001/api/films'),
        axios.get('http://localhost:3001/api/venues'),
        axios.get('http://localhost:3001/api/clubs')
      ]);
      setFilms(f.data);
      setVenues(v.data);
      setClubs(c.data);
    };
    fetchData();
  }, []);

  // ==========================================
  //  FORM HANDLERS
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/add-screening', form);
      setMessage('Screening published successfully!');
      setForm({ filmID: '', venueID: '', clubID: '', date: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: Could not publish screening.');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title"><FaCalendarPlus color="var(--accent-primary)" /> Schedule Screening</h1>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {message && (
          <div style={{ 
            background: message.includes('Error') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', 
            color: message.includes('Error') ? '#ef4444' : '#10b981', 
            padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' 
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-card" style={{ maxWidth: '100%' }}>
          <div className="form-group">
            <label>Select Film</label>
            <div style={{ position: 'relative' }}>
              <FaFilm style={{ position: 'absolute', top: '14px', left: '12px', color: '#666' }} />
              <select className="form-control" style={{ paddingLeft: '35px' }} onChange={e => setForm({...form, filmID: e.target.value})} value={form.filmID} required>
                <option value="">Choose a movie...</option>
                {films.map(f => <option key={f.filmID} value={f.filmID}>{f.title}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Hosting Club</label>
            <select className="form-control" onChange={e => setForm({...form, clubID: e.target.value})} value={form.clubID} required>
              <option value="">Choose your club...</option>
              {clubs.map(c => <option key={c.clubID} value={c.clubID}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Venue</label>
              <select className="form-control" onChange={e => setForm({...form, venueID: e.target.value})} value={form.venueID} required>
                <option value="">Select Venue...</option>
                {venues.map(v => <option key={v.venueID} value={v.venueID}>{v.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Date & Time</label>
              <input type="datetime-local" className="form-control" onChange={e => setForm({...form, date: e.target.value})} value={form.date} required />
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            <FaPlusCircle /> Publish Event
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;