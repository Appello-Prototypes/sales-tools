/**
 * AI Audit Trail System
 * 
 * Tracks all AI actions, queries, sources, and data used in report generation
 */

export interface AuditTrailEntry {
  timestamp: Date;
  action: string;
  type: 'claude_query' | 'atlas_query' | 'firecrawl_scrape' | 'firecrawl_search' | 'firecrawl_extract' | 'data_source' | 'calculation' | 'error';
  details: {
    prompt?: string;
    query?: string;
    url?: string;
    systemPrompt?: string;
    model?: string;
    options?: Record<string, any>;
    response?: {
      success: boolean;
      summary?: string;
      error?: string;
      tokenUsage?: {
        input?: number;
        output?: number;
        thinking?: number;
      };
    };
    sources?: Array<{
      type: 'atlas' | 'firecrawl' | 'database' | 'calculation';
      identifier?: string;
      url?: string;
      description?: string;
      dataSummary?: string;
    }>;
    dataUsed?: Record<string, any>;
  };
  duration?: number; // milliseconds
}

export interface AuditTrail {
  reportGeneration: {
    startedAt: Date;
    completedAt?: Date;
    totalDuration?: number;
    entries: AuditTrailEntry[];
  };
  summary: {
    totalClaudeQueries: number;
    totalAtlasQueries: number;
    totalFirecrawlActions: number;
    totalTokensUsed?: {
      input: number;
      output: number;
      thinking: number;
    };
    errors: number;
  };
}

/**
 * Create a new audit trail
 */
export function createAuditTrail(): AuditTrail {
  return {
    reportGeneration: {
      startedAt: new Date(),
      entries: [],
    },
    summary: {
      totalClaudeQueries: 0,
      totalAtlasQueries: 0,
      totalFirecrawlActions: 0,
      totalTokensUsed: {
        input: 0,
        output: 0,
        thinking: 0,
      },
      errors: 0,
    },
  };
}

/**
 * Add an entry to the audit trail
 */
export function addAuditEntry(
  auditTrail: AuditTrail,
  entry: Omit<AuditTrailEntry, 'timestamp'>
): void {
  const fullEntry: AuditTrailEntry = {
    ...entry,
    timestamp: new Date(),
  };
  
  auditTrail.reportGeneration.entries.push(fullEntry);
  
  // Update summary
  switch (entry.type) {
    case 'claude_query':
      auditTrail.summary.totalClaudeQueries++;
      if (entry.details.response?.tokenUsage) {
        auditTrail.summary.totalTokensUsed!.input += entry.details.response.tokenUsage.input || 0;
        auditTrail.summary.totalTokensUsed!.output += entry.details.response.tokenUsage.output || 0;
        auditTrail.summary.totalTokensUsed!.thinking += entry.details.response.tokenUsage.thinking || 0;
      }
      break;
    case 'atlas_query':
      auditTrail.summary.totalAtlasQueries++;
      break;
    case 'firecrawl_scrape':
    case 'firecrawl_search':
    case 'firecrawl_extract':
      auditTrail.summary.totalFirecrawlActions++;
      break;
    case 'error':
      auditTrail.summary.errors++;
      break;
  }
}

/**
 * Finalize audit trail (set completion time and duration)
 */
export function finalizeAuditTrail(auditTrail: AuditTrail): void {
  auditTrail.reportGeneration.completedAt = new Date();
  auditTrail.reportGeneration.totalDuration = 
    auditTrail.reportGeneration.completedAt.getTime() - 
    auditTrail.reportGeneration.startedAt.getTime();
}

/**
 * Format audit trail for display
 */
export function formatAuditTrail(auditTrail: AuditTrail): string {
  let output = `# AI Report Generation Audit Trail\n\n`;
  output += `**Started:** ${auditTrail.reportGeneration.startedAt.toISOString()}\n`;
  if (auditTrail.reportGeneration.completedAt) {
    output += `**Completed:** ${auditTrail.reportGeneration.completedAt.toISOString()}\n`;
    output += `**Duration:** ${(auditTrail.reportGeneration.totalDuration! / 1000).toFixed(2)}s\n`;
  }
  output += `\n## Summary\n\n`;
  output += `- Claude Queries: ${auditTrail.summary.totalClaudeQueries}\n`;
  output += `- ATLAS Queries: ${auditTrail.summary.totalAtlasQueries}\n`;
  output += `- Firecrawl Actions: ${auditTrail.summary.totalFirecrawlActions}\n`;
  output += `- Errors: ${auditTrail.summary.errors}\n`;
  
  if (auditTrail.summary.totalTokensUsed) {
    output += `\n### Token Usage\n`;
    output += `- Input: ${auditTrail.summary.totalTokensUsed.input.toLocaleString()}\n`;
    output += `- Output: ${auditTrail.summary.totalTokensUsed.output.toLocaleString()}\n`;
    output += `- Thinking: ${auditTrail.summary.totalTokensUsed.thinking.toLocaleString()}\n`;
    output += `- Total: ${(auditTrail.summary.totalTokensUsed.input + auditTrail.summary.totalTokensUsed.output + auditTrail.summary.totalTokensUsed.thinking).toLocaleString()}\n`;
  }
  
  output += `\n## Detailed Actions\n\n`;
  auditTrail.reportGeneration.entries.forEach((entry, index) => {
    output += `### ${index + 1}. ${entry.action} (${entry.type})\n`;
    output += `**Time:** ${entry.timestamp.toISOString()}\n`;
    if (entry.duration) {
      output += `**Duration:** ${entry.duration}ms\n`;
    }
    
    if (entry.details.prompt) {
      output += `\n**Prompt:**\n\`\`\`\n${entry.details.prompt.substring(0, 500)}${entry.details.prompt.length > 500 ? '...' : ''}\n\`\`\`\n`;
    }
    
    if (entry.details.query) {
      output += `\n**Query:** ${entry.details.query}\n`;
    }
    
    if (entry.details.url) {
      output += `\n**URL:** ${entry.details.url}\n`;
    }
    
    if (entry.details.sources && entry.details.sources.length > 0) {
      output += `\n**Sources:**\n`;
      entry.details.sources.forEach((source, idx) => {
        output += `${idx + 1}. ${source.type}: ${source.description || source.identifier || source.url || 'N/A'}\n`;
      });
    }
    
    if (entry.details.response) {
      output += `\n**Response:** ${entry.details.response.success ? '✅ Success' : '❌ Error'}\n`;
      if (entry.details.response.summary) {
        output += `Summary: ${entry.details.response.summary.substring(0, 200)}${entry.details.response.summary.length > 200 ? '...' : ''}\n`;
      }
      if (entry.details.response.error) {
        output += `Error: ${entry.details.response.error}\n`;
      }
    }
    
    output += `\n---\n\n`;
  });
  
  return output;
}

