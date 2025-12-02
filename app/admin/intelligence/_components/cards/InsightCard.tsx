import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, Sparkles, Rocket, Lightbulb } from 'lucide-react';

interface InsightCardProps {
  insight: { text: string; count: number; dealNames: string[]; priority: string };
  type: 'risk' | 'opportunity' | 'action' | 'insight';
}

export function InsightCard({ insight, type }: InsightCardProps) {
  const typeConfig = {
    risk: { color: 'border-red-500/30 bg-red-500/5', icon: AlertTriangle, iconColor: 'text-red-400' },
    opportunity: { color: 'border-emerald-500/30 bg-emerald-500/5', icon: Sparkles, iconColor: 'text-emerald-400' },
    action: { color: 'border-purple-500/30 bg-purple-500/5', icon: Rocket, iconColor: 'text-purple-400' },
    insight: { color: 'border-blue-500/30 bg-blue-500/5', icon: Lightbulb, iconColor: 'text-blue-400' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`p-3 rounded-lg border ${config.color}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 leading-tight capitalize">{insight.text}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {insight.count} {insight.count === 1 ? 'deal' : 'deals'}
            </Badge>
            <Tooltip>
              <TooltipTrigger>
                <span className="text-xs text-slate-500 truncate max-w-[150px]">
                  {insight.dealNames.slice(0, 2).join(', ')}
                  {insight.dealNames.length > 2 && ` +${insight.dealNames.length - 2}`}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{insight.dealNames.join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

