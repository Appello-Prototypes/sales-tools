'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const assessmentQuestions = [
  {
    section: 'Section 1: Company Basics',
    questions: [
      {
        number: 1,
        question: 'Company Name',
        description: 'This helps us personalize your experience and research your company',
        type: 'text',
        required: true,
      },
      {
        number: 2,
        question: 'Company Website (Optional)',
        description: 'Providing your website helps us better understand your business and tailor recommendations',
        type: 'url',
        required: false,
      },
      {
        number: 3,
        question: 'What is your primary trade/specialty?',
        description: 'This helps us customize your experience',
        type: 'radio',
        options: [
          'Mechanical Insulation',
          'HVAC',
          'Plumbing',
          'Electrical',
          'Fire Protection',
          'General Mechanical',
          'Other',
        ],
        required: true,
      },
      {
        number: 4,
        question: 'How many field workers do you currently have?',
        description: "We'll calculate ROI based on your team size",
        type: 'select',
        options: ['1-19', '20-49', '50-99', '100-249', '250+'],
        required: true,
      },
      {
        number: 5,
        question: 'What is your role in the company?',
        description: 'This helps us tailor recommendations to your perspective',
        type: 'radio',
        options: [
          'Owner/CEO',
          'Operations Manager',
          'Project Manager',
          'Office Administrator',
          'Estimator',
          'Other',
        ],
        required: true,
      },
    ],
  },
  {
    section: 'Section 2: Pain Point Discovery',
    questions: [
      {
        number: 6,
        question: 'Which of these operational challenges are costing you time or money RIGHT NOW?',
        description: "Check all that apply - be honest about what's frustrating you",
        type: 'checkbox',
        options: [
          'Time tracking and payroll processing takes too long (especially union/complex wage rules)',
          "Can't see job profitability in real-time (always looking backwards)",
          'Invoicing and progress billing is manual/slow (delays cash flow)',
          'Poor communication between field and office (things fall through cracks)',
          'Estimating is inconsistent or takes too long',
          "Can't track worker locations or equipment (where is everything?)",
          "Losing money on jobs but don't know why",
          'Paper forms and documents everywhere (hard to find, easy to lose)',
          'Scheduling conflicts and crew allocation issues',
          'Change orders fall through the cracks (leaving money on the table)',
          "Multiple disconnected systems that don't talk to each other",
          'Material ordering is chaotic (field requests, office confusion, cost tracking issues)',
          'Service work/work orders are hard to track and bill (time & materials)',
          "Can't get insights from our data (wish we had better reporting/analytics)",
        ],
        required: true,
      },
      {
        number: 7,
        question: 'If you could wave a magic wand and fix ONE thing about running your business, what would it be?',
        description: "This is your biggest pain - we will focus here",
        type: 'textarea',
        required: true,
      },
      {
        number: 8,
        question: 'On a scale of 1-10, how urgent is solving these challenges?',
        description: 'Rate the urgency',
        type: 'slider',
        min: 1,
        max: 10,
        required: true,
      },
      {
        number: 9,
        question: "What's the REAL cost of your current process?",
        description:
          'How many hours per week does your office staff spend on manual data entry, consolidating information from multiple systems, or chasing down missing information?',
        type: 'select',
        options: [
          'Less than 5 hours/week',
          '5-10 hours/week',
          '10-20 hours/week',
          '20+ hours/week',
          'Not sure, but it feels like too much',
        ],
        required: true,
      },
    ],
  },
  {
    section: 'Section 3: Current State Assessment',
    questions: [
      {
        number: 10,
        question: 'How do you currently handle timesheets?',
        type: 'select',
        options: [
          'Paper timesheets',
          'Excel spreadsheets',
          'Dedicated timesheet software',
          'Part of larger system',
          'No formal system',
          'Other',
        ],
        required: true,
      },
      {
        number: 11,
        question: 'Are you unionized?',
        type: 'radio',
        options: ['Yes, we are unionized', 'No, we are open shop (non-union)', 'Mixed (some union, some non-union)'],
        required: true,
        conditional: {
          if: 'Yes, we are unionized',
          questions: [
            {
              number: '11A',
              question: 'How many different Collective Bargaining Agreements (CBAs) do you work under?',
              type: 'select',
              options: ['1 CBA', '2-3 CBAs', '4-5 CBAs', '6+ CBAs'],
            },
            {
              number: '11B',
              question: 'Which unions do you work with?',
              type: 'checkbox',
              options: [
                'Sheet Metal Workers (SMWIA)',
                'Plumbers/Pipefitters (UA)',
                'Insulators (IUPAT)',
                'Electricians (IBEW)',
                'HVAC/Refrigeration (UA, SMWIA)',
                'Carpenters (UBC)',
                'Laborers (LIUNA)',
                'Operating Engineers (IUOE)',
              ],
            },
          ],
        },
      },
      {
        number: 12,
        question: 'What accounting software are you using?',
        type: 'select',
        options: [
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
        ],
        required: true,
      },
      {
        number: 13,
        question: 'What payroll software are you using?',
        type: 'select',
        options: [
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
        ],
        required: false,
      },
      {
        number: 14,
        question: 'Are you currently using any construction/contractor management software?',
        type: 'select',
        options: [
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
        ],
        required: true,
      },
      {
        number: 15,
        question: 'Which of these are you NOT currently doing, but WISH you were?',
        description:
          "Check all that apply - areas where you have no formal process because your current systems/processes don't support it",
        type: 'checkbox',
        options: [
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
        ],
        required: true,
      },
    ],
  },
  {
    section: 'Section 4: Demo Customization',
    questions: [
      {
        number: 16,
        question: 'Which areas would you like us to focus on during the demo?',
        description: 'Select up to 3 priorities - we will dive deep here',
        type: 'checkbox',
        options: [
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
        ],
        maxSelections: 3,
        required: true,
      },
      {
        number: 17,
        question: 'Who else will be involved in evaluating Appello?',
        type: 'checkbox',
        options: [
          'Just me',
          'Other owners/partners',
          'Operations/Project managers',
          'Office/admin staff',
          'Field supervisors/foremen',
          'Accountant/bookkeeper',
          'IT person',
        ],
        required: true,
      },
      {
        number: 18,
        question: "How would you describe your field crew's comfort level with technology?",
        type: 'radio',
        options: [
          'Very comfortable - they use apps daily',
          'Somewhat comfortable - can learn with training',
          'Not very comfortable - prefer paper',
          'Mixed - some tech-savvy, some not',
        ],
        required: true,
      },
      {
        number: 19,
        question: 'Do your field workers have smartphones?',
        type: 'radio',
        options: ['Yes, company-provided', 'Yes, personal devices', "Some do, some don't", 'No'],
        required: true,
      },
    ],
  },
  {
    section: 'Section 5: Decision Intelligence',
    questions: [
      {
        number: 20,
        question: "What's your timeline for making a decision?",
        type: 'select',
        options: ['Researching now, no timeline', 'Within 1 month', '1-3 months', '3-6 months', '6+ months'],
        required: true,
      },
      {
        number: 21,
        question: 'What other solutions are you currently evaluating?',
        type: 'checkbox',
        options: [
          'Not looking at alternatives yet',
          'Procore',
          'Buildertrend',
          'Jonas',
          'Foundation',
          'Sage Contractor',
          'ComputerEase',
          'Other',
        ],
        required: true,
      },
      {
        number: 22,
        question: 'After the demo, what would you need to move forward?',
        description: 'Select all that apply - helps us prepare',
        type: 'checkbox',
        options: [
          'Pricing information',
          'Talk to a reference customer (similar trade/size)',
          'Internal team buy-in (we can help with that)',
          'See how it integrates with our accounting software',
          'Proof of ROI/business case',
          'Custom demo for other stakeholders',
          'Understanding implementation timeline',
          'Security/compliance documentation',
        ],
        required: true,
      },
      {
        number: 23,
        question: 'On a scale of 1-10, how likely is it that you will implement new software in the next 6 months?',
        type: 'slider',
        min: 1,
        max: 10,
        required: true,
      },
      {
        number: 24,
        question: "Is there anything specific you'd like to see or any questions you have before the demo?",
        type: 'textarea',
        required: false,
      },
      {
        number: 25,
        question: 'Contact Information',
        description: 'Please provide your name and email so we can follow up with your personalized report.',
        type: 'contact',
        fields: ['Full Name', 'Email Address'],
        required: true,
      },
    ],
  },
];

