import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ProgressLoader } from '../components/ui/ProgressLoader';

import { generateScenario, generateActivities, generateMaterials } from '../api/ai';
import { planStorage } from '../utils/planStorage';
import { buildTimeline } from '../utils/timeline';

const SUGGESTIONS = [
  'Қауіпсіздік ережелері',
  'Кибербуллинг',
  'Кәсіптік бағдар',
  'Қаржылық сауаттылық',
  'ҰБТ-ға дайындық'
];


export const Wizard = ({ onBack, onComplete, aiProvider, initialTopic = '' }) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [formData, setFormData] = useState({
    topic: initialTopic,
    age: '',
    studentsCount: '',
    duration: '45',
    features: ''
  });
  const [generationState, setGenerationState] = useState({
    status: '',
    progress: 0,
    error: null,
    currentStep: 'idle'
  });

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else assembleSuitcase();
  };

  const assembleSuitcase = async (startFrom = 'scenario') => {
    setIsGenerating(true);
    setGenerationComplete(false);
    
    let currentData = { ...formData };
    
    try {
      // 1. Scenario
      if (startFrom === 'scenario' || !currentData.generatedScenario) {
        setGenerationState({ status: 'Сценарий жазылуда...', progress: 10, error: null, currentStep: 'scenario' });
        const scenarioJSON = await generateScenario(currentData, { provider: aiProvider });
        currentData.generatedScenario = scenarioJSON;
        setFormData(prev => ({...prev, generatedScenario: scenarioJSON}));
      }

      // 2. Activities
      if (['scenario', 'activities'].includes(startFrom) || !currentData.generatedActivities) {
        setGenerationState({ status: 'Тапсырмалар таңдалуда...', progress: 40, error: null, currentStep: 'activities' });
        const activitiesJSON = await generateActivities(currentData.generatedScenario, currentData, { provider: aiProvider });
        currentData.generatedActivities = activitiesJSON;
        setFormData(prev => ({...prev, generatedActivities: activitiesJSON}));
      }

      // 3. Timeline
      if (['scenario', 'activities', 'timeline'].includes(startFrom)) {
        setGenerationState({ status: 'Таймлайн құрастырылуда...', progress: 65, error: null, currentStep: 'timeline' });
        const timelineJSON = buildTimeline(currentData.generatedScenario, currentData.generatedActivities, currentData.duration);
        currentData.generatedTimeline = timelineJSON;
        // Small delay for UI
        await new Promise(r => setTimeout(r, 500));
      }

      // 4. Materials
      if (['scenario', 'activities', 'timeline', 'materials'].includes(startFrom) || !currentData.generatedMaterials) {
        setGenerationState({ status: 'Материалдар дайындалуда...', progress: 85, error: null, currentStep: 'materials' });
        const materialsJSON = await generateMaterials(currentData.generatedScenario, currentData.generatedActivities, currentData, { provider: aiProvider });
        currentData.generatedMaterials = materialsJSON;
        setFormData(prev => ({...prev, generatedMaterials: materialsJSON}));
      }

      // 5. Final pause and Save
      setGenerationState({ status: 'Сәл қалды...', progress: 100, error: null, currentStep: 'complete' });
      await new Promise(r => setTimeout(r, 800)); // short pause

      // Save to storage
      const planDataToSave = {
        title: currentData.topic,
        params: currentData,
        scenario: currentData.generatedScenario,
        activities: currentData.generatedActivities,
        materials: currentData.generatedMaterials,
        timeline: currentData.generatedTimeline?.items || []
      };
      
      const savedId = planStorage.savePlan(planDataToSave);

      setGenerationComplete(true);
      // Wait for ProgressLoader to finish its animation, then call onComplete
      setTimeout(() => {
        onComplete(currentData, currentData.generatedScenario, currentData.generatedActivities, currentData.generatedMaterials, savedId);
      }, 500);

    } catch (err) {
      console.error(err);
      setGenerationState(prev => ({ ...prev, error: err.message || 'Генерация кезінде қате пайда болды.' }));
    }
  };

  const handleRetry = () => {
    assembleSuitcase(generationState.currentStep);
  };

  const handleReset = () => {
    setIsGenerating(false);
    setGenerationComplete(false);
    setStep(2);
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="glass-card p-10 rounded-3xl shadow-[0_0_20px_rgba(255,255,255,0.15)] w-full max-w-lg">
          <ProgressLoader 
            statusText={generationState.status}
            progress={generationState.progress}
            error={generationState.error}
            isComplete={generationComplete}
            onRetry={handleRetry}
            onReset={handleReset}
            onFinish={() => {}} // handled above
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-10 flex justify-center">
      <div className="w-full max-w-2xl">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-slate-200 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Чемоданға қайту
        </button>

        <div className="glass-card rounded-3xl shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/20 p-8 md:p-12">
          {/* Steps indicator */}
          <div className="flex items-center gap-3 mb-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium \${step >= 1 ? 'bg-brand-500 text-white' : 'bg-paper/50 text-slate-400'}`}>1</div>
            <div className={`h-1 w-12 rounded-full \${step >= 2 ? 'bg-brand-500' : 'bg-paper/50'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium \${step >= 2 ? 'bg-brand-500 text-white' : 'bg-paper/50 text-slate-400'}`}>2</div>
          </div>

          <h2 className="text-3xl font-bold text-slate-200 mb-8">
            {step === 1 ? 'Не туралы сөйлесеміз?' : 'Сынып параметрлері'}
          </h2>

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Іс-шара тақырыбы немесе идеясы</label>
                <textarea 
                  className="w-full border border-brand-500/30 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none h-32 text-slate-200"
                  placeholder="Мысалы: Интернетте өзіңді қалай қорғауға болады..."
                  value={formData.topic}
                  onChange={e => setFormData({...formData, topic: e.target.value})}
                />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-3">Жылдам идеялар:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map(s => (
                    <button 
                      key={s} 
                      onClick={() => setFormData({...formData, topic: s})}
                      className="px-4 py-2 bg-paper/40 hover:bg-brand-50 text-slate-300 hover:text-brand-700 rounded-lg text-sm transition-colors border border-brand-500/20"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Жасы/Сынып</label>
                  <input 
                    type="text" 
                    className="w-full border border-brand-500/30 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Мысалы: 1-4 сынып"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Оқушылар саны</label>
                  <input 
                    type="number" 
                    className="w-full border border-brand-500/30 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Мысалы: 25"
                    value={formData.studentsCount}
                    onChange={e => setFormData({...formData, studentsCount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Уақыт (минут)</label>
                  <select 
                    className="w-full border border-brand-500/30 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none glass-card"
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                  >
                    <option value="30">30 минут</option>
                    <option value="45">45 минут</option>
                    <option value="60">60 минут</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Сынып ерекшеліктері (міндетті емес)</label>
                <textarea 
                  className="w-full border border-brand-500/30 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none resize-none h-24"
                  placeholder="Мысалы: Балалар белсенді, рөлдік ойындарды жақсы көреді..."
                  value={formData.features}
                  onChange={e => setFormData({...formData, features: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-end">
            {step === 1 ? (
              <Button onClick={handleNext} disabled={!formData.topic.trim()}>
                Келесі
              </Button>
            ) : (
              <Button variant="magic" onClick={handleNext} disabled={!formData.age.trim()} className="px-8">
                <Sparkles className="w-5 h-5 mr-2" />
                Бәрін жинау
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
