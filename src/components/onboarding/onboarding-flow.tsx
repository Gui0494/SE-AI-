'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  user: {
    id: string;
    name?: string | null;
  };
}

const interests = [
  { id: 'programming', icon: '💻', label: 'Programacao' },
  { id: 'writing', icon: '✍️', label: 'Escrita' },
  { id: 'design', icon: '🎨', label: 'Design/Imagens' },
  { id: 'data', icon: '📊', label: 'Analise de dados' },
  { id: 'learning', icon: '🎓', label: 'Aprendizado' },
  { id: 'work', icon: '💼', label: 'Trabalho' },
  { id: 'entertainment', icon: '🎮', label: 'Entretenimento' },
  { id: 'productivity', icon: '📱', label: 'Produtividade' },
];

const experienceLevels = [
  {
    id: 'beginner',
    icon: '🌱',
    label: 'Iniciante',
    description: 'Nunca usei ou usei muito pouco',
  },
  {
    id: 'intermediate',
    icon: '🌿',
    label: 'Intermediario',
    description: 'Uso regularmente ChatGPT ou similares',
  },
  {
    id: 'advanced',
    icon: '🌳',
    label: 'Avancado',
    description: 'Uso APIs, fine-tuning, prompts avancados',
  },
  {
    id: 'expert',
    icon: '🚀',
    label: 'Expert',
    description: 'Desenvolvo aplicacoes com IA',
  },
];

export function OnboardingFlow({ user }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const firstName = user.name?.split(' ')[0] || 'voce';

  const steps = [
    {
      id: 'welcome',
      title: `Bem-vindo ao SE AI, ${firstName}! 🎉`,
      subtitle: 'Estamos animados em ter voce aqui. Vamos personalizar sua experiencia.',
    },
    {
      id: 'interests',
      title: 'O que voce quer fazer com IA?',
      subtitle: 'Selecione todos que se aplicam',
    },
    {
      id: 'experience',
      title: 'Qual sua experiencia com IA?',
      subtitle: 'Isso nos ajuda a personalizar as sugestoes',
    },
    {
      id: 'ready',
      title: 'Tudo pronto! 🚀',
      subtitle: 'Sua experiencia esta configurada. Vamos comecar!',
    },
  ];

  const currentStep = steps[step];

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) return selectedInterests.length > 0;
    if (step === 2) return experienceLevel !== '';
    return true;
  };

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      setIsLoading(true);
      try {
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interests: selectedInterests,
            experienceLevel,
          }),
        });
        router.push('/');
        router.refresh();
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: [],
          experienceLevel: 'intermediate',
          skipped: true,
        }),
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              i === step
                ? 'w-6 bg-primary-500'
                : i < step
                ? 'bg-primary-500'
                : 'bg-neutral-700'
            )}
          />
        ))}
        <button
          onClick={handleSkip}
          className="ml-auto text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Pular
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">{currentStep.title}</h1>
            <p className="text-neutral-400">{currentStep.subtitle}</p>
          </div>

          {/* Step content */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <Feature icon="🚀" text="Modelos de IA mais avancados" />
                <Feature icon="🔍" text="Busca na web em tempo real" />
                <Feature icon="💻" text="Execute codigo diretamente" />
                <Feature icon="🎨" text="Gere imagens incriveis" />
                <Feature icon="📚" text="Aprenda com trilhas personalizadas" />
                <Feature icon="🔒" text="Privacidade e seguranca" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-4 gap-3">
              {interests.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                    selectedInterests.includes(interest.id)
                      ? 'bg-primary-500/20 border-primary-500 text-white'
                      : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  )}
                >
                  <span className="text-2xl">{interest.icon}</span>
                  <span className="text-sm">{interest.label}</span>
                  {selectedInterests.includes(interest.id) && (
                    <Check className="w-4 h-4 text-primary-400 absolute top-2 right-2" />
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {experienceLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setExperienceLevel(level.id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                    experienceLevel === level.id
                      ? 'bg-primary-500/20 border-primary-500'
                      : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                  )}
                >
                  <span className="text-3xl">{level.icon}</span>
                  <div>
                    <div className="font-medium text-white">{level.label}</div>
                    <div className="text-sm text-neutral-400">{level.description}</div>
                  </div>
                  {experienceLevel === level.id && (
                    <Check className="w-5 h-5 text-primary-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🚀</div>
              <div className="space-y-2">
                <p className="text-white">
                  Baseado nas suas preferencias, vamos personalizar:
                </p>
                <ul className="text-neutral-400 space-y-1">
                  <li>• Sugestoes de prompts relevantes</li>
                  <li>• Modelo de IA padrao ideal para voce</li>
                  <li>• Dicas contextuais durante o uso</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Voltar
              </Button>
            ) : (
              <div />
            )}

            <Button
              onClick={handleNext}
              disabled={!canContinue()}
              isLoading={isLoading}
              rightIcon={
                step === steps.length - 1 ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )
              }
            >
              {step === steps.length - 1 ? 'Comecar' : 'Continuar'}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
      <span className="text-xl">{icon}</span>
      <span className="text-sm text-neutral-300">{text}</span>
    </div>
  );
}
