import React, { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Wizard } from './pages/Wizard';
import { ResultPage } from './pages/ResultPage';
import { DeputyDashboard } from './pages/DeputyDashboard';
import { DeputyBriefcase } from './pages/DeputyBriefcase';
import { Mood } from './pages/Mood';
import { planStorage } from './utils/planStorage';
import { Neon3DBackground } from './components/ui/Neon3DBackground';

function App() {
  // Routes: 'landing', 'dashboard', 'wizard', 'result'
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  
  const [generatedScenario, setGeneratedScenario] = useState(null);
  const [generatedActivities, setGeneratedActivities] = useState(null);
  const [generatedMaterials, setGeneratedMaterials] = useState(null);
  const [planParams, setPlanParams] = useState(null);
  const [planHistory, setPlanHistory] = useState([]);
  const [aiProvider, setAiProvider] = useState('gemini');
  const [currentPlanId, setCurrentPlanId] = useState(null);
  
  const [appMode, setAppMode] = useState('teacher'); // 'teacher' | 'deputy'

  const handleAdapt = (newScenario, newActivities, newParams) => {
    // Save current to history
    setPlanHistory(prev => [...prev, {
      scenario: generatedScenario,
      activities: generatedActivities,
      materials: generatedMaterials,
      params: planParams
    }]);
    
    // Update current
    setGeneratedScenario(newScenario);
    setGeneratedActivities(newActivities);
    setGeneratedMaterials(null); // Clear materials on adapt so user can regenerate them
    setPlanParams(newParams);
  };

  const handleGenerateMaterials = (newMaterials) => {
    setGeneratedMaterials(newMaterials);
  };

  const handleOpenPlan = async (id) => {
    const plan = planStorage.getPlan(id);
    if (plan) {
      setCurrentPlanId(plan.id);
      setGeneratedScenario(plan.scenario);
      setGeneratedActivities(plan.activities);
      setGeneratedMaterials(plan.materials || null);
      setPlanParams(plan.params);
      setPlanHistory(plan.adaptationHistory || []);
      // If we had recommendations we could set them too, but they are fetched on demand
      setCurrentRoute('result');
    }
  };

  const [initialTopicForWizard, setInitialTopicForWizard] = useState('');

  const handleNewPlan = (topic = '') => {
    setCurrentPlanId(null);
    setGeneratedScenario(null);
    setGeneratedActivities(null);
    setGeneratedMaterials(null);
    setPlanParams(null);
    setPlanHistory([]);
    setInitialTopicForWizard(typeof topic === 'string' ? topic : '');
    setCurrentRoute('wizard');
  };

  return (
    <div className="font-sans text-slate-200 bg-transparent min-h-screen relative z-0">
      <Neon3DBackground />
      {currentRoute === 'landing' && (
        <LandingPage onStart={() => setCurrentRoute('dashboard')} />
      )}
      
      {currentRoute === 'dashboard' && appMode === 'teacher' && (
        <Dashboard 
          onNewPlan={handleNewPlan}
          onOpenPlan={handleOpenPlan}
          onSwitchRole={(role) => setAppMode(role)}
        />
      )}

      {currentRoute === 'dashboard' && appMode === 'deputy' && (
        <DeputyDashboard onSwitchRole={(role) => setAppMode(role)} />
      )}

      {currentRoute === 'dashboard' && appMode === 'deputy_briefcase' && (
        <DeputyBriefcase onSwitchRole={(role) => setAppMode(role)} />
      )}

      {currentRoute === 'dashboard' && appMode === 'mood' && (
        <Mood onSwitchRole={(role) => setAppMode(role)} />
      )}
      
      {currentRoute === 'wizard' && (
        <Wizard 
          aiProvider={aiProvider}
          initialTopic={initialTopicForWizard}
          onBack={() => setCurrentRoute('dashboard')}
          onComplete={(data, scenario, activities, materials, savedId) => {
            setGeneratedScenario(scenario);
            setGeneratedActivities(activities);
            setGeneratedMaterials(materials);
            const { generatedScenario: _, generatedActivities: __, generatedMaterials: ___, generatedTimeline: ____, ...pureParams } = data;
            setPlanParams(pureParams);
            setPlanHistory([]);
            setCurrentPlanId(savedId || null);
            setCurrentRoute('result');
          }}
        />
      )}
      
      {currentRoute === 'result' && (
        <ResultPage 
          onBack={() => setCurrentRoute('dashboard')}
          currentPlanId={currentPlanId}
          onPlanSaved={(id) => setCurrentPlanId(id)}
          generatedScenario={generatedScenario}
          generatedActivities={generatedActivities}
          generatedMaterials={generatedMaterials}
          planParams={planParams}
          onAdapt={handleAdapt}
          onGenerateMaterials={handleGenerateMaterials}
          aiProvider={aiProvider}
        />
      )}
      
    </div>
  );
}

export default App;
