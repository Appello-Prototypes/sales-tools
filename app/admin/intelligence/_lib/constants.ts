import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Flame,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface StatusConfig {
  color: string;
  bgColor: string;
  icon: LucideIcon;
  label: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { color: 'text-slate-400', bgColor: 'bg-slate-500/10', icon: Clock, label: 'Pending' },
  running: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: Loader2, label: 'Running' },
  complete: { color: 'text-green-400', bgColor: 'bg-green-500/10', icon: CheckCircle2, label: 'Complete' },
  error: { color: 'text-red-400', bgColor: 'bg-red-500/10', icon: XCircle, label: 'Error' },
  cancelled: { color: 'text-slate-400', bgColor: 'bg-slate-500/10', icon: XCircle, label: 'Cancelled' },
};

export interface PriorityConfig {
  color: string;
  bgColor: string;
  icon: LucideIcon;
}

export const getPriorityConfig = (priority: string): PriorityConfig => {
  switch (priority) {
    case 'Hot': return { color: 'text-red-500', bgColor: 'bg-red-500/10', icon: Flame };
    case 'Warm': return { color: 'text-orange-500', bgColor: 'bg-orange-500/10', icon: Target };
    case 'Cool': return { color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: Target };
    case 'Cold':
    default: return { color: 'text-slate-400', bgColor: 'bg-slate-500/10', icon: Target };
  }
};

export interface HealthConfig {
  color: string;
  bgColor: string;
}

export const getHealthConfig = (health: string): HealthConfig => {
  switch (health) {
    case 'Excellent': return { color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' };
    case 'Good': return { color: 'text-green-500', bgColor: 'bg-green-500/10' };
    case 'Fair': return { color: 'text-amber-500', bgColor: 'bg-amber-500/10' };
    case 'At Risk': return { color: 'text-orange-500', bgColor: 'bg-orange-500/10' };
    case 'Critical': return { color: 'text-red-500', bgColor: 'bg-red-500/10' };
    default: return { color: 'text-slate-500', bgColor: 'bg-slate-500/10' };
  }
};

