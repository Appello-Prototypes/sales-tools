'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ActivityLogEntry {
  step: string;
  message: string;
  status: 'loading' | 'complete' | 'error' | 'warning' | 'info';
  data?: {
    tool?: string;
    input?: any;
    result?: any;
    query?: string;
    reasoning?: string;
    duration?: string;
    resultCount?: number;
    text?: string;
    fullText?: string;
    description?: string;
    error?: string;
    message?: string;
    iterations?: number;
    toolCalls?: number;
    iteration?: number;
    [key: string]: any;
  };
  timestamp: Date;
}

export interface AgentActivityLogProps {
  /** Array of log entries to display */
  logs: ActivityLogEntry[];
  
  /** Whether the agent is currently processing */
  isLoading?: boolean;
  
  /** Maximum height of the log container (default: 500px) */
  maxHeight?: string;
  
  /** Title to display in the header */
  title?: string;
  
  /** Subtitle for the header */
  subtitle?: string;
  
  /** Whether to show the pulsing indicator when loading */
  showPulse?: boolean;
  
  /** Custom class name for the container */
  className?: string;
  
  /** Whether to auto-scroll to bottom on new entries */
  autoScroll?: boolean;
}

// ============================================================================
// Status Colors
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  loading: 'text-blue-400',
  complete: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  info: 'text-cyan-400',
};

const BORDER_COLORS: Record<string, string> = {
  'tool-call': 'border-blue-900',
  'tool-result': 'border-green-900',
  'agent-response': 'border-purple-900',
  'agent-start': 'border-amber-900',
  'agent-error': 'border-red-900',
  'agent-complete': 'border-green-700',
};

// ============================================================================
// Component
// ============================================================================

