'use client';

import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const sections = [
  { name: 'Company Basics', step: 1 },
  { name: 'Pain Points', step: 2 },
  { name: 'Current State', step: 3 },
  { name: 'Demo Focus', step: 4 },
  { name: 'Decision', step: 5 },
];

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;
  
  const encouragingMessages = [
    'Getting started!',
    'Great progress!',
    'Halfway there!',
    'Almost done!',
    'Final step!',
  ];
  
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs text-muted-foreground">
            {encouragingMessages[currentStep - 1]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">
            {Math.round(progress)}%
          </span>
          <span className="text-xs text-muted-foreground">Complete</span>
        </div>
      </div>
      
      <Progress value={progress} className="h-3" />
      
      <div className="flex justify-between">
        {sections.map((section, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div
              key={section.step}
              className="flex flex-col items-center flex-1"
            >
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}
                initial={false}
                animate={{ scale: isActive ? 1.1 : 1 }}
              >
                {isCompleted ? '✓' : stepNumber}
              </motion.div>
              <span
                className={`text-xs mt-1 text-center ${
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {section.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

