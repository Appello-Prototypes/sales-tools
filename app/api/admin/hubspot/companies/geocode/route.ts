import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';

// Save geocoded coordinates for a company
export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, lat, lng, geocodeError } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    await connectDB();

    const updateData: any = {
      geocodedAt: new Date(),
    };

    if (geocodeError) {
      updateData.geocodeError = true;
      updateData.lat = null;
      updateData.lng = null;
    } else if (typeof lat === 'number' && typeof lng === 'number') {
      updateData.lat = lat;
      updateData.lng = lng;
      updateData.geocodeError = false;
    } else {
      return NextResponse.json({ error: 'Valid lat/lng coordinates or geocodeError flag required' }, { status: 400 });
    }

    const result = await Company.findOneAndUpdate(
      { hubspotId: companyId },
      { $set: updateData },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      company: {
        id: result.hubspotId,
        lat: result.lat,
        lng: result.lng,
        geocodedAt: result.geocodedAt,
        geocodeError: result.geocodeError,
      }
    });
  } catch (error: any) {
    console.error('Error saving geocode data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save geocode data' },
      { status: 500 }
    );
  }
}

// Batch save geocoded coordinates for multiple companies
export async function PUT(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companies } = body;

    if (!Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json({ error: 'Companies array is required' }, { status: 400 });
    }

    await connectDB();

    const bulkOps = companies.map((company: any) => {
      const updateData: any = {
        geocodedAt: new Date(),
      };

      if (company.geocodeError) {
        updateData.geocodeError = true;
        updateData.lat = null;
        updateData.lng = null;
      } else if (typeof company.lat === 'number' && typeof company.lng === 'number') {
        updateData.lat = company.lat;
        updateData.lng = company.lng;
        updateData.geocodeError = false;
      }

      return {
        updateOne: {
          filter: { hubspotId: company.id },
          update: { $set: updateData },
        }
      };
    });

    const result = await Company.bulkWrite(bulkOps);

    return NextResponse.json({ 
      success: true,
      modified: result.modifiedCount,
      matched: result.matchedCount,
    });
  } catch (error: any) {
    console.error('Error batch saving geocode data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to batch save geocode data' },
      { status: 500 }
    );
  }
}

