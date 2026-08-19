import React, { useState, useEffect } from 'react';
import { Briefcase, FileText, CheckSquare, Users, Loader2, Download, Plus, Trash2, Edit2, Check, X, Calendar, Copy, ChevronRight, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
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

  useEffect(() => {
    if (activeTab === 'materials') {
      const plans = planStorage.listPlans();
      setSavedGuides(plans.filter(p => p.type === 'methodicalGuide'));
    }
  }, [activeTab]);

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
      const responseText = await callGemini(prompt, { temperature: 0.7 });
      
      // Попытка выпарсить JSON
      let cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
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
      const responseText = await callGemini(prompt, { temperature: 0.7 });
      let cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Тәрбие ісі жөніндегі орынбасары</h1>
              <p className="text-sm text-slate-500">Мектептің тәрбие жұмысын басқару</p>
            </div>
          </div>
          
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
            <button 
              onClick={() => onSwitchRole('teacher')}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 transition-all"
            >
              Мұғалім
            </button>
            <button 
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-indigo-700 shadow-sm"
            >
              Орынбасар
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('annual_plan')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'annual_plan' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Calendar className="w-5 h-5" />
              Жылдық жоспар
            </button>
            <button 
              onClick={() => setActiveTab('materials')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'materials' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <FileText className="w-5 h-5" />
              Әдістемелік құралдар
            </button>
            <button 
              onClick={() => setActiveTab('onboarding')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'onboarding' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <CheckSquare className="w-5 h-5" />
              Жаңа маман чек-листі
            </button>
            <button 
              onClick={() => setActiveTab('pedsovet')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'pedsovet' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Briefcase className="w-5 h-5" />
              Педсоветке материалдар
            </button>
          </nav>
        </aside>

        <section className="flex-1">
          {activeTab !== 'annual_plan' && activeTab !== 'materials' && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
              <div className="p-4 bg-indigo-50 rounded-full mb-4">
                <FileText className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Бұл бөлім жақын арада іске қосылады</h2>
              <p className="text-slate-500 max-w-md">Біз осы функцияның үстінде жұмыс істеп жатырмыз. Жаңа жаңартуларды күтіңіз!</p>
            </div>
          )}

          {activeTab === 'materials' && !generatedGuide && (
            <div className="space-y-6">
              <Card className="bg-white shadow-sm border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Жаңа әдістемелік құрал құру</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Дайын тақырыпты таңдаңыз</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_TOPICS.map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleGenerateGuide(topic)}
                          className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-full text-sm font-medium transition-colors text-left"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-white text-sm text-slate-400">немесе</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Өз тақырыбыңызды енгізіңіз</label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={guideTopic}
                        onChange={(e) => setGuideTopic(e.target.value)}
                        placeholder="Мысалы: Жаңа келген сынып жетекшісіне арналған нұсқаулық..."
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateGuide(guideTopic)}
                      />
                      <Button 
                        onClick={() => handleGenerateGuide(guideTopic)} 
                        disabled={isGeneratingGuide}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
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
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Сақталған материалдар</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedGuides.map(guide => (
                      <Card key={guide.id} className="p-4 hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => {
                        const plan = planStorage.getPlan(guide.id);
                        if (plan && plan.guide) setGeneratedGuide(plan.guide);
                      }}>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">{guide.title}</h4>
                            <p className="text-xs text-slate-500">{new Date(guide.createdAt).toLocaleDateString()}</p>
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
              <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1 leading-tight">{generatedGuide.title}</h2>
                    <p className="text-slate-600">{generatedGuide.purpose}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" onClick={() => setGeneratedGuide(null)}>
                    Артқа
                  </Button>
                  <Button onClick={handleSaveGuide} className="bg-indigo-600 hover:bg-indigo-700 text-white" icon={<Save className="w-4 h-4" />}>
                    Сақтау
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card className="bg-white border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                      Қадамдық нұсқаулық
                    </h3>
                    <div className="space-y-4">
                      {generatedGuide.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 mb-1">{step.stepTitle}</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">{step.stepDescription}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {generatedGuide.templates && generatedGuide.templates.length > 0 && (
                    <Card className="bg-white border-slate-200">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Дайын үлгілер (Шаблондар)
                      </h3>
                      <div className="space-y-4">
                        {generatedGuide.templates.map((tpl, idx) => (
                          <div key={idx} className="relative group">
                            <pre className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap font-sans border border-slate-100">
                              {tpl}
                            </pre>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(tpl);
                                alert('Мәтін көшірілді!');
                              }}
                              className="absolute top-2 right-2 p-2 bg-white shadow-sm border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <Card className="bg-white border-slate-200 sticky top-24">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                      Чек-лист
                    </h3>
                    <div className="space-y-3">
                      {generatedGuide.checklist.map((item, idx) => (
                        <label key={idx} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group">
                          <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                          <span className="text-sm text-slate-700 group-hover:text-slate-900 leading-snug">{item}</span>
                        </label>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'annual_plan' && !generatedPlan && (
            <Card className="max-w-2xl bg-white shadow-sm border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Жылдық тәрбие жоспарын құру</h2>
              
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Оқу жылы</label>
                    <input 
                      type="text" 
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Кезең</label>
                    <select 
                      value={formData.period}
                      onChange={(e) => setFormData({...formData, period: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  <label className="block text-sm font-medium text-slate-700 mb-3">Мектептің жас ерекшеліктері</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(formData.ageGroups).map(group => (
                      <label key={group} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.ageGroups[group] ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={formData.ageGroups[group]}
                          onChange={() => handleCheckbox(group)}
                        />
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${formData.ageGroups[group] ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                          {formData.ageGroups[group] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {group}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Мектеп ерекшеліктері (міндетті емес)</label>
                  <textarea 
                    value={formData.features}
                    onChange={(e) => setFormData({...formData, features: e.target.value})}
                    placeholder="Мысалы: ауыл мектебі, тілдерді тереңдетіп оқытатын гимназия..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-24"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 py-3 text-lg"
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
              <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Тәрбие жұмысының жоспары</h2>
                  <p className="text-slate-500">{formData.year} оқу жылы • {formData.period}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setGeneratedPlan(null)}>
                    Жаңадан құру
                  </Button>
                  <Button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white" icon={<Download className="w-4 h-4" />}>
                    Жүктеп алу
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {generatedPlan.map((monthData, mIdx) => (
                  <Card key={mIdx} className="bg-white shadow-sm border-slate-200 p-0 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <h3 className="text-lg font-bold text-slate-800">{monthData.month}</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {monthData.topics.map((topic, tIdx) => (
                        <EditableTopicRow key={tIdx} topic={topic} />
                      ))}
                      <div className="px-6 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer text-indigo-600 flex items-center justify-center gap-2 text-sm font-medium" onClick={() => alert("Жаңа тақырып қосу функциясы алдағы жаңартуларда!")}>
                        <Plus className="w-4 h-4" /> Тақырып қосу
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const EditableTopicRow = ({ topic: initialTopic }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [topic, setTopic] = useState(initialTopic);
  const [isDeleted, setIsDeleted] = useState(false);

  if (isDeleted) return null;

  return (
    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 transition-colors group">
      {isEditing ? (
        <div className="flex-1 space-y-3">
          <input 
            type="text" 
            value={topic.title} 
            onChange={(e) => setTopic({...topic, title: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm font-medium text-slate-800"
          />
          <div className="flex gap-3">
            <input 
              type="text" 
              value={topic.ageGroup} 
              onChange={(e) => setTopic({...topic, ageGroup: e.target.value})}
              className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
              placeholder="Сынып"
            />
            <input 
              type="text" 
              value={topic.format} 
              onChange={(e) => setTopic({...topic, format: e.target.value})}
              className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
              placeholder="Формат"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" className="py-1.5 px-3 text-xs" onClick={() => setIsEditing(false)}>Сақтау</Button>
            <Button variant="ghost" className="py-1.5 px-3 text-xs text-red-500" onClick={() => setIsDeleted(true)}>Жою</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-1">
              {topic.isHoliday && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider mt-0.5">
                  Мереке
                </span>
              )}
              <h4 className="text-base font-semibold text-slate-800 leading-snug">{topic.title}</h4>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {topic.ageGroup}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> {topic.format}
              </span>
              {topic.suggestedDate && (
                <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                  <Calendar className="w-3.5 h-3.5" /> {topic.suggestedDate}
                </span>
              )}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 bg-white shadow-sm border border-slate-200 rounded-lg"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
