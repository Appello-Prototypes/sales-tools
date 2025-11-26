# Assessment Flow Analysis - Step by Step

## Current System Architecture

### 1. Assessment Submission Flow

**Endpoint:** `POST /api/assessments/[submissionId]/submit`

**Step-by-Step Process:**

1. **Receive Submission**
   - Accepts assessment data (all 5 sections + name/email)
   - Finds existing assessment by `submissionId`

2. **Update Assessment Data**
   - Merges submitted data with existing assessment
   - Updates contact info (name, email)
   - Updates all sections (section1-5)

3. **Calculate Completion Metrics**
   - Sets `completedAt` timestamp
   - Calculates `timeToComplete` (seconds)
   - Sets `status = 'completed'`
   - Sets `currentStep = 5`

4. **Calculate Opportunity Score** ⚠️ **CURRENTLY ONLY THIS**
   - Calls `calculateOpportunityScore(data)`
   - Stores: `opportunityScore`, `opportunityGrade`, `opportunityPriority`
   - **Does NOT generate reports yet**

5. **Return Response**
   - Returns success with score
   - Provides report URL (but report not generated yet)

---

### 2. Report Generation Flow (Currently Lazy-Loaded)

**Endpoint:** `GET /api/assessments/[submissionId]/report`

**Step-by-Step Process:**

1. **Fetch Assessment**
   - Loads assessment from database
   - Validates `status === 'completed'`

2. **Calculate ROI**
   - Calls `calculateROI(data)`
   - Calculates:
     - Time costs (hours/week × hourly rate)
     - Money costs (profit margin loss, change orders, compliance)
     - Appello investment (software + onboarding + training)
     - Annual savings
     - ROI percentage
     - Payback months

3. **Generate Base Report**
   - Calls `generateCustomerReport(data, roi, score)`
   - Creates structured report with:
     - Company info
     - Pain summary
     - Cost analysis
     - Appello solutions
     - ROI metrics
     - Vision (before/after)
     - Next steps

4. **AI Enhancement** (Creates Audit Trail)
   - Calls `enhanceReportWithAI(baseReport, data)`
   - Creates audit trail
   - Performs:
     - **ATLAS Query**: Find similar customers
     - **Claude Query 1**: Generate industry benchmarks
     - **Claude Query 2**: Generate peer comparison
     - **Claude Query 3**: Generate success stories
     - **Claude Query 4**: Generate personalized insights
     - **Claude Query 5**: Generate next steps
   - Saves audit trail to database

5. **Return Enhanced Report**
   - Returns report + ROI + score + audit trail

---

## Scoring Algorithm Analysis

### Opportunity Scoring (`lib/scoring/opportunityScorer.ts`)

**Total Score: 0-100 points**

| Factor | Weight | Calculation Method |
|--------|--------|-------------------|
| **Urgency** | 20 pts | Based on urgency slider (1-10):<br>- 9-10: 20 pts<br>- 7-8: 15-19 pts<br>- 4-6: 6-12 pts<br>- 1-3: 0-6 pts |
| **Pain Severity** | 20 pts | Number of pain points (1.5 pts each, max 10) +<br>Hours/week multiplier (2-10 pts) |
| **Company Size** | 15 pts | Field workers:<br>- 250+: 15 pts<br>- 100-249: 13 pts<br>- 50-99: 11 pts<br>- 20-49: 9 pts<br>- 1-19: 6 pts |
| **Timeline** | 15 pts | Decision timeline:<br>- Within 1 month: 15 pts<br>- 1-3 months: 12 pts<br>- 3-6 months: 8 pts<br>- 6+ months: 4 pts<br>- Researching: 2 pts |
| **Likelihood** | 15 pts | Likelihood to implement (1-10):<br>- 9-10: 15 pts<br>- 7-8: 10-15 pts<br>- 4-6: 6-9 pts<br>- 1-3: 0-6 pts |
| **Current State** | 10 pts | Manual systems indicator:<br>- Paper/Excel timesheets: +5 pts<br>- No construction software: +2-3 pts<br>- Missing capabilities: +0.5 pts each (max 2) |
| **Budget Indicators** | 5 pts | Evaluating competitors: +3 pts<br>Next steps (pricing/integration): +1-2 pts |

