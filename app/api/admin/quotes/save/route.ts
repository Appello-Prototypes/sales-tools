import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Quote from '@/models/Quote';

function generateQuoteNumber(): string {
  const prefix = 'QTE';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function mapModuleIdsToNames(moduleIds: string[]): string[] {
  const moduleMap: Record<string, string> = {
    'core': 'CORE',
    'crm': 'CRM, Sales & Estimation',
    'scheduling': 'Scheduling & Dispatch',
    'timesheets': 'Timesheets & Workforce Admin',
    'equipment': 'Equipment & Asset Management',
    'job-financials': 'Job Financials & Cost Control',
    'project-mgmt': 'Project Management',
    'po-inventory': 'Purchase Order & Inventory Management',
    'safety-forms': 'Safety & Forms',
    'training-compliance': 'Training & Compliance',
    'progress-billing': 'Progress Billing & Invoicing',
    'accounting-integration': 'Accounting Integration',
    'hr-onboarding': 'Human Resources',
    'appello-intelligence': 'Appello Intelligence',
  };
  
  return moduleIds
    .filter(id => id !== 'core') // Exclude core from list
    .map(id => moduleMap[id] || id)
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerCompany,
      numUsers,
      tier,
      selectedModules,
      hasNIADiscount,
      paymentFrequency,
      calculations,
      firstYearTotal,
      notes,
    } = body;

    // Validate required fields
    if (!numUsers || !tier || !paymentFrequency || !calculations || !firstYearTotal) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const quoteNumber = generateQuoteNumber();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Quotes expire in 30 days

    // Map module IDs to names for storage
    const moduleNames = mapModuleIdsToNames(selectedModules || []);

    const quote = new Quote({
      quoteNumber,
      customerName,
      customerEmail,
      customerCompany,
      numUsers,
      tier,
      selectedModules: moduleNames, // Store as names, not IDs
      hasNIADiscount: hasNIADiscount || false,
      paymentFrequency,
      calculations,
      firstYearTotal,
      status: 'draft',
      expiresAt,
      notes,
      createdBy: user.userId || user.id || 'admin',
    });

    await quote.save();

    return NextResponse.json({
      success: true,
      quote: {
        id: quote._id.toString(),
        quoteNumber: quote.quoteNumber,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerCompany: quote.customerCompany,
        firstYearTotal: quote.firstYearTotal,
        status: quote.status,
        expiresAt: quote.expiresAt,
        createdAt: quote.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error saving quote:', error);
    return NextResponse.json(
      { error: 'Failed to save quote', details: error.message },
      { status: 500 }
    );
  }
}

