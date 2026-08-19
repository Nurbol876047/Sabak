import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Clock, Users, Calendar, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { planStorage } from '../utils/planStorage';

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
    <div className="min-h-screen bg-paper-light p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <Briefcase className="text-brand-500 w-8 h-8" />
              Менің чемоданым
            </h1>
            <p className="text-slate-500">Тәрбие сағаттарыңыздың кітапханасы</p>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
              <button 
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-brand-700 shadow-sm"
              >
                Мұғалім
              </button>
              <button 
                onClick={() => onSwitchRole('deputy')}
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 transition-all"
              >
                Орынбасар
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setIsVideoModalOpen(true)} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>}>
                Видео
              </Button>
              <Button variant="primary" onClick={onNewPlan} icon={<Plus className="w-5 h-5" />}>
                Жаңа жоспар
              </Button>
            </div>
          </div>
        </header>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center">
            <div className="bg-brand-50 p-6 rounded-full mb-6">
              <Briefcase className="w-12 h-12 text-brand-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Сіздің чемоданыңыз әзірге бос</h3>
            <p className="text-slate-500 max-w-md mb-8">
              Алғашқы интерактивті тәрбие сағатын 5 минутта жасаңыз. Біздің нейрожеліміз идеялар мен материалдарға көмектеседі.
            </p>
            <Button variant="magic" onClick={onNewPlan}>
              Алғашқы чемоданды жинау
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((item) => (
              <Card key={item.id} hover onClick={() => onOpenPlan(item.id)}>
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                      {item.target}
                    </span>
                    <button 
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      onClick={(e) => handleDelete(e, item.id)}
                      title="Жоспарды жою"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex-1 leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-4 pt-4 border-t border-slate-50">
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

        <div className="mt-12 space-y-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Жылдам бастау</h2>
            <p className="text-slate-500 mb-6">Сыныбыңызға сәйкес келетін тақырыпты таңдаңыз</p>
          </div>
          
          {TOPIC_CATEGORIES.map((cat, cIdx) => (
            <div key={cIdx}>
              <h3 className="text-lg font-bold text-brand-700 mb-4">{cat.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.topics.map((topic, tIdx) => (
                  <button 
                    key={tIdx}
                    onClick={() => onNewPlan(topic)}
                    className="text-left bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-brand-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-slate-700 group-hover:text-brand-600 transition-colors leading-snug">{topic}</span>
                      <Plus className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)}
        title="Видео"
      >
        <div className="space-y-6">
          <p className="text-slate-600">Платформамен жұмыс істеу бойынша қысқаша бейненұсқаулықтармен танысыңыз.</p>
          <div className="flex flex-col gap-6">
            <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200">
              <h4 className="font-semibold text-slate-800 px-2 pb-2 pt-1">1. Жоспарды қалай құру керек</h4>
              <video src="/videos/1.mp4" controls className="w-full rounded-xl shadow-sm bg-black aspect-video" />
            </div>
            <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200">
              <h4 className="font-semibold text-slate-800 px-2 pb-2 pt-1">2. Чемоданмен жұмыс</h4>
              <video src="/videos/2.mp4" controls className="w-full rounded-xl shadow-sm bg-black aspect-video" />
            </div>
            <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200">
              <h4 className="font-semibold text-slate-800 px-2 pb-2 pt-1">3. Бейімдеу және жақсарту</h4>
              <video src="/videos/3.mp4" controls className="w-full rounded-xl shadow-sm bg-black aspect-video" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
