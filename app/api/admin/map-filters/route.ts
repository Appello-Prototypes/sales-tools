import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import MapFilter from '@/models/MapFilter';

// GET - Fetch all saved filters for the user
export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const filters = await MapFilter.find({ userId: user.userId })
      .sort({ isDefault: -1, updatedAt: -1 })
      .lean();

    return NextResponse.json({ filters });
  } catch (error: any) {
    console.error('Error fetching map filters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filters', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new filter
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, filters, mapState, color, icon, isDefault } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Filter name is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // If setting as default, unset other defaults
    if (isDefault) {
      await MapFilter.updateMany(
        { userId: user.userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const newFilter = new MapFilter({
      name,
      description,
      userId: user.userId,
      filters: filters || {},
      mapState,
      color,
      icon,
      isDefault: isDefault || false,
    });

    await newFilter.save();

    return NextResponse.json({ 
      filter: newFilter,
      message: 'Filter saved successfully' 
    });
  } catch (error: any) {
    console.error('Error creating map filter:', error);
    return NextResponse.json(
      { error: 'Failed to create filter', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update an existing filter
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, filters, mapState, color, icon, isDefault } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Filter ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify ownership
    const existingFilter = await MapFilter.findOne({ _id: id, userId: user.userId });
    if (!existingFilter) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingFilter.isDefault) {
      await MapFilter.updateMany(
        { userId: user.userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const updatedFilter = await MapFilter.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filters && { filters }),
        ...(mapState && { mapState }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(isDefault !== undefined && { isDefault }),
      },
      { new: true }
    );

    return NextResponse.json({ 
      filter: updatedFilter,
      message: 'Filter updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating map filter:', error);
    return NextResponse.json(
      { error: 'Failed to update filter', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a filter
export async function DELETE(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Filter ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify ownership and delete
    const result = await MapFilter.findOneAndDelete({ _id: id, userId: user.userId });
    
    if (!result) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Filter deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting map filter:', error);
    return NextResponse.json(
      { error: 'Failed to delete filter', details: error.message },
      { status: 500 }
    );
  }
}


