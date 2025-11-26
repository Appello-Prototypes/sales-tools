/**
 * Assessment Debug Logger
 * 
 * Comprehensive logging system for assessment processing
 */

import { AuditTrail } from '../ai/auditTrail';

export interface DebugLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'submission' | 'scoring' | 'roi' | 'ai' | 'report' | 'system';
  message: string;
  data?: any;
  assessmentId?: string;
  submissionId?: string;
}

export interface AssessmentDebugLog {
  submissionId: string;
  startedAt: Date;
  completedAt?: Date;
  entries: DebugLogEntry[];
  summary: {
    totalEntries: number;
    errors: number;
    warnings: number;
    categories: Record<string, number>;
  };
}

const debugLogs: Map<string, AssessmentDebugLog> = new Map();

export function createDebugLog(submissionId: string): AssessmentDebugLog {
  const log: AssessmentDebugLog = {
    submissionId,
    startedAt: new Date(),
    entries: [],
    summary: {
      totalEntries: 0,
      errors: 0,
      warnings: 0,
      categories: {},
    },
  };
  debugLogs.set(submissionId, log);
  return log;
}

export function addDebugLog(
  submissionId: string,
  level: DebugLogEntry['level'],
  category: DebugLogEntry['category'],
  message: string,
  data?: any
): void {
  let log = debugLogs.get(submissionId);
  if (!log) {
    log = createDebugLog(submissionId);
  }
  
  const entry: DebugLogEntry = {
    timestamp: new Date(),
    level,
    category,
    message,
    data,
    submissionId,
  };
  
  log.entries.push(entry);
  log.summary.totalEntries++;
  
  if (level === 'error') log.summary.errors++;
  if (level === 'warn') log.summary.warnings++;
  
  log.summary.categories[category] = (log.summary.categories[category] || 0) + 1;
  
  // Also log to console for development
  const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  logMethod(`[${category.toUpperCase()}] ${message}`, data || '');
}

export function finalizeDebugLog(submissionId: string): void {
  const log = debugLogs.get(submissionId);
  if (log) {
    log.completedAt = new Date();
  }
}

export function getDebugLog(submissionId: string): AssessmentDebugLog | undefined {
  return debugLogs.get(submissionId);
}

export function getAllDebugLogs(): AssessmentDebugLog[] {
  return Array.from(debugLogs.values());
}

export function clearDebugLogs(): void {
  debugLogs.clear();
}

// Helper functions for common logging scenarios
export const logSubmission = (submissionId: string, message: string, data?: any) =>
  addDebugLog(submissionId, 'info', 'submission', message, data);

export const logScoring = (submissionId: string, message: string, data?: any) =>
  addDebugLog(submissionId, 'debug', 'scoring', message, data);

export const logROI = (submissionId: string, message: string, data?: any) =>
  addDebugLog(submissionId, 'debug', 'roi', message, data);

export const logAI = (submissionId: string, message: string, data?: any) =>
  addDebugLog(submissionId, 'info', 'ai', message, data);

export const logReport = (submissionId: string, message: string, data?: any) =>
  addDebugLog(submissionId, 'info', 'report', message, data);

export const logError = (submissionId: string, category: DebugLogEntry['category'], message: string, error?: any) =>
  addDebugLog(submissionId, 'error', category, message, { error: error?.message || error, stack: error?.stack });

export const logWarning = (submissionId: string, category: DebugLogEntry['category'], message: string, data?: any) =>
  addDebugLog(submissionId, 'warn', category, message, data);

