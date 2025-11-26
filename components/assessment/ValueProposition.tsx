'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, TrendingUp, Clock, Target } from 'lucide-react';

interface ValuePropositionProps {
  currentStep: number;
}

const valueProps = [
  {
    step: 1,
    items: [
      { icon: Target, text: 'Personalized demo tailored to your business' },
      { icon: TrendingUp, text: 'ROI analysis based on your specific situation' },
    ],
  },
  {
    step: 2,
    items: [
      { icon: CheckCircle2, text: 'Solutions matched to your pain points' },
      { icon: Clock, text: 'Time savings calculations for your team size' },
    ],
  },
  {
    step: 3,
    items: [
      { icon: TrendingUp, text: 'Integration recommendations' },
      { icon: Target, text: 'Implementation roadmap' },
    ],
  },
  {
    step: 4,
    items: [
      { icon: CheckCircle2, text: 'Demo focused on what matters to you' },
      { icon: Clock, text: 'See exactly how Appello solves your challenges' },
    ],
  },
  {
    step: 5,
    items: [
      { icon: TrendingUp, text: 'Your personalized ROI report is ready' },
      { icon: Target, text: 'See your potential savings and impact' },
    ],
  },
];

export default function ValueProposition({ currentStep }: ValuePropositionProps) {
  const props = valueProps[currentStep - 1] || valueProps[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
    >
      <p className="text-sm font-semibold text-green-900 mb-3">
        What you'll get:
      </p>
      <div className="space-y-2">
        {props.items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-2 text-sm text-green-800"
            >
              <Icon className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{item.text}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

