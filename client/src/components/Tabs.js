import React from 'react';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`btn-ghost ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          style={{
            borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : 'none',
            borderRadius: 0,
            paddingBottom: '15px',
            color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)'
          }}
        >
          {tab.icon && <span style={{ marginRight: '8px' }}>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;