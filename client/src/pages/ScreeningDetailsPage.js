import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaBuilding, 
  FaExternalLinkAlt, FaFacebook, FaInstagram, FaFilm 
} from 'react-icons/fa';

const ScreeningDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  //  DATA FETCHING
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/screening/${id}`);
        setData(res.data);
      } catch (err) {
        console.error("Error details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="container" style={{textAlign:'center', marginTop: '50px'}}>Loading...</div>;
  if (!data) return <div className="container">Screening not found.</div>;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn-ghost" style={{marginBottom: '20px'}}>
        <FaArrowLeft style={{marginRight: '8px'}} /> Back to Schedule
      </button>

      {/* --- HERO SECTION --- */}
      <div className="card" style={{padding: '40px', marginBottom: '30px'}}>
        <span className="status-badge role" style={{ marginBottom: '15px' }}>{data.club}</span>
        <h1 style={{fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '10px'}}>
          {data.title} <span style={{color: 'var(--text-muted)', fontWeight: '400'}}>({data.year})</span>
        </h1>
        
        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px', color: 'var(--text-muted)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <FaCalendarAlt color="var(--accent-primary)" />
            {formatDate(data.date)}
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <FaBuilding />
            {data.venue}
          </div>
        </div>

        {data.venue_details && (
          <div style={{marginTop: '20px', padding: '15px', background: 'var(--bg-input)', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)'}}>
            <h4 style={{fontSize: '0.9rem', marginBottom: '5px', display:'flex', alignItems:'center', gap:'8px'}}>
              <FaMapMarkerAlt /> Venue Details
            </h4>
            <p style={{color: 'var(--text-muted)', fontSize: '0.95rem'}}>{data.venue_details}</p>
          </div>
        )}
      </div>

      <div className="grid-layout" style={{gridTemplateColumns: '2fr 1fr'}}>
        
        {/* --- LEFT COLUMN: CAST & CREW --- */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          
          <div className="card">
            <h3 className="card-title">Directed By</h3>
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              {data.directors.map((d, i) => (
                <a key={i} href={d.TMDBLink || '#'} target="_blank" rel="noreferrer" className="status-badge role" style={{padding: '10px 15px', fontSize: '1rem'}}>
                  {d.name} <FaExternalLinkAlt size={10} style={{marginLeft: '6px', opacity: 0.5}}/>
                </a>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Cast</h3>
            {data.cast.length > 0 ? (
              <ul style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {data.cast.map((c, i) => (
                  <li key={i} style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)'}}>
                    <span style={{fontWeight: '600'}}>{c.name}</span>
                    <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>as {c.characterName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{color: 'var(--text-muted)'}}>No cast information available.</p>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: LINKS --- */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          
          <div className="card">
            <h3 className="card-title">External Info</h3>
            <a href={data.filmLink} target="_blank" rel="noreferrer" className="btn-primary" style={{width: '100%', marginBottom: '10px'}}>
              <FaFilm /> View on TMDB
            </a>
          </div>

          <div className="card">
            <h3 className="card-title">Social Events</h3>
            {data.posts.length > 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {data.posts.map((p, i) => (
                  <a key={i} href={p.postLink} target="_blank" rel="noreferrer" className="btn-ghost" style={{background: 'var(--bg-input)', border: '1px solid var(--border-color)', justifyContent: 'flex-start'}}>
                    {p.platform === 'Facebook' ? <FaFacebook color="#1877F2"/> : <FaInstagram color="#C13584"/>}
                    <span style={{marginLeft: '10px'}}>View {p.platform} Event</span>
                  </a>
                ))}
              </div>
            ) : (
              <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No social media events linked.</p>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Contact Club</h3>
            <p style={{marginBottom: '5px'}}><b>{data.club}</b></p>
            {data.clubEmail && <p style={{color: 'var(--accent-primary)'}}>{data.clubEmail}</p>}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScreeningDetailsPage;