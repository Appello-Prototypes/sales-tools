'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAssessmentStore } from '@/lib/store/assessmentStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  demoFocus: z.array(z.string()).max(3, 'Please select up to 3 priorities').min(1, 'Please select at least one'),
  evaluators: z.array(z.string()).min(1),
  techComfort: z.string().min(1),
  smartphones: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

interface Step4DemoCustomizationProps {
  onNext: () => void;
}

const demoFocusOptions = [
  'Mobile timesheets and GPS tracking (including union/complex wage rules)',
  'Job costing and profitability reports (real-time visibility)',
  'Scheduling and dispatch',
  'Estimating and proposals',
  'Invoicing and progress billing',
  'Purchase orders and material management',
  'Work orders and service work (time & materials tracking)',
  'Field forms and safety inspections',
  'Document storage and access',
  'Customer/project management',
  'Equipment and asset tracking',
  'AI-powered insights and automated reporting (Appello Apex)',
  'Advanced analytics and business intelligence',
  'Integration with accounting software',
  'Show me everything!',
];

const evaluators = [
  'Just me',
  'Other owners/partners',
  'Operations/Project managers',
  'Office/admin staff',
  'Field supervisors/foremen',
  'Accountant/bookkeeper',
  'IT person',
];

export default function Step4DemoCustomization({ onNext }: Step4DemoCustomizationProps) {
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
      demoFocus: data.section4?.demoFocus || [],
      evaluators: data.section4?.evaluators || [],
      techComfort: data.section4?.techComfort || '',
      smartphones: data.section4?.smartphones || '',
    },
  });

  const selectedDemoFocus = watch('demoFocus') || [];
  const selectedEvaluators = watch('evaluators') || [];

  const toggleDemoFocus = (item: string) => {
    if (item === 'Show me everything!') {
      setValue('demoFocus', ['Show me everything!']);
      updateData('section4', { demoFocus: ['Show me everything!'] });
      return;
    }
    
    const current = selectedDemoFocus.filter((f) => f !== 'Show me everything!');
    if (current.includes(item)) {
      const updated = current.filter((f) => f !== item);
      setValue('demoFocus', updated);
      updateData('section4', { demoFocus: updated });
    } else if (current.length < 3) {
      const updated = [...current, item];
      setValue('demoFocus', updated);
      updateData('section4', { demoFocus: updated });
    }
  };

  const toggleEvaluator = (item: string) => {
    const current = selectedEvaluators;
    const updated = current.includes(item)
      ? current.filter((e) => e !== item)
      : [...current, item];
    setValue('evaluators', updated);
    updateData('section4', { evaluators: updated });
  };

  const onSubmit = (formData: FormData) => {
    updateData('section4', formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 12: Which areas would you like us to focus on during the demo? *
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Select up to 3 priorities - we'll dive deep here
        </p>
        {selectedDemoFocus.length >= 3 && selectedDemoFocus[0] !== 'Show me everything!' && (
          <p className="text-sm text-amber-600">Maximum 3 selections</p>
        )}
        <div className="space-y-3">
          {demoFocusOptions.map((item) => (
            <div key={item} className="flex items-center space-x-3">
              <Checkbox
                id={item}
                checked={selectedDemoFocus.includes(item)}
                onCheckedChange={() => toggleDemoFocus(item)}
                disabled={
                  selectedDemoFocus.length >= 3 &&
                  !selectedDemoFocus.includes(item) &&
                  item !== 'Show me everything!'
                }
              />
              <Label htmlFor={item} className="font-normal cursor-pointer">
                {item}
              </Label>
            </div>
          ))}
        </div>
        {errors.demoFocus && (
          <p className="text-sm text-destructive">{errors.demoFocus.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 13: Who else will be involved in evaluating Appello? *
        </Label>
        <div className="space-y-3">
          {evaluators.map((evaluator) => (
            <div key={evaluator} className="flex items-center space-x-3">
              <Checkbox
                id={evaluator}
                checked={selectedEvaluators.includes(evaluator)}
                onCheckedChange={() => toggleEvaluator(evaluator)}
              />
              <Label htmlFor={evaluator} className="font-normal cursor-pointer">
                {evaluator}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 14: How would you describe your field crew's comfort level with technology? *
        </Label>
        <RadioGroup
          value={watch('techComfort')}
          onValueChange={(value) => {
            setValue('techComfort', value);
            updateData('section4', { techComfort: value });
          }}
        >
          {[
            'Very comfortable - they use apps daily',
            'Somewhat comfortable - can learn with training',
            'Not very comfortable - prefer paper',
            'Mixed - some tech-savvy, some not',
          ].map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={option} />
              <Label htmlFor={option} className="font-normal cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 15: Do your field workers have smartphones? *
        </Label>
        <RadioGroup
          value={watch('smartphones')}
          onValueChange={(value) => {
            setValue('smartphones', value);
            updateData('section4', { smartphones: value });
          }}
        >
          {[
            'Yes, company-provided',
            'Yes, personal devices',
            'Some do, some don\'t',
            'No',
          ].map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={option} />
              <Label htmlFor={option} className="font-normal cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      {/* Hidden submit button for parent to trigger */}
      <button type="submit" className="hidden" aria-hidden="true" />
    </form>
  );
}

