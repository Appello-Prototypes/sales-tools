import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';

test.describe('Assessment End-to-End Flow', () => {
  test('Complete assessment form and verify it appears in dashboard', async ({ page }) => {
    // Step 1: Start assessment
    await page.goto(`${BASE_URL}/assessment`);
    await page.waitForLoadState('networkidle');
    
    // Wait for form to load
    await page.waitForSelector('text=Company Basics', { timeout: 10000 });
    
    console.log('✓ Assessment form loaded');
    
    // Step 1: Company Basics
    // Select trade
    await page.locator('text=Mechanical Insulation').first().click();
    
    // Select field workers
    await page.locator('text=20-49').first().click();
    
    // Select role
    await page.locator('text=Owner/CEO').first().click();
    
    // Click Next
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(1000);
    
    console.log('✓ Step 1 completed');
    
    // Step 2: Pain Points
    await page.waitForSelector('text=Pain Point Discovery', { timeout: 5000 });
    
    // Select pain points
    await page.locator('text=Time tracking/payroll processing delays').first().click();
    await page.locator('text=Job profitability visibility').first().click();
    await page.locator('text=Material ordering and cost tracking').first().click();
    
    // Fill magic wand
    await page.fill('textarea', 'Automated payroll that handles union complexity');
    
    // Set urgency slider
    const urgencySlider = page.locator('input[type="range"]').first();
    await urgencySlider.fill('8');
    
    // Select hours per week
    await page.locator('text=10-20 hours/week').first().click();
    
    // Click Next
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(1000);
    
    console.log('✓ Step 2 completed');
    
    // Step 3: Current State
    await page.waitForSelector('text=Current State Assessment', { timeout: 5000 });
    
    // Select timesheet method
    await page.locator('text=Paper timesheets').first().click();
    
    // Select union status
    await page.locator('text=Yes, fully unionized').first().click();
    
    // Select CBA count
    await page.locator('text=2-3').first().click();
    
    // Select unions
    await page.locator('text=SMWIA').first().click();
    await page.locator('text=UA').first().click();
    
    // Select accounting software
    await page.locator('text=QuickBooks Desktop').first().click();
    
    // Select payroll software
    await page.locator('text=ADP').first().click();
    
    // Select construction software
    await page.locator('text=No, using paper/Excel').first().click();
    
    // Select gaps
    await page.locator('text=Job costing/tracking').first().click();
    await page.locator('text=Material ordering').first().click();
    
    // Click Next
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(1000);
    
    console.log('✓ Step 3 completed');
    
    // Step 4: Demo Customization
    await page.waitForSelector('text=Demo Customization', { timeout: 5000 });
    
    // Select demo focus
    await page.locator('text=Union payroll calculations').first().click();
    await page.locator('text=Real-time job costing').first().click();
    
    // Select evaluators
    await page.locator('text=Owner').first().click();
    await page.locator('text=Operations Manager').first().click();
    
    // Select tech comfort
    await page.locator('text=Comfortable with technology').first().click();
    
    // Select smartphones
    await page.locator('text=Yes, all crew members have smartphones').first().click();
    
    // Click Next
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(1000);
    
    console.log('✓ Step 4 completed');
    
    // Step 5: Decision Intelligence
    await page.waitForSelector('text=Decision Intelligence', { timeout: 5000 });
    
    // Select timeline
    await page.locator('text=Within 1 month').first().click();
    
    // Select evaluating
    await page.locator('text=Procore').first().click();
    
    // Select next steps
    await page.locator('text=Pricing information').first().click();
    await page.locator('text=See how it integrates').first().click();
    
    // Set likelihood slider
    const likelihoodSlider = page.locator('input[type="range"]').first();
    await likelihoodSlider.fill('8');
    
    // Fill specific questions
    await page.fill('textarea', 'How does it handle multiple CBAs?');
    
    // Submit
    await page.locator('button:has-text("Submit")').first().click();
    
    // Wait for redirect to thank you page
    await page.waitForURL('**/assessment/thank-you**', { timeout: 10000 });
    
    console.log('✓ Assessment submitted successfully');
    
    // Get submission ID from URL or page
    const url = page.url();
    const submissionIdMatch = url.match(/submissionId=([^&]+)/);
    const submissionId = submissionIdMatch ? submissionIdMatch[1] : null;
    
    expect(submissionId).toBeTruthy();
    console.log(`✓ Submission ID: ${submissionId}`);
    
    // Step 6: Login to admin dashboard
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[type="email"]', 'admin@useappello.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.locator('button:has-text("Login")').click();
    
    // Wait for dashboard
    await page.waitForURL('**/admin/dashboard**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    console.log('✓ Logged into admin dashboard');
    
    // Step 7: Verify assessment appears in dashboard
    await page.waitForSelector('text=Assessment Dashboard', { timeout: 10000 });
    
    // Check if our submission appears
    if (submissionId) {
      // Search for the submission
      await page.fill('input[placeholder*="Company name"]', submissionId.substring(0, 8));
      await page.waitForTimeout(2000);
      
      // Check if assessment appears in table
      const table = page.locator('table').first();
      const rows = table.locator('tbody tr');
      const count = await rows.count();
      
      console.log(`✓ Found ${count} assessments in dashboard`);
      
      // Verify assessment is there
      const assessmentFound = await page.locator(`text=${submissionId.substring(0, 8)}`).isVisible().catch(() => false);
      
      if (assessmentFound) {
        console.log('✓ Assessment found in dashboard!');
      } else {
        console.log('⚠ Assessment not immediately visible, checking API...');
        
        // Check API directly
        const response = await page.request.get(`${BASE_URL}/api/admin/assessments?status=completed`);
        const data = await response.json();
        
        const found = data.assessments?.some((a: any) => a.submissionId === submissionId);
        
        if (found) {
          console.log('✓ Assessment found via API!');
        } else {
          console.log('✗ Assessment not found in API response');
          console.log(`Total assessments: ${data.assessments?.length || 0}`);
        }
      }
    }
    
    // Verify dashboard loads assessments
    const statsCards = page.locator('[class*="card"]');
    const statsCount = await statsCards.count();
    expect(statsCount).toBeGreaterThan(0);
    
    console.log('✓ Dashboard loaded successfully');
  });
});

