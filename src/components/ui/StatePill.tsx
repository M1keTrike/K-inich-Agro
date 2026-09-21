import React from 'react';

interface StatePillProps {
  label: string;
  status: 'stable' | 'warning' | 'critical' | 'neutral';
}

const statusStyles: Record<StatePillProps['status'], string> = {
  stable:   'bg-green-100 text-green-800 border-green-200',
  warning:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
  neutral:  'bg-slate-100 text-slate-600 border-slate-200',
};

export function StatePill({ label, status }: StatePillProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}
