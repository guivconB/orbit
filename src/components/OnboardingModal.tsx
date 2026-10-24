import { useState } from 'react';
import { X, ArrowRight, LayoutGrid, Cpu, Bot, Cloud, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: LayoutGrid,
    title: 'Grade Modular & Drag and Drop',
    description: 'Arraste e solte qualquer widget para personalizar seu espaço. Vá nas configurações para ativar, desativar ou alterar o tamanho dos cartões (P, M ou G).'
  },
  {
    icon: Cpu,
    title: 'Atalhos Globais & Segundo Plano',
    description: 'O Orbit fica discretamente perto do relógio do Windows. Pressione Ctrl + Espaço em qualquer aplicativo para abrir ou esconder seu painel instantaneamente.'
  },
  {
    icon: Bot,
    title: 'Assistente Inteligente & Foco',
    description: 'Converse com o Gemini embutido e escute rádios Lo-Fi ou Spotify enquanto usa o Pomodoro com notificações nativas do Windows.'
  },
  {
    icon: Cloud,
    title: 'Nuvem Silenciosa & Plugins',
    description: 'Suas notas e tarefas têm backup automático no Firestore. Quer novos recursos? Basta soltar arquivos HTML na pasta Documentos/Orbit-Plugins!'
  }
];

export function OnboardingModal({ isOpen, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-app/95 w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-black/25">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
              Guia Orbit
            </span>
            <span className="text-xs text-slate-400">Passo {currentStep + 1} de {STEPS.length}</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar guia de introdução"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/25 text-accent flex items-center justify-center mb-5 shadow-inner">
            <Icon size={32} />
          </div>

          <h3 className="text-lg font-bold text-slate-100 tracking-tight">{step.title}</h3>
          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed max-w-sm">
            {step.description}
          </p>

          {/* Dots Indicator */}
          <div className="flex gap-2 mt-6">
            {STEPS.map((_, i) => (
              <span 
                key={i} 
                className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-6 bg-accent' : 'w-2 bg-white/15'}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-black/30 border-t border-white/[0.06] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium px-2 py-1 cursor-pointer"
          >
            Pular Guia
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-accent hover:opacity-90 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shadow-accent/25 cursor-pointer"
          >
            <span>{currentStep === STEPS.length - 1 ? 'Começar a Usar' : 'Próximo'}</span>
            {currentStep === STEPS.length - 1 ? <Check size={14} /> : <ArrowRight size={14} />}
          </button>
        </div>

      </div>
    </div>
  );
}
