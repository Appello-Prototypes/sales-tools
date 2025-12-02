# Letter Types Implementation Summary

## Quick Reference: Letter Types by Use Case

### When You Have NO Relationship
- **Cold Call / Initial Introduction** - First contact, no prior interaction

### When You Have a Relationship But NO Active Deal
- **Re-Engagement / Win-Back** - Previous contact, deal closed/lost, or no deal
- **Nurture / Stay-in-Touch** - Ongoing relationship, not ready to buy

### When You Have an ACTIVE Deal
- **Deal Advancement / Unstuck** - Deal stalled, needs momentum
- **Proposal Follow-Up** - After sending proposal/quote
- **Competitive Displacement** - Competitor involved, need to win

### When You Have a CUSTOMER
- **Onboarding Check-In** - New customer, implementation phase
- **Expansion / Upsell** - Existing customer, growth opportunity

### Campaign & Event Types
- **Event Follow-Up** - After trade shows, webinars
- **Campaign Integration** - With marketing collateral

---

## Data Source Priority (Always Check in This Order)

1. **HubSpot First** ⭐
   - Contacts, deals, meetings, emails, notes
   - Relationship history and context
   - Engagement metrics

2. **ATLAS Second**
   - Similar customers and case studies
   - Success stories and ROI examples
   - Social proof and validation

3. **Internet Research Third**
   - Recent company news
   - Industry trends
   - Competitive intelligence

---

## Key Letter Types for Your Use Case

