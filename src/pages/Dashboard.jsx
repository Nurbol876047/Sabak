import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Clock, Users, Calendar, Trash2, Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { planStorage } from '../utils/planStorage';
import { Neon3DBackground } from '../components/ui/Neon3DBackground';

const TOPIC_CATEGORIES = [
  {
    title: '1–4 сыныптар',
    topics: [
      'Қауіпсіздік ережелері (жол, от, су)',
      'Сыныптағы достық пен сыйластық',
      'Салауатты өмір салты',
      'Экология және табиғат',
      'Менің отбасым, құндылықтар',
      'Патриотизм: Қазақстан рәміздері'
    ]
  },
  {
    title: '5–6 сыныптар',
    topics: [
      'Кибербуллинг және интернеттегі қауіпсіздік',
      'Цифрлық гигиена (экран уақыты, желілер)',
      'Сыныптағы кикілжіңдерді шешу',
      'Төзімділік және адамдарды құрметтеу',
      'Мақсат қою және тиімді оқу'
    ]
  },
  {
    title: '7–9 сыныптар',
    topics: [
      'Жасөспірімдер арасындағы буллинг',
      'Кәсіптік бағдар: мамандық таңдау',
      'Қаржылық сауаттылық',
      'Киберқауіпсіздік және цифрлық із',
      'Психологиялық әл-ауқат, стресс',
      'Темекі, вейп және есірткінің зияны'
    ]
  },
  {
    title: '10–11 сыныптар',
    topics: [
      'ЖОО және мамандық таңдау',
      'ҰБТ-ға дайындық — стрессті жеңу',
      'Қаржылық сауаттылық және ересек өмір',
      'Киберқауіпсіздік, онлайн алаяқтық',
      'Психикалық денсаулық, күйіп кету',
      'Тәуелділіктердің алдын алу'
    ]
  }
];

export const Dashboard = ({ onNewPlan, onOpenPlan, onSwitchRole }) => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    setPlans(planStorage.listPlans());
  };

  const handleDelete = (e, id) => {
    e.stopPropagation(); // prevent opening the plan
    if (window.confirm('Бұл жоспарды жойғыңыз келетініне сенімдісіз бе?')) {
      planStorage.deletePlan(id);
      loadPlans();
    }
  };

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const isEmpty = plans.length === 0;

  return (
    <div className="relative min-h-screen text-slate-200 overflow-hidden">
      <Neon3DBackground />
      <div className="relative z-10 p-6 md:p-10 max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2 flex items-center gap-4">
              <Hexagon className="text-brand-500 w-10 h-10 animate-[spin_10s_linear_infinite]" />
              Менің жүйем
            </h1>
            <p className="text-slate-400">Тәрбие сағаттарыңыздың кибер-кітапханасы</p>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className="bg-paper/80 backdrop-blur-md p-1 rounded-xl flex items-center border border-brand-500/30 shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <button 
                className="px-4 py-2 text-sm font-bold rounded-lg neon-bg"
              >
                Мұғалім
              </button>
              <button 
                onClick={() => onSwitchRole('deputy')}
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-brand-500 transition-all"
              >
                Орынбасар
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsVideoModalOpen(true)} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>}>
                Видео
              </Button>
              <Button variant="magic" onClick={onNewPlan} icon={<Plus className="w-5 h-5" />}>
                Жаңа жоспар
              </Button>
            </div>
          </div>
        </header>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center glass-card border-brand-500/50 p-16 text-center neon-border">
            <div className="bg-brand-500/20 p-6 rounded-full mb-6 border border-brand-500/40 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <Hexagon className="w-16 h-16 text-brand-500" />
            </div>
            <h3 className="text-2xl font-bold neon-text mb-4">Жүйе қоймасы бос</h3>
            <p className="text-slate-300 max-w-md mb-8 text-lg">
              Алғашқы интерактивті модульді жасаңыз. Біздің нейрожелі сізге барлық қажеттілікті генерациялайды.
            </p>
            <Button variant="magic" onClick={onNewPlan}>
              Жүйені іске қосу
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((item) => (
              <Card key={item.id} hover onClick={() => onOpenPlan(item.id)}>
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-brand-500/20 text-brand-500 border border-brand-500/30 shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                      {item.target}
                    </span>
                    <button 
                      className="text-slate-400 hover:text-red-500 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all p-1"
                      onClick={(e) => handleDelete(e, item.id)}
                      title="Жоспарды жою"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-3 flex-1 leading-snug group-hover:text-brand-500 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-brand-500 mt-4 pt-4 border-t border-brand-500/20">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {item.duration} мин
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> 
                      {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-16 space-y-10 relative z-10">
          <div>
            <h2 className="text-3xl font-bold neon-text mb-3">Жылдам іске қосу</h2>
            <p className="text-slate-400 text-lg mb-6">Сыныпқа сәйкес келетін бағдарламаны таңдаңыз</p>
          </div>
          
          {TOPIC_CATEGORIES.map((cat, cIdx) => (
            <div key={cIdx} className="mb-8">
              <h3 className="text-xl font-bold text-brand-400 mb-5 pl-3 border-l-4 border-brand-500">{cat.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cat.topics.map((topic, tIdx) => (
                  <motion.button 
                    key={tIdx}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNewPlan(topic)}
                    className="text-left bg-paper/60 backdrop-blur-md p-5 rounded-2xl border border-brand-500/30 hover:border-brand-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-slate-300 group-hover:text-brand-500 transition-colors leading-snug">{topic}</span>
                      <Plus className="w-5 h-5 text-brand-700 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)}
        title="Видео Нұсқаулық"
      >
        <div className="space-y-6">
          <p className="text-slate-300">Жүйемен жұмыс істеу бойынша қысқаша бейненұсқаулықтармен танысыңыз.</p>
          <div className="flex flex-col gap-6">
            <div className="bg-paper-dark/50 rounded-2xl p-2 border border-brand-500/20">
              <h4 className="font-semibold text-brand-400 px-2 pb-2 pt-1">1. Жоспарды қалай құру керек</h4>
              <video src="/videos/1.mp4" controls className="w-full rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-black aspect-video border border-brand-500/10" />
            </div>
            <div className="bg-paper-dark/50 rounded-2xl p-2 border border-brand-500/20">
              <h4 className="font-semibold text-brand-400 px-2 pb-2 pt-1">2. Жүйемен жұмыс</h4>
              <video src="/videos/2.mp4" controls className="w-full rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-black aspect-video border border-brand-500/10" />
            </div>
            <div className="bg-paper-dark/50 rounded-2xl p-2 border border-brand-500/20">
              <h4 className="font-semibold text-brand-400 px-2 pb-2 pt-1">3. Бейімдеу және жақсарту</h4>
              <video src="/videos/3.mp4" controls className="w-full rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-black aspect-video border border-brand-500/10" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
