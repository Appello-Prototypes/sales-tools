import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Estimate from '@/models/Estimate';
import { verifyAuth } from '@/lib/auth';

// GET - List estimates with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const query: Record<string, unknown> = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { estimateNumber: { $regex: search, $options: 'i' } },
        { 'preparedFor.companyName': { $regex: search, $options: 'i' } },
        { 'preparedFor.contactName': { $regex: search, $options: 'i' } },
      ];
    }
    
    const total = await Estimate.countDocuments(query);
    const estimates = await Estimate.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    return NextResponse.json({
      estimates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimates' },
      { status: 500 }
    );
  }
}

// Generate estimate number
function generateEstimateNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EST-${year}${month}${day}-${random}`;
}

interface LineItemInput {
  id: string;
  type: string;
  description: string;
  included?: boolean;
  quantity?: number;
  unitPrice: number;
  originalPrice: number;
  discountedPrice: number;
  notes?: string;
  isOverridden?: boolean;
  discount?: number;
}

interface DiscountInput {
  id: string;
  name: string;
  percentage: number;
  appliedTo?: string;
  amount: number;
  enabled?: boolean;
}

// POST - Create new estimate
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const body = await request.json();
    
    // Generate estimate number if not provided
    const estimateNumber = body.estimateNumber || generateEstimateNumber();
    
    // Set default valid until date (30 days from now)
    const validUntil = body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Transform lineItems to ensure all required fields are present
    const lineItems = (body.lineItems || []).map((item: LineItemInput) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      included: item.included ?? true,
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice,
      originalPrice: item.originalPrice,
      discount: item.discount ?? 0,
      discountedPrice: item.discountedPrice,
      notes: item.notes,
      isOverridden: item.isOverridden ?? false,
    }));
    
    // Transform discounts to ensure all required fields are present
    const discounts = (body.discounts || []).map((d: DiscountInput) => ({
      id: d.id,
      name: d.name,
      percentage: d.percentage,
      appliedTo: d.appliedTo || 'all',
      amount: d.amount,
      enabled: d.enabled ?? true,
    }));
    
    const estimate = new Estimate({
      ...body,
      estimateNumber,
      validUntil,
      lineItems,
      discounts,
      createdBy: user.email,
      status: body.status || 'draft',
    });
    
    await estimate.save();
    
    return NextResponse.json({ 
      success: true, 
      estimate,
      estimateId: estimate._id,
    });
  } catch (error: unknown) {
    // Detailed error logging
    console.error('Error creating estimate:', error);
    
    // Check for Mongoose validation errors
    const mongooseError = error as { name?: string; errors?: Record<string, { message: string }> };
    if (mongooseError.name === 'ValidationError' && mongooseError.errors) {
      const validationErrors = Object.keys(mongooseError.errors).map(key => ({
        field: key,
        message: mongooseError.errors![key].message,
      }));
      console.error('Validation errors:', validationErrors);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }
    
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      return NextResponse.json(
        { error: 'Estimate number already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create estimate', message: (error as Error).message },
      { status: 500 }
    );
  }
}
