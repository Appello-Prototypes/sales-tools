import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  large?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  large = false,
}: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/10 text-blue-400',
    green: 'from-emerald-500/20 to-green-500/10 text-emerald-400',
    amber: 'from-amber-500/20 to-yellow-500/10 text-amber-400',
    red: 'from-red-500/20 to-rose-500/10 text-red-400',
    purple: 'from-purple-500/20 to-violet-500/10 text-purple-400',
    slate: 'from-slate-500/20 to-slate-500/10 text-slate-400',
  };

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <Card className={`relative overflow-hidden ${large ? 'p-6' : 'p-4'}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-50`} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{title}</p>
            <p className={`font-bold ${large ? 'text-3xl' : 'text-2xl'} text-slate-100`}>{value}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
            <Icon className={`${large ? 'h-6 w-6' : 'h-5 w-5'} ${colorClasses[color].split(' ').pop()}`} />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-xs">{trendValue}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

