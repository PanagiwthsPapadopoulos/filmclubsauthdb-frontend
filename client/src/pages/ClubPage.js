import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaUserCog, FaSave, FaToggleOn, FaToggleOff, 
  FaUsers, FaBuilding, FaInstagram 
} from 'react-icons/fa';

import Notification from '../components/Notification';
import PageHeader from '../components/PageHeader';
import Tabs from '../components/Tabs';

const ClubPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('members');
  const [selectedClubID, setSelectedClubID] = useState('');
  const [notification, setNotification] = useState(null);

  // ==========================================
  //  STATE MANAGEMENT
  // ==========================================
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]); 
  const [clubDetails, setClubDetails] = useState({
    name: '', emailAddress: '', instagramHandle: '', facebookHandle: '', isActive: 1, departmentID: ''
  });

  // ==========================================
  //  DATA FETCHING
  // ==========================================
  
  // Set default club on load
  useEffect(() => {
    if (user && user.clubs?.length > 0) {
      setSelectedClubID(user.clubs[0].clubID);
    }
    fetchDepartments(); 
  }, [user]);

  // Update view when selection changes
  useEffect(() => {
    if (selectedClubID) {
      fetchMembers();
      fetchClubDetails();
    }
  }, [selectedClubID]);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/departments');
      setDepartments(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/manage-members/${selectedClubID}`);
      const sanitizedMembers = res.data.map(m => ({
        ...m,
        isActive: m.isActive === 1 || m.isActive === true || m.isActive === '1'
      }));
      setMembers(sanitizedMembers);
    } catch (err) { console.error(err); }
  };

  const fetchClubDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/club-details/${selectedClubID}`);
      const data = res.data;

      setClubDetails({
        ...data,
        // Ensure type compatibility with select inputs
        departmentID: data.departmentID !== null && data.departmentID !== undefined ? String(data.departmentID) : ''
      });
    } catch (err) { console.error(err); }
  };

  // ==========================================
  //  UPDATE HANDLERS
  // ==========================================

  const showMsg = (msg, isError = false) => {
    setNotification({ text: msg, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleMemberChange = (id, field, value) => {
    setMembers(prev => prev.map(m => m.memberID === id ? { ...m, [field]: value } : m));
  };

  const saveMember = async (member) => {
    try {
      await axios.put('http://localhost:3001/api/update-member', {
        memberID: member.memberID,
        clubID: selectedClubID,
        roleName: member.roleName,
        isActive: member.isActive
      });
      showMsg(`Updated ${member.name}`);
      fetchMembers();
    } catch (err) { showMsg('Update Failed', true); }
  };

  const saveClubSettings = async () => {
    try {
      await axios.put('http://localhost:3001/api/update-club', {
        clubID: selectedClubID,
        email: clubDetails.emailAddress,
        instagram: clubDetails.instagramHandle,
        facebook: clubDetails.facebookHandle,
        isActive: clubDetails.isActive,
        departmentID: clubDetails.departmentID 
      });
      showMsg('Club Profile Saved!');
      fetchClubDetails();
    } catch (err) { showMsg('Save Failed', true); }
  };

  // Tabs Definition
  const tabs = [
    { id: 'members', label: 'Manage Members', icon: <FaUsers /> },
    { id: 'settings', label: 'Club Settings', icon: <FaBuilding /> }
  ];

  return (
    <div className="container">
      <Notification notification={notification} />
      
      <PageHeader title="Club Administration" icon={<FaUserCog />}>
        {user?.clubs?.length > 1 && (
           <select className="form-control" style={{width: 'auto'}} value={selectedClubID} onChange={e => setSelectedClubID(e.target.value)}>
             {user.clubs.map(c => <option key={c.clubID} value={c.clubID}>{c.name}</option>)}
           </select>
        )}
      </PageHeader>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'members' && (
        <div className="card">
          <h3 className="card-title">Member Roster</h3>
          <div style={{overflowX: 'auto'}}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Role Title</th><th>Status</th><th style={{textAlign: 'right'}}>Actions</th></tr></thead>
              <tbody>
                {members.map(m => {
                  const rowStyle = { opacity: m.isActive ? 1 : 0.5 };
                  return (
                    <tr key={m.memberID}>
                      <td style={{fontWeight: '500', ...rowStyle}}>{m.name}</td>
                      <td style={rowStyle}><input className="form-control" value={m.roleName} onChange={(e) => handleMemberChange(m.memberID, 'roleName', e.target.value)} style={{padding: '5px 10px', fontSize: '0.9rem'}} /></td>
                      <td style={rowStyle}>
                        <button className={`status-badge ${m.isActive ? 'public' : 'private'}`} onClick={() => handleMemberChange(m.memberID, 'isActive', !m.isActive)} style={{border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                          {m.isActive ? <FaToggleOn size={14}/> : <FaToggleOff size={14}/>} {m.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{textAlign: 'right', opacity: 1}}>
                        <button className="btn-ghost" onClick={() => saveMember(m)} style={{color: 'var(--accent-primary)'}}><FaSave /> Save</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
          <div className="form-card" style={{maxWidth: '100%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
               <h3 className="card-title">Edit Club Profile: {clubDetails.name}</h3>
               <button className={`status-badge ${clubDetails.isActive ? 'public' : 'private'}`} onClick={() => setClubDetails({...clubDetails, isActive: !clubDetails.isActive})} style={{border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '8px 12px'}}>
                 {clubDetails.isActive ? 'Club Active' : 'Club Inactive'}
               </button>
            </div>

            <div className="form-group">
              <label>Department</label>
              <select 
                className="form-control" 
                value={String(clubDetails.departmentID || '')} 
                onChange={e => setClubDetails({...clubDetails, departmentID: e.target.value})}
              >
                <option value="">-- Select Department --</option>
                {departments.map(d => (
                  <option key={d.departmentID} value={String(d.departmentID)}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input className="form-control" value={clubDetails.emailAddress || ''} onChange={e => setClubDetails({...clubDetails, emailAddress: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Instagram Handle</label>
              <div style={{position: 'relative'}}>
                 <span style={{position:'absolute', left:'12px', top:'12px', color:'var(--text-muted)'}}><FaInstagram /></span>
                 <input className="form-control" style={{paddingLeft: '35px'}} value={clubDetails.instagramHandle || ''} onChange={e => setClubDetails({...clubDetails, instagramHandle: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Facebook Handle</label>
              <input className="form-control" value={clubDetails.facebookHandle || ''} onChange={e => setClubDetails({...clubDetails, facebookHandle: e.target.value})} />
            </div>

            <button className="btn-primary" style={{width: '100%', marginTop: '10px'}} onClick={saveClubSettings}>
              <FaSave /> Update Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubPage;