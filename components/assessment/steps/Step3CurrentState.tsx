'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAssessmentStore } from '@/lib/store/assessmentStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';

const schema = z.object({
  timesheetMethod: z.string().min(1),
  unionized: z.string().min(1),
  cbaCount: z.string().optional(),
  unions: z.array(z.string()).optional(),
  accountingSoftware: z.string().min(1),
  payrollSoftware: z.string().optional(),
  constructionSoftware: z.string().min(1),
  notDoing: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

interface Step3CurrentStateProps {
  onNext: () => void;
}

const accountingSoftware = [
  'QuickBooks Desktop',
  'QuickBooks Online',
  'Sage 50',
  'Sage 100',
  'Sage 300',
  'Sage Intacct',
  'Spectrum by Viewpoint',
  'Vista by Viewpoint',
  'Foundation Construction Software',
  'ComputerEase',
  'NetSuite',
  'Microsoft Dynamics Business Central',
  'Xero',
  'FreshBooks',
  'Wave',
  'Excel/Manual',
  'Other',
];

const payrollSoftware = [
  'Dayforce Powerpay',
  'Payroll for Construction',
  'QuickBooks Payroll',
  'ADP',
  'Paychex',
  'Paycor',
  'Gusto',
  'BambooHR',
  'Workday',
  'Sage Payroll',
  'Spectrum Payroll',
  'Vista Payroll',
  'Foundation Payroll',
  'Excel/Manual',
  'Same as accounting software (integrated)',
  'Other',
];

const constructionSoftware = [
  'Procore',
  'Buildertrend',
  'Jonas Premier',
  'Foundation Construction Software',
  'Autodesk Construction Cloud',
  'BuildOps',
  'ServiceTitan',
  'Simpro',
  'Contractor Foreman',
  'Knowify',
  'Workyard',
  'Fieldwire',
  'SiteDocs',
  'ConnectTeam',
  'Bridgit Bench',
  'CoConstruct',
  'JobNimbus',
  'RedTeam',
  'eSub',
  'No, using paper/Excel',
  'Other',
];

const notDoingOptions = [
  'Project scheduling (formal system)',
  'Job costing/tracking (real-time visibility)',
  'Estimating (digital system)',
  'Invoicing/billing (automated)',
  'Purchase orders (tracked system)',
  'Material ordering and procurement (formal process)',
  'Work orders/service work tracking (time & materials)',
  'Equipment tracking',
  'Document management (centralized)',
  'Safety forms/inspections (digital)',
  'Field-office communication (structured)',
  'Business intelligence/advanced analytics',
];

export default function Step3CurrentState({ onNext }: Step3CurrentStateProps) {
  const { data, updateData } = useAssessmentStore();
  const [showUnionQuestions, setShowUnionQuestions] = useState(
    data.section3?.unionized === 'Yes'
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      timesheetMethod: data.section3?.timesheetMethod || '',
      unionized: data.section3?.unionized || '',
      cbaCount: data.section3?.cbaCount || '',
      unions: data.section3?.unions || [],
      accountingSoftware: data.section3?.accountingSoftware || '',
      payrollSoftware: data.section3?.payrollSoftware || '',
      constructionSoftware: data.section3?.constructionSoftware || '',
      notDoing: data.section3?.notDoing || [],
    },
  });

  const unionized = watch('unionized');
  const selectedUnions = watch('unions') || [];

  const toggleUnion = (union: string) => {
    const updated = selectedUnions.includes(union)
      ? selectedUnions.filter((u) => u !== union)
      : [...selectedUnions, union];
    setValue('unions', updated);
    updateData('section3', { unions: updated });
  };

  const toggleNotDoing = (item: string) => {
    const current = watch('notDoing') || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setValue('notDoing', updated);
    updateData('section3', { notDoing: updated });
  };

  const onSubmit = (formData: FormData) => {
    updateData('section3', formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 8: How do you currently handle timesheets? *
        </Label>
        <Select
          value={watch('timesheetMethod')}
          onValueChange={(value) => {
            setValue('timesheetMethod', value);
            updateData('section3', { timesheetMethod: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Paper timesheets">Paper timesheets</SelectItem>
            <SelectItem value="Excel spreadsheets">Excel spreadsheets</SelectItem>
            <SelectItem value="Dedicated timesheet software">Dedicated timesheet software</SelectItem>
            <SelectItem value="Part of larger system">Part of larger system</SelectItem>
            <SelectItem value="No formal system">No formal system</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 8B: Are you unionized? *
        </Label>
        <RadioGroup
          value={unionized}
          onValueChange={(value) => {
            setValue('unionized', value);
            setShowUnionQuestions(value === 'Yes');
            updateData('section3', { unionized: value });
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Yes" id="union-yes" />
            <Label htmlFor="union-yes" className="font-normal cursor-pointer">
              Yes, we are unionized
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="No" id="union-no" />
            <Label htmlFor="union-no" className="font-normal cursor-pointer">
              No, we are open shop (non-union)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Mixed" id="union-mixed" />
            <Label htmlFor="union-mixed" className="font-normal cursor-pointer">
              Mixed (some union, some non-union)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {showUnionQuestions && (
        <>
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Question 8C: How many different Collective Bargaining Agreements (CBAs) do you work under?
            </Label>
            <Select
              value={watch('cbaCount')}
              onValueChange={(value) => {
                setValue('cbaCount', value);
                updateData('section3', { cbaCount: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 CBA</SelectItem>
                <SelectItem value="2-3">2-3 CBAs</SelectItem>
                <SelectItem value="4-5">4-5 CBAs</SelectItem>
                <SelectItem value="6+">6+ CBAs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Question 8D: Which unions do you work with?
            </Label>
            <div className="space-y-3">
              {[
                'Sheet Metal Workers (SMWIA)',
                'Plumbers/Pipefitters (UA)',
                'Insulators (IUPAT)',
                'Electricians (IBEW)',
                'HVAC/Refrigeration (UA, SMWIA)',
                'Carpenters (UBC)',
                'Laborers (LIUNA)',
                'Operating Engineers (IUOE)',
              ].map((union) => (
                <div key={union} className="flex items-center space-x-3">
                  <Checkbox
                    id={union}
                    checked={selectedUnions.includes(union)}
                    onCheckedChange={() => toggleUnion(union)}
                  />
                  <Label htmlFor={union} className="font-normal cursor-pointer">
                    {union}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 9: What accounting software are you using? *
        </Label>
        <Select
          value={watch('accountingSoftware')}
          onValueChange={(value) => {
            setValue('accountingSoftware', value);
            updateData('section3', { accountingSoftware: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select software" />
          </SelectTrigger>
          <SelectContent>
            {accountingSoftware.map((software) => (
              <SelectItem key={software} value={software}>
                {software}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 9B: What payroll software are you using?
        </Label>
        <Select
          value={watch('payrollSoftware')}
          onValueChange={(value) => {
            setValue('payrollSoftware', value);
            updateData('section3', { payrollSoftware: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select software" />
          </SelectTrigger>
          <SelectContent>
            {payrollSoftware.map((software) => (
              <SelectItem key={software} value={software}>
                {software}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 10: Are you currently using any construction/contractor management software? *
        </Label>
        <Select
          value={watch('constructionSoftware')}
          onValueChange={(value) => {
            setValue('constructionSoftware', value);
            updateData('section3', { constructionSoftware: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select software" />
          </SelectTrigger>
          <SelectContent>
            {constructionSoftware.map((software) => (
              <SelectItem key={software} value={software}>
                {software}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Question 11: Which of these are you NOT currently doing, but WISH you were? *
        </Label>
        <p className="text-sm text-muted-foreground mb-2">
          Check all that apply - areas where you have no formal process because your current systems/processes don't support it
        </p>
        <div className="space-y-3">
          {notDoingOptions.map((item) => (
            <div key={item} className="flex items-center space-x-3">
              <Checkbox
                id={item}
                checked={watch('notDoing')?.includes(item) || false}
                onCheckedChange={() => toggleNotDoing(item)}
              />
              <Label htmlFor={item} className="font-normal cursor-pointer">
                {item}
              </Label>
            </div>
          ))}
        </div>
      </div>
      {/* Hidden submit button for parent to trigger */}
      <button type="submit" className="hidden" aria-hidden="true" />
    </form>
  );
}

