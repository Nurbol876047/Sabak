import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', icon, onClick, disabled = false }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 px-6 py-3";
  
  const variants = {
    primary: "neon-bg",
    secondary: "bg-paper hover:bg-paper-dark text-brand-500 neon-border",
    outline: "border-2 border-brand-500 hover:border-brand-400 text-brand-500 bg-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]",
    ghost: "text-slate-400 hover:text-brand-500 hover:bg-brand-900/30",
    magic: "bg-brand-500 text-black shadow-[0_0_20px_rgba(255,255,255,0.8)] hover:shadow-[0_0_30px_rgba(255,255,255,1)] transform hover:-translate-y-0.5 font-bold"
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
