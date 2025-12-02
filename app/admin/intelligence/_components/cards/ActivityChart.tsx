import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency } from '../../_lib/utils';

interface ActivityChartProps {
  data: Array<{ date: string; count: number; value: number }>;
}

export function ActivityChart({ data }: ActivityChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((day) => (
        <Tooltip key={day.date}>
          <TooltipTrigger asChild>
            <div
              className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ height: `${Math.max((day.count / maxCount) * 100, 4)}%` }}
            />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs font-medium">{new Date(day.date).toLocaleDateString()}</p>
            <p className="text-xs text-slate-400">{day.count} analyses • {formatCurrency(day.value)}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

