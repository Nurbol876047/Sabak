import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Download, Share2, Sparkles, FileText, LayoutList, Paperclip, FileDown, Settings2, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Timeline } from '../components/ui/Timeline';
import { Modal } from '../components/ui/Modal';
import { mockLessonPlan } from '../data/mockData';
import ReactMarkdown from 'react-markdown';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import html2pdf from 'html2pdf.js';
import { adaptPlan, generateMaterials, improvePlan } from '../api/ai';
import { buildTimeline } from '../utils/timeline';
import { planStorage } from '../utils/planStorage';

export const ResultPage = ({ onBack, currentPlanId, onPlanSaved, generatedScenario, generatedActivities, generatedMaterials, planParams, onAdapt, onGenerateMaterials, aiProvider }) => {
  const [activeTab, setActiveTab] = useState('scenario');
  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Materials generation state
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false);
  const [materialsError, setMaterialsError] = useState(null);

  // Improve states
  const [recommendations, setRecommendations] = useState(null);
  const [isImproving, setIsImproving] = useState(false);
  const [improveError, setImproveError] = useState(null);
  const [applyingRecId, setApplyingRecId] = useState(null); // id of single rec being applied
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);

  // Adaptation states
  const [isAdaptModalOpen, setIsAdaptModalOpen] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptError, setAdaptError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [adaptFormData, setAdaptFormData] = useState({
    age: '',
    studentsCount: '',
    features: ''
  });

  useEffect(() => {
    if (planParams) {
      setAdaptFormData({
        age: planParams.age || '',
        studentsCount: planParams.studentsCount || '',
        features: planParams.features || ''
      });
    }
  }, [planParams]);

  const handleOpenImprove = async () => {
    setIsImproveModalOpen(true);
    if (!generatedScenario || !generatedActivities || recommendations) return;
    
    setIsImproving(true);
    setImproveError(null);
    try {
      const timelineDataObj = buildTimeline(generatedScenario, generatedActivities, planParams?.duration);
      const recs = await improvePlan(generatedScenario, generatedActivities, timelineDataObj, planParams, { provider: aiProvider });
      setRecommendations(recs);
    } catch (err) {
      console.error(err);
      setImproveError(err.message || 'Ұсыныстар генерациясында қате пайда болды.');
    } finally {
      setIsImproving(false);
    }
  };

  const handleApplyRecommendation = async (rec, index) => {
    setApplyingRecId(index);
    try {
      // TODO: точечное применение по конкретному заданию
      // Временное решение: прогоняем через общую адаптацию, добавляя совет в особенности
      const suggestionText = `AI ұсынысы (${rec.area}): ${rec.issue} -> ${rec.suggestion}`;
      const newParams = {
        ...planParams,
        features: (planParams?.features ? planParams.features + '\n' : '') + suggestionText
      };
      
      const adapted = await adaptPlan(generatedScenario, generatedActivities, newParams, { provider: aiProvider });
      onAdapt(adapted.scenario, adapted.activities, newParams);
      
      // Remove applied rec from list
      setRecommendations(prev => prev.filter((_, i) => i !== index));
      setNotificationMsg('Ұсыныс жоспарға қолданылды');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Қолдану кезінде қате: ' + err.message);
    } finally {
      setApplyingRecId(null);
    }
  };

  const handleApplyAll = async () => {
    if (!recommendations || recommendations.length === 0) return;
    setIsApplyingAll(true);
    setAppliedCount(0);
    
    try {
      let currentScenario = generatedScenario;
      let currentActivities = generatedActivities;
      let currentParams = planParams;

      for (let i = 0; i < recommendations.length; i++) {
        const rec = recommendations[i];
        const suggestionText = `AI ұсынысы (${rec.area}): ${rec.issue} -> ${rec.suggestion}`;
        currentParams = {
          ...currentParams,
          features: (currentParams?.features ? currentParams.features + '\n' : '') + suggestionText
        };
        
        const adapted = await adaptPlan(currentScenario, currentActivities, currentParams, { provider: aiProvider });
        currentScenario = adapted.scenario;
        currentActivities = adapted.activities;
        setAppliedCount(i + 1);
      }
      
      onAdapt(currentScenario, currentActivities, currentParams);
      setRecommendations([]);
      setIsImproveModalOpen(false);
      setNotificationMsg('Барлық ұсыныстар жоспарға қолданылды');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Барлығын қолдану кезінде қате: ' + err.message);
    } finally {
      setIsApplyingAll(false);
      setAppliedCount(0);
    }
  };

  const [notificationMsg, setNotificationMsg] = useState('');

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotificationMsg('Сілтеме көшірілді');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Көшіру кезінде қате пайда болды');
    }
  };

  const handleDownloadWord = async () => {
    try {
      const title = planParams?.topic || mockLessonPlan.title;
      const children = [];
      
      children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }));
      if (planParams) {
        children.push(new Paragraph({ text: `Сынып: ${planParams.age} | Ұзақтығы: ${planParams.duration} минут`, spacing: { after: 400 } }));
      }

      if (generatedScenario) {
        children.push(new Paragraph({ text: "Сценарий", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }));
        if (generatedScenario.intro) {
          children.push(new Paragraph({ text: "Кіріспе", heading: HeadingLevel.HEADING_3 }));
          children.push(new Paragraph({ text: generatedScenario.intro }));
        }
        if (generatedScenario.main_parts) {
          children.push(new Paragraph({ text: "Негізгі бөлім", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }));
          generatedScenario.main_parts.forEach(part => {
            children.push(new Paragraph({ text: `${part.title} (${part.duration})`, heading: HeadingLevel.HEADING_4, spacing: { before: 200 } }));
            children.push(new Paragraph({ children: [new TextRun({ text: "Мұғалім: ", bold: true }), new TextRun(part.teacher_action)] }));
            children.push(new Paragraph({ children: [new TextRun({ text: "Оқушылар: ", bold: true }), new TextRun(part.student_action)] }));
          });
        }
        if (generatedScenario.conclusion) {
          children.push(new Paragraph({ text: "Қорытынды", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }));
          children.push(new Paragraph({ text: generatedScenario.conclusion }));
        }
      }

      if (generatedActivities && generatedActivities.length > 0) {
        children.push(new Paragraph({ text: "Тапсырмалар", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }));
        generatedActivities.forEach((act, idx) => {
          children.push(new Paragraph({ text: `${idx + 1}. ${act.title} (${act.duration})`, heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }));
          children.push(new Paragraph({ children: [new TextRun({ text: "Түрі: ", bold: true }), new TextRun(act.type)] }));
          children.push(new Paragraph({ children: [new TextRun({ text: "Сипаттама: ", bold: true }), new TextRun(act.description)] }));
        });
      }

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title}.docx`);
      
      setNotificationMsg('Word жүктелді');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Word жүктеу қатесі");
    }
  };

  const handleDownloadPdf = () => {
    const title = planParams?.topic || mockLessonPlan.title;
    const element = document.getElementById('print-container');
    if (!element) return;
    
    element.style.display = 'block';
    const opt = {
      margin:       0.5,
      filename:     `${title}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    setNotificationMsg('PDF жасалуда...');
    setShowToast(true);

    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
      setNotificationMsg('PDF жүктелді');
      setTimeout(() => setShowToast(false), 3000);
    });
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      const title = planParams?.topic || mockLessonPlan.title;
      
      // 1. Scenario
      if (generatedScenario) {
        let scenarioText = `# ${title}\n\n`;
        if (generatedScenario.intro) scenarioText += `## Кіріспе\n${generatedScenario.intro}\n\n`;
        if (generatedScenario.main_parts) {
          scenarioText += `## Негізгі бөлім\n`;
          generatedScenario.main_parts.forEach(part => {
            scenarioText += `### ${part.title} (${part.duration})\n**Мұғалім:** ${part.teacher_action}\n**Оқушылар:** ${part.student_action}\n\n`;
          });
        }
        if (generatedScenario.conclusion) scenarioText += `## Қорытынды\n${generatedScenario.conclusion}\n\n`;
        zip.file("Сценарий.md", scenarioText);
      }
      
      // 2. Activities
      if (generatedActivities && generatedActivities.length > 0) {
        let activitiesText = `# Тапсырмалар\n\n`;
        generatedActivities.forEach((act, idx) => {
          activitiesText += `## ${idx + 1}. ${act.title} (${act.duration})\n`;
          activitiesText += `**Түрі:** ${act.type}\n`;
          activitiesText += `**Сипаттама:** ${act.description}\n`;
          if (act.materials) activitiesText += `**Материалдар:** ${act.materials}\n`;
          activitiesText += `\n---\n\n`;
        });
        zip.file("Тапсырмалар.md", activitiesText);
      }
      
      // 3. Materials
      if (generatedMaterials) {
        const materialsFolder = zip.folder("Материалдар");
        
        if (generatedMaterials.cards && generatedMaterials.cards.length > 0) {
          let cardsText = `# Карточкалар\n\n`;
          generatedMaterials.cards.forEach((card, idx) => {
            cardsText += `## ${card.title}\n${card.instructions}\n`;
            if (card.questions) {
              cardsText += `\n**Сұрақтар:**\n`;
              card.questions.forEach(q => cardsText += `- ${q}\n`);
            }
            cardsText += `\n---\n\n`;
          });
          materialsFolder.file("Карточкалар.md", cardsText);
        }
        
        if (generatedMaterials.questions && generatedMaterials.questions.length > 0) {
          materialsFolder.file("Талқылау сұрақтары.txt", generatedMaterials.questions.join('\n\n'));
        }
        
        if (generatedMaterials.texts && generatedMaterials.texts.length > 0) {
          materialsFolder.file("Мәтіндер_Кейстер.txt", generatedMaterials.texts.join('\n\n---\n\n'));
        }
        
        if (generatedMaterials.presentation && generatedMaterials.presentation.length > 0) {
          let pptxText = `# Презентация құрылымы\n\n`;
          generatedMaterials.presentation.forEach((slide, idx) => {
            pptxText += `## Слайд ${idx + 1}: ${slide.slideTitle}\n**Мазмұны:**\n${slide.content}\n\n**Ескертпе:**\n${slide.speakerNote}\n\n---\n\n`;
          });
          materialsFolder.file("Презентация_слайдтары.md", pptxText);
        }
      }

      setNotificationMsg('Архив жасалуда...');
      setShowToast(true);
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${title}.zip`);
      
      setNotificationMsg('Жүктеу басталды');
      setTimeout(() => setShowToast(false), 3000);
      
    } catch (error) {
      console.error("ZIP қатесі:", error);
      alert("ZIP жүктеу кезінде қате пайда болды");
    }
  };

  const handleSavePlan = () => {
    try {
      const planData = {
        id: currentPlanId,
        title: planParams?.topic || mockLessonPlan.title,
        params: planParams,
        scenario: generatedScenario,
        activities: generatedActivities,
        materials: generatedMaterials,
        timeline: timelineData?.items || []
      };
      const newId = planStorage.savePlan(planData);
      if (onPlanSaved) onPlanSaved(newId);
      
      setNotificationMsg(currentPlanId ? 'План чемоданда жаңартылды' : 'Чемоданға қосылды');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleAdaptSubmit = async () => {
    if (!generatedScenario || !generatedActivities) return;
    
    setIsAdapting(true);
    setAdaptError(null);
    try {
      const adapted = await adaptPlan(generatedScenario, generatedActivities, adaptFormData, { provider: aiProvider });
      onAdapt(adapted.scenario, adapted.activities, adaptFormData);
      setIsAdaptModalOpen(false);
      setNotificationMsg('План жаңа параметрлерге бейімделді');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      setAdaptError(err.message || 'Бейімдеу кезінде қате пайда болды.');
    } finally {
      setIsAdapting(false);
    }
  };

  const handleGenerateMaterialsSubmit = async () => {
    if (!generatedScenario || !generatedActivities || !planParams) return;
    
    setIsGeneratingMaterials(true);
    setMaterialsError(null);
    try {
      const mats = await generateMaterials(generatedScenario, generatedActivities, planParams, { provider: aiProvider });
      onGenerateMaterials(mats);
    } catch (err) {
      console.error(err);
      setMaterialsError(err.message || 'Материалдар генерациясында қате пайда болды.');
    } finally {
      setIsGeneratingMaterials(false);
    }
  };

  const TABS = [
    { id: 'scenario', label: 'Сценарий', icon: FileText },
    { id: 'activities', label: 'Тапсырмалар', icon: LayoutList },
    { id: 'materials', label: 'Материалдар', icon: Paperclip },
  ];

  const renderScenario = () => {
    if (generatedScenario) {
      return (
        <div className="space-y-8">
          {generatedScenario.intro && (
            <div className="bg-brand-50/50 p-6 rounded-2xl border border-brand-100/50">
              <h3 className="text-xl font-bold text-brand-900 mb-3">Кіріспе</h3>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{generatedScenario.intro}</p>
            </div>
          )}
          
          {generatedScenario.main_parts && generatedScenario.main_parts.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-200">Негізгі бөлім</h3>
              <div className="space-y-4">
                {generatedScenario.main_parts.map((part, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-brand-500/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <h4 className="font-semibold text-slate-200">{part.title}</h4>
                      <span className="text-xs font-medium bg-paper/50 text-slate-300 px-2.5 py-1 rounded-md">
                        {part.duration}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-1">Мұғалім:</p>
                      <p className="text-slate-200 leading-relaxed">{part.teacher_action}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-1">Оқушылар:</p>
                      <p className="text-slate-200 leading-relaxed">{part.student_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {generatedScenario.conclusion && (
            <div className="bg-paper/40 p-6 rounded-2xl border border-brand-500/20">
              <h3 className="text-xl font-bold text-slate-200 mb-3">Қорытынды</h3>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{generatedScenario.conclusion}</p>
            </div>
          )}
        </div>
      );
    }
    // Fallback to mock text if not generated via API
    return (
      <div className="prose prose-slate max-w-none prose-headings:text-brand-900 prose-a:text-brand-600 prose-p:leading-relaxed">
        <ReactMarkdown>{mockLessonPlan.scenario}</ReactMarkdown>
      </div>
    );
  };

  const renderActivities = () => {
    const activitiesToRender = generatedActivities || mockLessonPlan.activities;
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-200 mb-6">Тапсырмалар мен белсенділіктер</h2>
        {activitiesToRender.map((act, idx) => {
          // AI data has description, mock data has content
          const isAi = !!generatedActivities;
          const content = isAi ? act.description : act.content;
          
          return (
            <Card key={act.id || idx} hover onClick={() => setSelectedItem({ ...act, content })} className="border-brand-100 bg-brand-50/30">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-lg font-semibold text-brand-800">{act.title}</h4>
                {isAi && (
                  <span className="text-xs font-medium glass-card text-brand-600 px-2 py-1 rounded-md border border-brand-100">
                    {act.duration}
                  </span>
                )}
              </div>
              {isAi && (
                <div className="mb-3">
                  <span className="inline-block text-xs font-medium text-slate-400 uppercase tracking-wider bg-paper/50 px-2 py-0.5 rounded">
                    {act.type}
                  </span>
                </div>
              )}
              <p className="text-slate-300 line-clamp-2">{content}</p>
              
              {isAi && act.materials && (
                <div className="mt-3 flex items-start gap-2 text-sm text-slate-400">
                  <Paperclip className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{act.materials}</span>
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" className="text-brand-600 px-4 py-2">Ашу</Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMaterials = () => {
    // 1. Если это mock-данные (нет сгенерированного сценария)
    if (!generatedScenario) {
      return (
        <div>
           <h2 className="text-2xl font-bold text-slate-200 mb-6">Дайын материалдар</h2>
           <div className="grid sm:grid-cols-2 gap-4">
            {mockLessonPlan.materials.map(mat => (
              <Card key={mat.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center flex-shrink-0">
                  {mat.type === 'presentation' ? <LayoutList className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-200 truncate">{mat.title}</h4>
                  <p className="text-xs text-slate-400">{mat.size}</p>
                </div>
                <button className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors">
                  <FileDown className="w-5 h-5" />
                </button>
              </Card>
            ))}
           </div>
        </div>
      );
    }

    // 2. Если сценарий сгенерирован, но материалы еще нет (или были сброшены при адаптации)
    if (!generatedMaterials) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-brand-50 text-brand-500 flex items-center justify-center rounded-full mx-auto mb-6">
            <Paperclip className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-200 mb-3">Материалдарды жинау қажет</h3>
          <p className="text-slate-300 mb-8 max-w-md mx-auto">
            Біз сіздің ағымдағы сценарийіңіз негізінде тапсырмалар карточкаларын, талқылау сұрақтарын және презентацияны дайындаймыз.
          </p>
          
          {isGeneratingMaterials ? (
             <div className="flex flex-col items-center">
               <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-4" />
               <span className="text-brand-600 font-medium">Материалдар генерациялануда...</span>
             </div>
          ) : materialsError ? (
             <div>
               <p className="text-red-500 mb-4">{materialsError}</p>
               <Button onClick={handleGenerateMaterialsSubmit} variant="primary">Қайта көру</Button>
             </div>
          ) : (
            <Button onClick={handleGenerateMaterialsSubmit} variant="magic" className="px-8 py-3">
              <Sparkles className="w-5 h-5 mr-2" /> Материалдарды генерациялау
            </Button>
          )}
        </div>
      );
    }

    // 3. Реальные сгенерированные материалы
    return (
      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-slate-200 mb-6">Сабаққа арналған материалдар</h2>
          <p className="text-slate-300 mb-8">Материалдар сіздің тапсырмаларыңызға және аудиторияңызға арнайы дайындалған.</p>
        </div>

        {generatedMaterials.cards && generatedMaterials.cards.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-brand-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Тапсырмалар карточкалары
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {generatedMaterials.cards.map((card, idx) => (
                <Card key={idx} className="border-brand-100 bg-brand-50/20">
                  <h4 className="font-semibold text-brand-800 mb-2">{card.title}</h4>
                  <p className="text-sm text-slate-200 mb-3 leading-relaxed">{card.instructions}</p>
                  {card.questions && card.questions.length > 0 && (
                    <div className="mt-3 glass-card p-3 rounded-lg border border-brand-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Сұрақтар:</p>
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {card.questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {generatedMaterials.questions && generatedMaterials.questions.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-brand-900 mb-4 flex items-center gap-2">
              <LayoutList className="w-5 h-5" /> Талқылауға арналған сұрақтар
            </h3>
            <Card className="glass-card">
              <ul className="space-y-3">
                {generatedMaterials.questions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-200">
                    <span className="text-brand-500 font-bold mt-0.5">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {generatedMaterials.texts && generatedMaterials.texts.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-brand-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Мәтіндер мен кейстер
            </h3>
            <div className="space-y-4">
              {generatedMaterials.texts.map((text, idx) => (
                <Card key={idx} className="bg-paper/40/50 border-brand-500/30">
                  <p className="text-slate-200 leading-relaxed">{text}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {generatedMaterials.presentation && generatedMaterials.presentation.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-brand-900 mb-4 flex items-center gap-2">
              <LayoutList className="w-5 h-5" /> Презентация слайдтары
            </h3>
            <div className="space-y-4">
              {generatedMaterials.presentation.map((slide, idx) => (
                <Card key={idx} className="flex flex-col sm:flex-row gap-6 border-brand-500/30">
                  <div className="sm:w-1/3 flex flex-col justify-center items-center bg-paper/50 rounded-xl p-6 min-h-[160px] text-center border border-brand-500/30">
                    <h4 className="font-bold text-slate-200 mb-2">{slide.slideTitle}</h4>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{slide.content}</p>
                  </div>
                  <div className="sm:w-2/3 py-2">
                    <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Мұғалімге арналған ескертпе:</p>
                    <p className="text-sm text-slate-200 leading-relaxed bg-brand-50/50 p-4 rounded-xl border border-brand-100/50">
                      {slide.speakerNote}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const timelineData = useMemo(() => {
    if (!generatedScenario) return null;
    const data = buildTimeline(generatedScenario, generatedActivities, planParams?.duration);
    // Добавляем id для рендеринга
    data.items = data.items.map((item, idx) => ({ ...item, id: idx + 1 }));
    return data;
  }, [generatedScenario, generatedActivities, planParams]);

  const durationDiff = timelineData ? Math.abs(timelineData.totalDuration - timelineData.targetDuration) : 0;
  const showDurationWarning = durationDiff > 5;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="glass-card border-b border-brand-500/30 sticky top-0 z-40 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-200 bg-paper/40 hover:bg-paper/50 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-200">
                {planParams ? planParams.topic : mockLessonPlan.title}
              </h1>
              <p className="text-sm text-slate-400">
                {planParams ? `${planParams.age} • ${planParams.duration} минут` : `${mockLessonPlan.target} • ${mockLessonPlan.duration} минут`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {generatedScenario && (
              <Button 
                variant="outline" 
                onClick={handleSavePlan} 
                icon={<Save className="w-4 h-4" />}
                className="text-brand-600 border-brand-200 hover:bg-brand-50"
              >
                {currentPlanId ? 'Чемоданда жаңарту' : 'Чемоданға сақтау'}
              </Button>
            )}
            <Button variant="ghost" onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>
              Бөлісу
            </Button>
            <div className="flex bg-paper/50 p-1 rounded-xl mr-2">
              <Button variant="ghost" onClick={handleDownloadPdf} className="px-3 py-1.5 h-auto text-sm text-slate-300 hover:text-slate-900" title="PDF жүктеп алу">
                PDF
              </Button>
              <Button variant="ghost" onClick={handleDownloadWord} className="px-3 py-1.5 h-auto text-sm text-slate-300 hover:text-slate-900 border-l border-brand-500/30 rounded-none" title="Word жүктеп алу">
                DOCX
              </Button>
              <Button variant="ghost" onClick={handleDownloadZip} className="px-3 py-1.5 h-auto text-sm text-slate-300 hover:text-slate-900 border-l border-brand-500/30 rounded-none" title="ZIP жүктеп алу">
                ZIP
              </Button>
            </div>
            {/* Show Adapt only if AI generated data exists */}
            {generatedScenario && (
              <Button variant="secondary" onClick={() => setIsAdaptModalOpen(true)} icon={<Settings2 className="w-4 h-4" />}>
                Бейімдеу
              </Button>
            )}
            <Button variant="primary" onClick={handleOpenImprove} icon={<Sparkles className="w-4 h-4" />}>
              Жақсарту
            </Button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className="bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-medium">{notificationMsg || 'Сәтті'}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Left column: Timeline */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="sticky top-28 space-y-4">
            <div className="glass-card p-6 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/20">
              <h3 className="text-lg font-bold text-slate-200 mb-6">Таймлайн</h3>
              <Timeline items={timelineData ? timelineData.items : mockLessonPlan.timeline} />
            </div>
            
            {/* Duration Warning */}
            {timelineData && showDurationWarning && (
              <div className="bg-amber-500/20 p-4 rounded-xl border border-amber-500/30 flex gap-3 text-amber-200">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-sm">
                  Жоспардың жалпы ұзақтығы ({timelineData.totalDuration} мин) көрсетілгеннен ({timelineData.targetDuration} мин) ерекшеленеді. Мұны өткізу кезінде ескеріңіз.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right column: Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 max-w-sm">
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="glass-card rounded-3xl shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/20 p-8 min-h-[600px]">
            {activeTab === 'scenario' && renderScenario()}

            {activeTab === 'activities' && renderActivities()}

            {activeTab === 'materials' && renderMaterials()}
          </div>
        </div>
      </main>

      {/* Improve Modal */}
      <Modal 
        isOpen={isImproveModalOpen} 
        onClose={() => !isApplyingAll && setIsImproveModalOpen(false)}
        title="AI жақсарту бойынша ұсыныстары"
      >
        {isImproving ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-4" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">Жоспарды талдаудамыз...</h3>
            <p className="text-sm text-slate-400 text-center">Оқушылардың қатысуын арттыру жолдарын іздеудеміз.</p>
          </div>
        ) : improveError ? (
          <div className="text-center py-6">
            <p className="text-red-500 mb-4">{improveError}</p>
            <Button onClick={handleOpenImprove} variant="primary">Қайта көру</Button>
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-slate-300 text-sm">{recommendations.length} ұсыныс табылды</p>
              <Button 
                onClick={handleApplyAll} 
                disabled={isApplyingAll || applyingRecId !== null}
                variant="magic" 
                className="py-1.5 px-4 text-sm"
              >
                {isApplyingAll ? `${appliedCount} қолданылуда (${recommendations.length})...` : 'Барлығын қолдану'}
              </Button>
            </div>
            
            <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {/* Сортировка по приоритету: high -> medium -> low */}
              {[...recommendations].sort((a, b) => {
                const p = { 'high': 1, 'medium': 2, 'low': 3 };
                return (p[a.priority] || 4) - (p[b.priority] || 4);
              }).map((rec, idx) => {
                const isApplyingThis = applyingRecId === idx;
                const isApplyingAny = applyingRecId !== null || isApplyingAll;
                
                return (
                  <div key={idx} className="p-4 rounded-xl border border-brand-500/30 bg-paper/40/50">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-200 text-slate-200'
                          }`}>
                            {rec.priority || 'low'}
                          </span>
                          <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{rec.area}</span>
                        </div>
                        <span className="font-medium text-slate-200 block text-sm">{rec.issue}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{rec.suggestion}</p>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleApplyRecommendation(rec, idx)} 
                        disabled={isApplyingAny}
                        variant="secondary"
                        className="py-1 px-3 text-xs"
                      >
                        {isApplyingThis ? 'Қолданылуда...' : 'Қолдану'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : recommendations && recommendations.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-200">Жоспар тамаша көрінеді!</h3>
            <p className="text-sm text-slate-400">Біздің AI маңызды мәселелер таппады.</p>
          </div>
        ) : null}
      </Modal>

      {/* Adapt Modal */}
      <Modal 
        isOpen={isAdaptModalOpen} 
        onClose={() => !isAdapting && setIsAdaptModalOpen(false)}
        title="Сыныпқа бейімдеу"
      >
        {isAdapting ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-4" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">Жоспарды қайта құрудамыз...</h3>
            <p className="text-sm text-slate-400 text-center max-w-sm">Біз құрылымды сақтаймыз, бірақ тапсырмалар мен беру тәсілін жаңа параметрлеріңізге бейімдейміз.</p>
          </div>
        ) : adaptError ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 flex items-center justify-center rounded-full mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Бейімдеу қатесі</h3>
            <p className="text-slate-300 mb-6">{adaptError}</p>
            <div className="flex justify-center gap-3">
              <Button variant="ghost" onClick={() => setAdaptError(null)}>Артқа</Button>
              <Button variant="primary" onClick={handleAdaptSubmit}>Қайта көру</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Жасы/Сынып</label>
                <input 
                  type="text" 
                  className="w-full border border-brand-500/30 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={adaptFormData.age}
                  onChange={e => setAdaptFormData({...adaptFormData, age: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Оқушылар саны</label>
                <input 
                  type="number" 
                  className="w-full border border-brand-500/30 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={adaptFormData.studentsCount}
                  onChange={e => setAdaptFormData({...adaptFormData, studentsCount: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Сынып ерекшеліктері (міндетті емес)</label>
              <textarea 
                className="w-full border border-brand-500/30 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none resize-none h-24"
                placeholder="Мысалы: Зейін тапшылығы бар балалар бар, тәртіп нашар..."
                value={adaptFormData.features}
                onChange={e => setAdaptFormData({...adaptFormData, features: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsAdaptModalOpen(false)}>Болдырмау</Button>
              <Button variant="primary" onClick={handleAdaptSubmit} disabled={!adaptFormData.age.trim()}>
                <Settings2 className="w-4 h-4 mr-2" /> Қолдану
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Item View/Edit Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || ''}
      >
        <div className="space-y-6">
          <textarea 
            className="w-full h-64 border border-brand-500/30 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none resize-y"
            defaultValue={selectedItem?.content}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedItem(null)}>Болдырмау</Button>
            <Button onClick={() => setSelectedItem(null)}>Сақтау</Button>
          </div>
        </div>
      </Modal>

      {/* Hidden Print Container for PDF */}
      <div id="print-container" style={{ display: 'none', padding: '40px', background: 'white', color: 'black' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          {planParams ? planParams.topic : mockLessonPlan.title}
        </h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
          {planParams ? `${planParams.age} • ${planParams.duration} минут` : ''}
        </p>

        {generatedScenario && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '8px', marginBottom: '16px' }}>Сценарий</h2>
            {generatedScenario.intro && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Кіріспе</h3>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.5' }}>{generatedScenario.intro}</p>
              </div>
            )}
            {generatedScenario.main_parts && generatedScenario.main_parts.map((part, idx) => (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{part.title} ({part.duration})</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '4px' }}><strong>Мұғалім:</strong> {part.teacher_action}</p>
                <p style={{ fontSize: '14px', lineHeight: '1.5' }}><strong>Оқушылар:</strong> {part.student_action}</p>
              </div>
            ))}
            {generatedScenario.conclusion && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Қорытынды</h3>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.5' }}>{generatedScenario.conclusion}</p>
              </div>
            )}
          </div>
        )}

        {generatedActivities && generatedActivities.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '8px', marginBottom: '16px' }}>Тапсырмалар</h2>
            {generatedActivities.map((act, idx) => (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{idx + 1}. {act.title} ({act.duration})</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '4px' }}><strong>Түрі:</strong> {act.type}</p>
                <p style={{ fontSize: '14px', lineHeight: '1.5' }}><strong>Сипаттама:</strong> {act.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
