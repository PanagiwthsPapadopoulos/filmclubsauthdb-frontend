import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Hook
import { 
  FaFilm, FaTheaterMasks, FaUserTie, FaCalendarPlus, 
  FaLink, FaDatabase, FaFacebook, FaInstagram, FaEdit, 
  FaChevronDown, FaExclamationCircle, FaCheckCircle, FaTimes
} from 'react-icons/fa';

const ContentManagerPage = () => {
  const { user } = useAuth(); // Context
  const [activeTab, setActiveTab] = useState('artistic'); // FIXED DEFAULT
  const [notification, setNotification] = useState(null); 

  // ... (State for films, venues, clubs, forms remains exactly the same) ...
  const [films, setFilms] = useState([]);
  const [venues, setVenues] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [directorsList, setDirectorsList] = useState([]); 
  const [actorsList, setActorsList] = useState([]);       

  const [actorForm, setActorForm] = useState({ name: '', tmdb: '' });
  const [directorForm, setDirectorForm] = useState({ name: '', tmdb: '' });
  const [filmForm, setFilmForm] = useState({ title: '', year: '', tmdb: '', languageIDs: [], directorIDs: [], actorIDs: [] });
  const [screeningForm, setScreeningForm] = useState({ filmID: '', venueID: '', clubID: '', date: '' });
  const [linkForm, setLinkForm] = useState({ filmID: '', tmdb: '' });
  const [socialForm, setSocialForm] = useState({ screeningID: '', platform: 'Facebook', link: '' });

  useEffect(() => {
    refreshData();
  }, [user]); 

  useEffect(() => {
    if (user && user.clubs && user.clubs.length > 0) {
      setScreeningForm(prev => ({ ...prev, clubID: user.clubs[0].clubID }));
    }
  }, [user]);

  const refreshData = async () => {
    if (!user || !user.clubs) return;

    try {
        const langRes = await axios.get('http://localhost:3001/api/languages');
        setLanguages(langRes.data);
    } catch (err) { console.error("Language Load Error:", err); }

    const myClubIds = user.clubs.map(c => c.clubID).join(',');
    try {
      // NOTE: Interceptor handles the ROLE param automatically now!
      const [f, v] = await Promise.all([
        axios.get('http://localhost:3001/api/films'),
        axios.get('http://localhost:3001/api/venues'),
      ]);

      setFilms(f.data);
      setVenues(v.data);
      
      // const formatted = s.data.map(item => ({
      //   ...item,
      //   displayLabel: `${item.film_title} - ${new Date(item.screening_date).toLocaleDateString()} (${item.club_name})`
      // }));
      // setScreenings(formatted);
    } catch (err) { console.error("Main Data Error:", err); }
  };

  // ... (Search handlers remain same, just remove manual role logic if any was there) ...
  const handleFilmSearch = async (text) => {
    try { const res = await axios.get('http://localhost:3001/api/films', { params: { q: text } }); setFilms(res.data); } catch (err) { console.error(err); }
  };
  const handleVenueSearch = async (text) => {
    try { const res = await axios.get('http://localhost:3001/api/venues', { params: { q: text } }); setVenues(res.data); } catch (err) { console.error(err); }
  };
  const handleDirectorSearch = async (text) => {
    try { const res = await axios.get('http://localhost:3001/api/directors', { params: { q: text } }); setDirectorsList(res.data); } catch (err) { console.error(err); }
  };
  const handleActorSearch = async (text) => {
    try { const res = await axios.get('http://localhost:3001/api/actors', { params: { q: text } }); setActorsList(res.data); } catch (err) { console.error(err); }
  };

  const handleScreeningSearch = async (text) => {
    if (!user || !user.clubs) return;
    try {
      const res = await axios.get('http://localhost:3001/api/own-schedule', { 
        params: { 
          q: text, 
          clubIds: user.clubs[0].clubID 
        }
      });
      const formatted = res.data.map(item => ({
        ...item,
        displayLabel: `${item.film_title} - ${new Date(item.screening_date).toLocaleDateString()} (${item.club_name})`
      }));
      setScreenings(formatted);
    } catch (err) { console.error(err); }
  };

  // ... (Helpers and UI remain identical) ...
  // ... (Paste the rest of the component logic: addLanguageToForm, validateAndSubmit, Render, SearchableSelect) ...
  // (Truncated for brevity since logic is same as previous step, just replacing user prop with context hook)

  const addLanguageToForm = (e) => {
    const id = parseInt(e.target.value);
    if (!id) return;
    if (!filmForm.languageIDs.includes(id)) {
      setFilmForm(prev => ({ ...prev, languageIDs: [...prev.languageIDs, id] }));
    }
  };
  const addDirectorToForm = (id, name) => {
    if (!filmForm.directorIDs.includes(id)) {
      setFilmForm(prev => ({ ...prev, directorIDs: [...prev.directorIDs, id] }));
    }
  };
  const addActorToForm = (id, name) => {
    if (!filmForm.actorIDs.some(a => a.actorID === id)) {
      setFilmForm(prev => ({ ...prev, actorIDs: [...prev.actorIDs, { actorID: id, name: name, characterName: '' }] }));
    }
  };

  const showMsg = (msg, isError = false) => {
    setNotification({ text: msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  const validateAndSubmit = (url, data, resetFn, type) => {
    let missing = [];
    if (type === 'film') {
        if (!data.title) missing.push("Title");
        if (!data.year) missing.push("Year");
        if (!data.tmdb) missing.push("TMDB");
    } else if (type === 'screening') {
        if (!data.filmID) missing.push("Film");
        if (!data.clubID) missing.push("Club");
        if (!data.venueID) missing.push("Venue");
        if (!data.date) missing.push("Date");
    } else if (type === 'social') {
        if (!data.screeningID) missing.push("Screening");
        if (!data.link) missing.push("URL");
    } 

    if (missing.length > 0) {
        showMsg(`Missing: ${missing.join(', ')}`, true);
        return;
    }
    submitData(url, data, resetFn);
  };

  const submitData = async (url, data, resetFn) => {
    try {
      await axios.post(url, data);
      showMsg('Success!');
      if (resetFn) resetFn();
      refreshData();
    } catch (err) { showMsg(err.message, true); }
  };

  const handleUpdateLink = async (e) => {
    e.preventDefault();
    if (!linkForm.filmID || !linkForm.tmdb) {
        showMsg("Missing Data", true);
        return;
    }
    try {
      await axios.put('http://localhost:3001/api/update-film-link', linkForm);
      showMsg('Updated!');
      setLinkForm({ filmID: '', tmdb: '' });
    } catch (err) { showMsg(err.message, true); }
  };

  return (
    <div className="container">
      {notification && (
        <div style={{ position: 'fixed', top: '90px', right: '20px', backgroundColor: notification.isError ? '#ef4444' : '#22c55e', color: 'white', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          {notification.isError ? <FaExclamationCircle size={20} /> : <FaCheckCircle size={20} />}
          <span>{notification.text}</span>
        </div>
      )}
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      <div className="page-header"><h1 className="page-title"><FaDatabase color="var(--accent-primary)" /> Content Dashboard</h1></div>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
        <button className={`btn-ghost ${activeTab === 'artistic' ? 'active' : ''}`} onClick={() => setActiveTab('artistic')} style={{borderBottom: activeTab === 'artistic' ? '2px solid var(--accent-primary)' : 'none', borderRadius: 0}}><FaTheaterMasks /> Artistic Data</button>
        <button className={`btn-ghost ${activeTab === 'program' ? 'active' : ''}`} onClick={() => setActiveTab('program')} style={{borderBottom: activeTab === 'program' ? '2px solid var(--accent-primary)' : 'none', borderRadius: 0}}><FaCalendarPlus /> Program</button>
        <button className={`btn-ghost ${activeTab === 'links' ? 'active' : ''}`} onClick={() => setActiveTab('links')} style={{borderBottom: activeTab === 'links' ? '2px solid var(--accent-primary)' : 'none', borderRadius: 0}}><FaLink /> Links & Socials</button>
      </div>

      {activeTab === 'artistic' && (
        <div className="grid-layout">
          <div className="card"><h3 className="card-title"><FaTheaterMasks /> New Actor</h3><div className="form-group"><input className="form-control" placeholder="Name" value={actorForm.name} onChange={e=>setActorForm({...actorForm, name: e.target.value})} /></div><div className="form-group"><input className="form-control" placeholder="TMDB URL" value={actorForm.tmdb} onChange={e=>setActorForm({...actorForm, tmdb: e.target.value})} /></div><button className="btn-primary" style={{width: '100%'}} onClick={() => validateAndSubmit('http://localhost:3001/api/add-actor', actorForm, () => setActorForm({name:'', tmdb:''}), 'actor')}>Add Actor</button></div>
          <div className="card"><h3 className="card-title"><FaUserTie /> New Director</h3><div className="form-group"><input className="form-control" placeholder="Name" value={directorForm.name} onChange={e=>setDirectorForm({...directorForm, name: e.target.value})} /></div><div className="form-group"><input className="form-control" placeholder="TMDB URL" value={directorForm.tmdb} onChange={e=>setDirectorForm({...directorForm, tmdb: e.target.value})} /></div><button className="btn-primary" style={{width: '100%'}} onClick={() => validateAndSubmit('http://localhost:3001/api/add-director', directorForm, () => setDirectorForm({name:'', tmdb:''}), 'director')}>Add Director</button></div>
          <div className="card" style={{gridColumn: 'span 2', maxWidth: '100%'}}><h3 className="card-title"><FaFilm /> New Film</h3><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}><div><div className="form-group"><input className="form-control" placeholder="Title" value={filmForm.title} onChange={e=>setFilmForm({...filmForm, title: e.target.value})} /></div><div className="form-group"><input className="form-control" placeholder="Year" type="number" value={filmForm.year} onChange={e=>setFilmForm({...filmForm, year: e.target.value})} /></div><div className="form-group"><input className="form-control" placeholder="TMDB URL" value={filmForm.tmdb} onChange={e=>setFilmForm({...filmForm, tmdb: e.target.value})} /></div><div className="form-group"><select className="form-control" value="" onChange={addLanguageToForm}><option value="">+ Add Language...</option>{languages.map(l => <option key={l.languageID} value={l.languageID}>{l.name}</option>)}</select><div style={{display:'flex', flexWrap:'wrap', gap:'5px', marginTop:'5px'}}>{filmForm.languageIDs.map(id => { const lang = languages.find(l => l.languageID === id); return <span key={id} style={{background:'var(--bg-input)', border:'1px solid var(--border-color)', padding:'2px 8px', borderRadius:'4px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'5px'}}>{lang ? lang.name : id} <FaTimes style={{cursor:'pointer'}} onClick={() => setFilmForm(prev => ({...prev, languageIDs: prev.languageIDs.filter(lid => lid !== id)}))} /></span> })}</div></div></div><div><div className="form-group"><label style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>Directors</label><SearchableSelect options={directorsList} labelKey="name" idKey="directorID" placeholder="Search Director..." selectedVal="" onChange={(id) => { const dir = directorsList.find(d => d.directorID === id); if(dir) addDirectorToForm(id, dir.name); }} onSearch={handleDirectorSearch} /><div style={{display:'flex', flexWrap:'wrap', gap:'5px', marginTop:'5px'}}>{filmForm.directorIDs.map(id => (<span key={id} style={{background:'var(--accent-primary)', color:'white', padding:'2px 8px', borderRadius:'12px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'5px'}}>Dir #{id} <FaTimes style={{cursor:'pointer'}} onClick={() => setFilmForm(prev => ({...prev, directorIDs: prev.directorIDs.filter(d => d !== id)}))} /></span>))}</div></div><div className="form-group"><label style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>Cast</label><SearchableSelect options={actorsList} labelKey="name" idKey="actorID" placeholder="Search Actor..." selectedVal="" onChange={(id) => { const act = actorsList.find(a => a.actorID === id); if(act) addActorToForm(id, act.name); }} onSearch={handleActorSearch} /><div style={{marginTop:'10px', display:'flex', flexDirection:'column', gap:'8px'}}>{filmForm.actorIDs.map((actor, idx) => (<div key={actor.actorID} style={{display:'flex', alignItems:'center', gap:'10px', background:'var(--bg-input)', padding:'5px 10px', borderRadius:'6px'}}><span style={{flex: 1, fontSize:'0.9rem'}}>{actor.name}</span><input placeholder="Character Name" style={{background:'transparent', border:'none', borderBottom:'1px solid var(--text-muted)', color:'var(--text-main)', width:'120px', fontSize:'0.85rem'}} value={actor.characterName} onChange={(e) => { const newActors = [...filmForm.actorIDs]; newActors[idx].characterName = e.target.value; setFilmForm({...filmForm, actorIDs: newActors}); }} /><FaTimes style={{cursor:'pointer'}} onClick={() => setFilmForm(prev => ({...prev, actorIDs: prev.actorIDs.filter(a => a.actorID !== actor.actorID)}))} /></div>))}</div></div></div></div><button className="btn-primary" style={{width: '100%', marginTop:'15px'}} onClick={() => validateAndSubmit('http://localhost:3001/api/add-film', filmForm, () => setFilmForm({title:'', year:'', tmdb:'', languageIDs:[], directorIDs:[], actorIDs:[]}), 'film')}>Add Film</button></div>
        </div>
      )}

      {activeTab === 'program' && (
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
          <div className="form-card" style={{maxWidth: '100%', overflow: 'visible'}}>
            <h3 className="card-title" style={{marginBottom: '20px'}}>Schedule New Screening</h3>
            <div className="form-group"><label>Film</label><SearchableSelect options={films} labelKey="title" idKey="filmID" placeholder="Search Films..." selectedVal={screeningForm.filmID} onChange={(val) => setScreeningForm({...screeningForm, filmID: val})} onSearch={handleFilmSearch} /></div>
            <div className="form-group"><label>Host Club</label><select className="form-control" value={screeningForm.clubID} onChange={e=>setScreeningForm({...screeningForm, clubID: e.target.value})}>{user && user.clubs && user.clubs.length > 0 ? user.clubs.map(c => <option key={c.clubID} value={c.clubID}>{c.name}</option>) : clubs.map(c => <option key={c.clubID} value={c.clubID}>{c.name}</option>)}</select></div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}><div className="form-group"><label>Venue</label><SearchableSelect options={venues} labelKey="name" idKey="venueID" placeholder="Search Venue..." selectedVal={screeningForm.venueID} onChange={(val) => setScreeningForm({...screeningForm, venueID: val})} onSearch={handleVenueSearch} /></div><div className="form-group"><label>Date & Time</label><input type="datetime-local" className="form-control" value={screeningForm.date} onChange={e=>setScreeningForm({...screeningForm, date: e.target.value})} /></div></div>
            <button className="btn-primary" style={{width: '100%'}} onClick={() => validateAndSubmit('http://localhost:3001/api/add-screening', screeningForm, () => setScreeningForm(prev => ({...prev, date:'', filmID: '', venueID: ''})), 'screening')}>Publish Screening</button>
          </div>
        </div>
      )}

      {activeTab === 'links' && (
        <div className="grid-layout">
          <div className="card" style={{zIndex: 1, overflow: 'visible'}}><h3 className="card-title"><FaEdit /> Update Film TMDB</h3><div className="form-group"><SearchableSelect options={films} labelKey="title" idKey="filmID" placeholder="Select Film..." selectedVal={linkForm.filmID} onChange={(val) => setLinkForm({...linkForm, filmID: val})} onSearch={handleFilmSearch} /></div><div className="form-group"><input className="form-control" placeholder="New TMDB Link" value={linkForm.tmdb} onChange={e=>setLinkForm({...linkForm, tmdb: e.target.value})} /></div><button className="btn-primary" style={{width: '100%'}} onClick={handleUpdateLink}>Update Link</button></div>
          <div className="card" style={{zIndex: 2, overflow: 'visible'}}><h3 className="card-title"><FaFacebook /> Link Social Post</h3><div className="form-group"><label>Select Your Screening</label><SearchableSelect options={screenings} labelKey="displayLabel" idKey="screeningID" placeholder={screenings.length > 0 ? "Search by Film..." : "No screenings found for your club"} selectedVal={socialForm.screeningID} onChange={(val) => setSocialForm({...socialForm, screeningID: val})} onSearch={handleScreeningSearch} /></div><div className="form-group"><div style={{display:'flex', gap:'20px', marginBottom:'10px', color:'var(--text-muted)'}}><label><input type="radio" name="plat" value="Facebook" checked={socialForm.platform === 'Facebook'} onChange={e=>setSocialForm({...socialForm, platform: e.target.value})}/> Facebook</label><label><input type="radio" name="plat" value="Instagram" checked={socialForm.platform === 'Instagram'} onChange={e=>setSocialForm({...socialForm, platform: e.target.value})}/> Instagram</label></div><input className="form-control" placeholder="Post URL" value={socialForm.link} onChange={e=>setSocialForm({...socialForm, link: e.target.value})} /></div><button className="btn-primary" style={{width: '100%'}} onClick={() => validateAndSubmit('http://localhost:3001/api/add-social-post', socialForm, () => setSocialForm({...socialForm, link:''}), 'social')}>Link Post</button></div>
        </div>
      )}
    </div>
  );
};

// --- SEARCHABLE SELECT COMPONENT ---
const SearchableSelect = ({ options, labelKey, idKey, placeholder, selectedVal, onChange, onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    const selectedOption = options.find(o => String(o[idKey]) === String(selectedVal));
    if (selectedOption) {
      setDisplayText(selectedOption[labelKey]);
    } else {
      if (!isOpen) setDisplayText('');
    }
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
    if (!isOpen) {
      setIsOpen(true);
      setDisplayText('');
      onSearch('');
    }
  };

  const handleSelect = (option) => {
    onChange(option[idKey]);
    setDisplayText(option[labelKey]);
    setIsOpen(false);
    onSearch('');
  };

  return (
    <div ref={wrapperRef} style={{position: 'relative'}}>
      <div className="form-control" onClick={() => { if(isOpen) setIsOpen(false); else { setIsOpen(true); setDisplayText(''); onSearch(''); inputRef.current?.focus(); } }} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'text'}}>
        <input ref={inputRef} style={{border: 'none', background: 'transparent', color: 'var(--text-main)', width: '100%', outline: 'none'}} placeholder={placeholder} value={displayText} onChange={handleInputChange} onClick={handleInputClick} autoComplete="off" />
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

export default ContentManagerPage;