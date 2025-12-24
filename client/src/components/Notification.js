import React from 'react';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const Notification = ({ notification }) => {
  if (!notification) return null;

  return (
    <>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      <div style={{
        position: 'fixed', top: '90px', right: '20px',
        backgroundColor: notification.isError ? '#ef4444' : '#22c55e', 
        color: 'white', padding: '15px 25px', 
        borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
        zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600',
        animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        {notification.isError ? <FaExclamationCircle size={20} /> : <FaCheckCircle size={20} />}
        <span>{notification.text}</span>
      </div>
    </>
  );
};

export default Notification;