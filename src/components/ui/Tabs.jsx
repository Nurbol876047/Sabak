import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex space-x-1 bg-paper/50 p-1 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-colors outline-none
            ${activeTab === tab.id ? 'text-brand-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-200/50'}
          `}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 glass-card rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};
