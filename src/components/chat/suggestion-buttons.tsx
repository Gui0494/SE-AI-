'use client';

import { motion } from 'framer-motion';
import {
  Image,
  Code2,
  PenLine,
  FlaskConical,
  GraduationCap,
  Target,
  FileText,
  Languages,
  Calculator,
  Lightbulb,
} from 'lucide-react';

interface SuggestionButtonsProps {
  onSelect: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: Image,
    label: 'Gerar Imagem',
    prompt: 'Crie uma imagem de ',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Code2,
    label: 'Escrever Codigo',
    prompt: 'Escreva um codigo em ',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: PenLine,
    label: 'Escrever Texto',
    prompt: 'Escreva um texto sobre ',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FlaskConical,
    label: 'Analisar Dados',
    prompt: 'Analise os seguintes dados: ',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: GraduationCap,
    label: 'Aprender',
    prompt: 'Me ensine sobre ',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Target,
    label: 'Planejar',
    prompt: 'Me ajude a planejar ',
    color: 'from-red-500 to-pink-500',
  },
  {
    icon: FileText,
    label: 'Resumir',
    prompt: 'Resuma o seguinte texto: ',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Languages,
    label: 'Traduzir',
    prompt: 'Traduza para ',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Calculator,
    label: 'Calcular',
    prompt: 'Calcule ',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Lightbulb,
    label: 'Ideias',
    prompt: 'Me de ideias para ',
    color: 'from-lime-500 to-green-500',
  },
];

export function SuggestionButtons({ onSelect }: SuggestionButtonsProps) {
  return (
    <div className="grid grid-cols-5 gap-3 max-w-3xl mx-auto px-4">
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
          onClick={() => onSelect(suggestion.prompt)}
          className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/50 hover:border-neutral-600 hover:bg-neutral-800 transition-all"
        >
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${suggestion.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
          >
            <suggestion.icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs text-neutral-400 group-hover:text-white transition-colors">
            {suggestion.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
