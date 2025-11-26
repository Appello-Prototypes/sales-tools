'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';

interface JourneyHeaderProps {
  currentStep: number;
  totalSteps: number;
}

const motivationalMessages = [
  {
    step: 1,
    title: "Let's get started! 🚀",
    subtitle: "We're building your personalized assessment",
    icon: Sparkles,
  },
  {
    step: 2,
    title: "Great progress! 💪",
    subtitle: "Understanding your challenges helps us help you",
    icon: TrendingUp,
  },
  {
    step: 3,
    title: "You're doing great! ⚡",
    subtitle: "Almost halfway there",
    icon: Zap,
  },
  {
    step: 4,
    title: "Almost done! 🎯",
    subtitle: "Your personalized demo is taking shape",
    icon: Sparkles,
  },
  {
    step: 5,
    title: "Final step! 🎉",
    subtitle: "Let's create your custom report",
    icon: TrendingUp,
  },
];

export default function JourneyHeader({ currentStep, totalSteps }: JourneyHeaderProps) {
  const message = motivationalMessages[currentStep - 1] || motivationalMessages[0];
  const Icon = message.icon;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-4 mb-8"
    >
      <div className="flex items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Icon className="h-8 w-8 text-primary" />
        </motion.div>
        <div>
          <h1 className="text-4xl font-bold text-[#0046AD] mb-1">
            {message.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {message.subtitle}
          </p>
        </div>
      </div>

      {/* AI-Powered Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-200"
      >
        <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
        <span className="text-sm font-medium text-purple-900">
          AI-Powered Assessment
        </span>
        <span className="text-xs text-purple-700">
          Powered by Claude Sonnet 4.5
        </span>
      </motion.div>

      {/* Value Proposition */}
      {currentStep > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {Math.round(progress)}% complete
            </span>
            {' • '}
            You're on track to receive your personalized ROI report
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

