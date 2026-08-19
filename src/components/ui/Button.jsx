import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', icon, onClick, disabled = false }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 px-6 py-3";
  
  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-md",
    secondary: "bg-brand-50 hover:bg-brand-100 text-brand-700",
    outline: "border-2 border-brand-200 hover:border-brand-300 text-brand-700 bg-transparent",
    ghost: "text-slate-600 hover:text-brand-600 hover:bg-brand-50",
    magic: "bg-gradient-to-r from-brand-500 to-orange-400 hover:from-brand-600 hover:to-orange-500 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''} ${className}`}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
};
