import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaServer, FaBuilding, FaMapMarkerAlt, FaExchangeAlt,
  FaTrash, FaPlus, FaUsers, FaTools, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';

const SystemAdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clubs');
  const [notification, setNotification] = useState(null);

  // DATA LISTS
  const [venues, setVenues] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [departments, setDepartments] = useState([]);

  // FORMS
  // Fixed: 'departmentIDVenue' was inconsistent. We use standard 'departmentID'
  const [newVenue, setNewVenue] = useState({ name: '', details: '', departmentID: ''});
  const [newClub, setNewClub] = useState({ name: '', email: '', departmentID: '' });

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const refreshData = async () => {
    if (!user) return;
    try {
      // Manual 'role' param added back to ensure backend sees permissions
      const config = { params: { role: user.role } };
      
      const [vRes, cRes, mRes, dRes, depRes] = await Promise.all([
        axios.get('http://localhost:3001/api/venues', config),
        axios.get('http://localhost:3001/api/clubs', config),
        axios.get('http://localhost:3001/api/admin/members-global', config),
        axios.get('http://localhost:3001/api/directors', config),
        axios.get('http://localhost:3001/api/departments', config)
      ]);
      setVenues(vRes.data);
      setClubs(cRes.data);
      setAllMembers(mRes.data);
      setDirectors(dRes.data);
      setDepartments(depRes.data);
    } catch (err) { console.error("Error loading admin data", err); }
  };

  const showMsg = (text, isError = false) => {
    setNotification({ text, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- ACTIONS ---
  const handleAddVenue = async () => {
    // Fixed: Added check for departmentID
    if (!newVenue.name || !newVenue.departmentID) return showMsg("Fill required fields", true);
    try {
      await axios.post('http://localhost:3001/api/admin/venue', { ...newVenue, role: user.role });
      showMsg('Venue Created Successfully');
      setNewVenue({ name: '', details: '', departmentID: '' }); // Reset Form
      refreshData();
    } catch (err) { showMsg('Error creating venue', true); }
  };

  const handleDeleteClub = async (id) => {
    if (!window.confirm("Warning: This deletes the club and its relationships. Proceed?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/admin/club/${id}`, { data: { role: user.role } });
      showMsg('Club deleted');
      refreshData();
    } catch (err) { showMsg('Error deleting club', true); }
  };

  const handleDeleteMember = async (id) => {
    // Safety: Don't let the admin delete themselves
    if (user.memberID === id) {
      return showMsg("You cannot delete your own account while logged in.", true);
    }

    if (!window.confirm("WARNING: This will permanently remove this user and all their club memberships. Proceed?")) return;
    
    try {
      await axios.delete(`http://localhost:3001/api/admin/member/${id}`, { 
        data: { role: user.role } 
      });
      showMsg('Member removed successfully');
      refreshData();
    } catch (err) { 
      showMsg('Error removing member', true); 
    }
  };

  // Helper to find Dept Name from ID
  const getDeptName = (id) => {
    const dept = departments.find(d => d.departmentID === id);
    return dept ? dept.name : id;
  };

  

  return (
    <div className="container">
      {notification && (
        <div style={{
          position: 'fixed', top: '90px', right: '20px',
          backgroundColor: notification.isError ? '#ef4444' : '#22c55e', color: 'white', padding: '15px 25px', 
          borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {notification.isError ? <FaExclamationCircle /> : <FaCheckCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title"><FaServer color="var(--accent-primary)"/> System Dashboard</h1>
        <div className="status-badge public">SUPERUSER MODE</div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)' }}>
        <button className={`btn-ghost ${activeTab === 'clubs' ? 'active' : ''}`} onClick={() => setActiveTab('clubs')}><FaBuilding /> Clubs</button>
        <button className={`btn-ghost ${activeTab === 'venues' ? 'active' : ''}`} onClick={() => setActiveTab('venues')}><FaMapMarkerAlt /> Venues</button>
        <button className={`btn-ghost ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}><FaUsers /> Global Members</button>
        <button className={`btn-ghost ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}><FaTools /> Maintenance</button>
      </div>

      {/* --- CLUBS TAB --- */}
      {activeTab === 'clubs' && (
        <div className="grid-layout">
          <div className="card">
            <h3 className="card-title"><FaPlus/> Register New Film Club</h3>
            <div className="form-group"><label>Club Name</label><input className="form-control" value={newClub.name} onChange={e=>setNewClub({...newClub, name:e.target.value})} /></div>
            <div className="form-group"><label>Official Email</label><input className="form-control" value={newClub.email} onChange={e=>setNewClub({...newClub, email:e.target.value})} /></div>
            <div className="form-group">
              <label>Department</label>
              <select 
                className="form-control" 
                value={String(newClub.departmentID || '')} 
                onChange={e=>setNewClub({...newClub, departmentID:e.target.value})}
              >
                <option value="">-- Select Department --</option>
                {departments.map(d => (
                  <option key={d.departmentID} value={String(d.departmentID)}>{d.name}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary" style={{width:'100%'}} onClick={async () => {
              if (!newClub.name || !newClub.email || !newClub.departmentID) return showMsg("Fill all fields", true);
              try {
                await axios.post('http://localhost:3001/api/admin/club', { ...newClub, role: user.role });
                showMsg('Club registered!');
                setNewClub({ name: '', email: '', departmentID: '' });
                refreshData();
              } catch (err) { showMsg('Registration failed', true); }
            }}>Register Club</button>
          </div>

          <div className="card" style={{gridColumn: 'span 2'}}>
            <h3 className="card-title">Manage Existing Clubs</h3>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Actions</th></tr></thead>
              <tbody>
                {clubs.map(c => (
                  <tr key={c.clubID}>
                    <td><b>{c.name}</b></td>
                    <td>{c.emailAddress}</td>
                    {/* Shows Department Name */}
                    <td>{c.department_name || getDeptName(c.departmentID)}</td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn-ghost" style={{color:'var(--accent-primary)', marginRight:'10px'}} onClick={() => navigate(`/manage-members?clubId=${c.clubID}`)}>Manage</button>
                      <button className="btn-ghost" style={{color:'#ef4444'}} onClick={()=>handleDeleteClub(c.clubID)}><FaTrash/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- VENUES TAB --- */}
      {activeTab === 'venues' && (
        <div className="grid-layout">
          <div className="card">
            <h3 className="card-title"><FaPlus/> Add New Venue</h3>
            
            {/* NAME */}
            <div className="form-group">
                <label>Venue Name</label>
                <input className="form-control" value={newVenue.name} onChange={e=>setNewVenue({...newVenue, name:e.target.value})} />
            </div>

            {/* DETAILS */}
            <div className="form-group">
                <label>Details</label>
                <input className="form-control" value={newVenue.details} onChange={e=>setNewVenue({...newVenue, details:e.target.value})} />
            </div>
            
            {/* DEPARTMENT SELECTION (Fixed Copy-Paste Error) */}
            <div className="form-group">
              <label>Department</label>
              <select 
                className="form-control" 
                value={String(newVenue.departmentID || '')} 
                onChange={e => setNewVenue({...newVenue, departmentID: e.target.value})}
              >
                <option value="">-- Select Department --</option>
                {departments.map(d => (
                  <option key={d.departmentID} value={String(d.departmentID)}>{d.name}</option>
                ))}
              </select>
            </div>

            <button className="btn-primary" style={{width:'100%'}} onClick={handleAddVenue}>Add Venue</button>
          </div>

          <div className="card" style={{gridColumn: 'span 2'}}>
            <h3 className="card-title">Infrastructure List</h3>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Details</th><th>Department</th><th>Actions</th></tr></thead>
              <tbody>
                {venues.map(v => (
                  <tr key={v.venueID}>
                    <td><b>{v.name}</b></td>
                    <td style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>{v.details}</td>
                    {/* Helper function shows Dept Name instead of ID */}
                    <td>{getDeptName(v.departmentID)}</td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn-ghost" style={{color:'#ef4444'}} onClick={async ()=>{
                        if (!window.confirm("Delete this venue?")) return;
                        try {
                          await axios.delete(`http://localhost:3001/api/admin/venue/${v.venueID}`, { data: { role: user.role } });
                          showMsg('Venue removed');
                          refreshData();
                        } catch (err) { showMsg('Cannot delete venue in use', true); }
                      }}><FaTrash/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- GLOBAL MEMBERS TAB --- */}
      {activeTab === 'members' && (
        <div className="card">
          <h3 className="card-title">System-Wide Member Directory</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone / Contact</th>
                <th>Affiliated Clubs</th>
                <th>Actions</th> {/* Added Header */}
              </tr>
            </thead>
            <tbody>
              {allMembers.map(m => (
                <tr key={m.memberID}>
                  <td>
                    <b>{m.name}</b><br/>
                    <span style={{fontSize:'0.8em', color:'var(--text-muted)'}}>{m.department_name}</span>
                  </td>
                  <td style={{color:'var(--text-muted)'}}>{m.phoneNumber || m.emailAddress}</td>
                  <td>{m.clubs || <span style={{opacity:0.5}}>No active memberships</span>}</td>
                  
                  {/* Added Actions Cell */}
                  <td style={{textAlign:'right'}}>
                    <button 
                      className="btn-ghost" 
                      style={{color:'#ef4444', padding:'5px 10px'}} 
                      onClick={() => handleDeleteMember(m.memberID)}
                      title="Remove Member"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MAINTENANCE TAB (Placeholder UI) --- */}
      {activeTab === 'data' && (
        <div className="grid-layout" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="card" style={{ 
            maxWidth: '600px', 
            textAlign: 'center', 
            padding: '40px',
            borderTop: '4px solid var(--text-muted)'
          }}>
            <div style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              <FaTools />
            </div>
            
            <h3 className="card-title" style={{ justifyContent: 'center', fontSize: '1.5rem', marginBottom: '15px' }}>
              Data Integrity Tool
            </h3>
            
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1rem', marginBottom: '30px' }}>
              This module is currently in development. Once active, it will be used to identify 
              and resolve <b>duplicate rows</b> or <b>broken records</b> within the database.
              <br/><br/>
              Administrators will be able to select conflicting entries (e.g., two "Quentin Tarantino" records) 
              and <b>merge</b> them into a single master record, preserving all history and relationships.
            </p>

            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px dashed var(--border-color)',
              display: 'inline-block'
            }}>
              <code style={{ color: '#ef4444' }}>Duplicate Record</code> 
              <span style={{ margin: '0 15px', color: 'var(--text-muted)' }}><FaExchangeAlt/></span> 
              <code style={{ color: '#22c55e' }}>Master Record</code>
            </div>
            
            <div style={{ marginTop: '30px' }}>
              <span className="status-badge" style={{ backgroundColor: '#333', color: '#aaa' }}>COMING SOON</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAdminPage;