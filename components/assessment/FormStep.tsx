'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FormStepProps {
  step: number;
  section: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function FormStep({
  step,
  section,
  title,
  description,
  children,
}: FormStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Section {section} • Step {step}
            </span>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && (
            <CardDescription className="text-base mt-2">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

