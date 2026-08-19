import React, { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProgressLoader = ({ statusText, progress, error, onRetry, onReset, isComplete, onFinish }) => {
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(onFinish, 800); // short pause at 100%
      return () => clearTimeout(timer);
    }
  }, [isComplete, onFinish]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center rounded-full mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Генерация қатесі</h3>
        <p className="text-slate-600 mb-6">{error}</p>
        <div className="flex justify-center gap-3">
          <button onClick={onReset} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            Қайта бастау
          </button>
          <button onClick={onRetry} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors">
            Осы қадамнан қайталау
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <div className="relative mb-8">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-brand-500"
        >
          <Briefcase className="w-20 h-20" />
        </motion.div>
        {isComplete && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -bottom-2 -right-2 text-green-500 bg-white rounded-full"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>
        )}
      </div>

      <h3 className="text-xl font-medium text-slate-800 mb-2">
        {statusText}
      </h3>
      
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-4">
        <motion.div 
          className="h-full bg-brand-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "linear" }}
        />
      </div>
      <p className="text-sm text-slate-400 mt-3 font-medium">
        {Math.round(progress)}%
      </p>
    </div>
  );
};
