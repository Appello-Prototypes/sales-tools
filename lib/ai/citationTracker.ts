/**
 * Citation and Reference Tracking System
 * 
 * Tracks sources, quotes, stats, and references for all AI-generated content
 */

export interface Citation {
  id: string;
  type: 'ai_generated' | 'structured_data' | 'web_research' | 'atlas_query' | 'firecrawl_search' | 'company_website' | 'industry_data';
  source: string; // e.g., "Claude Sonnet 4.5", "ATLAS Database", "Firecrawl Search", "Company Website"
  sourceUrl?: string; // URL if applicable
  timestamp: Date;
  data?: any; // Original data used
  query?: string; // Query or prompt used
  confidence?: number; // 0-1 confidence score
}

export interface CitedContent {
  content: string;
  citations: Citation[];
  aiGenerated: boolean;
  structuredData: boolean;
}

export interface Statistic {
  value: string | number;
  label: string;
  source: Citation;
  confidence: number;
}

export interface Quote {
  text: string;
  attribution?: string;
  source: Citation;
  context?: string;
}

/**
 * Citation Tracker - manages all citations for a report
 */
export class CitationTracker {
  private citations: Map<string, Citation> = new Map();
  private contentCitations: Map<string, string[]> = new Map(); // content hash -> citation IDs

  /**
   * Add a citation
   */
  addCitation(citation: Omit<Citation, 'id' | 'timestamp'>): string {
    const id = `cite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullCitation: Citation = {
      ...citation,
      id,
      timestamp: new Date(),
    };
    this.citations.set(id, fullCitation);
    return id;
  }

  /**
   * Link content to citations
   */
  linkContent(content: string, citationIds: string[]): void {
    const hash = this.hashContent(content);
    this.contentCitations.set(hash, citationIds);
  }

  /**
   * Get citations for content
   */
  getCitationsForContent(content: string): Citation[] {
    const hash = this.hashContent(content);
    const citationIds = this.contentCitations.get(hash) || [];
    return citationIds.map(id => this.citations.get(id)).filter(Boolean) as Citation[];
  }

  /**
   * Get all citations
   */
  getAllCitations(): Citation[] {
    return Array.from(this.citations.values());
  }

  /**
   * Get citation by ID
   */
  getCitation(id: string): Citation | undefined {
    return this.citations.get(id);
  }

  /**
   * Create citation for AI-generated content
   */
  citeAI(content: string, model: string, prompt?: string, confidence?: number): string {
    return this.addCitation({
      type: 'ai_generated',
      source: model,
      query: prompt,
      data: { content },
      confidence: confidence || 0.8,
    });
  }

  /**
   * Create citation for web research
   */
  citeWebResearch(query: string, results: any[], source: string = 'Firecrawl Search'): string {
    return this.addCitation({
      type: 'firecrawl_search',
      source,
      query,
      data: { results: results.slice(0, 3) }, // Store first 3 results
      sourceUrl: results[0]?.url,
      confidence: 0.7,
    });
  }

  /**
   * Create citation for company website
   */
  citeCompanyWebsite(url: string, content: string): string {
    return this.addCitation({
      type: 'company_website',
      source: 'Company Website',
      sourceUrl: url,
      data: { contentPreview: content.substring(0, 500) },
      confidence: 0.9,
    });
  }

  /**
   * Create citation for ATLAS query
   */
  citeATLAS(query: string, results: any[]): string {
    return this.addCitation({
      type: 'atlas_query',
      source: 'ATLAS Database',
      query,
      data: { resultCount: results.length, sampleResults: results.slice(0, 2) },
      confidence: 0.85,
    });
  }

  /**
   * Create citation for structured data
   */
  citeStructuredData(source: string, data: any): string {
    return this.addCitation({
      type: 'structured_data',
      source,
      data,
      confidence: 1.0,
    });
  }

  /**
   * Create citation for industry data
   */
  citeIndustryData(source: string, data: any, url?: string): string {
    return this.addCitation({
      type: 'industry_data',
      source,
      sourceUrl: url,
      data,
      confidence: 0.75,
    });
  }

  /**
   * Format citation for display
   */
  formatCitation(citation: Citation): string {
    const parts: string[] = [];
    
    if (citation.sourceUrl) {
      parts.push(`[${citation.source}](${citation.sourceUrl})`);
    } else {
      parts.push(citation.source);
    }
    
    if (citation.timestamp) {
      parts.push(`(${citation.timestamp.toLocaleDateString()})`);
    }
    
    if (citation.confidence && citation.confidence < 0.9) {
      parts.push(`[Confidence: ${Math.round(citation.confidence * 100)}%]`);
    }
    
    return parts.join(' ');
  }

  /**
   * Generate citation badge HTML/text
   */
  generateCitationBadge(citationIds: string[]): string {
    const citations = citationIds.map(id => this.getCitation(id)).filter(Boolean) as Citation[];
    if (citations.length === 0) return '';
    
    const sources = citations.map(c => this.formatCitation(c));
    return `[Sources: ${sources.join(', ')}]`;
  }

  private hashContent(content: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
}

/**
 * Create a new citation tracker instance
 */
export function createCitationTracker(): CitationTracker {
  return new CitationTracker();
}

