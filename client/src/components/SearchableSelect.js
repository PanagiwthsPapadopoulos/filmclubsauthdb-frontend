import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';

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
    debounceTimeout.current = setTimeout(() => { if(onSearch) onSearch(txt); }, 300);
  };

  const handleInputClick = (e) => {
    e.stopPropagation();
    setIsOpen(true);
    setDisplayText('');
    if(onSearch) onSearch('');
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

export default SearchableSelect;