import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Quote from '@/models/Quote';

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
    const { quoteId, format = 'html' } = body;

    let quote;
    if (quoteId) {
      // Load existing quote from database
      quote = await Quote.findById(quoteId);
      if (!quote) {
        return NextResponse.json(
          { error: 'Quote not found' },
          { status: 404 }
        );
      }
      // Convert Mongoose document to plain object
      quote = quote.toObject();
      // Map module IDs to names for existing quote (if stored as IDs)
      if (quote.selectedModules && quote.selectedModules.length > 0) {
        // Check if they're IDs or already names
        const firstModule = quote.selectedModules[0];
        if (firstModule && !firstModule.includes(' ')) {
          // Likely IDs, map them
          quote.selectedModules = mapModuleIdsToNames(quote.selectedModules);
        }
      }
    } else {
      // Generate quote from provided data
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
      } = body;

      if (!numUsers || !tier || !paymentFrequency || !calculations || !firstYearTotal) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Map module IDs to names
      const moduleNames = mapModuleIdsToNames(selectedModules || []);
      
      quote = {
        customerName,
        customerEmail,
        customerCompany,
        numUsers,
        tier,
        selectedModules: moduleNames,
        hasNIADiscount: hasNIADiscount || false,
        paymentFrequency,
        calculations,
        firstYearTotal,
        quoteNumber: `TEMP-${Date.now()}`,
        createdAt: new Date(),
      };
    }

    // Generate branded quote HTML
    const quoteHtml = generateBrandedQuoteHTML(quote);

    if (format === 'html') {
      return new NextResponse(quoteHtml, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="quote-${quote.quoteNumber || 'temp'}.html"`,
        },
      });
    }

    // For PDF, you would use a library like puppeteer or pdfkit
    // For now, return HTML that can be printed to PDF
    return new NextResponse(quoteHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="quote-${quote.quoteNumber || 'temp'}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating quote:', error);
    return NextResponse.json(
      { error: 'Failed to generate quote', details: error.message },
      { status: 500 }
    );
  }
}

function generateBrandedQuoteHTML(quote: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const expiresAt = quote.expiresAt 
    ? formatDate(quote.expiresAt)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  // Split modules into columns for compact display
  const modules = quote.selectedModules || [];
  const midpoint = Math.ceil(modules.length / 2);
  const modulesCol1 = modules.slice(0, midpoint);
  const modulesCol2 = modules.slice(midpoint);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appello Pricing Quote - ${quote.quoteNumber || 'Draft'}</title>
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      height: 100%;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #26303D;
      background: white;
      line-height: 1.4;
      font-size: 11px;
    }
    .page {
      width: 8.5in;
      height: 11in;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      background: white;
    }
    .header {
      background: linear-gradient(135deg, #3D6AFF 0%, #1e40af 100%);
      color: white;
      padding: 20px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      height: 36px;
      width: auto;
    }
    .quote-info {
      text-align: right;
    }
    .quote-number {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .quote-date {
      font-size: 11px;
      opacity: 0.9;
    }
    .content {
      flex: 1;
      padding: 20px 32px;
      display: flex;
      flex-direction: column;
    }
    .top-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 16px;
    }
    .customer-box {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #3D6AFF;
    }
    .customer-box h3 {
      font-size: 9px;
      color: #879ACE;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .customer-box p {
      font-size: 12px;
      color: #26303D;
      font-weight: 600;
    }
    .customer-box .sub {
      font-size: 10px;
      color: #666;
      font-weight: 400;
      margin-top: 2px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .summary-card {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 6px;
      border-top: 3px solid #3D6AFF;
      text-align: center;
    }
    .summary-label {
      font-size: 8px;
      color: #879ACE;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .summary-value {
      font-size: 16px;
      font-weight: bold;
      color: #26303D;
    }
    .summary-sub {
      font-size: 8px;
      color: #879ACE;
      margin-top: 2px;
    }
    .section-title {
      font-size: 11px;
      font-weight: bold;
      color: #26303D;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 2px solid #3D6AFF;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .breakdown-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .breakdown-table th {
      background: #f0f4ff;
      padding: 6px 8px;
      text-align: left;
      font-size: 8px;
      color: #3D6AFF;
      text-transform: uppercase;
      font-weight: 600;
    }
    .breakdown-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .breakdown-table tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .text-bold {
      font-weight: bold;
    }
    .discount {
      color: #10b981;
    }
    .modules-section {
      margin-bottom: 16px;
    }
    .modules-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 10px;
    }
    .module-item {
      padding: 4px 8px;
      background: #f0f4ff;
      border-radius: 4px;
      color: #26303D;
    }
    .totals-section {
      background: linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%);
      padding: 12px 16px;
      border-radius: 8px;
      border: 2px solid #3D6AFF;
      margin-bottom: 12px;
    }
    .totals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      align-items: center;
    }
    .total-item {
      text-align: center;
    }
    .total-label {
      font-size: 9px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .total-value {
      font-size: 18px;
      font-weight: bold;
      color: #26303D;
    }
    .total-value.primary {
      font-size: 24px;
      color: #3D6AFF;
    }
    .total-sub {
      font-size: 8px;
      color: #879ACE;
      margin-top: 2px;
    }
    .footer {
      background: #26303D;
      color: white;
      padding: 12px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      font-size: 9px;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .footer-right {
      text-align: right;
      color: #879ACE;
    }
    .valid-until {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 9px;
      color: #856404;
      margin-bottom: 12px;
      display: inline-block;
    }
    .notes {
      font-size: 8px;
      color: #879ACE;
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .page {
        page-break-after: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-container">
        <svg class="logo" viewBox="0 0 2361.4 612" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FFFFFF" d="M579.4,273l-141.1,86.6L286,274.9L0,441.8l274.8,162.9c9.6,5.7,21.6,5.7,31.2-0.2l273.7-165.7L579.4,273z"/>
          <path fill="#FFFFFF" d="M0.1,337.9l141-86.6l129.4,72c14.1,7.8,31.2,7.6,45.1-0.5l264.4-154.4L312.4,10.7C297.9,2.2,280,2.3,265.6,11L0,172.5L0.1,337.9z"/>
          <path fill="#879ACE" d="M0,338l141.1-86.7L0,172.5L0,338z"/>
          <path fill="#455367" d="M579.8,272.8v166l-141.7-78.5L579.8,272.8z"/>
          <path fill="#FFFFFF" d="M943.2,211.2l-40.5,107.9h82L943.2,211.2z M969.6,130.2l123.2,309.6h-62.2l-27.8-72.9H885.4L858,439.8h-59.2l120.7-309.6H969.6z"/>
          <path fill="#FFFFFF" d="M1222,394.7c20.3,0,34.6-7.3,42.8-21.9c8.2-14.9,12.3-29.9,12.3-45.1c0-17.3-3.6-32.8-10.9-46.4c-7.3-13.7-22-20.5-44.2-20.5c-6.4,0-13.1,1.2-20,3.6c-6.7,2.1-13.1,5.2-19.1,9.1V382c6.1,3.6,12.4,6.7,19.1,9.1C1209,393.5,1215.6,394.7,1222,394.7z M1124.1,218.9h30.1l12.7,16.4c10-7.6,21.7-13.7,35.1-18.2c13.4-4.6,25.2-6.8,35.5-6.8c32.5,0,57.4,11.2,74.7,33.7c17.3,22.5,26,50.4,26,83.8s-9,61.3-26.9,83.8c-17.6,22.5-42.2,33.7-73.8,33.7c-7.9,0-16.8-1.4-26.9-4.1c-9.7-2.7-19-6.5-27.8-11.4v105.2h-58.7V218.9z"/>
          <path fill="#FFFFFF" d="M1486.6,394.7c20.3,0,34.6-7.3,42.8-21.9c8.2-14.9,12.3-29.9,12.3-45.1c0-17.3-3.6-32.8-10.9-46.4c-7.3-13.7-22-20.5-44.2-20.5c-6.4,0-13.1,1.2-20,3.6c-6.7,2.1-13.1,5.2-19.1,9.1V382c6.1,3.6,12.4,6.7,19.1,9.1C1473.5,393.5,1480.2,394.7,1486.6,394.7z M1388.7,218.9h30.1l12.7,16.4c10-7.6,21.7-13.7,35.1-18.2c13.4-4.6,25.2-6.8,35.5-6.8c32.5,0,57.4,11.2,74.7,33.7c17.3,22.5,26,50.4,26,83.8s-9,61.3-26.9,83.8c-17.6,22.5-42.2,33.7-73.8,33.7c-7.9,0-16.8-1.4-26.9-4.1c-9.7-2.7-19-6.5-27.8-11.4v105.2h-58.7V218.9z"/>
          <path fill="#FFFFFF" d="M1764.4,445.2c-38.2,0-68.5-10.5-90.6-31.4c-21.9-20.9-32.8-49-32.8-84.2s9.9-63.4,29.6-84.7c20-21.2,47.2-31.9,81.5-31.9c34.6,0,60,11.5,76,34.6c16.4,22.8,24.6,49.8,24.6,81v18.2h-148.9c2.7,14.6,9.4,26.3,20,35.1c10.6,8.5,24.6,12.7,41.9,12.7c10,0,19-1.2,26.9-3.6c8.2-2.7,17.6-6.5,28.2-11.4l17.3,42.8c-10.3,7.9-22.9,13.7-37.8,17.3C1785.8,443.4,1773.8,445.2,1764.4,445.2z M1796.7,307.3c-3-14.9-8.5-25.8-16.4-32.8c-7.9-7.3-17.8-10.9-29.6-10.9c-12.1,0-22.3,3.8-30.5,11.4c-8.2,7.3-13.5,18.1-15.9,32.3H1796.7z"/>
          <path fill="#FFFFFF" d="M1960.1,129.4v310.4h-58.7V129.4L1960.1,129.4z"/>
          <path fill="#FFFFFF" d="M2081.1,129.4v310.4h-58.7V129.4H2081.1z"/>
          <path fill="#FFFFFF" d="M2242.1,445.2c-34.9,0-62.2-10.5-82-31.4c-19.4-21.2-29.1-49.6-29.1-85.1c0-35.2,10.2-63.3,30.5-84.2c20.6-20.9,48.7-31.4,84.2-31.4c36.7,0,65.1,10.9,85.1,32.8c20.3,21.6,30.5,49.9,30.5,85.1s-10.9,63.1-32.8,83.8C2306.7,435.1,2277.9,445.2,2242.1,445.2z M2300.4,331c0-20.9-4.7-37.3-14.1-49.2c-9.1-12.1-22.2-18.2-39.2-18.2c-17.3,0-30.8,5.3-40.5,15.9c-9.7,10.6-14.6,26.9-14.6,48.7c0,21.9,4.1,38.4,12.3,49.6c8.5,11.2,21.4,16.8,38.7,16.8c17,0,30.8-5,41.4-15C2295.1,369.4,2300.4,353.1,2300.4,331z"/>
        </svg>
      </div>
      <div class="quote-info">
        <div class="quote-number">${quote.quoteNumber || 'DRAFT QUOTE'}</div>
        <div class="quote-date">${formatDate(quote.createdAt || new Date())}</div>
      </div>
    </div>

    <div class="content">
      <div class="top-section">
        <div class="customer-box">
          <h3>Prepared For</h3>
          <p>${quote.customerCompany || quote.customerName || 'Customer'}</p>
          ${quote.customerName && quote.customerCompany ? `<div class="sub">Attn: ${quote.customerName}</div>` : ''}
        </div>
        <div class="customer-box">
          <h3>Contact</h3>
          <p>${quote.customerEmail || 'N/A'}</p>
          <div class="sub">Valid until ${expiresAt}</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Users</div>
          <div class="summary-value">${quote.numUsers}</div>
          <div class="summary-sub">Tier ${quote.tier}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Modules</div>
          <div class="summary-value">${quote.calculations.selectedModulesCount}</div>
          <div class="summary-sub">Selected</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Billing</div>
          <div class="summary-value" style="font-size: 14px;">${quote.paymentFrequency.charAt(0).toUpperCase() + quote.paymentFrequency.slice(1)}</div>
          <div class="summary-sub">${quote.paymentFrequency === 'annual' ? '16.7% savings' : quote.paymentFrequency === 'quarterly' ? '8.3% savings' : 'Standard'}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Monthly</div>
          <div class="summary-value" style="font-size: 14px;">${formatCurrency(quote.calculations.monthlyEquivalent)}</div>
          <div class="summary-sub">Equivalent</div>
        </div>
      </div>

      <div class="breakdown-grid">
        <div>
          <h3 class="section-title">Monthly Subscription</h3>
          <table class="breakdown-table">
            <tbody>
              <tr>
                <td>Users (${quote.numUsers} × ${formatCurrency(quote.calculations.userCostPerUser)})</td>
                <td class="text-right">${formatCurrency(quote.calculations.totalUserCost)}</td>
              </tr>
              <tr>
                <td>Server & Storage</td>
                <td class="text-right">${formatCurrency(quote.calculations.serverStorageCost)}</td>
              </tr>
              <tr>
                <td>Modules (${quote.calculations.selectedModulesCount})</td>
                <td class="text-right">${formatCurrency(quote.calculations.totalModuleCost)}</td>
              </tr>
              ${quote.hasNIADiscount ? `
              <tr>
                <td class="discount">NIA Discount (10%)</td>
                <td class="text-right discount">-${formatCurrency(quote.calculations.niaDiscount || 0)}</td>
              </tr>
              ` : ''}
              <tr>
                <td class="discount">Early Adopter (20%)</td>
                <td class="text-right discount">-${formatCurrency(quote.calculations.earlyAdopterDiscount)}</td>
              </tr>
              <tr style="background: #f0f4ff;">
                <td class="text-bold">Subtotal</td>
                <td class="text-right text-bold">${formatCurrency(quote.calculations.monthlySubscriptionSubtotal)}</td>
              </tr>
              <tr>
                <td>HST (13%)</td>
                <td class="text-right">${formatCurrency(quote.calculations.taxAmount)}</td>
              </tr>
              <tr style="background: #e8edff;">
                <td class="text-bold">Monthly Total</td>
                <td class="text-right text-bold">${formatCurrency(quote.calculations.monthlySubscriptionWithTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 class="section-title">One-Time Fees</h3>
          <table class="breakdown-table">
            <tbody>
              <tr>
                <td>System Configuration</td>
                <td class="text-right">${formatCurrency(quote.calculations.onboardingCost / 4)}</td>
              </tr>
              <tr>
                <td>Data Migration</td>
                <td class="text-right">${formatCurrency(quote.calculations.onboardingCost / 4)}</td>
              </tr>
              <tr>
                <td>Onboarding</td>
                <td class="text-right">${formatCurrency(quote.calculations.onboardingCost / 4)}</td>
              </tr>
              <tr>
                <td>Training</td>
                <td class="text-right">${formatCurrency(quote.calculations.onboardingCost / 4)}</td>
              </tr>
              <tr>
                <td class="discount">30% Discount Applied</td>
                <td class="text-right"></td>
              </tr>
              <tr style="background: #e8edff;">
                <td class="text-bold">Onboarding Total</td>
                <td class="text-right text-bold">${formatCurrency(quote.calculations.onboardingCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modules-section">
        <h3 class="section-title">Included Modules</h3>
        <div class="modules-grid">
          <div>
            ${modulesCol1.map((m: string) => `<div class="module-item">✓ ${m}</div>`).join('')}
          </div>
          <div>
            ${modulesCol2.map((m: string) => `<div class="module-item">✓ ${m}</div>`).join('')}
          </div>
        </div>
      </div>

      <div class="totals-section">
        <div class="totals-grid">
          <div class="total-item">
            <div class="total-label">Onboarding</div>
            <div class="total-value">${formatCurrency(quote.calculations.onboardingCost)}</div>
            <div class="total-sub">One-time</div>
          </div>
          <div class="total-item">
            <div class="total-label">${quote.paymentFrequency === 'annual' ? 'Annual' : quote.paymentFrequency === 'quarterly' ? 'Quarterly × 4' : 'Monthly × 12'}</div>
            <div class="total-value">${formatCurrency(
              quote.paymentFrequency === 'annual' 
                ? quote.calculations.paymentAmount 
                : quote.paymentFrequency === 'quarterly'
                ? quote.calculations.paymentAmount * 4
                : quote.calculations.monthlySubscriptionSubtotal * 12
            )}</div>
            <div class="total-sub">Subscription</div>
          </div>
          <div class="total-item">
            <div class="total-label">First Year Total</div>
            <div class="total-value primary">${formatCurrency(quote.firstYearTotal)}</div>
            ${quote.calculations.savings > 0 ? `<div class="total-sub" style="color: #10b981;">Save ${formatCurrency(quote.calculations.savings)}/yr</div>` : ''}
          </div>
        </div>
      </div>

      <div class="notes">
        • Users added during billing cycles are prorated • All discounts maintained for lifetime of service • Payments via PAD/ACH bank transfer • Additional modules receive same discounts and are prorated
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <strong>Appello Inc.</strong>
        <span>643 Railroad St, Mount Brydges, ON N0L 1W0</span>
        <span>416-388-3907</span>
        <span>sales@appello.com</span>
      </div>
      <div class="footer-right">
        Construction Management Platform
      </div>
    </div>
  </div>
</body>
</html>`;
}

