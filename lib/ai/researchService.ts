/**
 * Comprehensive AI Research Service
 * 
 * Conducts deep research on companies using multiple sources:
 * - Web research (Firecrawl)
 * - ATLAS database (case studies, similar customers)
 * - Company website analysis
 * - Competitor research
 * - Industry analysis
 * - Tool/software research
 */

import { scrapeWithFirecrawl, searchWithFirecrawl } from './mcpTools';
import { queryATLAS } from './mcpTools';
import { analyzeWithClaude } from './claude';
import { AuditTrail, addAuditEntry, createAuditTrail } from './auditTrail';

export interface CompanyResearch {
  companyName?: string;
  website?: string;
  email?: string;
  
  // Basic Company Info
  companyInfo?: {
    description?: string;
    industry?: string;
    location?: string;
    size?: string;
    founded?: string;
    headquarters?: string;
  };
  
  // Website Analysis
  websiteAnalysis?: {
    technologies?: string[];
    services?: string[];
    keyPages?: Array<{ url: string; title: string; summary: string }>;
    valuePropositions?: string[];
    painPoints?: string[];
    // Enhanced company background
    companyHistory?: {
      founded?: string;
      foundingYear?: number;
      headquarters?: string;
      keyMilestones?: Array<{ year?: number; event: string }>;
      companyBackground?: string;
      mission?: string;
      values?: string[];
      leadership?: Array<{ name?: string; role?: string }>;
    };
  };
  
  // Competitor Research
  competitors?: Array<{
    name: string;
    website?: string;
    description?: string;
    differentiation?: string;
  }>;
  
  // Industry Insights
  industryInsights?: {
    trends?: string[];
    challenges?: string[];
    opportunities?: string[];
    marketSize?: string;
  };
  
  // Tools & Software Research
  toolsResearch?: {
    mentioned?: string[];
    likelyUsing?: string[];
    analysis?: string;
  };
  
  // ATLAS Intelligence
  atlasIntelligence?: {
    similarCustomers?: any[];
    caseStudies?: any[];
    relevantExamples?: any[];
    insights?: string[];
  };
  
  // Sales Intelligence
  salesIntelligence?: {
    keyContacts?: Array<{ name?: string; role?: string; email?: string }>;
    decisionMakers?: string[];
    buyingSignals?: string[];
    objections?: string[];
    talkingPoints?: string[];
    competitiveAdvantages?: string[];
    risks?: string[];
  };
}

/**
 * Conduct comprehensive research on a company
 * Optimized for parallel execution where possible
 */