export default function AssessmentFormPage() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  return (
    <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-2">Assessment Form</h1>
            <p className="text-muted-foreground">
              Complete view of all assessment questions organized by section
            </p>
          </div>

          <div className="space-y-8">
            {assessmentQuestions.map((section, sectionIndex) => (
              <Card key={sectionIndex}>
                <CardHeader>
                  <CardTitle className="text-xl">{section.section}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {section.questions.map((q, qIndex) => (
                      <div key={qIndex} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex items-start gap-3 mb-2">
                          <Badge variant="outline" className="mt-1">
                            Q{q.number}
                          </Badge>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{q.question}</h3>
                            {q.description && (
                              <p className="text-sm text-muted-foreground mb-3">{q.description}</p>
                            )}
                            {q.required && (
                              <Badge variant="secondary" className="text-xs mb-3">
                                Required
                              </Badge>
                            )}
                            
                            {/* Question Type Display */}
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-muted-foreground">
                                <strong>Type:</strong> {q.type}
                              </p>
                              
                              {q.options && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-2">Options:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    {q.options.map((option, optIndex) => (
                                      <li key={optIndex} className="text-muted-foreground">
                                        {option}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {'maxSelections' in q && (q as any).maxSelections && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  <strong>Max selections:</strong> {(q as any).maxSelections}
                                </p>
                              )}
                              
                              {'min' in q && 'max' in q && (q as any).min !== undefined && (q as any).max !== undefined && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  <strong>Range:</strong> {(q as any).min} - {(q as any).max}
                                </p>
                              )}
                            </div>

                            {/* Conditional Questions */}
                            {'conditional' in q && (q as any).conditional && (
                              <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-300 dark:border-border">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">
                                  Conditional (if "{(q as any).conditional.if}"):
                                </p>
                                {(q as any).conditional.questions.map((cq: any, cqIndex: number) => (
                                  <div key={cqIndex} className="mb-4">
                                    <Badge variant="outline" className="text-xs mb-1">
                                      Q{cq.number}
                                    </Badge>
                                    <p className="text-sm font-medium">{cq.question}</p>
                                    {cq.options && (
                                      <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground mt-1 ml-4">
                                        {cq.options.map((opt: string, optIndex: number) => (
                                          <li key={optIndex}>{opt}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
  );
}

