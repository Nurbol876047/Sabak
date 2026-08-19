import React from 'react';

export const Card = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`glass-card p-6 ${hover ? 'hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:border-brand-500/80 transition-all cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