**Grade Mapping:**
- A+: 90-100%
- A: 85-89%
- B+: 75-84%
- B: 65-74%
- C+: 55-64%
- C: 45-54%
- D: <45%

**Priority Mapping:**
- High: ≥75 points
- Medium: 55-74 points
- Low: <55 points

---

## ROI Calculation Analysis

### ROI Calculator (`lib/roi/roiCalculator.ts`)

**Key Variables:**

1. **Revenue Estimation**
   - Formula: `fieldWorkers × $120,000`
   - Industry average: $100K-150K per field worker

2. **Time Costs**
   - Hours/week from assessment
   - Hourly rate: $35/hr (admin rate)
   - Annual: `hoursPerWeek × 52 × $35`

3. **Money Costs**
   - **Profit Margin Loss**: Based on pain points + urgency (0-8% of revenue)
   - **Change Order Loss**: 8% of revenue (if change order pain point)
   - **Compliance Costs**: $15K (if safety/compliance pain point)

4. **Appello Investment**
   - Software: `(fieldWorkers + 3) × $10/month × 12` (min 10 users)
   - Onboarding: $6,000 (one-time)
   - Training: 20 hours × $35/hr = $700

5. **Savings Calculations**
   - **Time Savings**: 75% reduction in time costs
   - **Profit Improvement**: Recover 60% of margin loss (max 8%)
   - **Change Order Capture**: Capture 80% of lost change orders
   - **Compliance Savings**: 70% reduction

6. **ROI Metrics**
   - Net Annual Value: `totalSavings - softwareCost`
   - ROI %: `((netValue - oneTimeCosts) / totalInvestment) × 100`
   - Payback: `totalInvestment / (totalSavings / 12)` months

---

## AI Enhancement Flow

### AI Report Generator (`lib/ai/reportGenerator.ts`)

**Process:**

1. **Find Similar Customers** (ATLAS)
   - Query: `Find customers similar to: trade=X, fieldWorkers=Y, painPoints=Z`
   - Returns: Array of similar customer profiles

2. **Generate Industry Benchmarks** (Claude)
   - Prompt: Company profile + similar customers data
   - Output: Field workers percentile, typical ROI, average savings

3. **Generate Peer Comparison** (Claude)
   - Prompt: Company profile + similar customers
   - Output: Similar companies count, average ROI, common outcomes

4. **Generate Success Stories** (Claude)
   - Prompt: Company profile + similar customers
   - Output: 2-3 relevant success stories

5. **Generate Personalized Insights** (Claude)
   - Prompt: Full assessment summary
   - Output: 3-5 actionable insights

6. **Generate Next Steps** (Claude)
   - Prompt: Timeline, demo focus, urgency
   - Output: Immediate actions, demo focus, timeline guidance

**All actions tracked in audit trail with:**
- Timestamps
- Prompts/queries
- Responses
- Token usage
- Sources
- Duration

---

## External Connections

### 1. Anthropic Claude API
- **Model**: `claude-sonnet-4-5-20250929`
- **Mode**: Extended thinking (16K tokens)
- **Temperature**: 1 (when thinking enabled)
- **Usage**: All AI report generation

### 2. ATLAS Database (via MCP)
- **Endpoint**: `ATLAS_MCP_ENDPOINT` env variable
- **Usage**: Finding similar customers, industry data
- **Method**: HTTP POST to SSE endpoint

### 3. Firecrawl API
- **Usage**: Web scraping, search (currently not actively used in report generation)
- **API Key**: `FIRECRAWL_API_KEY` env variable

### 4. MongoDB Database
- **Model**: `Assessment` schema
- **Stores**: All assessment data, scores, audit trails

---

## Current Issues

1. **Reports Generated Lazily**: Only when customer views report page
2. **No Admin Analytics**: No visibility into scoring logic, variables, or configuration
3. **No Debug Logging**: Limited visibility into what's happening
4. **No Configuration**: Scoring weights are hardcoded
5. **No Prompt Injection**: Can't add custom prompts to AI analysis

---

## Proposed Improvements

1. **Generate Reports on Submission**: Move report generation to submit route
2. **Admin Analytics Dashboard**: Show all variables, scoring breakdown, debug logs
3. **Configurable Scoring**: Allow admin to adjust weights
4. **Prompt Injection**: Add custom prompts to AI analysis
5. **System Status**: Show all connected services and their status

