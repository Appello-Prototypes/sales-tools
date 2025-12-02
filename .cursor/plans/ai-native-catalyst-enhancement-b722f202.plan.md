<!-- b722f202-975e-4c7a-97e9-3f765ce49dba feb93722-664d-4d11-97f5-11bdeddec89f -->
# Magazine Campaign System: 250 Hyper-Personalized Letters

## Immediate Goal

Build a system to generate, review, and track 250 personalized letters for the magazine direct mail campaign - leveraging all data sources (HubSpot, ATLAS, Fathom transcripts) to maximize personalization and response rates.

---

## Workflow Overview

```
CSV Upload → HubSpot Sync → Batch Letter Generation → Review Queue → Export PDFs → Track Campaign
```

---

## Phase 1: Import Pipeline

### 1.1 CSV Import UI

Create [`app/admin/campaigns/magazine/import/page.tsx`](app/admin/campaigns/magazine/import/page.tsx):

- Upload CSV with company/contact data
- Column mapping UI (company name, contact, email, industry, etc.)
- Preview rows before import
- Option to create new HubSpot companies or match existing

### 1.2 HubSpot Integration

Create [`lib/hubspot/campaignImport.ts`](lib/hubspot/campaignImport.ts):

- Search HubSpot for existing companies by name/domain
- Create companies that don't exist
- Create/associate contacts
- Tag all imported records with campaign identifier (e.g., `magazine_campaign_2025`)
- Create deals in designated pipeline stage

---

## Phase 2: Batch Letter Generation

### 2.1 Generation Queue

Create [`app/api/admin/campaigns/generate-batch/route.ts`](app/api/admin/campaigns/generate-batch/route.ts):

- Accept list of company IDs to process
- Queue background jobs (one per company)
- Track progress in database

### 2.2 Enhanced Letter Generation

Modify existing [`app/api/admin/hubspot/generate-letter/route.ts`](app/api/admin/hubspot/generate-letter/route.ts):

- Add Fathom transcript search (if we have meeting history with this company/contact)
- Deeper ATLAS queries (similar customers in same industry/region)
- Web research option via Firecrawl (company news, recent projects)

### 2.3 Campaign Model

Create [`models/Campaign.ts`](models/Campaign.ts):

```typescript
interface ICampaign {
  name: string;                    // "Magazine Campaign Q1 2025"
  type: 'magazine' | 'chocolate' | 'email';
  status: 'draft' | 'generating' | 'reviewing' | 'sending' | 'tracking';
  targets: [{
    companyId: string;             // HubSpot company ID
    contactId?: string;            // Primary contact
    letterStatus: 'pending' | 'generating' | 'generated' | 'approved' | 'rejected';
    letterId?: string;             // Reference to GeneratedLetter
    magazineSentDate?: Date;
    responseDate?: Date;
    responseType?: 'demo_booked' | 'callback' | 'email_reply' | 'no_response';
  }];
  stats: {
    total: number;
    generated: number;
    approved: number;
    sent: number;
    responses: number;
    demosBooked: number;
  };
}
```

---

## Phase 3: Review Dashboard

### 3.1 Campaign Dashboard

Create [`app/admin/campaigns/magazine/page.tsx`](app/admin/campaigns/magazine/page.tsx):

- Campaign overview with stats (generated/approved/sent/responses)
- Progress bar for batch generation
- Quick filters: Pending Review, Approved, Rejected, Needs Revision

### 3.2 Letter Review UI

Create [`app/admin/campaigns/magazine/review/[targetId]/page.tsx`](app/admin/campaigns/magazine/review/[targetId]/page.tsx):

- Display company context (HubSpot data, industry, contacts)
- Show generated letter with edit capability
- Show research used (ATLAS matches, Fathom transcripts, web research)
- Actions: Approve, Reject, Regenerate with feedback
- Navigate to next/previous in queue

### 3.3 Bulk Actions

On campaign dashboard:

- Approve all with confidence score > 0.8
- Export approved letters to PDF
- Mark batch as sent with date

---

## Phase 4: PDF Export & Tracking

### 4.1 PDF Generation

Enhance existing [`app/api/admin/letters/export-pdf/route.ts`](app/api/admin/letters/export-pdf/route.ts):

- Batch PDF generation (one PDF per letter, or combined document)
- Professional letter template with Appello branding
- Include merge fields (recipient name, address)

### 4.2 HubSpot Tracking

Add HubSpot properties (if not exist):

- `magazine_campaign`: Campaign name
- `magazine_sent_date`: Date magazine shipped
- `magazine_response_date`: When response received
- `magazine_response_type`: Type of response

### 4.3 Response Tracking UI

On campaign dashboard:

- Mark individual recipients as responded
- Quick log: "Demo Booked", "Called Back", "Email Reply", "No Response (30 days)"
- Auto-sync response to HubSpot deal

---

## Data Sources for Personalization

| Source | Data | How Used |

|--------|------|----------|

| **HubSpot Company** | Industry, size, location, website | Basic targeting context |

| **HubSpot Contacts** | Decision maker names, titles | Personal salutation |

| **HubSpot Deals** | Prior history, deal stage | Reference past engagement |

| **ATLAS** | Similar customers, case studies | Social proof, relevant examples |

| **Fathom** | Meeting transcripts (if any) | Reference past conversations |

| **Firecrawl** | Company website, recent news | Current projects, pain points |

---

## Files to Create

| File | Purpose |

|------|---------|

| `models/Campaign.ts` | Campaign data model |

| `app/admin/campaigns/magazine/page.tsx` | Campaign dashboard |

| `app/admin/campaigns/magazine/import/page.tsx` | CSV import wizard |

| `app/admin/campaigns/magazine/review/[targetId]/page.tsx` | Letter review UI |

| `app/api/admin/campaigns/route.ts` | CRUD for campaigns |

| `app/api/admin/campaigns/[campaignId]/import/route.ts` | CSV import endpoint |

| `app/api/admin/campaigns/[campaignId]/generate/route.ts` | Batch generation |

| `app/api/admin/campaigns/[campaignId]/export/route.ts` | PDF export |

| `lib/hubspot/campaignImport.ts` | HubSpot sync logic |

| `lib/ai/letterEnricher.ts` | Multi-source personalization |

---

## Files to Modify

| File | Change |

|------|--------|

| `app/api/admin/hubspot/generate-letter/route.ts` | Add Fathom + Firecrawl research |

| `components/admin/AdminLayout.tsx` | Add Campaigns nav item |

| `models/GeneratedLetter.ts` | Add campaign reference field |

---

## Implementation Order

1. **Campaign model + basic API** - Store campaign data
2. **CSV import wizard** - Get targets into system
3. **Enhanced letter generation** - Add all data sources
4. **Batch generation queue** - Process 250 letters
5. **Review dashboard** - Approve/reject workflow
6. **PDF export** - Print-ready letters
7. **Response tracking** - Measure success

---

## Existing Tools to Keep (No Changes)

- Estimate Builder - Working, needed now
- CRM Dashboard - Data source for letters
- Letter Settings - AI model configuration
- Individual Letter Generator - Still useful for one-offs

### To-dos

- [ ] Create structured Appello knowledge layer with modules, ICP profiles, and pricing rules
- [ ] Add AI-powered module recommendations and narrative generation to estimates
- [ ] Enhance Deal Intelligence Agent with proactive coaching and similar deal matching
- [ ] Build embedded conversational AI assistant component with tool calling
- [ ] Create automated sequences for post-demo, stale deals, and assessment-to-estimate