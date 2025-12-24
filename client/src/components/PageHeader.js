import React from 'react';

const PageHeader = ({ title, icon, children }) => {
  return (
    <div className="page-header">
      <h1 className="page-title">
        {icon && <span style={{marginRight: '10px', color: 'var(--accent-primary)'}}>{icon}</span>}
        {title}
      </h1>
      {children && <div>{children}</div>}
    </div>
  );
};

export default PageHeader;