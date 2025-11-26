'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAssessmentStore } from '@/lib/store/assessmentStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  timeline: z.string().min(1),
  evaluating: z.array(z.string()),
  nextSteps: z.array(z.string()).min(1),
  likelihood: z.number().min(1).max(10),
  specificQuestions: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

interface Step5DecisionIntelligenceProps {
  onSubmit: () => void;
}

const timelines = [
  'Researching now, no timeline',
  'Within 1 month',
  '1-3 months',
  '3-6 months',
  '6+ months',
];

const evaluatingOptions = [
  'Not looking at alternatives yet',
  'Procore',
  'Buildertrend',
  'Jonas',
  'Foundation',
  'Sage Contractor',
  'ComputerEase',
  'Other',
];

const nextStepsOptions = [
  'Pricing information',
  'Talk to a reference customer (similar trade/size)',
  'Internal team buy-in (we can help with that)',
  'See how it integrates with our accounting software',
  'Proof of ROI/business case',
  'Custom demo for other stakeholders',
  'Understanding implementation timeline',
  'Security/compliance documentation',
];

export default function Step5DecisionIntelligence({ onSubmit }: Step5DecisionIntelligenceProps) {
  const { data, updateData } = useAssessmentStore();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      timeline: data.section5?.timeline || '',
      evaluating: data.section5?.evaluating || [],
      nextSteps: data.section5?.nextSteps || [],
      likelihood: data.section5?.likelihood || 5,
      specificQuestions: data.section5?.specificQuestions || '',
      name: data.name || '',
      email: data.email || '',
    },
  });

  const selectedEvaluating = watch('evaluating') || [];
  const selectedNextSteps = watch('nextSteps') || [];
  const likelihood = watch('likelihood');

  const toggleEvaluating = (item: string) => {
    const current = selectedEvaluating;
    const updated = current.includes(item)
      ? current.filter((e) => e !== item)
      : [...current, item];
    setValue('evaluating', updated);
    updateData('section5', { evaluating: updated });
  };

  const toggleNextStep = (item: string) => {
    const current = selectedNextSteps;
    const updated = current.includes(item)
      ? current.filter((n) => n !== item)
      : [...current, item];
    setValue('nextSteps', updated);
    updateData('section5', { nextSteps: updated });
  };

  const onFormSubmit = async (formData: FormData) => {
    updateData('section5', formData);
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 16: What's your timeline for making a decision? *
        </Label>
        <Select
          value={watch('timeline')}
          onValueChange={(value) => {
            setValue('timeline', value);
            updateData('section5', { timeline: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timeline" />
          </SelectTrigger>
          <SelectContent>
            {timelines.map((timeline) => (
              <SelectItem key={timeline} value={timeline}>
                {timeline}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 17: What other solutions are you currently evaluating? *
        </Label>
        <div className="space-y-3">
          {evaluatingOptions.map((option) => (
            <div key={option} className="flex items-center space-x-3">
              <Checkbox
                id={option}
                checked={selectedEvaluating.includes(option)}
                onCheckedChange={() => toggleEvaluating(option)}
              />
              <Label htmlFor={option} className="font-normal cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 18: After the demo, what would you need to move forward? *
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Select all that apply - helps us prepare
        </p>
        <div className="space-y-3">
          {nextStepsOptions.map((step) => (
            <div key={step} className="flex items-center space-x-3">
              <Checkbox
                id={step}
                checked={selectedNextSteps.includes(step)}
                onCheckedChange={() => toggleNextStep(step)}
              />
              <Label htmlFor={step} className="font-normal cursor-pointer">
                {step}
              </Label>
            </div>
          ))}
        </div>
        {errors.nextSteps && (
          <p className="text-sm text-destructive">{errors.nextSteps.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 19: On a scale of 1-10, how likely is it that you'll implement new software in the next 6 months? *
        </Label>
        <div className="space-y-4">
          <Slider
            value={[likelihood]}
            onValueChange={([value]) => {
              setValue('likelihood', value);
              updateData('section5', { likelihood: value });
            }}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1-3: Very unlikely</span>
            <span className="font-medium text-foreground">{likelihood}</span>
            <span>9-10: Very likely</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 20: Is there anything specific you'd like to see or any questions you have before the demo?
        </Label>
        <Textarea
          {...register('specificQuestions')}
          placeholder="Enter your questions or specific requests..."
          className="min-h-[120px]"
          onChange={(e) => {
            setValue('specificQuestions', e.target.value);
            updateData('section5', { specificQuestions: e.target.value });
          }}
        />
      </div>

      <div className="space-y-6 pt-6 border-t">
        <div className="space-y-4">
          <Label className="text-base font-semibold">
            Contact Information *
          </Label>
          <p className="text-sm text-muted-foreground">
            Please provide your name and email so we can follow up with your personalized report.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="John Doe"
                onChange={(e) => {
                  setValue('name', e.target.value);
                  updateData('name', e.target.value);
                }}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@company.com"
                onChange={(e) => {
                  setValue('email', e.target.value);
                  updateData('email', e.target.value);
                }}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Hidden submit button for parent to trigger */}
      <button type="submit" className="hidden" aria-hidden="true" />
    </form>
  );
}

