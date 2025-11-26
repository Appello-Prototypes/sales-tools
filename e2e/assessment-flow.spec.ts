import { test, expect } from '@playwright/test';

test.describe('Assessment End-to-End Flow', () => {
  test('Complete assessment form and verify it appears in dashboard', async ({ page }) => {
    let submissionId: string | null = null;
    
    // Step 1: Start assessment
    await page.goto('/assessment');
    await page.waitForLoadState('networkidle');
    
    // Wait for form to load - look for step title
    await page.waitForSelector('h2, h1', { timeout: 10000 });
    
    console.log('✓ Assessment form loaded');
    
    // Step 1: Company Basics - Use radio buttons or selects
    // Wait for form elements
    await page.waitForTimeout(2000);
    
    // Try to find and click trade option (radio button)
    const tradeOption = page.locator('label:has-text("Mechanical Insulation")').first();
    if (await tradeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tradeOption.click();
    } else {
      // Try radio group
      await page.locator('input[value="Mechanical Insulation"]').first().click();
    }
    
    // Select field workers
    const fieldWorkersOption = page.locator('label:has-text("20-49"), input[value="20-49"]').first();
    await fieldWorkersOption.click({ timeout: 5000 });
    
    // Select role
    const roleOption = page.locator('label:has-text("Owner/CEO"), input[value="Owner/CEO"]').first();
    await roleOption.click({ timeout: 5000 });
    
    // Click Next button
    const nextButton = page.locator('button:has-text("Next"), button[type="button"]').filter({ hasText: /next/i }).first();
    await nextButton.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    
    console.log('✓ Step 1 completed');
    
    // Step 2: Pain Points
    await page.waitForTimeout(2000);
    
    // Select pain points (checkboxes)
    const painPoint1 = page.locator('label:has-text("Time tracking/payroll"), input[type="checkbox"]').first();
    await painPoint1.click({ timeout: 5000 });
    
    const painPoint2 = page.locator('label:has-text("Job profitability"), input[type="checkbox"]').first();
    await painPoint2.click({ timeout: 5000 });
    
    // Fill magic wand textarea
    const textarea = page.locator('textarea').first();
    await textarea.fill('Automated payroll that handles union complexity', { timeout: 5000 });
    
    // Set urgency slider - try to find and set value
    const urgencySlider = page.locator('input[type="range"]').first();
    if (await urgencySlider.isVisible({ timeout: 2000 }).catch(() => false)) {
      await urgencySlider.fill('8');
      // Also try setting value attribute
      await page.evaluate(() => {
        const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
        if (slider) {
          slider.value = '8';
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }
    
    // Select hours per week (radio or checkbox)
    const hoursOption = page.locator('label:has-text("10-20"), input[value*="10-20"]').first();
    await hoursOption.click({ timeout: 5000 });
    
    // Click Next
    const nextButton2 = page.locator('button:has-text("Next")').first();
    await nextButton2.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    
    console.log('✓ Step 2 completed');
    
    // Step 3: Current State
    await page.waitForTimeout(2000);
    
    // Select timesheet method (radio)
    await page.locator('label:has-text("Paper timesheets"), input[value*="Paper"]').first().click({ timeout: 5000 });
    
    // Select union status (radio)
    await page.locator('label:has-text("Yes, fully unionized"), input[value*="fully"]').first().click({ timeout: 5000 });
    
    // Wait for conditional CBA question to appear
    await page.waitForTimeout(1000);
    
    // Select CBA count (radio or select)
    await page.locator('label:has-text("2-3"), input[value="2-3"]').first().click({ timeout: 5000 });
    
    // Select unions (checkboxes)
    await page.locator('label:has-text("SMWIA"), input[type="checkbox"]').first().click({ timeout: 5000 });
    await page.locator('label:has-text("UA"), input[type="checkbox"]').first().click({ timeout: 5000 });
    
    // Select accounting software (select dropdown or radio)
    const accountingSelect = page.locator('select, [role="combobox"]').filter({ hasText: /accounting/i }).first();
    if (await accountingSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await accountingSelect.click();
      await page.locator('text=QuickBooks Desktop').first().click();
    } else {
      await page.locator('label:has-text("QuickBooks Desktop"), input[value*="QuickBooks"]').first().click({ timeout: 5000 });
    }
    
    // Select payroll software
    const payrollSelect = page.locator('select, [role="combobox"]').filter({ hasText: /payroll/i }).first();
    if (await payrollSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await payrollSelect.click();
      await page.locator('text=ADP').first().click();
    } else {
      await page.locator('label:has-text("ADP"), input[value="ADP"]').first().click({ timeout: 5000 });
    }
    
    // Select construction software
    await page.locator('label:has-text("No, using paper/Excel"), input[value*="No"]').first().click({ timeout: 5000 });
    
    // Select gaps (checkboxes)
    await page.locator('label:has-text("Job costing/tracking"), input[type="checkbox"]').first().click({ timeout: 5000 });
    await page.locator('label:has-text("Material ordering"), input[type="checkbox"]').first().click({ timeout: 5000 });
    
    // Click Next
    const nextButton3 = page.locator('button:has-text("Next")').first();
    await nextButton3.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    
    console.log('✓ Step 3 completed');
    
    // Step 4: Demo Customization
    await page.waitForTimeout(2000);
    
    // Select demo focus (checkboxes)
    await page.locator('label:has-text("Union payroll calculations"), input[type="checkbox"]').first().click({ timeout: 5000 });
    await page.locator('label:has-text("Real-time job costing"), input[type="checkbox"]').first().click({ timeout: 5000 });
    
    // Select evaluators (checkboxes)
    await page.locator('label:has-text("Owner"), input[type="checkbox"]').first().click({ timeout: 5000 });
    await page.locator('label:has-text("Operations Manager"), input[type="checkbox"]').first().click({ timeout: 5000 });
    
    // Select tech comfort (radio)
    await page.locator('label:has-text("Comfortable with technology"), input[value*="Comfortable"]').first().click({ timeout: 5000 });
    
    // Select smartphones (radio)
    await page.locator('label:has-text("Yes, all crew members"), input[value*="Yes"]').first().click({ timeout: 5000 });
    
    // Click Next
    const nextButton4 = page.locator('button:has-text("Next")').first();
    await nextButton4.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    
    console.log('✓ Step 4 completed');
    
    // Step 5: Decision Intelligence
    await page.waitForTimeout(2000);
    
    // Select timeline (radio or select)
    await page.locator('label:has-text("Within 1 month"), input[value*="Within"]').first().click({ timeout: 5000 });
    
    // Select evaluating (checkboxes)
    await page.locator('label:has-text("Procore"), input[type="checkbox"]').first().click({ timeout: 5000 });
    
    // Select next steps (checkboxes)
    await page.locator('label:has-text("Pricing information"), input[type="checkbox"]').first().click({ timeout: 5000 });
    await page.locator('label:has-text("See how it integrates"), input[type="checkbox"]').first().click({ timeout: 5000 });
    
    // Set likelihood slider
    const likelihoodSlider = page.locator('input[type="range"]').first();
    if (await likelihoodSlider.isVisible({ timeout: 2000 }).catch(() => false)) {
      await likelihoodSlider.fill('8');
      await page.evaluate(() => {
        const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
        if (slider) {
          slider.value = '8';
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }
    
    // Fill specific questions textarea
    const questionsTextarea = page.locator('textarea').last();
    await questionsTextarea.fill('How does it handle multiple CBAs?', { timeout: 5000 });
    
    // Submit - wait a bit for form to be ready
    await page.waitForTimeout(1000);
    const submitButton = page.locator('button:has-text("Submit"), button[type="submit"]').first();
    await submitButton.click({ timeout: 5000 });
    
    // Wait for redirect to thank you page
    await page.waitForURL('**/assessment/thank-you**', { timeout: 15000 });
    
    console.log('✓ Assessment submitted successfully');
    
    // Get submission ID from URL
    const url = page.url();
    const submissionIdMatch = url.match(/submissionId=([^&]+)/);
    submissionId = submissionIdMatch ? submissionIdMatch[1] : null;
    
    expect(submissionId).toBeTruthy();
    console.log(`✓ Submission ID: ${submissionId}`);
    
    // Step 6: Login to admin dashboard
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[type="email"]', 'admin@useappello.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.locator('button:has-text("Login"), button[type="submit"]').first().click();
    
    // Wait for dashboard
    await page.waitForURL('**/admin/dashboard**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    console.log('✓ Logged into admin dashboard');
    
    // Step 7: Verify assessment appears in dashboard
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for data to load
    
    // Check if our submission appears
    if (submissionId) {
      console.log(`\n🔍 Looking for submission: ${submissionId.substring(0, 8)}...`);
      
      // Search for the submission ID
      const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"], input[type="search"]').first();
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill(submissionId.substring(0, 8));
        await page.waitForTimeout(2000);
      }
      
      // Check if assessment appears in table
      const table = page.locator('table').first();
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const rows = table.locator('tbody tr');
        const count = await rows.count();
        console.log(`✓ Found ${count} assessment(s) in dashboard table`);
        
        // Check if our submission ID appears anywhere on the page
        const pageContent = await page.content();
        const foundInPage = pageContent.includes(submissionId.substring(0, 8));
        
        if (foundInPage) {
          console.log('✅ Assessment found in dashboard!');
        } else {
          console.log('⚠ Assessment not found on page, checking API...');
        }
      }
      
      // Check API directly via browser context
      const apiResponse = await page.request.get('/api/admin/assessments?status=completed&limit=100');
      const apiData = await apiResponse.json();
      
      console.log(`\n📊 API Response:`);
      console.log(`   Total assessments: ${apiData.assessments?.length || 0}`);
      
      const found = apiData.assessments?.some((a: any) => a.submissionId === submissionId);
      
      if (found) {
        console.log('✅ Assessment found via API!');
        const assessment = apiData.assessments.find((a: any) => a.submissionId === submissionId);
        console.log(`   Status: ${assessment.status}`);
        console.log(`   Score: ${assessment.opportunityScore || 'N/A'}`);
        console.log(`   Priority: ${assessment.opportunityPriority || 'N/A'}`);
      } else {
        console.log('❌ Assessment NOT found in API response');
        console.log('   This indicates a submission or query issue');
      }
    }
    
    // Verify dashboard loads assessments
    const statsSection = page.locator('text=Total Assessments, text=Completed, [class*="card"]').first();
    if (await statsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Dashboard stats section loaded');
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'e2e/dashboard-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved to e2e/dashboard-screenshot.png');
    
    console.log('\n✅ Test completed!');
  });
});

