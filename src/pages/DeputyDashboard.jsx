import React, { useState, useEffect } from 'react';
import { Briefcase, FileText, CheckSquare, Users, Loader2, Download, Plus, Trash2, Edit2, Check, X, Calendar, Copy, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Neon3DBackground } from '../components/ui/Neon3DBackground';
import { callGemini } from '../api/aiClient';
import { planStorage } from '../utils/planStorage';

export const DeputyDashboard = ({ onSwitchRole }) => {
  const [activeTab, setActiveTab] = useState('annual_plan');
  
  // Generator state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  // Form state
  const [formData, setFormData] = useState({
    year: '2026-2027',
    period: 'Весь год',
    ageGroups: {
      '1-4 сыныптар': false,
      '5-9 сыныптар': false,
      '10-11 сыныптар': false,
    },
    features: ''
  });

  // Guide state
  const [guideTopic, setGuideTopic] = useState('');
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [guideError, setGuideError] = useState(null);
  const [generatedGuide, setGeneratedGuide] = useState(null);
  const [savedGuides, setSavedGuides] = useState([]);

  // Onboarding state
  const [onboardingForm, setOnboardingForm] = useState({
    year: '2026-2027',
    schoolType: 'Жалпы орта білім беретін мектеп',
    alreadyDone: ''
  });
  const [activeChecklist, setActiveChecklist] = useState(null);
  const [isOnboardingGenerating, setIsOnboardingGenerating] = useState(false);
  const [onboardingError, setOnboardingError] = useState(null);

  // Pedsovet state
  const [pedsovetForm, setPedsovetForm] = useState({
    topic: '',
    audience: 'Барлық сынып жетекшілері',
    duration: '30 минут'
  });
  const [isGeneratingPedsovet, setIsGeneratingPedsovet] = useState(false);
  const [pedsovetError, setPedsovetError] = useState(null);
  const [generatedPedsovet, setGeneratedPedsovet] = useState(null);
  const [savedPedsovets, setSavedPedsovets] = useState([]);
  const [pedsovetView, setPedsovetView] = useState('presentation'); // 'presentation' or 'guide'
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reports state
  const [reportForm, setReportForm] = useState({
    period: '1 тоқсан (1 четверть)',
    includePlan: true,
    includeCompletedOnly: false,
    extraNotes: ''
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [editableReportText, setEditableReportText] = useState('');

  useEffect(() => {
    if (activeTab === 'materials') {
      const plans = planStorage.listPlans();
      setSavedGuides(plans.filter(p => p.type === 'methodicalGuide'));
    }
    if (activeTab === 'onboarding') {
      loadOnboardingChecklist();
    }
    if (activeTab === 'pedsovet') {
      const plans = planStorage.listPlans();
      setSavedPedsovets(plans.filter(p => p.type === 'staffMeetingMaterial'));
    }
    if (activeTab === 'reports') {
      const plans = planStorage.listPlans();
      setSavedReports(plans.filter(p => p.type === 'activityReport'));
    }
  }, [activeTab]);

  const loadOnboardingChecklist = () => {
    const plans = planStorage.listPlans();
    const onboardingPlan = plans.find(p => p.type === 'onboardingChecklist');
    if (onboardingPlan) {
      const planData = planStorage.getPlan(onboardingPlan.id);
      if (planData && planData.checklistData) {
        setActiveChecklist({ ...planData.checklistData, id: planData.id });
      }
    } else {
      setActiveChecklist(null);
    }
  };

  const handleCheckbox = (group) => {
    setFormData(prev => ({
      ...prev,
      ageGroups: {
        ...prev.ageGroups,
        [group]: !prev.ageGroups[group]
      }
    }));
  };

  const handleGenerate = async () => {
    const selectedAges = Object.entries(formData.ageGroups).filter(([k, v]) => v).map(([k]) => k);
    if (selectedAges.length === 0) {
      alert("Кем дегенде бір жас ерекшелігін таңдаңыз!");
      return;
    }

    setIsGenerating(true);
    setError(null);

    const prompt = `
Ты опытный методист и заместитель директора по воспитательной работе (тәрбие ісі жөніндегі орынбасары) в школе Казахстана.
Составь годовой план воспитательной работы.
Оқу жылы (Учебный год): ${formData.year}
Кезең (Период): ${formData.period}
Жас ерекшеліктері (Классы): ${selectedAges.join(', ')}
Ерекшеліктер (Особенности школы): ${formData.features || 'Жалпы орта білім беретін мектеп'}

ТРЕБОВАНИЯ:
1. План должен быть разбит по месяцам (если "Весь год", то с сентября по май). На каникулах минимизировать мероприятия.
2. Для каждого месяца напиши 2-4 темы/мероприятия.
3. ОБЯЗАТЕЛЬНО привяжи мероприятия к государственным и национальным праздникам РК (1 сентября, День Учителя, День Республики, День Независимости, Наурыз, 1 мая, 7 мая, 9 мая и т.д.).
4. Формулировки тем должны различаться для выбранных возрастных групп (${selectedAges.join(', ')}). Учитывай их интересы.
5. Форматы должны быть разнообразными (Сынып сағаты, Жиын, Сайыс, Эскурсия, Кездесу, Дөңгелек үстел и т.д.).
6. Весь текст должен быть на КАЗАХСКОМ ЯЗЫКЕ.

ОТВЕЧАЙ ТОЛЬКО В ФОРМАТЕ JSON, БЕЗ MARKDOWN, БЕЗ ПОЯСНЕНИЙ!
Формат JSON:
{
  "months": [
    {
      "month": "Қыркүйек",
      "topics": [
        {
          "title": "Название мероприятия",
          "ageGroup": "Для каких классов",
          "format": "Формат",
          "suggestedDate": "Например: 1 қыркүйек",
          "isHoliday": true
        }
      ]
    }
  ]
}
`;

    try {
      const response = await callGemini(prompt, { temperature: 0.7 });
      
      // Попытка выпарсить JSON
      let cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      }
      
      const data = JSON.parse(cleanedText);
      if (data && data.months) {
        setGeneratedPlan(data.months);
      } else {
        throw new Error("Invalid JSON structure");
      }
    } catch (err) {
      console.error(err);
      setError('Генерация кезінде қате пайда болды. Қайталап көріңіз.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAnnualPlan = () => {
    if (!generatedPlan) return;
    planStorage.savePlan({
      title: `Тәрбие жоспары (${formData.year} • ${formData.period})`,
      type: 'deputyAnnualPlan',
      guide: generatedPlan,
      params: { duration: formData.period, age: 'Барлығы' }
    });
    alert("Жоспар сақталды!");
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReportError(null);

    let planContext = '';
    if (reportForm.includePlan) {
      const plans = planStorage.listPlans();
      const annualPlan = plans.find(p => p.type === 'deputyAnnualPlan');
      const planDataToUse = annualPlan?.guide || generatedPlan;

      if (planDataToUse) {
        const relevantEvents = [];
        planDataToUse.forEach(month => {
          month.topics.forEach(topic => {
            if (reportForm.includeCompletedOnly && !topic.completed) return;
            relevantEvents.push(`${month.month}: ${topic.title} (${topic.format}) - ${topic.completed ? 'Өткізілді' : 'Жоспарланған'}`);
          });
        });
        planContext = `Деректер (Жоспарланған / өткізілген іс-шаралар):\n${relevantEvents.join('\n')}`;
      } else {
        planContext = `Жүйеде сақталған жылдық жоспар жоқ.`;
      }
    }

    const prompt = `
Ты помогаешь заместителю директора по воспитательной работе (тәрбие ісі жөніндегі орынбасары) оформить официальный отчёт для РОО/управления образования.
Период отчета: ${reportForm.period}
Дополнительная информация от завуча: ${reportForm.extraNotes || 'Нет'}

${planContext}

ТРЕБОВАНИЯ:
1. Составь структурированный официальный отчет.
2. Вводная часть (период, общая характеристика проделанной работы).
3. Перечень проведённых мероприятий (используя ТОЛЬКО предоставленные данные, не выдумывай факты и конкретные цифры, которых нет). Если данных мало, отметь, что данные в системе ограничены.
4. Выводы и рекомендации на следующий период.
5. Весь текст должен быть на КАЗАХСКОМ ЯЗЫКЕ в официальном стиле (ресми стиль).

ОТВЕЧАЙ ТОЛЬКО В ФОРМАТЕ JSON, БЕЗ MARKDOWN, БЕЗ ПОЯСНЕНИЙ!
Формат JSON:
{
  "title": "Название отчета",
  "intro": "Вводная часть текста",
  "sections": [
    {
      "sectionTitle": "Название раздела",
      "content": "Текст раздела"
    }
  ],
  "recommendations": "Рекомендации/задачи на следующий период"
}
`;

    try {
      const response = await callGemini(prompt, { temperature: 0.7 });
      let cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      
      const data = JSON.parse(cleanedText);
      if (data && data.title) {
        setGeneratedReport(data);
        let rawText = `${data.title}\n\n${data.intro}\n\n`;
        if (data.sections) {
          data.sections.forEach(s => {
            rawText += `=== ${s.sectionTitle} ===\n${s.content}\n\n`;
          });
        }
        rawText += `=== Ұсыныстар / Келесі кезеңге міндеттер ===\n${data.recommendations || ''}`;
        setEditableReportText(rawText);
      } else {
        throw new Error("Invalid JSON structure");
      }
    } catch (err) {
      console.error(err);
      setReportError('Есеп құру кезінде қате пайда болды. Қайталап көріңіз.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSaveReport = () => {
    if (!editableReportText) return;
    planStorage.savePlan({
      title: `Есеп: ${reportForm.period}`,
      type: 'activityReport',
      guide: editableReportText,
      params: { duration: reportForm.period, age: 'РОО' }
    });
    alert("Есеп сақталды!");
    const plans = planStorage.listPlans();
    setSavedReports(plans.filter(p => p.type === 'activityReport'));
  };

  const handleDownload = () => {
    alert("Бұл мүмкіндік келесі жаңартуларда қосылады (экспорт в DOCX/PDF)!");
  };

  const PRESET_TOPICS = [
    "Сынып жетекшілерінің жұмысын ұйымдастыру",
    "Тәрбие жұмысының құжаттамасы және есептілік",
    "Педкеңес/жиналыс өткізу",
    "Жалпы мектептік іс-шараларды ұйымдастыру",
    "Мектептегі тәрбие жұмысын бақылау және мониторинг"
  ];

  const handleGenerateGuide = async (topicToGenerate) => {
    const topic = topicToGenerate || guideTopic;
    if (!topic.trim()) {
      alert("Тақырыпты енгізіңіз немесе тізімнен таңдаңыз!");
      return;
    }

    setIsGeneratingGuide(true);
    setGuideError(null);
    setGuideTopic(topic);

    const prompt = `
Ты опытный методист и заместитель директора по воспитательной работе (тәрбие ісі жөніндегі орынбасары) в школе Казахстана.
Составь методичку (нұсқаулық) для завуча по теме: "${topic}".
Методичка должна решать задачи именно ЗАВУЧА (управление, контроль, организация работы учителей), а не классного руководителя (как провести урок).

ОТВЕЧАЙ ТОЛЬКО В ФОРМАТЕ JSON, БЕЗ MARKDOWN, БЕЗ ПОЯСНЕНИЙ!
Весь текст должен быть на КАЗАХСКОМ ЯЗЫКЕ.

Формат JSON:
{
  "title": "Название методички",
  "purpose": "Для чего нужна эта методичка, когда применять",
  "steps": [
    {
      "stepTitle": "Название шага",
      "stepDescription": "Подробное описание действий"
    }
  ],
  "checklist": [
    "Пункт 1 для самопроверки",
    "Пункт 2"
  ],
  "templates": [
    "Здесь может быть готовый текст шаблона (например, текст приказа, шаблон плана совещания или отчета), который можно скопировать. Если шаблоны не нужны, оставь пустой массив."
  ]
}
`;

    try {
      const response = await callGemini(prompt, { temperature: 0.7 });
      let cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      }
      
      const data = JSON.parse(cleanedText);
      if (data && data.title) {
        setGeneratedGuide(data);
      } else {
        throw new Error("Invalid JSON structure");
      }
    } catch (err) {
      console.error(err);
      setGuideError('Генерация кезінде қате пайда болды. Қайталап көріңіз.');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const handleSaveGuide = () => {
    if (!generatedGuide) return;
    planStorage.savePlan({
      title: generatedGuide.title,
      type: 'methodicalGuide',
      guide: generatedGuide,
      params: { duration: '-', age: 'Орынбасар' }
    });
    alert("Әдістемелік құрал сақталды!");
    const plans = planStorage.listPlans();
    setSavedGuides(plans.filter(p => p.type === 'methodicalGuide'));
    setGeneratedGuide(null);
    setGuideTopic('');
  };

  const handleGenerateOnboarding = async () => {
    if (activeChecklist && !window.confirm('Жаңа чек-лист құру алдыңғы сақталған прогрессті жояды. Жалғастырамыз ба?')) {
      return;
    }

    setIsOnboardingGenerating(true);
    setOnboardingError(null);

    const prompt = `
Ты опытный методист. Составь структурированный чек-лист "С чего начать учебный год" для нового завуча по воспитательной работе (тәрбие ісі жөніндегі орынбасары).
Оқу жылы: ${onboardingForm.year}
Мектеп түрі: ${onboardingForm.schoolType}
Уже сделано (не предлагай это): ${onboardingForm.alreadyDone || 'Нет информации'}

Требования:
1. Обязательные документы на начало года.
2. Обязательные мероприятия/планерки.
3. Организационные шаги (работа с классными руководителями).
4. Раздел с частыми ошибками новых завучей (на что обратить внимание).

ОТВЕЧАЙ ТОЛЬКО В ФОРМАТЕ JSON, БЕЗ MARKDOWN!
Текст на КАЗАХСКОМ ЯЗЫКЕ.

Формат JSON:
{
  "checklist": [
    {
      "id": "уникальная_строка",
      "category": "Название категории (например, Құжаттар)",
      "title": "Название задачи",
      "description": "Краткое пояснение",
      "deadline": "Дедлайн или null",
      "done": false
    }
  ],
  "commonMistakes": [
    "Ошибка 1",
    "Ошибка 2"
  ]
}
`;

    try {
      const response = await callGemini(prompt, { temperature: 0.7 });
      let cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      
      const data = JSON.parse(cleanedText);
      if (data && data.checklist) {
        // Удаляем старый чек-лист, если был
        if (activeChecklist && activeChecklist.id) {
          planStorage.deletePlan(activeChecklist.id);
        }
        
        // Сохраняем новый
        const savedId = planStorage.savePlan({
          title: 'Жаңа маманға арналған чек-лист',
          type: 'onboardingChecklist',
          checklistData: data,
          params: { duration: '-', age: 'Орынбасар' }
        });
        
        setActiveChecklist({ ...data, id: savedId });
      } else {
        throw new Error("Invalid JSON");
      }
    } catch (err) {
      console.error(err);
      setOnboardingError('Чек-лист құру кезінде қате пайда болды. Қайталап көріңіз.');
    } finally {
      setIsOnboardingGenerating(false);
    }
  };

  const toggleChecklistItem = (itemId) => {
    if (!activeChecklist) return;
    const updatedChecklist = activeChecklist.checklist.map(item => 
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    const updatedData = { ...activeChecklist, checklist: updatedChecklist };
    setActiveChecklist(updatedData);
    
    // Сохраняем прогресс
    planStorage.savePlan({
      id: updatedData.id,
      title: 'Жаңа маманға арналған чек-лист',
      type: 'onboardingChecklist',
      checklistData: updatedData,
      params: { duration: '-', age: 'Орынбасар' }
    });
  };

  const PEDSOVET_TOPICS = [
    "Қиын балалармен жұмыс",
    "Буллингтің алдын алу",
    "Ата-аналармен қарым-қатынас",
    "Тәрбие жұмысының жоспарын құру"
  ];

  const handleGeneratePedsovet = async (topicToGenerate) => {
    const topic = topicToGenerate || pedsovetForm.topic;
    if (!topic.trim()) {
      alert("Тақырыпты енгізіңіз немесе тізімнен таңдаңыз!");
      return;
    }

    setIsGeneratingPedsovet(true);
    setPedsovetError(null);
    setPedsovetForm(prev => ({ ...prev, topic }));
    setCurrentSlide(0);
    setPedsovetView('presentation');

    const prompt = `
Ты опытный методист. Помоги завучу по воспитательной работе подготовить выступление перед классными руководителями.
Тема: "${topic}"
Аудитория: ${pedsovetForm.audience}
Длительность: ${pedsovetForm.duration}

ОТВЕЧАЙ ТОЛЬКО В ФОРМАТЕ JSON, БЕЗ MARKDOWN! Текст на КАЗАХСКОМ ЯЗЫКЕ.

Формат JSON:
{
  "title": "Название выступления",
  "presentation": [
    {
      "slideTitle": "Заголовок слайда",
      "content": ["Тезис 1", "Тезис 2"],
      "speakerNote": "Слова спикера на этом слайде"
    }
  ],
  "guide": {
    "keyMessages": ["Главный тезис 1", "Главный тезис 2"],
    "discussionQuestions": ["Вопрос к аудитории 1", "Вопрос 2"],
    "handoutSummary": "Готовый текст памятки для раздачи учителям"
  }
}
`;

    try {
      const response = await callGemini(prompt, { temperature: 0.7 });
      let cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      
      const data = JSON.parse(cleanedText);
      if (data && data.presentation && data.guide) {
        setGeneratedPedsovet(data);
      } else {
        throw new Error("Invalid JSON structure");
      }
    } catch (err) {
      console.error(err);
      setPedsovetError('Материалдарды құру кезінде қате пайда болды. Қайталап көріңіз.');
    } finally {
      setIsGeneratingPedsovet(false);
    }
  };

  const handleSavePedsovet = () => {
    if (!generatedPedsovet) return;
    planStorage.savePlan({
      title: generatedPedsovet.title,
      type: 'staffMeetingMaterial',
      guide: generatedPedsovet,
      params: { duration: pedsovetForm.duration, age: pedsovetForm.audience }
    });
    alert("Материалдар сақталды!");
    const plans = planStorage.listPlans();
    setSavedPedsovets(plans.filter(p => p.type === 'staffMeetingMaterial'));
    setGeneratedPedsovet(null);
    setPedsovetForm(prev => ({ ...prev, topic: '' }));
  };

  return (
    <div className="relative min-h-screen text-slate-200 overflow-hidden">
      <Neon3DBackground />
      <header className="bg-paper/80 backdrop-blur-md border-b border-brand-500/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-brand-500/20 rounded-xl">
              <Users className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold neon-text">Тәрбие ісі жөніндегі орынбасары</h1>
              <p className="text-sm text-slate-400">Мектептің тәрбие жұмысын басқару</p>
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
              className="px-4 py-2 text-sm font-bold rounded-lg neon-bg whitespace-nowrap"
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
              onClick={() => onSwitchRole('mood')}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-brand-500 transition-all whitespace-nowrap"
            >
              Көңіл күй
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-3">
            <button 
              onClick={() => setActiveTab('annual_plan')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition-colors ${activeTab === 'annual_plan' ? 'bg-brand-500/10 text-brand-500' : 'text-slate-300 hover:bg-paper/40'}`}
            >
              <Calendar className="w-6 h-6" />
              Жылдық жоспар
            </button>
            <button 
              onClick={() => setActiveTab('materials')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition-colors ${activeTab === 'materials' ? 'bg-brand-500/10 text-brand-500' : 'text-slate-300 hover:bg-paper/40'}`}
            >
              <FileText className="w-6 h-6" />
              Әдістемелік құралдар
            </button>
            <button 
              onClick={() => setActiveTab('onboarding')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition-colors ${activeTab === 'onboarding' ? 'bg-brand-500/10 text-brand-500' : 'text-slate-300 hover:bg-paper/40'}`}
            >
              <CheckSquare className="w-6 h-6" />
              Жаңа маман чек-листі
            </button>
            <button 
              onClick={() => setActiveTab('pedsovet')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition-colors ${activeTab === 'pedsovet' ? 'bg-brand-500/10 text-brand-500' : 'text-slate-300 hover:bg-paper/40'}`}
            >
              <Briefcase className="w-6 h-6" />
              Педсоветке материалдар
            </button>
          </nav>
        </aside>

        <section className="flex-1">
          {activeTab !== 'annual_plan' && activeTab !== 'materials' && activeTab !== 'onboarding' && activeTab !== 'pedsovet' && activeTab !== 'reports' && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-paper/80 backdrop-blur-md rounded-2xl border border-brand-500/30 border-dashed">
              <div className="p-4 bg-brand-500/10 rounded-full mb-4">
                <FileText className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold neon-text mb-2">Бұл бөлім жақын арада іске қосылады</h2>
              <p className="text-slate-400 max-w-md">Біз осы функцияның үстінде жұмыс істеп жатырмыз. Жаңа жаңартуларды күтіңіз!</p>
            </div>
          )}

          {/* PEDSOVET TAB */}
          {activeTab === 'pedsovet' && !generatedPedsovet && (
            <div className="space-y-6">
              <Card className="bg-paper/80 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] border-brand-500/30">
                <h2 className="text-3xl font-bold neon-text mb-6">Педкеңеске / семинарға материалдар</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-3">Дайын тақырыптар</label>
                    <div className="flex flex-wrap gap-2">
                      {PEDSOVET_TOPICS.map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleGeneratePedsovet(topic)}
                          className="px-4 py-2 bg-paper/40 hover:bg-brand-500/10 text-slate-200 hover:text-brand-500 rounded-full text-sm font-medium transition-colors text-left"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-brand-500/30" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-paper/80 backdrop-blur-md text-sm text-slate-400">немесе</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Өз тақырыбыңызды енгізіңіз</label>
                    <input 
                      type="text" 
                      value={pedsovetForm.topic}
                      onChange={(e) => setPedsovetForm({...pedsovetForm, topic: e.target.value})}
                      placeholder="Мысалы: Оқушылардың сабаққа қатысуын бақылау..."
                      className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-3 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Аудитория</label>
                      <select 
                        value={pedsovetForm.audience}
                        onChange={(e) => setPedsovetForm({...pedsovetForm, audience: e.target.value})}
                        className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-2 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      >
                        <option>Барлық сынып жетекшілері</option>
                        <option>Бастауыш сынып жетекшілері (1-4)</option>
                        <option>Орта буын сынып жетекшілері (5-9)</option>
                        <option>Жоғары сынып жетекшілері (10-11)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Ұзақтығы</label>
                      <select 
                        value={pedsovetForm.duration}
                        onChange={(e) => setPedsovetForm({...pedsovetForm, duration: e.target.value})}
                        className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-2 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      >
                        <option>15 минут</option>
                        <option>30 минут</option>
                        <option>45 минут</option>
                      </select>
                    </div>
                  </div>

                  {pedsovetError && (
                    <div className="p-4 bg-red-500/20 text-red-600 rounded-lg text-sm">
                      {pedsovetError}
                    </div>
                  )}

                  <Button 
                    onClick={() => handleGeneratePedsovet()} 
                    disabled={isGeneratingPedsovet}
                    className="w-full neon-bg shadow-md shadow-indigo-200 py-3 text-lg"
                  >
                    {isGeneratingPedsovet ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Материалдар құрылуда...</>
                    ) : (
                      'Материалдарды құру'
                    )}
                  </Button>
                </div>
              </Card>

              {savedPedsovets.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-100 mb-4">Сақталған материалдар</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedPedsovets.map(pedsovet => (
                      <Card key={pedsovet.id} className="p-4 hover:border-brand-500/80 transition-colors cursor-pointer" onClick={() => {
                        const plan = planStorage.getPlan(pedsovet.id);
                        if (plan && plan.guide) {
                          setGeneratedPedsovet(plan.guide);
                          setCurrentSlide(0);
                          setPedsovetView('presentation');
                        }
                      }}>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500 shrink-0">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-100 text-sm mb-1 line-clamp-2">{pedsovet.title}</h4>
                            <p className="text-xs text-slate-400">{new Date(pedsovet.createdAt).toLocaleDateString()} • {pedsovet.params?.duration}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pedsovet' && generatedPedsovet && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-paper/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/30">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-500/20 text-brand-500 rounded-xl">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold neon-text mb-1 leading-tight">{generatedPedsovet.title}</h2>
                    <p className="text-slate-300">Педкеңес материалдары</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" onClick={() => setGeneratedPedsovet(null)}>
                    Артқа
                  </Button>
                  <Button onClick={handleSavePedsovet} className="neon-bg" icon={<Save className="w-4 h-4" />}>
                    Сақтау
                  </Button>
                </div>
              </div>

              <div className="bg-paper/80 backdrop-blur-md rounded-2xl border border-brand-500/30 shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col">
                <div className="flex border-b border-brand-500/30 bg-paper/60 backdrop-blur-md">
                  <button 
                    onClick={() => setPedsovetView('presentation')}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${pedsovetView === 'presentation' ? 'bg-paper/80 backdrop-blur-md border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Презентация
                  </button>
                  <button 
                    onClick={() => setPedsovetView('guide')}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${pedsovetView === 'guide' ? 'bg-paper/80 backdrop-blur-md border-b-2 border-brand-500 text-brand-500' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Спикерге нұсқаулық
                  </button>
                </div>

                <div className="p-6">
                  {pedsovetView === 'presentation' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                      <div className="aspect-video bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-brand-500/30 flex flex-col items-center justify-center p-12 text-center shadow-inner relative overflow-hidden">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-8 max-w-2xl leading-tight">
                          {generatedPedsovet.presentation[currentSlide].slideTitle}
                        </h2>
                        
                        {generatedPedsovet.presentation[currentSlide].content && generatedPedsovet.presentation[currentSlide].content.length > 0 && (
                          <ul className="text-left space-y-4 w-full max-w-2xl mx-auto">
                            {generatedPedsovet.presentation[currentSlide].content.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-4 text-lg sm:text-xl text-slate-200">
                                <div className="mt-1.5 p-1 bg-brand-500/20 rounded-full text-brand-500 flex-shrink-0">
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        <div className="absolute top-4 right-4 bg-paper/80 backdrop-blur-md/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-slate-400 border border-brand-500/30">
                          {currentSlide + 1} / {generatedPedsovet.presentation.length}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                          disabled={currentSlide === 0}
                          icon={<ChevronLeft className="w-5 h-5" />}
                        >
                          Алдыңғы
                        </Button>
                        <div className="text-sm font-medium text-slate-400">
                          Слайд {currentSlide + 1} / {generatedPedsovet.presentation.length}
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setCurrentSlide(prev => Math.min(generatedPedsovet.presentation.length - 1, prev + 1))}
                          disabled={currentSlide === generatedPedsovet.presentation.length - 1}
                        >
                          Келесі <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>

                      <Card className="bg-amber-500/20 border-amber-500/30 mt-6">
                        <div className="flex gap-4">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg h-fit">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-amber-200 mb-2">Спикер сөзі:</h3>
                            <p className="text-amber-900 leading-relaxed text-lg">
                              {generatedPedsovet.presentation[currentSlide].speakerNote}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {pedsovetView === 'guide' && (
                    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                      <div className="space-y-8">
                        <section>
                          <h3 className="text-2xl font-bold neon-text mb-4 flex items-center gap-2">
                            <CheckSquare className="w-6 h-6 text-brand-500" />
                            Негізгі тезистер
                          </h3>
                          <ul className="space-y-4">
                            {generatedPedsovet.guide.keyMessages.map((msg, idx) => (
                              <li key={idx} className="flex gap-3 text-slate-200 bg-paper/60 backdrop-blur-md p-4 rounded-xl border border-brand-500/20">
                                <span className="font-bold text-brand-500">{idx + 1}.</span>
                                <span className="leading-relaxed">{msg}</span>
                              </li>
                            ))}
                          </ul>
                        </section>

                        <section>
                          <h3 className="text-2xl font-bold neon-text mb-4 flex items-center gap-2">
                            <Users className="w-6 h-6 text-brand-500" />
                            Талқылауға арналған сұрақтар
                          </h3>
                          <ul className="space-y-3">
                            {generatedPedsovet.guide.discussionQuestions.map((q, idx) => (
                              <li key={idx} className="flex gap-2 text-slate-200">
                                <span className="text-brand-500 font-bold">•</span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </section>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold neon-text mb-4 flex items-center gap-2">
                          <FileText className="w-6 h-6 text-brand-500" />
                          Үлестірмелі материал (Памятка)
                        </h3>
                        <Card className="bg-paper/80 backdrop-blur-md border-brand-500/30 relative group overflow-hidden">
                          <pre className="whitespace-pre-wrap font-sans text-slate-200 text-sm leading-relaxed">
                            {generatedPedsovet.guide.handoutSummary}
                          </pre>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(generatedPedsovet.guide.handoutSummary);
                              alert('Памятка мәтіні көшірілді!');
                            }}
                            className="absolute top-4 right-4 p-2 bg-brand-500/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-indigo-100 rounded-lg text-brand-500 hover:bg-brand-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Көшіру"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'materials' && !generatedGuide && (
            <div className="space-y-6">
              <Card className="bg-paper/80 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] border-brand-500/30">
                <h2 className="text-3xl font-bold neon-text mb-6">Жаңа әдістемелік құрал құру</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-3">Дайын тақырыпты таңдаңыз</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_TOPICS.map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleGenerateGuide(topic)}
                          className="px-4 py-2 bg-paper/40 hover:bg-brand-500/10 text-slate-200 hover:text-brand-500 rounded-full text-sm font-medium transition-colors text-left"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-brand-500/30" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-paper/80 backdrop-blur-md text-sm text-slate-400">немесе</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Өз тақырыбыңызды енгізіңіз</label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={guideTopic}
                        onChange={(e) => setGuideTopic(e.target.value)}
                        placeholder="Мысалы: Жаңа келген сынып жетекшісіне арналған нұсқаулық..."
                        className="flex-1 px-4 py-3 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateGuide(guideTopic)}
                      />
                      <Button 
                        onClick={() => handleGenerateGuide(guideTopic)} 
                        disabled={isGeneratingGuide}
                        className="neon-bg whitespace-nowrap"
                      >
                        {isGeneratingGuide ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Құру'}
                      </Button>
                    </div>
                    {guideError && (
                      <p className="mt-2 text-sm text-red-600">{guideError}</p>
                    )}
                  </div>
                </div>
              </Card>

              {savedGuides.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-100 mb-4">Сақталған материалдар</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedGuides.map(guide => (
                      <Card key={guide.id} className="p-4 hover:border-brand-500/80 transition-colors cursor-pointer" onClick={() => {
                        const plan = planStorage.getPlan(guide.id);
                        if (plan && plan.guide) setGeneratedGuide(plan.guide);
                      }}>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-100 text-sm mb-1 line-clamp-2">{guide.title}</h4>
                            <p className="text-xs text-slate-400">{new Date(guide.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && generatedGuide && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-paper/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/30">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-500/20 text-brand-500 rounded-xl">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold neon-text mb-1 leading-tight">{generatedGuide.title}</h2>
                    <p className="text-slate-300">{generatedGuide.purpose}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" onClick={() => setGeneratedGuide(null)}>
                    Артқа
                  </Button>
                  <Button onClick={handleSaveGuide} className="neon-bg" icon={<Save className="w-4 h-4" />}>
                    Сақтау
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card className="bg-paper/80 backdrop-blur-md border-brand-500/30">
                    <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-brand-500" />
                      Қадамдық нұсқаулық
                    </h3>
                    <div className="space-y-4">
                      {generatedGuide.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-brand-500/20 text-brand-500 rounded-full flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-100 mb-1">{step.stepTitle}</h4>
                            <p className="text-slate-300 text-sm leading-relaxed">{step.stepDescription}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {generatedGuide.templates && generatedGuide.templates.length > 0 && (
                    <Card className="bg-paper/80 backdrop-blur-md border-brand-500/30">
                      <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-500" />
                        Дайын үлгілер (Шаблондар)
                      </h3>
                      <div className="space-y-4">
                        {generatedGuide.templates.map((tpl, idx) => (
                          <div key={idx} className="relative group">
                            <pre className="bg-paper/60 backdrop-blur-md p-4 rounded-xl text-sm text-slate-200 whitespace-pre-wrap font-sans border border-brand-500/20">
                              {tpl}
                            </pre>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(tpl);
                                alert('Мәтін көшірілді!');
                              }}
                              className="absolute top-2 right-2 p-2 bg-paper/80 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/30 rounded-lg text-slate-400 hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Көшіру"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                <div className="md:col-span-1 space-y-6">
                  <Card className="bg-paper/80 backdrop-blur-md border-brand-500/30 sticky top-24">
                    <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-brand-500" />
                      Чек-лист
                    </h3>
                    <div className="space-y-3">
                      {generatedGuide.checklist.map((item, idx) => (
                        <label key={idx} className="flex items-start gap-3 p-2 hover:bg-paper/60 backdrop-blur-md rounded-lg cursor-pointer group">
                          <input type="checkbox" className="mt-1 w-4 h-4 rounded border-brand-500/40 text-brand-500 focus:ring-brand-500" />
                          <span className="text-sm text-slate-200 group-hover:text-slate-100 leading-snug">{item}</span>
                        </label>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ONBOARDING TAB */}
          {activeTab === 'onboarding' && !activeChecklist && (
            <Card className="max-w-2xl bg-paper/80 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] border-brand-500/30">
              <h2 className="text-3xl font-bold neon-text mb-6">Жаңа маманға арналған чек-лист</h2>
              <p className="text-slate-300 mb-6">Бұл чек-лист жаңадан тағайындалған тәрбие ісі жөніндегі орынбасарына оқу жылын дұрыс бастауға көмектеседі.</p>
              
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Оқу жылы</label>
                    <input 
                      type="text" 
                      value={onboardingForm.year}
                      onChange={(e) => setOnboardingForm({...onboardingForm, year: e.target.value})}
                      className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-2 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Мектеп түрі</label>
                    <select 
                      value={onboardingForm.schoolType}
                      onChange={(e) => setOnboardingForm({...onboardingForm, schoolType: e.target.value})}
                      className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-2 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option>Жалпы орта білім беретін мектеп</option>
                      <option>Гимназия</option>
                      <option>Лицей</option>
                      <option>Ауыл мектебі / Шағын жинақты мектеп</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Қандай жұмыстар жасалды? (міндетті емес)</label>
                  <textarea 
                    value={onboardingForm.alreadyDone}
                    onChange={(e) => setOnboardingForm({...onboardingForm, alreadyDone: e.target.value})}
                    placeholder="Мысалы: Жоспар бекітілді, бірақ сынып жетекшілерімен жиналыс өткен жоқ..."
                    className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-3 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none h-24"
                  />
                </div>

                {onboardingError && (
                  <div className="p-4 bg-red-500/20 text-red-600 rounded-lg text-sm">
                    {onboardingError}
                  </div>
                )}

                <Button 
                  onClick={handleGenerateOnboarding} 
                  disabled={isOnboardingGenerating}
                  className="w-full neon-bg shadow-md shadow-indigo-200 py-3 text-lg"
                >
                  {isOnboardingGenerating ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Чек-лист құрылуда...</>
                  ) : (
                    'Чек-листі құру'
                  )}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'onboarding' && activeChecklist && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-paper/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/30">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-500/20 text-brand-500 rounded-xl">
                    <CheckSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold neon-text mb-1 leading-tight">Бастапқы чек-лист</h2>
                    <p className="text-slate-300">
                      Жаңадан тағайындалған орынбасарға арналған қадамдар
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" onClick={handleGenerateOnboarding} disabled={isOnboardingGenerating}>
                    {isOnboardingGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Жаңарту'}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Group checklist by category */}
                  {Array.from(new Set(activeChecklist.checklist.map(item => item.category))).map((category, cIdx) => {
                    const itemsInCategory = activeChecklist.checklist.filter(i => i.category === category);
                    const completedCount = itemsInCategory.filter(i => i.done).length;
                    const progress = Math.round((completedCount / itemsInCategory.length) * 100);

                    return (
                      <Card key={cIdx} className="bg-paper/80 backdrop-blur-md border-brand-500/30">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-slate-100">{category}</h3>
                          <span className="text-sm font-medium text-slate-400">{completedCount} / {itemsInCategory.length}</span>
                        </div>
                        
                        <div className="w-full bg-paper/40 rounded-full h-2 mb-6">
                          <div className="neon-bg h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>

                        <div className="space-y-3">
                          {itemsInCategory.map(item => (
                            <div 
                              key={item.id} 
                              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${item.done ? 'bg-paper/60 backdrop-blur-md border-brand-500/30' : 'bg-paper/80 backdrop-blur-md border-brand-500/30 hover:border-brand-500/80'}`}
                            >
                              <div className="pt-1">
                                <label className="relative flex cursor-pointer items-center rounded-full p-1" htmlFor={`checkbox-${item.id}`}>
                                  <input 
                                    type="checkbox" 
                                    className="before:content[''] peer relative h-6 w-6 cursor-pointer appearance-none rounded-md border border-brand-500/40 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-brand-500/100 before:opacity-0 before:transition-opacity checked:border-brand-500 checked:neon-bg checked:before:neon-bg hover:before:opacity-10" 
                                    id={`checkbox-${item.id}`} 
                                    checked={item.done}
                                    onChange={() => toggleChecklistItem(item.id)}
                                  />
                                  <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-slate-100 opacity-0 transition-opacity peer-checked:opacity-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                  </div>
                                </label>
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-semibold mb-1 transition-colors ${item.done ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                                  {item.title}
                                </h4>
                                <p className={`text-sm transition-colors ${item.done ? 'text-slate-400' : 'text-slate-300'}`}>
                                  {item.description}
                                </p>
                                {item.deadline && (
                                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-rose-50 text-rose-600">
                                    <Calendar className="w-3 h-3" /> {item.deadline}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="md:col-span-1 space-y-6">
                  {activeChecklist.commonMistakes && activeChecklist.commonMistakes.length > 0 && (
                    <Card className="bg-rose-50 border-rose-100 sticky top-24">
                      <h3 className="text-lg font-bold text-rose-800 mb-4 flex items-center gap-2">
                        <X className="w-5 h-5" />
                        Жиі кездесетін қателіктер
                      </h3>
                      <ul className="space-y-3">
                        {activeChecklist.commonMistakes.map((mistake, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-rose-700">
                            <span className="font-bold shrink-0">•</span>
                            <span className="leading-snug">{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'annual_plan' && !generatedPlan && (
            <Card className="max-w-2xl bg-paper/80 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] border-brand-500/30">
              <h2 className="text-3xl font-bold neon-text mb-6">Жылдық тәрбие жоспарын құру</h2>
              
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Оқу жылы</label>
                    <input 
                      type="text" 
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-2 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Кезең</label>
                    <select 
                      value={formData.period}
                      onChange={(e) => setFormData({...formData, period: e.target.value})}
                      className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-2 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option>Весь год (Толық жыл)</option>
                      <option>1-ші тоқсан</option>
                      <option>2-ші тоқсан</option>
                      <option>3-ші тоқсан</option>
                      <option>4-ші тоқсан</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-3">Мектептің жас ерекшеліктері</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(formData.ageGroups).map(group => (
                      <label key={group} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.ageGroups[group] ? 'bg-brand-500/10 border-indigo-200 text-brand-500' : 'bg-paper/80 backdrop-blur-md border-brand-500/30 text-slate-300 hover:bg-paper/60 backdrop-blur-md'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={formData.ageGroups[group]}
                          onChange={() => handleCheckbox(group)}
                        />
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${formData.ageGroups[group] ? 'neon-bg border-brand-500' : 'border-brand-500/40'}`}>
                          {formData.ageGroups[group] && <Check className="w-3 h-3 text-slate-100" />}
                        </div>
                        {group}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Мектеп ерекшеліктері (міндетті емес)</label>
                  <textarea 
                    value={formData.features}
                    onChange={(e) => setFormData({...formData, features: e.target.value})}
                    placeholder="Мысалы: ауыл мектебі, тілдерді тереңдетіп оқытатын гимназия..."
                    className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-3 border border-brand-500/40 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none h-24"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/20 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full neon-bg shadow-md shadow-indigo-200 py-3 text-lg"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Генерациялануда...</>
                  ) : (
                    'Жоспарды құру'
                  )}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'annual_plan' && generatedPlan && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-paper/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/30">
                <div>
                  <h2 className="text-3xl font-bold neon-text">Тәрбие жұмысының жоспары</h2>
                  <p className="text-slate-400">{formData.year} оқу жылы • {formData.period}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setGeneratedPlan(null)}>
                    Жаңадан құру
                  </Button>
                  <Button variant="outline" onClick={handleSaveAnnualPlan} icon={<Save className="w-4 h-4" />}>
                    Сақтау
                  </Button>
                  <Button onClick={handleDownload} className="neon-bg" icon={<Download className="w-4 h-4" />}>
                    Жүктеп алу
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {generatedPlan.map((monthData, mIdx) => (
                  <Card key={mIdx} className="bg-paper/80 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] border-brand-500/30 p-0 overflow-hidden">
                    <div className="bg-paper/60 backdrop-blur-md px-6 py-4 border-b border-brand-500/30">
                      <h3 className="text-lg font-bold text-slate-100">{monthData.month}</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {monthData.topics.map((topic, tIdx) => (
                        <EditableTopicRow 
                          key={tIdx} 
                          topic={topic} 
                          onUpdate={(updatedTopic) => {
                            const newPlan = [...generatedPlan];
                            newPlan[mIdx].topics[tIdx] = updatedTopic;
                            setGeneratedPlan(newPlan);
                          }}
                          onDelete={() => {
                            const newPlan = [...generatedPlan];
                            newPlan[mIdx].topics.splice(tIdx, 1);
                            setGeneratedPlan(newPlan);
                          }}
                        />
                      ))}
                      <div className="px-6 py-3 bg-paper/60 backdrop-blur-md/50 hover:bg-paper/60 backdrop-blur-md transition-colors cursor-pointer text-brand-500 flex items-center justify-center gap-2 text-sm font-medium" onClick={() => alert("Жаңа тақырып қосу функциясы алдағы жаңартуларда!")}>
                        <Plus className="w-4 h-4" /> Тақырып қосу
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && !generatedReport && (
            <div className="space-y-6">
              <Card className="p-6 md:p-8 border-indigo-100/50 shadow-[0_0_15px_rgba(255,255,255,0.1)] shadow-indigo-100/20">
                <h2 className="text-3xl font-bold neon-text mb-6">Есеп дайындау (Генератор отчетов)</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Есеп кезеңі (Период)</label>
                    <select 
                      value={reportForm.period}
                      onChange={(e) => setReportForm({...reportForm, period: e.target.value})}
                      className="w-full sm:w-1/2 px-4 py-3 bg-paper/60 backdrop-blur-md border border-brand-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="1 тоқсан (1 четверть)">1 тоқсан (1 четверть)</option>
                      <option value="2 тоқсан (2 четверть)">2 тоқсан (2 четверть)</option>
                      <option value="3 тоқсан (3 четверть)">3 тоқсан (3 четверть)</option>
                      <option value="4 тоқсан (4 четверть)">4 тоқсан (4 четверть)</option>
                      <option value="1 жартыжылдық (1 полугодие)">1 жартыжылдық (1 полугодие)</option>
                      <option value="Жылдық есеп (Годовой)">Жылдық есеп (Годовой)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Негізге алынатын мәліметтер</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 border border-brand-500/30 rounded-xl cursor-pointer hover:bg-paper/60 backdrop-blur-md">
                        <input type="checkbox" checked={reportForm.includePlan} onChange={(e) => setReportForm({...reportForm, includePlan: e.target.checked})} className="w-5 h-5 text-brand-500 rounded" />
                        <span className="text-slate-200 font-medium">Жүйедегі жылдық жоспарды қосу</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-brand-500/30 rounded-xl cursor-pointer hover:bg-paper/60 backdrop-blur-md">
                        <input type="checkbox" checked={reportForm.includeCompletedOnly} onChange={(e) => setReportForm({...reportForm, includeCompletedOnly: e.target.checked})} className="w-5 h-5 text-brand-500 rounded" />
                        <span className="text-slate-200 font-medium">Тек "Өткізілді" (Completed) деп белгіленген іс-шараларды қосу</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Қосымша мәліметтер (міндетті емес)</label>
                    <textarea 
                      value={reportForm.extraNotes}
                      onChange={(e) => setReportForm({...reportForm, extraNotes: e.target.value})}
                      className="w-full bg-paper/50 text-white placeholder-slate-500 px-4 py-3 bg-paper/60 backdrop-blur-md border border-brand-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 min-h-[120px] resize-none"
                      placeholder="Жоспардан тыс өткен шаралар, жетістіктер, қиындықтар туралы жазыңыз..."
                    />
                  </div>

                  {reportError && (
                    <div className="p-4 bg-red-500/20 text-red-600 rounded-xl text-sm font-medium">
                      {reportError}
                    </div>
                  )}

                  <Button 
                    className="w-full neon-bg py-4 rounded-xl text-lg font-semibold shadow-xl shadow-indigo-200 mt-4"
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Есеп дайындалуда...
                      </span>
                    ) : (
                      "Есепті генерациялау"
                    )}
                  </Button>
                </div>
              </Card>

              {savedReports.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-100 mb-4">Сақталған есептер</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedReports.map(report => (
                      <Card key={report.id} className="p-4 hover:border-brand-500/80 transition-colors cursor-pointer" onClick={() => {
                        setGeneratedReport({ title: report.title });
                        setEditableReportText(report.guide);
                      }}>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-100 text-sm mb-1 line-clamp-2">{report.title}</h4>
                            <p className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString()} • {report.params?.duration}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && generatedReport && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-paper/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/30 gap-4">
                <div>
                  <h2 className="text-3xl font-bold neon-text">{generatedReport.title || 'Есеп'}</h2>
                  <p className="text-slate-400">Ресми стильде дайындалған мәтін</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" onClick={() => setGeneratedReport(null)}>
                    Артқа
                  </Button>
                  <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(editableReportText);
                    alert('Мәтін көшірілді!');
                  }} icon={<Copy className="w-4 h-4" />}>
                    Көшіру
                  </Button>
                  <Button variant="outline" onClick={handleSaveReport} icon={<Save className="w-4 h-4" />}>
                    Сақтау
                  </Button>
                  <Button onClick={handleDownload} className="neon-bg" icon={<Download className="w-4 h-4" />}>
                    Экспорт
                  </Button>
                </div>
              </div>

              <Card className="p-0 border-indigo-100 overflow-hidden">
                <textarea
                  className="w-full min-h-[600px] p-6 bg-paper/80 backdrop-blur-md focus:outline-none resize-y text-slate-100 leading-relaxed font-medium"
                  value={editableReportText}
                  onChange={(e) => setEditableReportText(e.target.value)}
                />
              </Card>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

const EditableTopicRow = ({ topic, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = (field, value) => {
    onUpdate({ ...topic, [field]: value });
  };

  const handleToggleComplete = () => {
    onUpdate({ ...topic, completed: !topic.completed });
  };

  return (
    <div className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-paper/60 backdrop-blur-md/50 transition-colors group ${topic.completed ? 'bg-paper/60 backdrop-blur-md/70' : ''}`}>
      <div className="pt-1">
        <button 
          onClick={handleToggleComplete} 
          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${topic.completed ? 'bg-green-500 border-green-500 text-slate-100' : 'border-brand-500/40 hover:border-indigo-400 bg-paper/80 backdrop-blur-md'}`}
          title="Өткізілді деп белгілеу"
        >
          {topic.completed && <Check className="w-3.5 h-3.5" />}
        </button>
      </div>
      {isEditing ? (
        <div className="flex-1 space-y-3">
          <input 
            type="text" 
            value={topic.title || ''} 
            onChange={(e) => handleEdit('title', e.target.value)}
            className="w-full px-3 py-2 border border-brand-500/40 rounded text-sm font-medium text-slate-100"
          />
          <div className="flex gap-3">
            <input 
              type="text" 
              value={topic.ageGroup || ''} 
              onChange={(e) => handleEdit('ageGroup', e.target.value)}
              className="flex-1 px-3 py-2 border border-brand-500/40 rounded text-sm"
              placeholder="Сынып"
            />
            <input 
              type="text" 
              value={topic.format || ''} 
              onChange={(e) => handleEdit('format', e.target.value)}
              className="flex-1 px-3 py-2 border border-brand-500/40 rounded text-sm"
              placeholder="Формат"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" className="py-1.5 px-3 text-xs" onClick={() => setIsEditing(false)}>Сақтау</Button>
            <Button variant="ghost" className="py-1.5 px-3 text-xs text-red-500" onClick={onDelete}>Жою</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-1">
              {topic.isHoliday && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider mt-0.5 shrink-0">
                  Мереке
                </span>
              )}
              <h4 className={`text-base font-semibold text-slate-100 leading-snug ${topic.completed ? 'line-through text-slate-400' : ''}`}>{topic.title}</h4>
            </div>
            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${topic.completed ? 'text-slate-400' : 'text-slate-400'}`}>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {topic.ageGroup}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> {topic.format}
              </span>
              {topic.suggestedDate && (
                <span className={`flex items-center gap-1.5 font-medium ${topic.completed ? 'text-slate-400' : 'text-brand-500'}`}>
                  <Calendar className="w-3.5 h-3.5" /> {topic.suggestedDate}
                </span>
              )}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-400 hover:text-brand-500 bg-paper/80 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-500/30 rounded-lg"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