export async function researchCompany(
  assessmentData: {
    companyName?: string;
    website?: string;
    email?: string;
    section1?: any;
    section2?: any;
    section3?: any;
    section4?: any;
    section5?: any;
  },
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<CompanyResearch> {
  // Create audit trail if not provided
  const researchAuditTrail = auditTrail || createAuditTrail();
  const research: CompanyResearch = {
    companyName: assessmentData.companyName,
    email: assessmentData.email,
  };
  
  const companyName = assessmentData.companyName || '';
  const website = assessmentData.website || '';
  const email = assessmentData.email || '';
  const trade = assessmentData.section1?.trade || '';
  const fieldWorkers = assessmentData.section1?.fieldWorkers || '';
  const location = extractLocationFromEmail(email);
  
  // Step 1: Company Website Research
  // If website URL is provided directly, use it; otherwise search for it
  if (companyName) {
    try {
      let websiteUrl = website;
      
      // If website URL provided directly, use it
      if (websiteUrl) {
        logCallback?.('step', `🔍 Step 1/5: Using provided company website...`);
        logCallback?.('success', `   ✅ Website provided: ${websiteUrl}`);
        research.website = websiteUrl;
      } else {
        // Otherwise, search for company website
        logCallback?.('step', `🔍 Step 1/5: Searching web for company website...`);
        const searchQuery = `${companyName} ${trade} contractor`;
        
        addAuditEntry(researchAuditTrail, {
          action: 'Company Web Research',
          type: 'firecrawl_search',
          details: { query: searchQuery },
        });
        
        logCallback?.('info', `   → Calling Firecrawl MCP: searchWithFirecrawl`);
        const webResults = await searchWithFirecrawl(
          searchQuery,
          { limit: 5 },
          researchAuditTrail,
          logCallback
        );
        
        logCallback?.('success', `   ✅ Firecrawl search completed`, {
          resultsFound: webResults?.data?.length || 0,
          topResult: webResults?.data?.[0]?.title || 'None',
        });
        
        if (webResults?.data?.length > 0) {
          // Extract website URL
          websiteUrl = webResults.data[0]?.url || webResults.data.find((r: any) => r.url?.includes(companyName.toLowerCase().replace(/\s+/g, '')))?.url;
          research.website = websiteUrl;
          
          if (websiteUrl) {
            logCallback?.('success', `   ✅ Found website: ${websiteUrl}`);
          } else {
            logCallback?.('warning', `   ⚠️ No website URL found in search results`);
          }
          
          // Extract company info from search results
          research.companyInfo = await extractCompanyInfo(webResults.data, companyName, researchAuditTrail);
        }
      }
      
      // Scrape company website if found (either provided or discovered)
      if (websiteUrl) {
        logCallback?.('step', `🌐 Scraping company website: ${websiteUrl}`);
        logCallback?.('info', `   → Calling Firecrawl scrape API...`);
        research.websiteAnalysis = await analyzeCompanyWebsite(websiteUrl, researchAuditTrail, logCallback);
        logCallback?.('success', `   ✅ Website scraping completed`);
      } else {
        logCallback?.('info', `   ⚠️ No website URL available, skipping website analysis`);
      }
    } catch (error: any) {
      addAuditEntry(researchAuditTrail, {
        action: 'Company Web Research Error',
        type: 'error',
        details: { error: error.message },
      });
    }
  }
  
  // Steps 2-5: Parallel execution where possible
  logCallback?.('step', `⚡ Steps 2-5: Running parallel research (competitors, industry, tools, ATLAS)...`);
  
  const parallelTasks = await Promise.allSettled([
    // Step 2: Competitor Research
    companyName && trade ? (async () => {
      try {
        logCallback?.('info', `   → [Parallel] Researching competitors...`);
        const competitors = await researchCompetitors(companyName, trade, location, researchAuditTrail, logCallback);
        logCallback?.('success', `   ✅ [Parallel] Competitor research completed - found ${competitors?.length || 0} competitors`);
        return { type: 'competitors', data: competitors };
      } catch (error: any) {
        addAuditEntry(researchAuditTrail, {
          action: 'Competitor Research Error',
          type: 'error',
          details: { error: error.message },
        });
        return { type: 'competitors', data: [] };
      }
    })() : Promise.resolve({ type: 'competitors', data: [] }),
    
    // Step 3: Industry Research
    trade ? (async () => {
      try {
        logCallback?.('info', `   → [Parallel] Researching industry trends...`);
        const insights = await researchIndustry(trade, fieldWorkers, researchAuditTrail, logCallback);
        logCallback?.('success', `   ✅ [Parallel] Industry research completed`);
        return { type: 'industry', data: insights };
      } catch (error: any) {
        addAuditEntry(researchAuditTrail, {
          action: 'Industry Research Error',
          type: 'error',
          details: { error: error.message },
        });
        return { type: 'industry', data: undefined };
      }
    })() : Promise.resolve({ type: 'industry', data: undefined }),
    
    // Step 4: Tools & Software Research
    assessmentData.section3 ? (async () => {
      try {
        logCallback?.('info', `   → [Parallel] Researching tools and software...`);
        const tools = await researchTools(assessmentData.section3, companyName, researchAuditTrail);
        return { type: 'tools', data: tools };
      } catch (error: any) {
        addAuditEntry(researchAuditTrail, {
          action: 'Tools Research Error',
          type: 'error',
          details: { error: error.message },
        });
        return { type: 'tools', data: undefined };
      }
    })() : Promise.resolve({ type: 'tools', data: undefined }),
    
    // Step 5: ATLAS Intelligence
    (async () => {
      try {
        logCallback?.('info', `   → [Parallel] Querying ATLAS database...`);
        const atlas = await researchATLAS(assessmentData, researchAuditTrail, logCallback);
        logCallback?.('success', `   ✅ [Parallel] ATLAS research completed`);
        return { type: 'atlas', data: atlas };
      } catch (error: any) {
        logCallback?.('error', `   ❌ [Parallel] ATLAS research failed: ${error.message}`);
        addAuditEntry(researchAuditTrail, {
          action: 'ATLAS Research Error',
          type: 'error',
          details: { error: error.message },
        });
        return { type: 'atlas', data: undefined };
      }
    })(),
  ]);
  
  // Process parallel results
  for (const result of parallelTasks) {
    if (result.status === 'fulfilled') {
      const { type, data } = result.value;
      switch (type) {
        case 'competitors':
          research.competitors = data;
          break;
        case 'industry':
          research.industryInsights = data;
          break;
        case 'tools':
          research.toolsResearch = data;
          break;
        case 'atlas':
          research.atlasIntelligence = data;
          break;
      }
    }
  }
  
  // Step 6: Generate Sales Intelligence (must be after all research)
  logCallback?.('step', `💼 Step 6/6: Generating comprehensive sales intelligence...`);
  logCallback?.('info', `   → Analyzing all research data and generating detailed insights...`);
  research.salesIntelligence = await generateSalesIntelligence(research, assessmentData, researchAuditTrail, logCallback);
  logCallback?.('success', `   ✅ Sales intelligence generated`);
  
  logCallback?.('success', `🎉 All research steps completed!`);
  return research;
}

/**
 * Analyze company website
 */
async function analyzeCompanyWebsite(
  url: string,
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<CompanyResearch['websiteAnalysis']> {
  try {
    addAuditEntry(auditTrail, {
      action: 'Website Analysis',
      type: 'firecrawl_scrape',
      details: { url },
    });
    
    logCallback?.('info', `   → Scraping ${url}...`);
    const scraped = await scrapeWithFirecrawl(url, { formats: ['markdown'], onlyMainContent: true }, auditTrail, logCallback);
    const content = scraped?.markdown || scraped?.content || scraped?.data?.markdown || '';
    
    if (!content || content.length < 100) {
      logCallback?.('warning', `   ⚠️ No content scraped from website (${content.length} chars)`);
      // Try fallback: scrape without onlyMainContent
      logCallback?.('info', `   → Retrying with full page scrape...`);
      try {
        const fallbackScrape = await scrapeWithFirecrawl(url, { formats: ['markdown'], onlyMainContent: false }, auditTrail, logCallback);
        const fallbackContent = fallbackScrape?.markdown || fallbackScrape?.content || fallbackScrape?.data?.markdown || '';
        if (fallbackContent && fallbackContent.length > 100) {
          logCallback?.('success', `   ✅ Fallback scrape successful (${fallbackContent.length} chars)`);
          // Use fallback content for analysis
          return await analyzeWebsiteContent(fallbackContent, url, auditTrail, logCallback);
        }
      } catch (fallbackError) {
        logCallback?.('warning', `   ⚠️ Fallback scrape also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`);
      }
      return undefined;
    }
    
    logCallback?.('success', `   ✅ Website scraped successfully`, {
      contentLength: content.length,
      preview: content.substring(0, 200) + '...',
    });
    
    return await analyzeWebsiteContent(content, url, auditTrail, logCallback);
  } catch (error: any) {
    addAuditEntry(auditTrail, {
      action: 'Website Analysis Error',
      type: 'error',
      details: { error: error.message },
    });
    return undefined;
  }
}

/**
 * Analyze website content with Claude
 */
async function analyzeWebsiteContent(
  content: string,
  url: string,
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<CompanyResearch['websiteAnalysis']> {
  logCallback?.('step', `🤖 Analyzing website content with Claude...`);
  
  const prompt = `Analyze this company website content and extract comprehensive business intelligence:

1. Technologies they use (look for mentions of software, tools, platforms)
2. Services they offer
3. Key value propositions
4. Pain points they might be addressing
5. Company size indicators
6. Key pages and their purposes
7. **Company History & Background:**
   - Founding year/date
   - Company background story
   - Key milestones (year and event)
   - Headquarters location
   - Mission statement
   - Core values
   - Leadership team (names and roles if mentioned)

Website Content:
${content.substring(0, 12000)}

Return JSON format:
{
  "technologies": ["tech1", "tech2"],
  "services": ["service1", "service2"],
  "valuePropositions": ["prop1", "prop2"],
  "painPoints": ["pain1", "pain2"],
  "keyPages": [{"url": "...", "title": "...", "summary": "..."}],
  "companyHistory": {
    "founded": "YYYY or date",
    "foundingYear": YYYY,
    "headquarters": "City, State/Province",
    "keyMilestones": [{"year": YYYY, "event": "..."}],
    "companyBackground": "Brief company history and background",
    "mission": "Mission statement if found",
    "values": ["value1", "value2"],
    "leadership": [{"name": "...", "role": "..."}]
  }
}`;

  try {
    logCallback?.('info', `   → Calling Claude API for website analysis...`);
    const analysis = await analyzeWithClaude(
      prompt,
      'You are an expert at analyzing company websites and extracting business intelligence.',
      { temperature: 0.7 },
      auditTrail
    );
    
    logCallback?.('success', `   ✅ Website analysis completed`);
    
    // Handle JSON wrapped in markdown code blocks
    let parsed;
    try {
      const jsonMatch = analysis.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = JSON.parse(analysis);
      }
    } catch (parseError: any) {
      logCallback?.('warning', `   ⚠️ JSON parsing failed: ${parseError.message}, using fallback extraction`);
      // Fallback parsing
      return {
        technologies: extractTechnologies(content),
        services: [],
        valuePropositions: [],
        painPoints: [],
        keyPages: [],
        companyHistory: extractCompanyHistoryFallback(content),
      };
    }
    
    logCallback?.('info', `   → Extracted: ${parsed.technologies?.length || 0} technologies, ${parsed.services?.length || 0} services`);
    if (parsed.companyHistory) {
      logCallback?.('success', `   ✅ Company history extracted: Founded ${parsed.companyHistory.founded || parsed.companyHistory.foundingYear || 'unknown'}`);
    }
    return parsed;
  } catch (error: any) {
    logCallback?.('error', `   ❌ Website analysis failed: ${error.message}`);
    addAuditEntry(auditTrail, {
      action: 'Website Analysis Error',
      type: 'error',
      details: { error: error.message },
    });
    return undefined;
  }
}

/**
 * Extract company info from search results
 */
async function extractCompanyInfo(
  searchResults: any[],
  companyName: string,
  auditTrail?: AuditTrail
): Promise<CompanyResearch['companyInfo']> {
  const resultsText = searchResults.map((r: any) => `${r.title || ''}\n${r.description || ''}`).join('\n\n');
  
  const prompt = `Extract company information from these search results:

Company Name: ${companyName}

Search Results:
${resultsText.substring(0, 4000)}

Return JSON:
{
  "description": "...",
  "industry": "...",
  "location": "...",
  "size": "...",
  "founded": "...",
  "headquarters": "..."
}`;

  try {
    const info = await analyzeWithClaude(
      prompt,
      'You are an expert at extracting structured company information.',
      { temperature: 0.7 },
      auditTrail
    );
    
    return JSON.parse(info);
  } catch {
    return undefined;
  }
}

/**
 * Research competitors
 */
async function researchCompetitors(
  companyName: string,
  trade: string,
  location: string,
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<CompanyResearch['competitors']> {
  const searchQuery = `${trade} contractors ${location || ''} competitors`;
  
  logCallback?.('step', `🔍 Researching competitors: "${searchQuery}"`);
  
  addAuditEntry(auditTrail, {
    action: 'Competitor Research',
    type: 'firecrawl_search',
    details: { query: searchQuery },
  });
  
  try {
    logCallback?.('info', `   → Calling Firecrawl MCP: searchWithFirecrawl`);
    const results = await searchWithFirecrawl(searchQuery, { limit: 10 }, auditTrail, logCallback);
    
    // Scrape competitor websites for deeper analysis
    const competitorData: any[] = [];
    const urlsToScrape = results.data?.slice(0, 5) || []; // Scrape top 5 competitor websites
    
    for (let i = 0; i < urlsToScrape.length; i++) {
      const result = urlsToScrape[i];
      if (result.url && !result.url.includes(companyName.toLowerCase().replace(/\s+/g, ''))) {
        try {
          logCallback?.('info', `   → Scraping competitor ${i + 1}/${urlsToScrape.length}: ${result.title || result.url}`);
          const scraped = await scrapeWithFirecrawl(
            result.url, 
            { formats: ['markdown'], onlyMainContent: true }, 
            auditTrail, 
            logCallback
          );
          const content = scraped?.markdown || scraped?.content || '';
          competitorData.push({
            ...result,
            scrapedContent: content.substring(0, 5000), // Limit content length
            hasFullContent: content.length > 0,
          });
          logCallback?.('success', `   ✅ Scraped competitor website (${content.length} chars)`);
        } catch (error: any) {
          logCallback?.('warning', `   ⚠️ Failed to scrape ${result.url}: ${error.message}`);
          // Fallback to search result data
          competitorData.push(result);
        }
      } else {
        competitorData.push(result);
      }
    }
    
    // Add remaining search results without scraping (to get to 10 total)
    const remaining = results.data?.slice(5, 10) || [];
    competitorData.push(...remaining);
    
    const prompt = `Analyze these competitor research results and identify competitors to ${companyName}:

Competitor Research Data:
${JSON.stringify(competitorData.slice(0, 10), null, 2)}

For each competitor (excluding ${companyName}), extract:
- Name
- Website (if available)
- Description (use scraped content when available for more detail)
- How they differentiate from ${companyName} (services, size, focus areas, etc.)

Focus on companies that are actual competitors (similar trade, similar market, similar size).
Exclude ${companyName} itself.

Return JSON array:
[{
  "name": "...",
  "website": "...",
  "description": "...",
  "differentiation": "..."
}]`;

    const analysis = await analyzeWithClaude(
      prompt,
      'You are an expert at competitive analysis. Return ONLY valid JSON, no markdown code blocks.',
      { temperature: 0.7 },
      auditTrail
    );
    
    // Handle JSON wrapped in markdown code blocks
    let parsed;
    try {
      const jsonMatch = analysis.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = JSON.parse(analysis);
      }
    } catch (parseError: any) {
      logCallback?.('error', `   ❌ Failed to parse competitor analysis: ${parseError.message}`);
      logCallback?.('info', `   → Response preview: ${analysis.substring(0, 200)}...`);
      // Return empty array if parsing fails
      return [];
    }
    
    // Filter out empty or invalid entries
    return parsed.filter((c: any) => c && c.name && c.name !== companyName);
  } catch (error: any) {
    addAuditEntry(auditTrail, {
      action: 'Competitor Research Error',
      type: 'error',
      details: { error: error.message },
    });
    return [];
  }
}

/**
 * Research industry trends and insights
 */
async function researchIndustry(
  trade: string,
  fieldWorkers: string,
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<CompanyResearch['industryInsights']> {
  const searchQuery = `${trade} industry trends 2025 challenges opportunities`;
  
  logCallback?.('step', `📊 Researching industry trends: "${searchQuery}"`);
  
  addAuditEntry(auditTrail, {
    action: 'Industry Research',
    type: 'firecrawl_search',
    details: { query: searchQuery },
  });
  
  try {
    logCallback?.('info', `   → Calling Firecrawl MCP: searchWithFirecrawl`);
    const results = await searchWithFirecrawl(searchQuery, { limit: 5 }, auditTrail, logCallback);
    
    // Scrape top search results for deeper content
    const scrapedContents: string[] = [];
    const urlsToScrape = results.data?.slice(0, 3) || []; // Scrape top 3 results
    
    for (let i = 0; i < urlsToScrape.length; i++) {
      const result = urlsToScrape[i];
      if (result.url) {
        try {
          logCallback?.('info', `   → Scraping article ${i + 1}/${urlsToScrape.length}: ${result.url}`);
          const scraped = await scrapeWithFirecrawl(
            result.url, 
            { formats: ['markdown'], onlyMainContent: true }, 
            auditTrail, 
            logCallback
          );
          const content = scraped?.markdown || scraped?.content || '';
          if (content) {
            scrapedContents.push(`\n---\nSource: ${result.title || result.url}\n${content.substring(0, 3000)}`);
            logCallback?.('success', `   ✅ Scraped ${result.title || result.url} (${content.length} chars)`);
          }
        } catch (error: any) {
          logCallback?.('warning', `   ⚠️ Failed to scrape ${result.url}: ${error.message}`);
          // Fallback to search result snippet
          if (result.description) {
            scrapedContents.push(`\n---\nSource: ${result.title || result.url}\n${result.description}`);
          }
        }
      }
    }
    
    const combinedContent = scrapedContents.length > 0 
      ? scrapedContents.join('\n\n')
      : JSON.stringify(results.data?.slice(0, 5) || [], null, 2);
    
    const prompt = `Based on this comprehensive industry research content, provide industry insights for ${trade} contractors with ${fieldWorkers} field workers:

Research Content:
${combinedContent}

Extract:
- Current industry trends (be specific with numbers/statistics when available)
- Common challenges facing contractors in this trade
- Growth opportunities and market trends
- Market size indicators or growth projections

Return JSON:
{
  "trends": ["trend1", "trend2"],
  "challenges": ["challenge1", "challenge2"],
  "opportunities": ["opp1", "opp2"],
  "marketSize": "..."
}`;

    const insights = await analyzeWithClaude(
      prompt,
      'You are an expert at industry analysis for construction and trade contractors. Return ONLY valid JSON, no markdown code blocks.',
      { temperature: 0.7 },
      auditTrail
    );
    
    // Handle JSON wrapped in markdown code blocks
    try {
      const jsonMatch = insights.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      } else {
        return JSON.parse(insights);
      }
    } catch (parseError: any) {
      logCallback?.('error', `   ❌ Failed to parse industry insights: ${parseError.message}`);
      return undefined;
    }
  } catch (error: any) {
    return undefined;
  }
}

/**
 * Research tools and software they're using
 */
async function researchTools(
  section3: any,
  companyName: string,
  auditTrail?: AuditTrail
): Promise<CompanyResearch['toolsResearch']> {
  const mentionedTools: string[] = [];
  
  // Extract mentioned tools from assessment
  if (section3.accountingSoftware) mentionedTools.push(section3.accountingSoftware);
  if (section3.payrollSoftware) mentionedTools.push(section3.payrollSoftware);
  if (section3.constructionSoftware) mentionedTools.push(section3.constructionSoftware);
  
  const toolsList = mentionedTools.filter(Boolean).join(', ');
  
  if (!toolsList) {
    return {
      mentioned: [],
      likelyUsing: [],
      analysis: 'No specific tools mentioned in assessment.',
    };
  }
  
  const prompt = `Based on this company's tool stack, provide analysis:

Company: ${companyName}
Tools Mentioned: ${toolsList}

Provide:
1. What these tools indicate about their operations
2. Likely other tools they might be using
3. Integration opportunities
4. Pain points these tools might indicate

Return JSON:
{
  "mentioned": ["tool1", "tool2"],
  "likelyUsing": ["tool3", "tool4"],
  "analysis": "..."
}`;

  try {
    const analysis = await analyzeWithClaude(
      prompt,
      'You are an expert at analyzing software stacks and identifying business intelligence.',
      { temperature: 0.7 },
      auditTrail
    );
    
    return JSON.parse(analysis);
  } catch {
    return {
      mentioned: mentionedTools,
      likelyUsing: [],
      analysis: 'Analysis unavailable.',
    };
  }
}

/**
 * Research ATLAS for similar customers and case studies
 * Enhanced to extract actual insights from the data, not just counts
 */
async function researchATLAS(
  assessmentData: any,
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<CompanyResearch['atlasIntelligence']> {
  const trade = assessmentData.section1?.trade || '';
  const fieldWorkers = assessmentData.section1?.fieldWorkers || '';
  const painPoints = assessmentData.section2?.painPoints || [];
  
  const queries = [
    `Find customers similar to ${trade} contractor with ${fieldWorkers} field workers`,
    `Case studies for ${trade} contractors solving ${painPoints.slice(0, 2).join(' and ')}`,
    `Success stories for ${trade} contractors with similar challenges`,
  ];
  
  const results: any[] = [];
  
  logCallback?.('info', `   → Preparing ${queries.length} ATLAS queries...`);
  
  // Execute queries in parallel for performance
  const queryPromises = queries.map(async (query, i) => {
    try {
      logCallback?.('step', `   Query ${i + 1}/${queries.length}: "${query}"`);
      logCallback?.('info', `   → Calling ATLAS MCP: queryATLAS`);
      
      addAuditEntry(auditTrail, {
        action: 'ATLAS Query',
        type: 'atlas_query',
        details: { query },
      });
      
      const atlasResult = await queryATLAS(query, auditTrail, logCallback);
      
      if (atlasResult?.results && atlasResult.results.length > 0) {
        logCallback?.('success', `   ✅ ATLAS query returned ${atlasResult.results.length} results`, {
          query,
          resultCount: atlasResult.results.length,
          firstResult: atlasResult.results[0]?.title || atlasResult.results[0]?.name || 'Result',
        });
        return atlasResult.results;
      } else {
        logCallback?.('warning', `   ⚠️ ATLAS query returned no results`, { query });
        return [];
      }
    } catch (error: any) {
      logCallback?.('error', `   ❌ ATLAS query failed: ${error.message}`, { query });
      addAuditEntry(auditTrail, {
        action: 'ATLAS Query Error',
        type: 'error',
        details: { error: error.message, query },
      });
      return [];
    }
  });
  
  const queryResults = await Promise.all(queryPromises);
  results.push(...queryResults.flat());
  
  logCallback?.('success', `✅ ATLAS research completed`, {
    totalResults: results.length,
    similarCustomers: results.slice(0, 5).length,
    caseStudies: results.filter((r: any) => r.type === 'case_study').length,
  });
  
  // Extract detailed insights from ATLAS data using Claude
  logCallback?.('step', `   → Analyzing ATLAS data to extract actionable insights...`);
  const detailedInsights = await extractATLASInsights(results, assessmentData, auditTrail, logCallback);
  
  return {
    similarCustomers: results.slice(0, 5),
    caseStudies: results.filter((r: any) => r.type === 'case_study').slice(0, 3),
    relevantExamples: results.slice(0, 10),
    insights: detailedInsights,
    rawData: results, // Keep raw data for deeper analysis
  };
}

/**
 * Extract detailed insights from ATLAS results using Claude
 */
async function extractATLASInsights(
  atlasResults: any[],
  assessmentData: any,
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<string[]> {
  if (atlasResults.length === 0) {
    return ['No similar customers found in ATLAS database'];
  }
  
  const trade = assessmentData.section1?.trade || '';
  const fieldWorkers = assessmentData.section1?.fieldWorkers || '';
  const painPoints = assessmentData.section2?.painPoints || [];
  
  const prompt = `Analyze these ATLAS database results and extract SPECIFIC, ACTIONABLE insights about similar customers:

ATLAS Results (${atlasResults.length} total):
${JSON.stringify(atlasResults.slice(0, 10), null, 2)}

Target Company Profile:
- Trade: ${trade}
- Field Workers: ${fieldWorkers}
- Pain Points: ${painPoints.join(', ')}

Extract SPECIFIC insights such as:
1. Actual customer names and their outcomes (with specific metrics if available)
2. Common patterns in how similar customers solved these pain points
3. Specific ROI or savings numbers from case studies
4. Implementation timelines from similar customers
5. Key features/modules that were most valuable
6. Common objections these customers had and how they were overcome
7. Company size/type patterns (what size companies see best results)
8. Industry-specific insights for ${trade} contractors

For each insight, reference the source (customer name, case study title, etc.) and be SPECIFIC with numbers, timelines, and outcomes.

Return as JSON array of strings, each insight should be detailed and cite its source:
[
  "Insight 1 with specific data and source",
  "Insight 2 with specific data and source",
  ...
]`;

  try {
    const insights = await analyzeWithClaude(
      prompt,
      'You are an expert at analyzing customer data and extracting actionable sales intelligence. Return ONLY valid JSON array, no markdown code blocks or explanations.',
      { temperature: 0.7 },
      auditTrail
    );
    
    // Handle JSON wrapped in markdown code blocks (common Claude response format)
    let parsed;
    try {
      // Try to extract JSON from markdown code blocks first
      const jsonMatch = insights.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/s);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        // Try direct JSON parse
        parsed = JSON.parse(insights);
      }
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        logCallback?.('success', `   ✅ Extracted ${parsed.length} detailed insights from ATLAS data`);
        return parsed;
      }
    } catch (parseError: any) {
      logCallback?.('warning', `   ⚠️ Failed to parse ATLAS insights JSON: ${parseError.message}`);
      logCallback?.('info', `   → Response preview: ${insights.substring(0, 300)}...`);
      // Try to extract any array-like structure
      const arrayMatch = insights.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            logCallback?.('success', `   ✅ Extracted ${parsed.length} insights using fallback parsing`);
            return parsed;
          }
        } catch {
          // Continue to fallback
        }
      }
    }
    
    // Fallback to basic insights
    logCallback?.('info', `   → Using fallback insight generation`);
    return generateATLASInsights(atlasResults, assessmentData);
  } catch (error: any) {
    logCallback?.('error', `   ❌ Failed to extract detailed insights: ${error.message}`);
    return generateATLASInsights(atlasResults, assessmentData);
  }
}

