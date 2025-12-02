import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Estimate from '@/models/Estimate';
import { verifyAuth } from '@/lib/auth';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { EstimatePdfDocument } from '@/lib/pdf/EstimatePdfTemplate';

// Transform the estimate data for the PDF template with defaults
function transformEstimateForPdf(estimate: Record<string, unknown>) {
  const paymentOptions = estimate.paymentOptions as Record<string, Record<string, number>> || {};
  
  return {
    estimateNumber: estimate.estimateNumber || 'EST-DRAFT',
    preparedFor: estimate.preparedFor || { companyName: 'N/A', contactName: 'N/A' },
    numberOfUsers: estimate.numberOfUsers || 1,
    moduleTier: estimate.moduleTier || 1,
    currency: estimate.currency || 'CAD',
    lineItems: estimate.lineItems || [],
    discounts: estimate.discounts || [],
    totals: estimate.totals || {
      modulePrice: 0,
      userPrice: 0,
      serverStorage: 0,
      subtotal: 0,
      totalDiscounts: 0,
      taxRate: 13,
      taxAmount: 0,
      total: 0,
    },
    paymentOptions: {
      monthly: {
        amount: paymentOptions.monthly?.amount || 0,
        annual: paymentOptions.monthly?.annualEquivalent || 0,
        monthlyEquiv: paymentOptions.monthly?.amount || 0,
      },
      quarterly: {
        amount: paymentOptions.quarterly?.amount || 0,
        annual: paymentOptions.quarterly?.annualEquivalent || 0,
        monthlyEquiv: (paymentOptions.quarterly?.amount || 0) / 3,
        savings: paymentOptions.quarterly?.savings || 0,
        discountPct: paymentOptions.quarterly?.discountPct || 8.3,
      },
      annual: {
        amount: paymentOptions.annual?.amount || 0,
        annual: paymentOptions.annual?.annualEquivalent || 0,
        monthlyEquiv: (paymentOptions.annual?.amount || 0) / 12,
        savings: paymentOptions.annual?.savings || 0,
        discountPct: paymentOptions.annual?.discountPct || 16.7,
      },
    },
    notes: estimate.notes || '',
    createdAt: estimate.createdAt || new Date(),
    validUntil: estimate.validUntil,
  };
}

// GET - Generate PDF for estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ estimateId: string }> }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { estimateId } = await params;
    
    if (!estimateId || estimateId.length !== 24) {
      return NextResponse.json({ error: 'Invalid estimate ID' }, { status: 400 });
    }

    const estimate = await Estimate.findById(estimateId).lean();

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Transform data for PDF template with safe defaults
    const pdfData = transformEstimateForPdf(estimate as Record<string, unknown>);

    // Generate PDF buffer
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderToBuffer(
        React.createElement(EstimatePdfDocument, { estimate: pdfData })
      );
    } catch (renderError) {
      console.error('PDF Render Error:', renderError);
      return NextResponse.json(
        { error: 'Failed to render PDF', details: renderError instanceof Error ? renderError.message : 'Unknown render error' },
        { status: 500 }
      );
    }

    // Return as downloadable PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfData.estimateNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
