import { formatCurrency } from '../../_lib/utils';
import type { AnalyticsData } from '../../_lib/types';

interface PriorityBarProps {
  data: AnalyticsData['priorityDistribution'];
  showValues?: boolean;
}

export function PriorityBar({ data, showValues = true }: PriorityBarProps) {
  const total = data.hot + data.warm + data.cool + data.cold;
  if (total === 0) return null;

  const segments = [
    { key: 'hot', label: 'Hot', count: data.hot, value: data.hotValue, color: 'bg-red-500' },
    { key: 'warm', label: 'Warm', count: data.warm, value: data.warmValue, color: 'bg-orange-500' },
    { key: 'cool', label: 'Cool', count: data.cool, value: data.coolValue, color: 'bg-blue-500' },
    { key: 'cold', label: 'Cold', count: data.cold, value: data.coldValue, color: 'bg-slate-500' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
        {segments.map(seg => (
          <div
            key={seg.key}
            className={`${seg.color} transition-all`}
            style={{ width: `${(seg.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs">
        {segments.map(seg => (
          <div key={seg.key} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${seg.color}`} />
            <span className="text-slate-400">{seg.label}</span>
            <span className="text-slate-300 font-medium">{seg.count}</span>
            {showValues && <span className="text-slate-500">({formatCurrency(seg.value)})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

