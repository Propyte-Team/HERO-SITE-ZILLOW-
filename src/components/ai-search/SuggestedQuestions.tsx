'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export default function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  const t = useTranslations('aiSearch');

  const suggestions = [
    t('suggestion1'),
    t('suggestion2'),
    t('suggestion3'),
    t('suggestion4'),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex flex-wrap justify-center gap-2 px-4 max-w-xl mx-auto"
    >
      {suggestions.map((text, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          onClick={() => onSelect(text)}
          className="px-4 py-2 rounded-full text-sm bg-white/80 backdrop-blur-sm text-[#1E3A5F] border border-[#00B4C8]/20 hover:border-[#00B4C8]/50 hover:bg-[#00B4C8]/5 transition-all shadow-sm"
        >
          {text}
        </motion.button>
      ))}
    </motion.div>
  );
}
