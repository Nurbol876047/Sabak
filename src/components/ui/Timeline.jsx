import React from 'react';

export const Timeline = ({ items }) => {
  return (
    <div className="relative pl-4 sm:pl-6 border-l-2 border-brand-100 space-y-8 py-4">
      {items.map((item, idx) => (
        <div key={item.id} className="relative group">
          {/* Timeline Node */}
          <div className="absolute -left-[21px] sm:-left-[29px] w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-brand-50 border-4 border-white shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-1 ring-brand-200 group-hover:bg-brand-400 group-hover:ring-brand-400 transition-colors" />
          
          <div className="glass-card p-4 rounded-xl border border-brand-500/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-md hover:border-brand-100 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                {item.time}
              </span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {item.type}
              </span>
            </div>
            <h4 className="text-base font-semibold text-slate-200 mb-1">{item.title}</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
