# Testing Guide - Comprehensive AI Research & Dual Reports

## Quick Test Steps

### Option 1: Use Admin Dashboard Test Button (Easiest)

1. **Start your development server:**
   ```bash
   cd appello-assessment
   npm run dev
   ```

2. **Log into Admin Dashboard:**
   - Navigate to `http://localhost:3000/admin/login`
   - Log in with admin credentials

3. **Create a Test Assessment:**
   - In the admin dashboard, find the "Testing Tools" card
   - Click "Create Test Assessment" button
   - Wait for the success message (this may take 30-60 seconds as it conducts research)

4. **Verify Reports Were Generated:**
   - Look for the new assessment in the table
   - Check for these icons in the "Action" column:
     - 👁️ Eye icon = View assessment details
     - 💼 Briefcase icon = View sales intelligence report (NEW!)
     - 📄 File icon = View AI audit trail

5. **View the Sales Intelligence Report:**
   - Click the 💼 briefcase icon next to the test assessment
   - You should see a comprehensive sales intelligence report with:
     - Company intelligence
     - Competitor research
     - Tools analysis
     - Sales recommendations
     - ATLAS intelligence

6. **View the Customer Report:**
   - Click the 👁️ eye icon
   - Scroll down and click "View Customer Report"
   - This shows what the customer sees

### Option 2: Submit a Real Assessment

1. **Fill out the assessment form:**
   - Navigate to `http://localhost:3000/assessment`
   - Complete all 5 steps
   - **Important:** Make sure to provide:
     - Company name (for research)
     - Email (for location hints)
     - All sections filled out

2. **Submit the assessment:**
   - Click "Submit" on the final step
   - Wait for processing (30-60 seconds)

3. **Check Admin Dashboard:**
   - Log into admin dashboard
   - Find your submitted assessment
   - Verify both reports were generated

## What to Check

### ✅ Success Indicators

1. **In Admin Dashboard:**
   - Assessment appears with status "Completed"
   - Briefcase icon appears in Action column (indicates admin report generated)
   - File icon appears (indicates audit trail generated)

2. **Sales Intelligence Report Should Include:**
   - ✅ Company Information (description, location, size)
   - ✅ Website Analysis (technologies detected, value propositions)
   - ✅ Tools & Software Stack (mentioned tools, likely using)
   - ✅ Competitor Research (competitors found)
   - ✅ Sales Recommendations (next steps, talking points, objections)
   - ✅ ATLAS Intelligence (similar customers, case studies)
   - ✅ Industry Context (trends, challenges, opportunities)

3. **Customer Report Should Include:**
   - ✅ Personalized ROI analysis
   - ✅ Industry benchmarks
   - ✅ Peer comparison
   - ✅ Success stories
   - ✅ Personalized insights
   - ✅ Next steps

4. **Debug Logs Should Show:**
   - Company web research
   - Website analysis
   - Competitor research
   - Industry research
   - Tools research
   - ATLAS queries
   - Sales intelligence generation

### 🔍 Debugging

**Check Server Logs:**
Look for these log messages in your terminal:
```
✅ Company research completed
✅ Customer report AI enhancement completed
✅ Admin report generated
✅ All reports and audit trail saved to database
```

**Check Browser Console:**
Open browser DevTools (F12) and check for:
- Any API errors
- Network requests to `/api/assessments/[submissionId]/submit`
- Response should include `reportGenerated: true` and `auditTrailGenerated: true`

**If Reports Don't Generate:**

1. **Check API Keys:**
   - Verify `ANTHROPIC_API_KEY` is set in `.env.local`
   - Verify `FIRECRAWL_API_KEY` is set
   - Verify `ATLAS_MCP_ENDPOINT` is set

2. **Check Server Logs:**
   - Look for error messages
   - Check if research steps are failing

3. **Check Database:**
   - Verify `adminReport` field exists in Assessment document
   - Check `auditTrail` field for research entries

## Testing Different Scenarios

### Test 1: Company with Website
- Use a real company name (e.g., "ABC Mechanical")
- Should trigger website scraping and analysis
- Should find competitors

### Test 2: Company without Website
- Use a generic name (e.g., "Test Company")
- Should still conduct industry and ATLAS research
- Should generate sales recommendations based on assessment

### Test 3: Different Trades
- Test with different trades (HVAC, Plumbing, etc.)
- Should find trade-specific competitors
- Should get trade-specific industry insights

### Test 4: Different Company Sizes
- Test with different field worker ranges
- Should adjust ROI calculations
- Should find size-appropriate similar customers

## Expected Processing Time

- **Simple assessment:** 20-30 seconds
- **With website research:** 40-60 seconds
- **With competitor research:** 50-70 seconds
- **Full research:** 60-90 seconds

The system processes asynchronously, so the assessment is saved immediately, but reports may take a moment to generate.

## Troubleshooting

### Issue: Reports not generating
**Solution:** Check server logs for errors. Common issues:
- Missing API keys
- API rate limits
- Network connectivity issues

### Issue: Research incomplete
**Solution:** Check audit trail to see which research steps succeeded/failed. Some steps may fail gracefully and continue.

### Issue: Admin report missing
**Solution:** 
- Check if `adminReport` field exists in database
- Verify research completed successfully
- Check server logs for errors during report generation

## Next Steps After Testing

Once you verify everything works:

1. **Review the Sales Intelligence Report:**
   - Check if competitor research is accurate
   - Verify tools analysis makes sense
   - Review sales recommendations

2. **Review the Customer Report:**
   - Ensure it's customer-friendly
   - Check ROI calculations
   - Verify personalization

3. **Optimize Research:**
   - Adjust research queries in `lib/ai/researchService.ts`
   - Fine-tune sales intelligence prompts
   - Add more research sources if needed

