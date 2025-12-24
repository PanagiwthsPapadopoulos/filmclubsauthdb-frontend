import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaUserCircle, FaPhone, FaInstagram } from 'react-icons/fa';

const TeamPage = () => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState({}); 
  const [loading, setLoading] = useState(true);

  // ==========================================
  //  DATA FETCHING
  // ==========================================
  useEffect(() => {
    const fetchAllTeams = async () => {
      if (user && user.clubs && user.clubs.length > 0) {
        try {
          const newTeamData = {};
          await Promise.all(
            user.clubs.map(async (club) => {
              const res = await axios.get(`http://localhost:3001/api/team/${club.clubID}`);
              newTeamData[club.clubID] = res.data;
            })
          );
          setTeamData(newTeamData);
        } catch (err) {
          console.error("Error fetching teams:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchAllTeams();
  }, [user]);

  if (!user || !user.clubs) return <div className="container">Access Denied</div>;
  if (loading) return <div className="container" style={{textAlign: 'center', marginTop: '50px'}}>Loading your team...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title"><FaUsers color="var(--accent-primary)" /> My Team</h1>
      </div>
      {user.clubs.length === 0 ? (
        <p>You are not currently active in any film clubs.</p>
      ) : (
        user.clubs.map(club => {
          const members = teamData[club.clubID] || [];
          
          // Sort members: Current user first, then others alphabetically
          const sortedMembers = [...members].sort((a, b) => {
            const isMeA = a.name.toLowerCase() === user.username.toLowerCase();
            const isMeB = b.name.toLowerCase() === user.username.toLowerCase();
            return isMeA ? -1 : isMeB ? 1 : 0;
          });

          return (
            <div key={club.clubID} style={{ marginBottom: '50px' }}>
              <h2 style={{ marginBottom: '20px', color: 'var(--text-muted)', borderLeft: '4px solid var(--accent-primary)', paddingLeft: '15px' }}>
                {club.name}
              </h2>
              <div className="grid-layout">
                {sortedMembers.length > 0 ? (
                  sortedMembers.map((m, i) => {
                    const isMe = m.name.toLowerCase() === user.username.toLowerCase();
                    return (
                      <div key={i} className="card" style={{
                        borderColor: isMe ? 'var(--accent-primary)' : 'var(--border-color)',
                        background: isMe ? 'rgba(229, 9, 20, 0.05)' : 'var(--bg-card)',
                        transform: isMe ? 'scale(1.02)' : 'none',
                        boxShadow: isMe ? '0 0 15px rgba(229, 9, 20, 0.15)' : ''
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                          <div style={{ background: isMe ? 'var(--accent-primary)' : 'var(--bg-card-hover)', padding: '10px', borderRadius: '50%' }}>
                            <FaUserCircle size={30} color={isMe ? '#fff' : 'var(--text-muted)'} />
                          </div>
                          <div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <h3 className="card-title" style={{ marginBottom: '2px' }}>{m.name}</h3>
                              {isMe && <span className="status-badge role" style={{background: 'var(--accent-primary)', color: 'white', fontSize: '0.65rem'}}>YOU</span>}
                            </div>
                            <span className="status-badge role">{m.roleName}</span>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                          <p className="card-meta"><FaPhone size={12} /> {m.phoneNumber || 'Hidden'}</p>
                          <p className="card-meta"><FaInstagram size={12} /> {m.instagramHandle || 'N/A'}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{color: 'var(--text-muted)'}}>No active members found.</p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TeamPage;