/**
 * Generate comprehensive sales intelligence from all research
 * Enhanced to deeply analyze data and provide detailed, source-attributed insights
 */
async function generateSalesIntelligence(
  research: CompanyResearch,
  assessmentData: any,
  auditTrail?: AuditTrail,
  logCallback?: (type: 'info' | 'success' | 'error' | 'warning' | 'step', message: string, data?: any) => void
): Promise<CompanyResearch['salesIntelligence']> {
  logCallback?.('info', `   → Analyzing company website data...`);
  logCallback?.('info', `   → Analyzing ATLAS customer data...`);
  logCallback?.('info', `   → Analyzing competitor intelligence...`);
  logCallback?.('info', `   → Analyzing industry trends...`);
  
  // Build comprehensive context with source attribution
  const context = {
    companyName: research.companyName,
    website: research.website,
    trade: assessmentData.section1?.trade,
    fieldWorkers: assessmentData.section1?.fieldWorkers,
    painPoints: assessmentData.section2?.painPoints || [],
    urgency: assessmentData.section2?.urgency,
    timeline: assessmentData.section5?.timeline,
    likelihood: assessmentData.section5?.likelihood,
    currentTools: [
      assessmentData.section3?.accountingSoftware,
      assessmentData.section3?.payrollSoftware,
      assessmentData.section3?.constructionSoftware,
    ].filter(Boolean),
    
    // Website intelligence (source: company website)
    websiteIntelligence: research.websiteAnalysis ? {
      source: 'Company Website Analysis',
      technologies: research.websiteAnalysis.technologies,
      services: research.websiteAnalysis.services,
      valuePropositions: research.websiteAnalysis.valuePropositions,
      companyHistory: research.websiteAnalysis.companyHistory,
      keyPages: research.websiteAnalysis.keyPages,
    } : null,
    
    // ATLAS intelligence (source: ATLAS database)
    atlasIntelligence: research.atlasIntelligence ? {
      source: 'ATLAS Customer Database',
      similarCustomers: research.atlasIntelligence.similarCustomers?.map((c: any) => ({
        name: c.name || c.title || 'Unknown',
        trade: c.trade,
        fieldWorkers: c.fieldWorkers,
        outcomes: c.outcomes || c.results,
        roi: c.roi,
        implementationTime: c.implementationTime,
      })),
      caseStudies: research.atlasIntelligence.caseStudies?.map((cs: any) => ({
        title: cs.title || cs.name,
        challenge: cs.challenge,
        solution: cs.solution,
        outcome: cs.outcome,
        metrics: cs.metrics,
      })),
      insights: research.atlasIntelligence.insights,
    } : null,
    
    // Competitor intelligence (source: web research)
    competitorIntelligence: research.competitors ? {
      source: 'Web Research & Competitor Analysis',
      competitors: research.competitors,
      marketPosition: research.competitors.length > 0 ? `${research.competitors.length} competitors identified` : null,
    } : null,
    
    // Industry intelligence (source: industry research)
    industryIntelligence: research.industryInsights ? {
      source: 'Industry Research & Trend Analysis',
      trends: research.industryInsights.trends,
      challenges: research.industryInsights.challenges,
      opportunities: research.industryInsights.opportunities,
      marketSize: research.industryInsights.marketSize,
    } : null,
    
    // Tools intelligence (source: assessment + website)
    toolsIntelligence: research.toolsResearch ? {
      source: 'Assessment Responses + Website Analysis',
      mentioned: research.toolsResearch.mentioned,
      likelyUsing: research.toolsResearch.likelyUsing,
      analysis: research.toolsResearch.analysis,
    } : null,
  };
  
  const prompt = `Generate comprehensive, detailed sales intelligence based on this research. For EVERY insight, cite the source.

Research Context:
${JSON.stringify(context, null, 2)}

CRITICAL REQUIREMENTS:
1. **Source Attribution**: Every insight MUST cite where it came from (e.g., "Based on ATLAS case study: [Customer Name]...", "From website analysis: [Company] uses...", "Industry research shows...")
2. **Specific Data**: Use actual numbers, names, and facts from the research. Don't generalize.
3. **Actionable Insights**: Each insight should be immediately usable by sales team.

Generate detailed sales intelligence:

1. **Talking Points** (5-7 points):
   - Reference specific ATLAS customer outcomes with numbers
   - Reference their specific pain points from assessment
   - Reference industry trends that apply to them
   - Format: "Based on [SOURCE]: [Specific insight with data]"

2. **Competitive Advantages** (3-5 points):
   - Compare to their current tools (from assessment)
   - Reference competitor analysis
   - Format: "Unlike [competitor/tool], Appello [advantage] because [evidence from research]"

3. **Potential Objections** (3-5 points):
   - Based on their tools, size, industry patterns
   - Reference similar customers who had same concerns
   - Format: "They may object: [objection]. Response: [How similar ATLAS customer overcame this]"

4. **Buying Signals** (3-5 points):
   - From assessment responses (urgency, timeline, likelihood)
   - From company research (growth indicators, tool stack)
   - Format: "[Signal] - Evidence: [specific data point]"

5. **Risks & Concerns** (2-4 points):
   - Implementation risks based on their size/tools
   - Competitive risks
   - Format: "[Risk] - Mitigation: [based on ATLAS data]"

6. **Key Contacts** (if available from website):
   - Extract from website leadership/team pages
   - Format: "Name: [name], Role: [role], Source: Company website"

7. **Decision Makers** (inferred):
   - Based on company size, structure, tools
   - Format: "[Role] - Likely decision maker because [evidence]"

Return JSON:
{
  "talkingPoints": ["Detailed point with source attribution", ...],
  "competitiveAdvantages": ["Detailed advantage with evidence", ...],
  "objections": ["Objection with response citing source", ...],
  "buyingSignals": ["Signal with evidence", ...],
  "risks": ["Risk with mitigation citing source", ...],
  "keyContacts": [{"name": "...", "role": "...", "email": "...", "source": "..."}],
  "decisionMakers": ["Role - reason with evidence", ...]
}`;

  try {
    logCallback?.('info', `   → Calling Claude API for comprehensive sales intelligence analysis...`);
    const intelligence = await analyzeWithClaude(
      prompt,
      'You are an expert sales strategist who creates highly detailed, source-attributed sales intelligence. Always cite sources and use specific data. Return ONLY valid JSON, no markdown code blocks or explanations.',
      { temperature: 0.8 },
      auditTrail
    );
    
    // Handle JSON wrapped in markdown code blocks
    let parsed;
    try {
      const jsonMatch = intelligence.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/s);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        parsed = JSON.parse(intelligence);
      }
      logCallback?.('success', `   ✅ Generated ${parsed.talkingPoints?.length || 0} talking points, ${parsed.competitiveAdvantages?.length || 0} advantages`);
      return parsed;
    } catch (parseError: any) {
      logCallback?.('error', `   ❌ Failed to parse sales intelligence JSON: ${parseError.message}`);
      logCallback?.('info', `   → Response preview: ${intelligence.substring(0, 300)}...`);
      // Fallback to basic intelligence
      return {
        keyContacts: [],
        decisionMakers: [],
        buyingSignals: assessmentData.section5?.timeline ? [`Timeline: ${assessmentData.section5.timeline}`] : [],
        objections: [],
        talkingPoints: [],
        competitiveAdvantages: [],
        risks: [],
      };
    }
  } catch (error: any) {
    logCallback?.('error', `   ❌ Failed to generate sales intelligence: ${error.message}`);
    // Fallback to basic intelligence
    return {
      keyContacts: [],
      decisionMakers: [],
      buyingSignals: assessmentData.section5?.timeline ? [`Timeline: ${assessmentData.section5.timeline}`] : [],
      objections: [],
      talkingPoints: [],
      competitiveAdvantages: [],
      risks: [],
    };
  }
}

