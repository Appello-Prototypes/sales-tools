import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assessment from '@/models/Assessment';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    
    if (!user) {
      console.log('❌ Unauthorized: No valid auth token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const flagged = searchParams.get('flagged');
    const sort = searchParams.get('sort') || '-createdAt';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.opportunityPriority = priority;
    }
    if (flagged === 'true') {
      query.flagged = true;
    } else if (flagged === 'false') {
      // Match documents where flagged is not true (includes false, null, undefined)
      query.flagged = { $ne: true };
    }
    
    // Get assessments with pagination - exclude heavy fields for list view
    const assessments = await Assessment.find(query)
      .select('-auditTrail -adminReport -customerReport -debugLog') // Exclude large fields
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Assessment.countDocuments(query);
    
    return NextResponse.json({
      assessments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments', details: error.message },
      { status: 500 }
    );
  }
}

