'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

interface StepTransitionProps {
  isTransitioning: boolean;
  message?: string;
}

export default function StepTransition({ isTransitioning, message }: StepTransitionProps) {
  if (!isTransitioning) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      style={{ pointerEvents: isTransitioning ? 'auto' : 'none' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="text-center space-y-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="h-12 w-12 text-primary mx-auto" />
        </motion.div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">Analyzing your responses...</p>
          <p className="text-sm text-muted-foreground">
            {message || 'Preparing your personalized next step'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">AI processing</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

