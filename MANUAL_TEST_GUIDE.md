# Manual End-to-End Test Guide
**Testing Assessment Flow with Browser**

## Prerequisites
1. App running on `http://localhost:3002`
2. MongoDB running and connected
3. Admin user created (`admin@useappello.com` / `admin123`)

## Test Steps

### Part 1: Complete Assessment Form

1. **Navigate to Assessment Form**
   - Go to: `http://localhost:3002/assessment`
   - Should see "Company Basics" step

2. **Step 1: Company Basics**
   - Select Trade: "Mechanical Insulation"
   - Select Field Workers: "20-49"
   - Select Role: "Owner/CEO"
   - Click "Next"
   - ✅ Should advance to Step 2

3. **Step 2: Pain Point Discovery**
   - Select Pain Points (check multiple):
     - "Time tracking/payroll processing delays"
     - "Job profitability visibility (finding out too late)"
     - "Material ordering and cost tracking"
   - Magic Wand: Type "Automated union payroll that handles all our CBAs"
   - Urgency Slider: Set to 8
   - Hours Per Week: Select "10-20 hours/week"
   - Click "Next"
   - ✅ Should advance to Step 3

4. **Step 3: Current State Assessment**
   - Timesheet Method: Select "Paper timesheets"
   - Union Status: Select "Yes, fully unionized"
   - CBA Count: Select "2-3"
   - Unions: Check "SMWIA" and "UA"
   - Accounting Software: Select "QuickBooks Desktop"
   - Payroll Software: Select "ADP"
   - Construction Software: Select "No, using paper/Excel"
   - Not Doing (check multiple):
     - "Job costing/tracking (real-time visibility)"
     - "Material ordering and procurement (formal process)"
   - Click "Next"
   - ✅ Should advance to Step 4

5. **Step 4: Demo Customization**
   - Demo Focus (check multiple):
     - "Union payroll calculations"
     - "Real-time job costing"
   - Evaluating Stakeholders: Check "Owner" and "Operations Manager"
   - Tech Comfort: Select "Comfortable with technology"
   - Smartphones: Select "Yes, all crew members have smartphones"
   - Click "Next"
   - ✅ Should advance to Step 5

6. **Step 5: Decision Intelligence**
   - Timeline: Select "Within 1 month"
   - Evaluating Alternatives: Check "Procore"
   - Next Steps (check multiple):
     - "Pricing information"
     - "See how it integrates with our accounting software"
   - Likelihood Slider: Set to 8
   - Specific Questions: Type "How does it handle multiple CBAs?"
   - Click "Submit Assessment"
   - ✅ Should redirect to Thank You page
   - ✅ Should see "View Your Report" button

### Part 2: Verify Submission

7. **Check Thank You Page**
   - URL should contain `submissionId=...`
   - Copy the submission ID from URL
   - Click "View Your Report"
   - ✅ Should see customer-facing report with:
     - Pain point analysis
     - Cost calculations
     - ROI breakdown
     - Appello solutions
     - Vision section

### Part 3: Verify in Admin Dashboard

8. **Login to Admin Dashboard**
   - Go to: `http://localhost:3002/admin/login`
   - Email: `admin@useappello.com`
   - Password: `admin123`
   - Click "Login"
   - ✅ Should redirect to dashboard

9. **Check Dashboard**
   - ✅ Should see stats cards (Total, Completed, In Progress, High Priority)
   - ✅ Should see assessment table
   - ✅ Should see your new submission in the table
   - Look for your submission ID or check most recent entry

10. **Filter and Search**
    - Use Status filter: Select "Completed"
    - ✅ Should show only completed assessments
    - Use Priority filter: Select "High"
    - ✅ Should show only high priority assessments
    - Use Search: Type part of submission ID
    - ✅ Should filter to matching assessments

11. **View Assessment Details**
    - Click "View" button on your assessment
    - ✅ Should see detailed view with:
      - Opportunity Score (should be 75+ for this scenario)
      - Grade (should be B+ or higher)
      - Priority (should be High)
      - ROI breakdown
      - Feature Analysis Report
      - Complete answers in tabs
      - Demo recommendations

### Part 4: Verify Feature Analysis

12. **Check Feature Analysis**
    - In assessment detail page, scroll to "Appello Features Analysis"
    - ✅ Should see:
      - Recommended Modules (should include "Workforce Admin", "Financials", "Material Management")
      - Top Features with relevance levels
      - Key Differentiators (should mention "Union Payroll Mastery")
      - Demo Focus recommendations

### Expected Results

**For this test scenario:**
- **Score:** 75-85/100 (High Priority)
- **Grade:** B+ or A
- **Priority:** High
- **Top Modules:** Workforce Admin, Financials, Material Management
- **Key Differentiator:** Union Payroll Mastery
- **ROI:** $50K-$150K annual savings estimated

## Troubleshooting

### Assessment Not Appearing in Dashboard

1. **Check Browser Console**
   - Open DevTools (F12)
   - Check for errors in Console tab
   - Check Network tab for failed API calls

2. **Check Server Logs**
   - Look for errors in terminal where `npm run dev` is running
   - Check for MongoDB connection errors

3. **Verify Submission**
   - Check MongoDB directly:
   ```bash
   mongosh appello-assessment --eval "db.assessments.find({status: 'completed'}).sort({createdAt: -1}).limit(1)"
   ```

4. **Check API Response**
   - After submission, check Network tab
   - Look for `/api/assessments/[submissionId]/submit` request
   - Verify response is 200 OK
   - Check response body for `success: true`

5. **Verify Dashboard Query**
   - Check Network tab when loading dashboard
   - Look for `/api/admin/assessments` request
   - Verify it returns assessments array
   - Check if status filter is working

### Common Issues

**Issue:** Assessment shows as "in_progress" instead of "completed"
- **Fix:** Check if submit endpoint is being called correctly
- **Fix:** Verify all section data is being sent

**Issue:** Score not calculated
- **Fix:** Check if scoring function is running
- **Fix:** Verify all required fields are present

**Issue:** Dashboard shows 0 assessments
- **Fix:** Check authentication (admin login)
- **Fix:** Verify MongoDB query is correct
- **Fix:** Check if status filter is too restrictive

## Test Checklist

- [ ] Assessment form loads
- [ ] Can navigate through all 5 steps
- [ ] Data saves on each step
- [ ] Submit button works
- [ ] Redirects to thank you page
- [ ] Report page loads
- [ ] Can login to admin dashboard
- [ ] Assessment appears in dashboard
- [ ] Filters work correctly
- [ ] Search works correctly
- [ ] Assessment detail page loads
- [ ] Score is calculated correctly
- [ ] Feature analysis is generated
- [ ] ROI calculations are shown
- [ ] All answers are visible in tabs

