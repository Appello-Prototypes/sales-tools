import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GeneratedLetter from '@/models/GeneratedLetter';

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
    const { letterId, letterContent, recipientName, recipientTitle, companyName, companyAddress } = body;

    let letter;
    if (letterId) {
      letter = await GeneratedLetter.findById(letterId);
      if (!letter) {
        return NextResponse.json(
          { error: 'Letter not found' },
          { status: 404 }
        );
      }
    }

    const content = letterContent || letter?.generatedText || '';
    const recipient = recipientName || letter?.recipientName || '';
    const title = recipientTitle || letter?.recipientTitle || '';
    const company = companyName || letter?.companyName || '';
    const address = companyAddress || letter?.companyLocation || '';

    // Generate HTML with branded letterhead
    const html = generateBrandedLetterHTML({
      content,
      recipient,
      title,
      company,
      address,
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="appello-letter-${letterId || Date.now()}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}

function generateBrandedLetterHTML(data: {
  content: string;
  recipient?: string;
  title?: string;
  company?: string;
  address?: string;
}): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appello Letter</title>
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      margin: 0;
      padding: 0;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .letterhead {
      background: linear-gradient(135deg, #3D6AFF 0%, #2B4FD9 100%);
      color: white;
      padding: 40px 60px;
      text-align: center;
    }
    .letterhead h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 2px;
    }
    .letterhead .tagline {
      margin-top: 8px;
      font-size: 14px;
      opacity: 0.95;
      font-weight: 300;
    }
    .letter-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 60px;
      background: white;
    }
    .date {
      text-align: right;
      margin-bottom: 40px;
      color: #666;
      font-size: 14px;
    }
    .recipient-info {
      margin-bottom: 40px;
    }
    .recipient-info p {
      margin: 4px 0;
      color: #333;
    }
    .content {
      white-space: pre-wrap;
      font-size: 15px;
      line-height: 1.8;
      margin-bottom: 60px;
      color: #1a1a1a;
    }
    .signature {
      margin-top: 60px;
    }
    .signature-line {
      border-top: 1px solid #333;
      width: 200px;
      margin-top: 60px;
      margin-bottom: 10px;
    }
    .signature-name {
      font-weight: 600;
      font-size: 16px;
    }
    .signature-title {
      color: #666;
      font-size: 14px;
      margin-top: 4px;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .letterhead {
        background: #3D6AFF !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>APPELLO</h1>
    <div class="tagline">Empowering ICI Subcontractors with Intelligent Operations</div>
  </div>
  
  <div class="letter-container">
    <div class="date">${today}</div>
    
    <div class="recipient-info">
      ${data.recipient ? `<p><strong>${data.recipient}</strong></p>` : ''}
      ${data.title ? `<p>${data.title}</p>` : ''}
      ${data.company ? `<p>${data.company}</p>` : ''}
      ${data.address ? `<p>${data.address}</p>` : ''}
    </div>
    
    <div class="content">${data.content}</div>
    
    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-name">Appello Inc.</div>
      <div class="signature-title">Sales Team</div>
    </div>
  </div>
</body>
</html>`;
}

