import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaTools, FaLock, FaGlobeAmericas, FaPlusCircle, 
  FaHandshake, FaCalendarCheck, FaExclamationCircle, FaCheckCircle, FaTrash, FaBuilding, FaChevronDown
} from 'react-icons/fa';

const Equipment = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [notification, setNotification] = useState(null);

  // DATA
  const [items, setItems] = useState([]);
  const [clubResults, setClubResults] = useState([]); // Search results for clubs
  const [myScreenings, setMyScreenings] = useState([]);

  // FORMS
  const [newItem, setNewItem] = useState({ name: '', isPrivate: false, clubID: '' });
  const [shareForm, setShareForm] = useState({ equipmentID: '', targetClubID: '' });
  const [reserveForm, setReserveForm] = useState({ equipmentID: '', screeningID: '' });

  useEffect(() => {
    refreshData();
  }, [user]);

  useEffect(() => {
    if (user && user.clubs?.length > 0) {
      setNewItem(prev => ({ ...prev, clubID: user.clubs[0].clubID }));
    }
  }, [user]);

  // Reset club search when item changes
  useEffect(() => {
    setShareForm(prev => ({ ...prev, targetClubID: '' }));
    setClubResults([]);
    // If an item is selected, load initial "non-owner" clubs immediately
    if (shareForm.equipmentID) {
        handleClubSearch('', shareForm.equipmentID);
    }
  }, [shareForm.equipmentID]);

  const refreshData = async () => {
    if (!user || !user.clubs) return; 
    
    try {
      const myClubIds = user.clubs.map(c => c.clubID).join(',');

      // 1. Get Inventory
      const resItems = await axios.get('http://localhost:3001/api/equipment-manage', {
        params: { clubIds: myClubIds } 
      });
      setItems(resItems.data);

      // 2. Get My Screenings
      const resSched = await axios.get('http://localhost:3001/api/schedule', { 
          params: { clubIds: myClubIds } 
      });
      setMyScreenings(resSched.data);

    } catch (err) { console.error(err); }
  };

  // --- SPECIFIC CLUB SEARCH (Non-Owners) ---
  const handleClubSearch = async (query, eqID) => {
    const activeEqID = eqID || shareForm.equipmentID;
    
    // We CANNOT search for clubs if we don't know which item we are talking about
    // (because we need to know who to exclude)
    if (!activeEqID) return;

    try {
      const res = await axios.get('http://localhost:3001/api/clubs/non-owners', {
        params: { 
          q: query, 
          equipmentID: activeEqID 
        }
      });
      setClubResults(res.data);
    } catch (err) { console.error(err); }
  };

  const showMsg = (msg, isError = false) => {
    setNotification({ text: msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAdd = async () => {
    if (!newItem.name || !newItem.clubID) return showMsg("Please fill in all fields", true);
    try {
      await axios.post('http://localhost:3001/api/add-equipment', newItem);
      showMsg('Item Added Successfully!');
      setNewItem(prev => ({ ...prev, name: '' })); 
      refreshData();
    } catch (err) { showMsg('Error adding item', true); }
  };

  const handleShare = async () => {
    if (!shareForm.equipmentID || !shareForm.targetClubID) return showMsg("Select item and club", true);
    try {
      await axios.post('http://localhost:3001/api/share-equipment', shareForm);
      showMsg('Ownership Shared!');
      setShareForm({ equipmentID: '', targetClubID: '' }); 
      refreshData();
    } catch (err) { showMsg(err.response?.data?.error || 'Error sharing', true); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This deletes the item for ALL owners.")) return;
    try {
      await axios.delete(`http://localhost:3001/api/delete-equipment/${id}`);
      showMsg('Item Deleted.');
      refreshData();
    } catch (err) { showMsg('Error deleting item', true); }
  };

  const handleReserve = async () => {
    if (!reserveForm.equipmentID || !reserveForm.screeningID) return showMsg("Select event and item", true);
    try {
      await axios.post('http://localhost:3001/api/reserve-equipment', reserveForm);
      showMsg('Reservation Confirmed!');
    } catch (err) { showMsg('Error: Item likely already booked.', true); }
  };

  // Filter lists
  const myClubIdSet = new Set(user?.clubs?.map(c => String(c.clubID)));
  const exclusiveItems = items.filter(i => {
    const owners = i.ownerIDs.split(',');
    return owners.every(id => myClubIdSet.has(id));
  });
  const sharedItems = items.filter(i => {
    const owners = i.ownerIDs.split(',');
    return owners.some(id => !myClubIdSet.has(id));
  });

  return (
    <div className="container">
      {notification && (
        <div style={{
          position: 'fixed', top: '90px', right: '20px',
          backgroundColor: notification.isError ? '#ef4444' : '#22c55e', color: 'white', padding: '15px 25px', 
          borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600',
          animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          {notification.isError ? <FaExclamationCircle size={20} /> : <FaCheckCircle size={20} />}
          <span>{notification.text}</span>
        </div>
      )}
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      <div className="page-header"><h1 className="page-title"><FaTools color="var(--accent-primary)" /> Equipment Manager</h1></div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)' }}>
        <button className={`btn-ghost ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')} style={{ borderRadius: 0, borderBottom: activeTab === 'inventory' ? '2px solid var(--accent-primary)' : 'none' }}>Inventory</button>
        <button className={`btn-ghost ${activeTab === 'reserve' ? 'active' : ''}`} onClick={() => setActiveTab('reserve')} style={{ borderRadius: 0, borderBottom: activeTab === 'reserve' ? '2px solid var(--accent-primary)' : 'none' }}><FaCalendarCheck /> Reservations</button>
      </div>

      {activeTab === 'inventory' && (
        <div className="grid-layout">
          {/* LEFT COL: FORMS */}
          <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
            
            {/* ADD ITEM */}
            <div className="card">
              <h3 className="card-title"><FaPlusCircle /> Add Equipment</h3>
              <div className="form-group"><label>Item Name</label><input className="form-control" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. 4K Camera" /></div>
              <div className="form-group"><label>Owner Club</label><select className="form-control" value={newItem.clubID} onChange={e => setNewItem({...newItem, clubID: e.target.value})}>{user?.clubs?.map(c => <option key={c.clubID} value={c.clubID}>{c.name}</option>)}</select></div>
              <div className="form-group" onClick={() => setNewItem({...newItem, isPrivate: !newItem.isPrivate})} style={{cursor:'pointer', display:'flex', gap:'10px'}}><div style={{width:'20px', height:'20px', border:'1px solid var(--text-muted)', background: newItem.isPrivate ? 'var(--accent-primary)' : 'transparent'}}></div><span>Private (Exclusive)</span></div>
              <button className="btn-primary" style={{width:'100%'}} onClick={handleAdd}>Add Item</button>
            </div>

            {/* SHARE ITEM */}
            <div className="card" style={{overflow:'visible', zIndex: 10}}>
              <h3 className="card-title"><FaHandshake /> Share Ownership</h3>
              <p style={{fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'15px'}}>Only <b>Public</b> items can be shared.</p>
              
              <div className="form-group">
                <label>1. Select Public Item</label>
                <select className="form-control" value={shareForm.equipmentID} onChange={e => setShareForm({...shareForm, equipmentID: e.target.value})}>
                    <option value="">-- Choose Item --</option>
                    {/* FILTER: ONLY PUBLIC ITEMS */}
                    {items.filter(i => !i.isPrivate).map(i => (
                        <option key={i.equipmentID} value={i.equipmentID}>{i.name}</option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>2. Share With (Typable)</label>
                {/* DYNAMIC SEARCH */}
                <SearchableSelect 
                  options={clubResults} 
                  labelKey="name" 
                  idKey="clubID" 
                  placeholder={shareForm.equipmentID ? "Type to search clubs..." : "Select an item first"} 
                  selectedVal={shareForm.targetClubID} 
                  onChange={(val) => setShareForm({...shareForm, targetClubID: val})} 
                  onSearch={handleClubSearch}
                />
              </div>
              
              <button className="btn-primary" style={{width:'100%'}} onClick={handleShare} disabled={!shareForm.equipmentID}>Grant Co-Ownership</button>
            </div>
          </div>

          {/* RIGHT COL: TABLES */}
          <div style={{gridColumn: 'span 2'}}>
             <InventoryTable list={exclusiveItems} title="My Exclusive Equipment" emptyMsg="No exclusive items found." onDelete={handleDelete} />
             <InventoryTable list={sharedItems} title="Shared / Co-Owned Equipment" emptyMsg="No shared items found." onDelete={handleDelete} />
          </div>
        </div>
      )}

      {activeTab === 'reserve' && (
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div className="form-card" style={{maxWidth:'100%'}}>
                <h3 className="card-title">Book Equipment</h3>
                <div className="form-group"><label>1. Select Event</label><select className="form-control" onChange={e => setReserveForm({...reserveForm, screeningID: e.target.value})}><option value="">-- Choose Event --</option>{myScreenings.map(s => (<option key={s.screeningID} value={s.screeningID}>{new Date(s.screening_date).toLocaleDateString()} - {s.film_title}</option>))}</select></div>
                <div className="form-group"><label>2. Select Item</label><select className="form-control" onChange={e => setReserveForm({...reserveForm, equipmentID: e.target.value})}><option value="">-- Choose Item --</option>{items.map(i => (<option key={i.equipmentID} value={i.equipmentID}>{i.name} [{i.isPrivate ? 'My Club' : 'Public'}]</option>))}</select></div>
                <button className="btn-primary" style={{width:'100%'}} onClick={handleReserve}>Confirm Reservation</button>
            </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTS ---

const InventoryTable = ({ list, title, emptyMsg, onDelete }) => (
    <div className="card" style={{ marginBottom: '30px' }}>
      <h3 className="card-title" style={{borderBottom:'1px solid var(--border-color)', paddingBottom:'10px', marginBottom:'15px'}}>{title}</h3>
      {list.length > 0 ? (
        <div style={{overflowX: 'auto'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Status</th>
                <th>Owners</th>
                <th style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(i => (
                <tr key={i.equipmentID}>
                  <td style={{ fontWeight: '600' }}>{i.name}</td>
                  <td>
                    {i.isPrivate 
                      ? <span className="status-badge private"><FaLock size={10}/> Private</span> 
                      : <span className="status-badge public"><FaGlobeAmericas size={10}/> Public</span>}
                  </td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                      <FaBuilding color="var(--text-muted)"/> {i.owners}
                    </div>
                  </td>
                  <td style={{textAlign:'right'}}>
                    <button className="btn-ghost" onClick={() => onDelete(i.equipmentID)} style={{color:'#ef4444', padding:'5px'}}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p style={{color:'var(--text-muted)', fontStyle:'italic'}}>{emptyMsg}</p>}
    </div>
);

// --- SEARCHABLE SELECT (Server-Side) ---
const SearchableSelect = ({ options, labelKey, idKey, placeholder, selectedVal, onChange, onSearch }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [displayText, setDisplayText] = useState('');
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const debounceTimeout = useRef(null);
  
    useEffect(() => {
      const selectedOption = options.find(o => String(o[idKey]) === String(selectedVal));
      if (selectedOption) setDisplayText(selectedOption[labelKey]);
      else if (!isOpen) setDisplayText('');
    }, [selectedVal, options, idKey, labelKey, isOpen]);
  
    useEffect(() => {
      function handleClickOutside(event) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setIsOpen(false);
          const selectedOption = options.find(o => String(o[idKey]) === String(selectedVal));
          setDisplayText(selectedOption ? selectedOption[labelKey] : '');
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, options, selectedVal, idKey, labelKey]);
  
    const handleInputChange = (e) => {
      const txt = e.target.value;
      setDisplayText(txt);
      if (!isOpen) setIsOpen(true);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => { onSearch(txt); }, 300);
    };
  
    const handleInputClick = (e) => {
      e.stopPropagation();
      setIsOpen(true);
      setDisplayText('');
      onSearch('');
    };
  
    const handleSelect = (option) => {
      onChange(option[idKey]);
      setDisplayText(option[labelKey]);
      setIsOpen(false);
    };
  
    return (
      <div ref={wrapperRef} style={{position: 'relative'}}>
        <div className="form-control" onClick={handleInputClick} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'text'}}>
          <input ref={inputRef} style={{border: 'none', background: 'transparent', color: 'var(--text-main)', width: '100%', outline: 'none'}} placeholder={placeholder} value={displayText} onChange={handleInputChange} autoComplete="off" />
          <FaChevronDown size={12} color="var(--text-muted)"/>
        </div>
        {isOpen && (
          <div style={{position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 1000 }}>
            {options.length > 0 ? (
              options.map(option => (
                <div key={option[idKey]} onClick={(e) => { e.stopPropagation(); handleSelect(option); }} style={{padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: String(option[idKey]) === String(selectedVal) ? 'rgba(229, 9, 20, 0.1)' : 'transparent'}} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = String(option[idKey]) === String(selectedVal) ? 'rgba(229, 9, 20, 0.1)' : 'transparent'}>
                  {option[labelKey]}
                </div>
              ))
            ) : <div style={{padding: '10px', color: 'var(--text-muted)', textAlign: 'center'}}>No matches found</div>}
          </div>
        )}
      </div>
    );
  };

export default Equipment;