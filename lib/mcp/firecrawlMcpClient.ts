/**
 * Firecrawl MCP Client
 * 
 * Provides web scraping and search capabilities for the AI agent.
 * Uses the Firecrawl API directly for reliable server-side access.
 */

import { FIRECRAWL_API_KEY } from '@/lib/config';

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';

/**
 * Scrape a single URL and extract its content
 */
export async function scrapeUrl(url: string, options: {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
} = {}): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> {
  try {
    if (!FIRECRAWL_API_KEY) {
      return { success: false, error: 'Firecrawl API key not configured' };
    }

    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: options.formats || ['markdown'],
        onlyMainContent: options.onlyMainContent ?? true,
        includeTags: options.includeTags,
        excludeTags: options.excludeTags,
        waitFor: options.waitFor,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Firecrawl scrape failed: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return { success: true, result: data };
  } catch (error: any) {
    console.error('Error scraping with Firecrawl:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search the web and optionally scrape results
 */
export async function searchWeb(query: string, options: {
  limit?: number;
  scrapeOptions?: {
    formats?: ('markdown' | 'html')[];
    onlyMainContent?: boolean;
  };
} = {}): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> {
  try {
    if (!FIRECRAWL_API_KEY) {
      return { success: false, error: 'Firecrawl API key not configured' };
    }

    const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: options.limit || 5,
        scrapeOptions: options.scrapeOptions,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Firecrawl search failed: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return { success: true, result: data };
  } catch (error: any) {
    console.error('Error searching with Firecrawl:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Map a website to discover URLs
 */
export async function mapWebsite(url: string, options: {
  limit?: number;
  search?: string;
  includeSubdomains?: boolean;
} = {}): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> {
  try {
    if (!FIRECRAWL_API_KEY) {
      return { success: false, error: 'Firecrawl API key not configured' };
    }

    const response = await fetch(`${FIRECRAWL_BASE_URL}/map`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        limit: options.limit || 100,
        search: options.search,
        includeSubdomains: options.includeSubdomains ?? false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Firecrawl map failed: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return { success: true, result: data };
  } catch (error: any) {
    console.error('Error mapping with Firecrawl:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Firecrawl status
 */
export async function getFirecrawlStatus(): Promise<{
  connected: boolean;
  available: boolean;
  error?: string;
}> {
  if (!FIRECRAWL_API_KEY) {
    return {
      connected: false,
      available: false,
      error: 'Firecrawl API key not configured'
    };
  }

  return {
    connected: true,
    available: true,
  };
}