Based on your requirements (letters to people you know but haven't closed yet), prioritize these:

### 1. **Re-Engagement / Win-Back** (HIGHEST PRIORITY)
**Why:** You mentioned sending letters to people you already know but haven't closed. This is the perfect use case.

**HubSpot Data Needed:**
- Past emails and responses
- Meeting notes and outcomes
- Deal history (why deals closed/lost)
- Last contact date
- Objections or concerns

**ATLAS Queries:**
- Case studies addressing past objections
- Success stories for companies that re-engaged
- ROI examples relevant to their situation

**Internet Research:**
- Company changes since last contact
- Industry trends affecting their business
- New projects or growth

---

### 2. **Deal Advancement / Unstuck** (HIGH PRIORITY)
**Why:** For active deals that aren't moving forward.

**HubSpot Data Needed:**
- Current deal stage
- Deal notes with blockers
- Recent activities
- Decision-maker information
- Timeline and urgency

**ATLAS Queries:**
- Case studies addressing specific blockers
- Success stories at similar deal stages
- ROI calculations for their deal size

**Internet Research:**
- Company business developments
- Industry changes affecting timing
- Competitive intelligence

---

### 3. **Nurture / Stay-in-Touch** (MEDIUM PRIORITY)
**Why:** Maintain relationships with companies not ready to buy.

**HubSpot Data Needed:**
- Engagement history
- Interests mentioned
- Timing concerns
- Contact preferences

**ATLAS Queries:**
- New case studies since last contact
- Updated ROI data
- New features relevant to them

**Internet Research:**
- Company updates
- Industry trends
- Regulatory changes

---

## Recommended Letter Type Model Enhancement

Extend the `LetterType` model to include query configurations:

```typescript
interface ILetterTypeEnhanced extends ILetterType {
  // Query Configuration
  atlasQueries: string[]; // Template strings: "Find customers similar to {{companyName}}"
  internetQueries: string[]; // Template strings: "Recent news about {{companyName}}"
  
  // HubSpot Data Requirements
  hubspotDataRequirements: {
    required: ('contacts' | 'deals' | 'activities' | 'notes' | 'engagements')[];
    optional: ('contacts' | 'deals' | 'activities' | 'notes' | 'engagements')[];
  };
  
  // Conditions for Use
  conditions: {
    requiresHubSpotData: boolean;
    requiresActiveDeal: boolean;
    requiresPastInteraction: boolean;
    minDaysSinceLastContact?: number; // For re-engagement
  };
  
  // Personalization Instructions
  personalizationGuidance: string; // How to use the data sources
}
```

---

## Implementation Example: Re-Engagement Letter Type

```typescript
{
  name: "Re-Engagement / Win-Back",
  description: "Reconnect with companies that previously engaged but haven't moved forward",
  
  systemPrompt: `You are writing a re-engagement letter for Appello Inc. This company has previous interactions with Appello but hasn't moved forward. Your letter should:
- Reference specific past conversations or meetings
- Address previous objections or concerns mentioned in HubSpot notes
- Highlight what's changed since last contact
- Provide new relevant information (case studies, ROI data)
- Maintain a warm, relationship-focused tone
- Avoid being pushy - focus on value and partnership`,
  
  userPromptTemplate: `Company: {{companyName}}
Industry: {{industry}}
Location: {{location}}

{{#if hubspotData}}
Previous Relationship Context:
- Last Contact: {{hubspotData.lastContactDate}}
- Past Meetings: {{hubspotData.meetings}}
- Previous Deals: {{hubspotData.dealHistory}}
- Objections/Concerns: {{hubspotData.objections}}
- Interests Mentioned: {{hubspotData.interests}}
{{/if}}

{{#if atlasResults}}
ATLAS Case Studies & Similar Customers:
{{atlasResults}}
{{/if}}

{{#if internetResearch}}
Recent Company & Industry Updates:
{{internetResearch}}
{{/if}}

Write a personalized re-engagement letter that acknowledges the past relationship and provides new value.`,
  
  atlasQueries: [
    "Case studies for companies that re-engaged after initial evaluation",
    "Success stories for {{trade}} contractors who overcame {{objection}}",
    "Similar customers who initially hesitated but later adopted Appello",
    "ROI examples for companies like {{companyName}}"
  ],
  
  internetQueries: [
    "{{companyName}} recent business changes or growth",
    "{{companyName}} new projects or contracts",
    "{{industry}} challenges that may have changed since last contact"
  ],
  
  hubspotDataRequirements: {
    required: ['contacts', 'activities', 'notes'],
    optional: ['deals', 'engagements']
  },
  
  conditions: {
    requiresHubSpotData: true,
    requiresActiveDeal: false,
    requiresPastInteraction: true,
    minDaysSinceLastContact: 30
  },
  
  personalizationGuidance: "Prioritize HubSpot relationship data (past conversations, objections) over generic company information. Use ATLAS for social proof addressing specific concerns. Use internet research to show awareness of recent company changes."
}
```

---

## Smart Letter Type Selection Logic

When a user selects a company, automatically suggest the best letter type:

```typescript
function suggestLetterType(companyId: string, hubspotData: HubSpotData): LetterType {
  // No relationship at all
  if (!hubspotData.contacts.length && !hubspotData.deals.length) {
    return 'Cold Call';
  }
  
  // Has relationship but no active deal
  if (hubspotData.activeDeals.length === 0) {
    const daysSinceLastContact = getDaysSince(hubspotData.lastContactDate);
    
    if (daysSinceLastContact > 30) {
      return 'Re-Engagement';
    } else {
      return 'Nurture';
    }
  }
  
  // Has active deal
  const activeDeal = hubspotData.activeDeals[0];
  const daysSinceUpdate = getDaysSince(activeDeal.lastUpdated);
  
  if (daysSinceUpdate > 14) {
    return 'Deal Advancement';
  }
  
  if (activeDeal.stage === 'proposal' || activeDeal.stage === 'negotiation') {
    return 'Proposal Follow-Up';
  }
  
  // Check for competitor mentions
  if (hubspotData.notes.some(note => note.includes('competitor'))) {
    return 'Competitive Displacement';
  }
  
  return 'Nurture'; // Default
}
```

---

## Next Steps for Implementation

1. **Extend LetterType Model** - Add query configuration fields
2. **Create Query Builder Service** - Generate queries from templates
3. **Enhance HubSpot Data Gathering** - Comprehensive relationship data
4. **Build Smart Type Selector** - Auto-suggest based on HubSpot data
5. **Update Letter Generation** - Use new query system
6. **Add Letter Type Admin UI** - Manage types and queries

---

## Key Takeaways

1. **HubSpot is King** - Always check HubSpot first for relationship context
2. **Context Matters** - Same company needs different letters at different times
3. **Query Templates** - Make queries dynamic and reusable
4. **Personalization Hierarchy** - Relationship data > Social proof > General research
5. **Flexibility** - System should adapt to different sales situations