export function AgentActivityLog({
  logs,
  isLoading = false,
  maxHeight = '500px',
  title = 'AI Agent Activity Log',
  subtitle = 'Full audit trail',
  showPulse = true,
  className = '',
  autoScroll = true,
}: AgentActivityLogProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getBorderColor = (step: string) => {
    for (const [key, color] of Object.entries(BORDER_COLORS)) {
      if (step.startsWith(key) || step === key) {
        return color;
      }
    }
    return 'border-gray-700';
  };

  return (
    <div className={`p-3 bg-gray-900 rounded-lg font-mono text-xs overflow-x-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 text-gray-400 border-b border-gray-700 pb-2">
        {showPulse && isLoading && (
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        )}
        {showPulse && !isLoading && logs.length > 0 && (
          <span className="w-2 h-2 rounded-full bg-gray-500" />
        )}
        <span>{title}</span>
        <span className="ml-auto text-[10px] text-gray-600">{subtitle}</span>
      </div>

      {/* Logs Container */}
      <div 
        ref={scrollRef}
        className="space-y-1 overflow-y-auto"
        style={{ maxHeight }}
      >
        {logs.map((log, idx) => (
          <div key={idx} className="space-y-1">
            {/* Main Log Entry */}
            <div className={`flex items-start gap-2 ${STATUS_COLORS[log.status] || 'text-gray-400'}`}>
              <span className="text-gray-600 flex-shrink-0">
                {formatTime(log.timestamp)}
              </span>
              <span className="flex-shrink-0">
                {log.status === 'loading' && (
                  <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
              </span>
              <span>{log.message}</span>
            </div>

            {/* Tool Call Details */}
            {log.step?.startsWith('tool-call-') && log.data && (
              <ToolCallBlock data={log.data} />
            )}

            {/* Tool Result Details */}
            {log.step?.startsWith('tool-result-') && log.data && (
              <ToolResultBlock data={log.data} />
            )}

            {/* Agent Reasoning */}
            {log.step === 'agent-response' && log.data?.fullText && (
              <ReasoningBlock data={log.data} />
            )}

            {/* Agent Start Description */}
            {log.step === 'agent-start' && log.data?.description && (
              <DescriptionBlock description={log.data.description} />
            )}

            {/* Agent Error */}
            {log.step === 'agent-error' && log.data && (
              <ErrorBlock data={log.data} />
            )}

            {/* Agent Complete Stats */}
            {log.step === 'agent-complete' && log.data && (
              <CompleteBlock data={log.data} />
            )}
          </div>
        ))}

        {/* Loading Cursor */}
        {isLoading && logs.length > 0 && (
          <div className="text-gray-500 animate-pulse">
            <span className="inline-block">_</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ToolCallBlock({ data }: { data: ActivityLogEntry['data'] }) {
  return (
    <div className="ml-16 mt-1 p-2 bg-gray-800 rounded border border-blue-900">
      <div className="text-[10px] text-blue-500 mb-1 font-semibold">
        🔧 TOOL CALL: {data?.tool}
      </div>
      {data?.reasoning && (
        <div className="text-[10px] text-blue-300 mb-2 italic">
          <span className="text-gray-500">Reasoning: </span>{data.reasoning}
        </div>
      )}
      {data?.input && (
        <details open>
          <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400">
            Input parameters
          </summary>
          <pre className="text-blue-300 text-[10px] whitespace-pre-wrap break-all mt-1">
            {JSON.stringify(data.input, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function ToolResultBlock({ data }: { data: ActivityLogEntry['data'] }) {
  return (
    <div className="ml-16 mt-1 p-2 bg-gray-800 rounded border border-green-900">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-green-500 font-semibold">
          ✅ RESULT: {data?.tool}
        </span>
        {data?.duration && (
          <span className="text-[10px] text-gray-600">({data.duration})</span>
        )}
        {data?.resultCount !== undefined && (
          <span className="text-[10px] text-green-400">• {data.resultCount} records</span>
        )}
      </div>
      {data?.query && (
        <div className="text-[10px] text-cyan-300 mb-2">
          <span className="text-gray-500">Query: </span>"{data.query}"
        </div>
      )}
      {data?.result && (
        <details>
          <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400">
            View full response data...
          </summary>
          <pre className="text-green-300 text-[10px] whitespace-pre-wrap break-all mt-1 max-h-60 overflow-y-auto">
            {JSON.stringify(data.result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function ReasoningBlock({ data }: { data: ActivityLogEntry['data'] }) {
  const text = data?.text || '';
  const fullText = data?.fullText || '';
  
  return (
    <div className="ml-16 mt-1 p-2 bg-gray-800 rounded border border-purple-900">
      <div className="text-[10px] text-purple-500 mb-1 font-semibold">
        💭 AGENT REASONING
      </div>
      <div className="text-purple-300 text-[10px] whitespace-pre-wrap">
        {text}
      </div>
      {fullText.length > text.length && (
        <details className="mt-2">
          <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400">
            View full reasoning...
          </summary>
          <pre className="text-purple-300 text-[10px] whitespace-pre-wrap mt-1 max-h-48 overflow-y-auto">
            {fullText}
          </pre>
        </details>
      )}
    </div>
  );
}

function DescriptionBlock({ description }: { description: string }) {
  return (
    <div className="ml-16 mt-1 p-2 bg-gray-800 rounded border border-amber-900">
      <div className="text-[10px] text-amber-400">
        {description}
      </div>
    </div>
  );
}

function ErrorBlock({ data }: { data: ActivityLogEntry['data'] }) {
  return (
    <div className="ml-16 mt-1 p-2 bg-gray-800 rounded border border-red-900">
      <div className="text-[10px] text-red-500 mb-1 font-semibold">❌ AGENT ERROR</div>
      <div className="text-[10px] text-red-300">
        {data?.message || data?.error}
      </div>
      {data?.iteration && (
        <div className="text-[10px] text-gray-500 mt-1">
          At iteration: {data.iteration}
        </div>
      )}
    </div>
  );
}

function CompleteBlock({ data }: { data: ActivityLogEntry['data'] }) {
  return (
    <div className="ml-16 mt-1 p-2 bg-gray-800 rounded border border-green-700">
      <div className="text-[10px] text-green-500 font-semibold">📊 ANALYSIS STATS</div>
      <div className="text-[10px] text-green-300 mt-1">
        • Iterations: {data?.iterations} | Tool calls: {data?.toolCalls}
      </div>
    </div>
  );
}

// ============================================================================
// Hook for managing activity logs with SSE
// ============================================================================

export interface UseAgentStreamOptions {
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useAgentStream(options: UseAgentStreamOptions = {}) {
  const [logs, setLogs] = React.useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any>(null);

  const startStream = React.useCallback(async (url: string) => {
    setLogs([]);
    setError(null);
    setResult(null);
    setIsLoading(true);

    // Add initial log
    setLogs([{
      step: 'start',
      message: 'Starting AI analysis...',
      status: 'loading',
      timestamp: new Date()
    }]);

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.substring(7);
          } else if (line.startsWith('data: ')) {
            currentData = line.substring(6);

            if (currentEvent && currentData) {
              try {
                const data = JSON.parse(currentData);

                if (currentEvent === 'progress') {
                  setLogs(prev => {
                    const existingIndex = prev.findIndex(p => p.step === data.step);
                    if (existingIndex >= 0) {
                      const updated = [...prev];
                      updated[existingIndex] = { ...data, timestamp: new Date() };
                      return updated;
                    }
                    return [...prev, { ...data, timestamp: new Date() }];
                  });
                } else if (currentEvent === 'complete') {
                  setResult(data);
                  setLogs(prev => [...prev, {
                    step: 'done',
                    message: '✓ Analysis complete!',
                    status: 'complete',
                    timestamp: new Date()
                  }]);
                  options.onComplete?.(data);
                } else if (currentEvent === 'error') {
                  setError(data.message);
                  setLogs(prev => [...prev, {
                    step: 'error',
                    message: `✗ Error: ${data.message}`,
                    status: 'error',
                    timestamp: new Date()
                  }]);
                  options.onError?.(data.message);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }

              currentEvent = '';
              currentData = '';
            }
          }
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect';
      setError(errorMessage);
      setLogs(prev => [...prev, {
        step: 'error',
        message: `✗ Connection failed: ${errorMessage}`,
        status: 'error',
        timestamp: new Date()
      }]);
      options.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options.onComplete, options.onError]);

  const reset = React.useCallback(() => {
    setLogs([]);
    setError(null);
    setResult(null);
    setIsLoading(false);
  }, []);

  return {
    logs,
    isLoading,
    error,
    result,
    startStream,
    reset,
  };
}

export default AgentActivityLog;


