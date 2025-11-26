'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAssessmentStore } from '@/lib/store/assessmentStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  companyName: z.string().min(1, 'Please enter your company name'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  trade: z.string().min(1, 'Please select your trade'),
  fieldWorkers: z.string().min(1, 'Please select number of field workers'),
  role: z.string().min(1, 'Please select your role'),
});

type FormData = z.infer<typeof schema>;

interface Step1CompanyBasicsProps {
  onNext: () => void;
}

const trades = [
  'Mechanical Insulation',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Fire Protection',
  'General Mechanical',
  'Other',
];

const fieldWorkerRanges = ['1-19', '20-49', '50-99', '100-249', '250+'];

const roles = [
  'Owner/CEO',
  'Operations Manager',
  'Project Manager',
  'Office Administrator',
  'Estimator',
  'Other',
];

export default function Step1CompanyBasics({ onNext }: Step1CompanyBasicsProps) {
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
      companyName: data.companyName || '',
      website: data.website || '',
      trade: data.section1?.trade || '',
      fieldWorkers: data.section1?.fieldWorkers || '',
      role: data.section1?.role || '',
    },
  });

  const companyName = watch('companyName');
  const website = watch('website');
  const trade = watch('trade');
  const fieldWorkers = watch('fieldWorkers');
  const role = watch('role');

  const onSubmit = (formData: FormData) => {
    // Update company name and website at root level
    updateData('companyName', formData.companyName);
    if (formData.website) {
      updateData('website', formData.website);
    }
    // Update section1 with trade, fieldWorkers, role
    updateData('section1', {
      trade: formData.trade,
      fieldWorkers: formData.fieldWorkers,
      role: formData.role,
    });
    // Call onNext immediately - transition is handled by parent
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-base font-semibold">
            Company Name *
          </Label>
          <p className="text-sm text-muted-foreground">
            This helps us personalize your experience and research your company
          </p>
          <Input
            id="companyName"
            {...register('companyName')}
            placeholder="e.g., Rival Insulation"
            value={companyName}
            onChange={(e) => {
              setValue('companyName', e.target.value);
              updateData('companyName', e.target.value);
            }}
          />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website" className="text-base font-semibold">
            Company Website (Optional)
          </Label>
          <p className="text-sm text-muted-foreground">
            Providing your website helps us better understand your business and tailor recommendations
          </p>
          <Input
            id="website"
            type="url"
            {...register('website')}
            placeholder="https://yourcompany.com"
            value={website}
            onChange={(e) => {
              setValue('website', e.target.value);
              if (e.target.value) {
                updateData('website', e.target.value);
              }
            }}
          />
          {errors.website && (
            <p className="text-sm text-destructive">{errors.website.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            What is your primary trade/specialty? *
          </Label>
          <p className="text-sm text-muted-foreground">
            This helps us customize your experience
          </p>
        </div>
        <RadioGroup
          value={trade}
          onValueChange={(value) => {
            setValue('trade', value);
            updateData('section1', { trade: value });
          }}
        >
          {trades.map((t) => (
            <div key={t} className="flex items-center space-x-2">
              <RadioGroupItem value={t} id={t} />
              <Label htmlFor={t} className="font-normal cursor-pointer">
                {t}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.trade && (
          <p className="text-sm text-destructive">{errors.trade.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            How many field workers do you currently have? *
          </Label>
          <p className="text-sm text-muted-foreground">
            We'll calculate ROI based on your team size
          </p>
        </div>
        <Select
          value={fieldWorkers}
          onValueChange={(value) => {
            setValue('fieldWorkers', value);
            updateData('section1', { fieldWorkers: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {fieldWorkerRanges.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.fieldWorkers && (
          <p className="text-sm text-destructive">{errors.fieldWorkers.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            What is your role in the company? *
          </Label>
          <p className="text-sm text-muted-foreground">
            This helps us tailor recommendations to your perspective
          </p>
        </div>
        <RadioGroup
          value={role}
          onValueChange={(value) => {
            setValue('role', value);
            updateData('section1', { role: value });
          }}
        >
          {roles.map((r) => (
            <div key={r} className="flex items-center space-x-2">
              <RadioGroupItem value={r} id={r} />
              <Label htmlFor={r} className="font-normal cursor-pointer">
                {r}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>
      {/* Hidden submit button for parent to trigger */}
      <button type="submit" className="hidden" aria-hidden="true" />
    </form>
  );
}

