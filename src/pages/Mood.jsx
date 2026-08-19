import React from 'react';
import { Neon3DBackground } from '../components/ui/Neon3DBackground';

export const Mood = ({ onSwitchRole }) => {
  return (
    <div className="relative min-h-screen text-slate-200 overflow-hidden">
      <Neon3DBackground />
      <header className="bg-paper/80 backdrop-blur-md border-b border-brand-500/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold neon-text">Көңіл күй</h1>
              <p className="text-sm text-slate-400">Интерактивті релаксация аймағы</p>
            </div>
          </div>
          
          <div className="bg-paper/40 p-1 rounded-xl flex items-center shadow-[0_0_15px_rgba(255,255,255,0.15)] border border-brand-500/30 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button 
              onClick={() => onSwitchRole('teacher')}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-brand-500 transition-all whitespace-nowrap"
            >
              Мұғалім
            </button>
            <button 
              onClick={() => onSwitchRole('deputy')}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-brand-500 transition-all whitespace-nowrap"
            >
              Орынбасар
            </button>
            <button 
              onClick={() => onSwitchRole('deputy_briefcase')}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-brand-500 transition-all whitespace-nowrap"
            >
              Тәрбие орынбасарының қойын сөмкесі
            </button>
            <button 
              className="px-4 py-2 text-sm font-bold rounded-lg neon-bg whitespace-nowrap"
            >
              Көңіл күй
            </button>
          </div>
        </div>
      </header>
      <main className="w-full" style={{ height: 'calc(100vh - 85px)' }}>
        <iframe 
          src="https://v0-game-camera-fix.vercel.app/" 
          width="100%" 
          height="100%" 
          style={{ border: 'none' }}
          title="Көңіл күй"
        ></iframe>
      </main>
    </div>
  );
};
