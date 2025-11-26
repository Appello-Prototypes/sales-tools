'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2, Sparkles, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  type: 'info' | 'success' | 'error' | 'warning' | 'step';
  message: string;
  timestamp: string;
  data?: any;
}

interface TestAssessmentLogsProps {
  onComplete?: (result: any) => void;
  onClose?: () => void;
}

export function TestAssessmentLogs({ onComplete, onClose }: TestAssessmentLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const toggleExpand = (index: number) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const startStreaming = async () => {
    setIsStreaming(true);
    setLogs([]);
    setResult(null);
    setError(null);
    setExpandedLogs(new Set());

    try {
      const response = await fetch('/api/admin/test-assessment/stream', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'success' && data.message === '✅ COMPLETE') {
                setResult(data.data);
                setIsStreaming(false);
                if (onComplete) {
                  onComplete(data.data);
                }
              } else {
                setLogs(prev => [...prev, data]);
              }
            } catch (e) {
              console.error('Error parsing log entry:', e);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to stream logs');
      setIsStreaming(false);
      setLogs(prev => [...prev, {
        type: 'error',
        message: `❌ Error: ${err.message}`,
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'step':
        return <Sparkles className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'step':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const hasDetailedData = (log: LogEntry): boolean => {
    if (!log.data) return false;
    return !!(log.data.request || log.data.response || log.data.body || 
              (typeof log.data === 'object' && Object.keys(log.data).length > 3));
  };

  const renderDetailedData = (log: LogEntry, index: number) => {
    if (!log.data) return null;

    const isExpanded = expandedLogs.has(index);
    const hasDetails = hasDetailedData(log);

    if (!hasDetails) {
      return (
        <div className="mt-2 text-xs opacity-75">
          {typeof log.data === 'object' ? (
            <pre className="whitespace-pre-wrap bg-white/50 p-2 rounded border">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          ) : (
            <div className="bg-white/50 p-2 rounded border">{String(log.data)}</div>
          )}
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        {log.data.request && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(index)}
              className="w-full flex items-center justify-between p-2 bg-blue-50 hover:bg-blue-100 text-left"
            >
              <span className="text-xs font-semibold text-blue-700">
                📤 Request
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {isExpanded && (
              <div className="p-3 bg-white border-t">
                <div className="flex justify-end mb-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(JSON.stringify(log.data.request, null, 2), index)}
                    className="h-6 text-xs"
                  >
                    {copiedIndex === index ? (
                      <><Check className="h-3 w-3 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
                <pre className="text-xs overflow-x-auto bg-gray-50 p-2 rounded border">
                  {JSON.stringify(log.data.request, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {log.data.response && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(index)}
              className="w-full flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 text-left"
            >
              <span className="text-xs font-semibold text-green-700">
                📥 Response
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {isExpanded && (
              <div className="p-3 bg-white border-t">
                <div className="flex justify-end mb-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(JSON.stringify(log.data.response, null, 2), index)}
                    className="h-6 text-xs"
                  >
                    {copiedIndex === index ? (
                      <><Check className="h-3 w-3 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
                <pre className="text-xs overflow-x-auto bg-gray-50 p-2 rounded border max-h-96 overflow-y-auto">
                  {JSON.stringify(log.data.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {!log.data.request && !log.data.response && log.data && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(index)}
              className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 text-left"
            >
              <span className="text-xs font-semibold text-gray-700">
                📋 Details
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {isExpanded && (
              <div className="p-3 bg-white border-t">
                <div className="flex justify-end mb-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(JSON.stringify(log.data, null, 2), index)}
                    className="h-6 text-xs"
                  >
                    {copiedIndex === index ? (
                      <><Check className="h-3 w-3 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
                <pre className="text-xs overflow-x-auto bg-gray-50 p-2 rounded border max-h-96 overflow-y-auto">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <Card className="w-full h-full flex flex-col m-0 rounded-none border-0">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Test Assessment Creation Logs
              </CardTitle>
              <CardDescription>
                Real-time transparency into the assessment creation process with full API audit trail
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col p-6">
        <div className="flex flex-col h-full space-y-4 min-h-0">
          {!isStreaming && logs.length === 0 && !result && !error && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Click the button below to start creating a test assessment and see real-time logs with full API calls and responses
              </p>
              <Button onClick={startStreaming} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Start Test Assessment
              </Button>
            </div>
          )}

          {isStreaming && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Processing...</span>
              </div>
              {logs.length > 0 && (
                <div className="text-xs text-blue-600 max-w-md truncate">
                  {logs[logs.length - 1]?.message || 'Initializing...'}
                </div>
              )}
            </div>
          )}

          {logs.length > 0 && (
            <div className="border rounded-lg bg-gray-900 text-gray-100 font-mono text-sm flex-1 overflow-y-auto min-h-0" style={{ height: 0 }}>
              <div className="p-4 space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={cn(
                    "mb-3 p-3 rounded border-l-4 transition-all",
                    getLogColor(log.type)
                  )}
                >
                  <div className="flex items-start gap-2">
                    {getLogIcon(log.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium break-words">{log.message}</div>
                      {renderDetailedData(log, index)}
                      <div className="text-xs opacity-50 mt-2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              <div ref={logsEndRef} className="h-1" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-red-600 mt-2">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-3">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Assessment Created Successfully!</span>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {result.data?.name}</p>
                <p><strong>Email:</strong> {result.data?.email}</p>
                <p><strong>Trade:</strong> {result.data?.trade}</p>
                <p><strong>Score:</strong> {result.score?.total} ({result.score?.grade})</p>
                <p><strong>Priority:</strong> {result.score?.priority}</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => window.open(result.reportUrl, '_blank')}
                  >
                    View Customer Report
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(result.adminUrl, '_blank')}
                  >
                    View Admin Details
                  </Button>
                  {result.adminReportUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(result.adminReportUrl, '_blank')}
                    >
                      View Sales Report
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
