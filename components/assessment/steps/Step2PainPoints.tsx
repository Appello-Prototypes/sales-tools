'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAssessmentStore } from '@/lib/store/assessmentStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const schema = z.object({
  painPoints: z.array(z.string()).min(1, 'Please select at least one pain point'),
  magicWand: z.string().min(10, 'Please provide more detail (at least 10 characters)'),
  urgency: z.number().min(1).max(10),
  hoursPerWeek: z.string().min(1, 'Please select an option'),
});

type FormData = z.infer<typeof schema>;

interface Step2PainPointsProps {
  onNext: () => void;
}

const painPoints = [
  'Time tracking and payroll processing takes too long (especially union/complex wage rules)',
  'Can\'t see job profitability in real-time (always looking backwards)',
  'Invoicing and progress billing is manual/slow (delays cash flow)',
  'Poor communication between field and office (things fall through cracks)',
  'Estimating is inconsistent or takes too long',
  'Can\'t track worker locations or equipment (where is everything?)',
  'Losing money on jobs but don\'t know why',
  'Paper forms and documents everywhere (hard to find, easy to lose)',
  'Scheduling conflicts and crew allocation issues',
  'Change orders fall through the cracks (leaving money on the table)',
  'Multiple disconnected systems that don\'t talk to each other',
  'Material ordering is chaotic (field requests, office confusion, cost tracking issues)',
  'Service work/work orders are hard to track and bill (time & materials)',
  'Can\'t get insights from our data (wish we had better reporting/analytics)',
];

const hoursPerWeekOptions = [
  'Less than 5 hours/week',
  '5-10 hours/week',
  '10-20 hours/week',
  '20+ hours/week',
  'Not sure, but it feels like too much',
];

export default function Step2PainPoints({ onNext }: Step2PainPointsProps) {
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
      painPoints: data.section2?.painPoints || [],
      magicWand: data.section2?.magicWand || '',
      urgency: data.section2?.urgency || 5,
      hoursPerWeek: data.section2?.hoursPerWeek || '',
    },
  });

  const selectedPainPoints = watch('painPoints');
  const urgency = watch('urgency');
  const hoursPerWeek = watch('hoursPerWeek');

  const togglePainPoint = (point: string) => {
    const current = selectedPainPoints || [];
    const updated = current.includes(point)
      ? current.filter((p) => p !== point)
      : [...current, point];
    setValue('painPoints', updated);
    updateData('section2', { painPoints: updated });
  };

  const onSubmit = (formData: FormData) => {
    updateData('section2', formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 4: Which of these operational challenges are costing you time or money RIGHT NOW? *
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Check all that apply - be honest about what's frustrating you
        </p>
        <div className="space-y-3">
          {painPoints.map((point) => (
            <div key={point} className="flex items-start space-x-3">
              <Checkbox
                id={point}
                checked={selectedPainPoints?.includes(point) || false}
                onCheckedChange={() => togglePainPoint(point)}
              />
              <Label htmlFor={point} className="font-normal cursor-pointer leading-relaxed">
                {point}
              </Label>
            </div>
          ))}
        </div>
        {errors.painPoints && (
          <p className="text-sm text-destructive">{errors.painPoints.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 5: If you could wave a magic wand and fix ONE thing about running your business, what would it be? *
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          This is your biggest pain - we'll focus here
        </p>
        <Textarea
          {...register('magicWand')}
          placeholder="Describe your biggest challenge..."
          className="min-h-[120px]"
          onChange={(e) => {
            setValue('magicWand', e.target.value);
            updateData('section2', { magicWand: e.target.value });
          }}
        />
        {errors.magicWand && (
          <p className="text-sm text-destructive">{errors.magicWand.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 6: On a scale of 1-10, how urgent is solving these challenges? *
        </Label>
        <div className="space-y-4">
          <Slider
            value={[urgency]}
            onValueChange={([value]) => {
              setValue('urgency', value);
              updateData('section2', { urgency: value });
            }}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1-3: Not urgent</span>
            <span className="font-medium text-foreground">{urgency}</span>
            <span>9-10: Critical</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 7: What's the REAL cost of your current process? *
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          How many hours per week does your office staff spend on manual data entry, consolidating information from multiple systems, or chasing down missing information?
        </p>
        <Select
          value={hoursPerWeek}
          onValueChange={(value) => {
            setValue('hoursPerWeek', value);
            updateData('section2', { hoursPerWeek: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {hoursPerWeekOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.hoursPerWeek && (
          <p className="text-sm text-destructive">{errors.hoursPerWeek.message}</p>
        )}
      </div>
      {/* Hidden submit button for parent to trigger */}
      <button type="submit" className="hidden" aria-hidden="true" />
    </form>
  );
}

