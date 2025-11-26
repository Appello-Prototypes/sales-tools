'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/lib/store/assessmentStore';
import ProgressBar from '@/components/assessment/ProgressBar';
import FormStep from '@/components/assessment/FormStep';
import JourneyHeader from '@/components/assessment/JourneyHeader';
import StepTransition from '@/components/assessment/StepTransition';
import ValueProposition from '@/components/assessment/ValueProposition';
import Step1CompanyBasics from '@/components/assessment/steps/Step1CompanyBasics';
import Step2PainPoints from '@/components/assessment/steps/Step2PainPoints';
import Step3CurrentState from '@/components/assessment/steps/Step3CurrentState';
import Step4DemoCustomization from '@/components/assessment/steps/Step4DemoCustomization';
import Step5DecisionIntelligence from '@/components/assessment/steps/Step5DecisionIntelligence';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const TOTAL_STEPS = 5;

export default function AssessmentPage() {
  const router = useRouter();
  const { submissionId, currentStep, setSubmissionId, setCurrentStep, data, updateData } = useAssessmentStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  // Define saveProgress first
  const saveProgress = useCallback(async (step: number, sectionData: any) => {
    if (!submissionId) return;
    
    setIsSaving(true);
    try {
      await fetch(`/api/assessments/${submissionId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          data: sectionData,
        }),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [submissionId]);

  // Define handleStepNext after saveProgress to maintain hook order
  const handleStepNext = useCallback(() => {
    // This is called by step components after form validation
    if (currentStep < TOTAL_STEPS && !isTransitioning) {
      setIsTransitioning(true);
      const messages = [
        'Analyzing your company profile...',
        'Understanding your challenges...',
        'Evaluating your current state...',
        'Customizing your demo experience...',
        'Preparing your personalized report...',
      ];
      setTransitionMessage(messages[currentStep - 1] || 'Processing...');
      
      // Save progress and move to next step
      saveProgress(currentStep, data).then(() => {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setIsTransitioning(false);
        }, 600);
      }).catch(() => {
        setIsTransitioning(false);
      });
    }
  }, [currentStep, isTransitioning, data, saveProgress, setCurrentStep]);

  useEffect(() => {
    // Initialize assessment if not already started
    if (!submissionId) {
      startAssessment();
    } else {
      setIsLoading(false);
    }
  }, [submissionId]);

  const startAssessment = async () => {
    try {
      const response = await fetch('/api/assessments/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        const result = await response.json();
        setSubmissionId(result.submissionId);
        setIsLoading(false);
      } else {
        console.error('Failed to start assessment');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS && !isTransitioning) {
      // Show transition animation
      setIsTransitioning(true);
      const messages = [
        'Analyzing your company profile...',
        'Understanding your challenges...',
        'Evaluating your current state...',
        'Customizing your demo experience...',
        'Preparing your personalized report...',
      ];
      setTransitionMessage(messages[currentStep - 1] || 'Processing...');

      // Trigger form validation by submitting the form
      if (formRef.current) {
        const form = formRef.current.querySelector('form');
        if (form) {
          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
            // Don't set transition to false here - let the step component handle it
            return;
          }
        }
      }
      
      // Fallback: if no form found, proceed without validation
      await saveProgress(currentStep, data);
      
      // Smooth transition
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 600);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!submissionId) return;
    
    // Trigger form validation by submitting Step5's form
    if (formRef.current) {
      const form = formRef.current.querySelector('form');
      if (form) {
        const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.click();
          return; // Form submission will call onSubmit callback
        }
      }
    }
    
    // Fallback: submit directly if no form found
    await submitAssessment();
  };

  const submitAssessment = async () => {
    if (!submissionId) return;
    
    setIsTransitioning(true);
    setTransitionMessage('Generating your personalized AI-powered report...');
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/assessments/${submissionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        router.push(`/assessment/thank-you?submissionId=${submissionId}`);
      } else {
        const error = await response.json();
        console.error('Error submitting assessment:', error);
        setIsTransitioning(false);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setIsTransitioning(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1CompanyBasics onNext={handleStepNext} />;
      case 2:
        return <Step2PainPoints onNext={handleStepNext} />;
      case 3:
        return <Step3CurrentState onNext={handleStepNext} />;
      case 4:
        return <Step4DemoCustomization onNext={handleStepNext} />;
      case 5:
        return <Step5DecisionIntelligence onSubmit={submitAssessment} />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = [
      'Company Basics',
      'Pain Point Discovery',
      'Current State Assessment',
      'Demo Customization',
      'Decision Intelligence',
    ];
    return titles[currentStep - 1] || '';
  };

  const getStepDescription = () => {
    const descriptions = [
      'Tell us about your company',
      'What challenges are costing you time or money?',
      'Help us understand your current systems',
      'What should we focus on during your demo?',
      'Help us understand your timeline and needs',
    ];
    return descriptions[currentStep - 1] || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-12 w-12 text-primary mx-auto" />
          </motion.div>
          <div>
            <p className="text-lg font-semibold">Preparing your assessment...</p>
            <p className="text-sm text-muted-foreground">Powered by AI</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <StepTransition isTransitioning={isTransitioning} message={transitionMessage} />
      
      <div className="max-w-5xl mx-auto space-y-6">
        <JourneyHeader currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <div ref={formRef}>
          <FormStep
            step={currentStep}
            section={Math.ceil(currentStep / 1)}
            title={getStepTitle()}
            description={getStepDescription()}
          >
            {renderStep()}
            <ValueProposition currentStep={currentStep} />
          </FormStep>
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSaving || isTransitioning}
            size="lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Saving your progress...</span>
              </div>
            )}

            {currentStep < TOTAL_STEPS ? (
              <Button 
                onClick={() => {
                  // Trigger form submission via hidden submit button
                  if (formRef.current) {
                    const form = formRef.current.querySelector('form');
                    if (form) {
                      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                      if (submitButton && !submitButton.disabled) {
                        submitButton.click();
                        return;
                      }
                    }
                  }
                  // Fallback: call handleStepNext directly
                  handleStepNext();
                }} 
                disabled={isSaving || isTransitioning}
                size="lg"
                className="min-w-[120px]"
              >
                {isTransitioning ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSaving || isTransitioning}
                size="lg"
                className="min-w-[180px] bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                {isTransitioning ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get My Personalized Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