// Helper functions
function extractLocationFromEmail(email: string): string {
  // Try to extract location hints from email domain
  return '';
}

function extractTechnologies(content: string): string[] {
  const techKeywords = [
    'QuickBooks', 'Sage', 'Xero', 'Procore', 'Buildertrend', 'CoConstruct',
    'Jobber', 'ServiceTitan', 'FieldPulse', 'Housecall Pro', 'monday.com',
    'Asana', 'Trello', 'Slack', 'Microsoft', 'Google Workspace', 'Salesforce',
  ];
  
  const found: string[] = [];
  techKeywords.forEach(tech => {
    if (content.toLowerCase().includes(tech.toLowerCase())) {
      found.push(tech);
    }
  });
  
  return found;
}

function generateATLASInsights(results: any[], assessmentData: any): string[] {
  if (results.length === 0) return [];
  
  return [
    `Found ${results.length} relevant examples in ATLAS database`,
    `Similar customers have seen success with Appello`,
    `Case studies available for ${assessmentData.section1?.trade || 'this trade'}`,
  ];
}

/**
 * Fallback function to extract company history from content
 */
function extractCompanyHistoryFallback(content: string): any {
  const history: any = {};
  
  // Try to extract founding year
  const yearMatch = content.match(/(?:founded|established|since|since\s+)(?:in\s+)?(\d{4})/i);
  if (yearMatch) {
    history.foundingYear = parseInt(yearMatch[1]);
    history.founded = yearMatch[1];
  }
  
  // Try to extract headquarters
  const hqMatch = content.match(/(?:headquarters|based in|located in|head office)[:\s]+([^,\n]+(?:,\s*[A-Z]{2})?)/i);
  if (hqMatch) {
    history.headquarters = hqMatch[1].trim();
  }
  
  return Object.keys(history).length > 0 ? history : undefined;
}

