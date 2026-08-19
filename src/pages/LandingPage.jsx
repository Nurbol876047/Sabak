import React from 'react';
import { Briefcase, Clock, Sparkles, Target, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-paper-light">
      {/* Hero Section */}
      <header className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Тәрбие сағаттарына арналған AI-көмекшіңіз</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
          Керемет сабақты жинаңыз <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-orange-500">5 минут ішінде</span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          «Чемодан» сіздің идеяңызды дайын сценарийге, таймлайнға және тапсырмаларға айналдырады. 
          Қағазбастылық аз — оқушылармен жанды қарым-қатынас көп.
        </p>
        
        <Button variant="magic" className="text-lg px-8 py-4" onClick={onStart}>
          <Briefcase className="w-5 h-5 mr-2" />
          Чемоданды жинау
        </Button>
      </header>

      {/* Features/Steps */}
      <section className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-16">Бұл қалай жұмыс істейді?</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Target, title: "Идея", desc: "Талқылағыңыз келетін тақырыпты немесе мәселені көрсетіңіз" },
              { icon: Clock, title: "Параметрлер", desc: "Балалардың жасын, санын және сабақ уақытын көрсетіңіз" },
              { icon: Sparkles, title: "AI сиқыры", desc: "Біздің алгоритм сценарийді құрастырып, форматтарды таңдайды" },
              { icon: Briefcase, title: "Дайын", desc: "Чемоданды ашыңыз: материалдар мен жоспар сізді күтуде!" }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-brand-50 w-14 h-14 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                {idx < 3 && <ArrowRight className="hidden md:block absolute top-4 -right-6 w-6 h-6 text-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
