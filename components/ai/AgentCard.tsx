'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  User,
  Mail,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  Pause,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Clock,
  Search,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import type { AgentInstance, AgentStatus } from '@/lib/store/agentStore';

// ============================================================================
// Types
// ============================================================================

interface AgentCardProps {
  agent: AgentInstance;
  onCancel?: () => void;
  onRemove?: () => void;
  onToggleMinimize?: () => void;
  onViewLetter?: (agent: AgentInstance) => void;
}

// ============================================================================
// Status Configuration
// ============================================================================

const STATUS_CONFIG: Record<AgentStatus, { 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
}> = {
  idle: {
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    icon: <Clock className="h-3 w-3" />,
    label: 'Idle',
  },
  preparing: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    label: 'Preparing',
  },
  researching: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: <Search className="h-3 w-3 animate-pulse" />,
    label: 'Researching',
  },
  generating: {
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    icon: <Sparkles className="h-3 w-3 animate-pulse" />,
    label: 'Generating',
  },
  complete: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Complete',
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Error',
  },
  cancelled: {
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    icon: <X className="h-3 w-3" />,
    label: 'Cancelled',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(start: Date | string, end?: Date | string): string {
  try {
    const startTime = start instanceof Date ? start : new Date(start);
    const endTime = end ? (end instanceof Date ? end : new Date(end)) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    if (isNaN(diff) || diff < 0) return '0s';
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } catch {
    return '0s';
  }
}

function formatTime(date: Date | string): string {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--:--';
  }
}

// ============================================================================
// Component
// ============================================================================

export function AgentCard({
  agent,
  onCancel,
  onRemove,
  onToggleMinimize,
  onViewLetter,
}: AgentCardProps) {
  const [copied, setCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);
  const statusConfig = STATUS_CONFIG[agent.status];
  const isRunning = ['preparing', 'researching', 'generating'].includes(agent.status);
  
  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current && showLogs) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [agent.logs, showLogs]);
  
  // Copy letter to clipboard
  const handleCopy = () => {
    if (agent.result?.letter) {
      navigator.clipboard.writeText(agent.result.letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // If minimized, show compact view
  if (agent.isMinimized) {
    return (
      <div 
        className={`
          flex items-center gap-3 p-3 rounded-lg border cursor-pointer
          transition-all hover:bg-slate-700/30
          ${statusConfig.bgColor} ${statusConfig.borderColor}
        `}
        onClick={onToggleMinimize}
      >
        <div className={`flex-shrink-0 ${statusConfig.color}`}>
          {statusConfig.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm truncate">
              {agent.name}
            </span>
            <Badge className={`text-[10px] ${statusConfig.bgColor} ${statusConfig.color} border-0`}>
              {statusConfig.label}
            </Badge>
          </div>
          <div className="text-xs text-slate-500 truncate">
            {agent.target.letterType} • {formatDuration(agent.startedAt, agent.completedAt)}
          </div>
        </div>
        <Maximize2 className="h-4 w-4 text-slate-500" />
      </div>
    );
  }
  
  return (
    <Card className={`
      bg-slate-800/50 border transition-all
      ${statusConfig.borderColor}
      ${isRunning ? 'shadow-lg shadow-violet-500/5' : ''}
    `}>
      {/* Header */}
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex-shrink-0 p-1.5 rounded-lg ${statusConfig.bgColor}`}>
              <Building2 className={`h-4 w-4 ${statusConfig.color}`} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-white text-base truncate">
                {agent.name}
              </CardTitle>
              {agent.target.contactName && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <User className="h-3 w-3" />
                  <span className="truncate">{agent.target.contactName}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Status Badge */}
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 gap-1`}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
            
            {/* Minimize Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300"
              onClick={onToggleMinimize}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            
            {/* Close/Cancel Button */}
            {isRunning ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={onCancel}
              >
                <X className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300"
                onClick={onRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-3 space-y-3">
        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {agent.target.letterType.replace(/_/g, ' ')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(agent.startedAt, agent.completedAt)}
          </span>
          {agent.stats && (
            <span className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              {agent.stats.toolCalls} queries
            </span>
          )}
        </div>
        
        {/* Progress/Activity Preview */}
        {isRunning && agent.logs.length > 0 && (
          <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-300 truncate">
                {agent.logs[agent.logs.length - 1]?.message || 'Processing...'}
              </span>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {agent.status === 'error' && agent.error && (
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
            <div className="flex items-start gap-2 text-xs text-red-400">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{agent.error}</span>
            </div>
          </div>
        )}
        
        {/* Result Preview */}
        {agent.status === 'complete' && agent.result && (
          <div className="space-y-2">
            {/* Subject */}
            {agent.result.subject && (
              <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase mb-0.5">Subject</div>
                <div className="text-sm text-white truncate">{agent.result.subject}</div>
              </div>
            )}
            
            {/* Letter Preview */}
            <div className="p-2 bg-white/5 rounded-lg border border-slate-700 max-h-32 overflow-hidden relative">
              <div className="text-xs text-slate-300 line-clamp-4">
                {agent.result.letter}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-800 to-transparent" />
            </div>
            
            {/* Confidence */}
            {agent.result.confidence && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Confidence:</span>
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    style={{ width: `${agent.result.confidence * 100}%` }}
                  />
                </div>
                <span className="text-emerald-400">{Math.round(agent.result.confidence * 100)}%</span>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                onClick={() => onViewLetter?.(agent)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Full
              </Button>
            </div>
          </div>
        )}
        
        {/* Activity Log Toggle */}
        <div
          className="flex items-center justify-between text-xs text-slate-500 cursor-pointer hover:text-slate-400"
          onClick={() => setShowLogs(!showLogs)}
        >
          <span className="flex items-center gap-1">
            {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Activity Log ({agent.logs.length})
          </span>
          <span className="text-[10px]">
            Started {formatTime(agent.startedAt)}
          </span>
        </div>
        
        {/* Activity Log */}
        {showLogs && (
          <div 
            ref={logsRef}
            className="p-2 bg-slate-900 rounded-lg font-mono text-[10px] max-h-48 overflow-y-auto space-y-1"
          >
            {agent.logs.length === 0 ? (
              <div className="text-slate-500 text-center py-2">No activity yet...</div>
            ) : (
              agent.logs.map((log, i) => (
                <div key={i} className={`flex items-start gap-2 ${
                  log.status === 'complete' ? 'text-green-400' :
                  log.status === 'error' ? 'text-red-400' :
                  log.status === 'warning' ? 'text-amber-400' :
                  log.status === 'loading' ? 'text-blue-400' :
                  'text-slate-400'
                }`}>
                  <span className="text-slate-600 flex-shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className="break-words">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentCard;

