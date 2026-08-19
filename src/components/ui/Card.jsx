import React from 'react';

export const Card = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${hover ? 'hover:shadow-md hover:border-brand-200 transition-all cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
