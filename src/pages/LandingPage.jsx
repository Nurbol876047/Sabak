import React from 'react';
import { Briefcase, Clock, Sparkles, Target, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Neon3DBackground } from '../components/ui/Neon3DBackground';

export const LandingPage = ({ onStart }) => {
  return (
    <div className="relative min-h-screen text-slate-200 overflow-hidden">
      <Neon3DBackground />
      {/* Hero Section */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-brand-500/50 neon-text text-sm font-bold mb-8 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          <Sparkles className="w-4 h-4" />
          <span>Тәрбие сағаттарына арналған AI-көмекшіңіз</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-slate-100 mb-6 tracking-tight">
          Керемет сабақты жинаңыз <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-slate-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">5 минут ішінде</span>
        </h1>
        
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          «Жүйе» сіздің идеяңызды дайын сценарийге, таймлайнға және тапсырмаларға айналдырады. 
          Қағазбастылық аз — оқушылармен жанды қарым-қатынас көп.
        </p>
        
        <Button variant="magic" className="text-lg px-8 py-4" onClick={onStart}>
          <Briefcase className="w-5 h-5 mr-2" />
          Жүйеге кіру
        </Button>
      </header>

      {/* Features/Steps */}
      <section className="relative z-10 py-20 border-t border-brand-500/20 bg-paper/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center neon-text mb-16">Бұл қалай жұмыс істейді?</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Target, title: "Идея", desc: "Талқылағыңыз келетін тақырыпты немесе мәселені көрсетіңіз" },
              { icon: Clock, title: "Параметрлер", desc: "Балалардың жасын, санын және сабақ уақытын көрсетіңіз" },
              { icon: Sparkles, title: "AI сиқыры", desc: "Біздің алгоритм сценарийді құрастырып, форматтарды таңдайды" },
              { icon: Briefcase, title: "Дайын", desc: "Жүйені ашыңыз: материалдар мен жоспар сізді күтуде!" }
            ].map((step, idx) => (
              <div key={idx} className="relative glass-card p-6 border border-brand-500/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
                <div className="bg-brand-500/20 w-14 h-14 rounded-2xl flex items-center justify-center text-brand-500 mb-6 border border-brand-500/50 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:neon-text">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                {idx < 3 && <ArrowRight className="hidden md:block absolute top-1/2 -right-6 w-6 h-6 text-brand-500/50 transform -translate-y-1/2" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
