'use client';

import { motion } from 'framer-motion';
import { getFirstName } from '@/lib/utils';

interface GreetingProps {
  user: {
    name?: string | null;
  };
  streak?: number;
}

function getTimeGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return { greeting: 'Bom dia', emoji: '☀️' };
  } else if (hour >= 12 && hour < 18) {
    return { greeting: 'Boa tarde', emoji: '🌤️' };
  } else if (hour >= 18 && hour < 22) {
    return { greeting: 'Boa noite', emoji: '🌙' };
  } else {
    return { greeting: 'Boa madrugada', emoji: '🌃' };
  }
}

function getContextualSubtext(): string {
  const hour = new Date().getHours();
  const subtexts = [
    'Como posso ajudar?',
    'No que posso ajudar hoje?',
    'Em que posso ser util?',
  ];

  if (hour >= 5 && hour < 9) {
    subtexts.push('Pronto para comecar o dia?', 'Vamos ser produtivos hoje?');
  } else if (hour >= 22 || hour < 5) {
    subtexts.push('Trabalhando ate tarde?', 'Uma ultima tarefa antes de dormir?');
  }

  return subtexts[Math.floor(Math.random() * subtexts.length)];
}

export function Greeting({ user, streak = 0 }: GreetingProps) {
  const { greeting, emoji } = getTimeGreeting();
  const firstName = getFirstName(user.name || 'voce');
  const subtext = getContextualSubtext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      {/* Animated emoji */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
        className="text-6xl mb-4"
      >
        {emoji}
      </motion.div>

      {/* Main greeting */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-white mb-2"
      >
        {greeting}, {firstName}!
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-neutral-400 text-lg"
      >
        {subtext}
      </motion.p>

      {/* Streak badge */}
      {streak >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white font-medium shadow-lg"
        >
          🔥 {streak} dias de streak!
        </motion.div>
      )}
    </motion.div>
  );
}
