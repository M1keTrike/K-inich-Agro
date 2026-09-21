import React from 'react';
import { Droplets, Zap, Leaf } from 'lucide-react';

interface ResourceProgressBarProps {
  resourceType: 'water' | 'energy' | 'biomass';
  value: number; // 0–100
  colorStatus: 'safe' | 'caution' | 'danger';
  displayValue?: string; // e.g. "120 L", "450 W"
}

const resourceConfig = {
  water:   { label: 'Agua',    Icon: Droplets },
  energy:  { label: 'Energía', Icon: Zap },
  biomass: { label: 'Biomasa', Icon: Leaf },
};

const colorMap: Record<ResourceProgressBarProps['colorStatus'], string> = {
  safe:    'bg-green-500',
  caution: 'bg-yellow-400',
  danger:  'bg-red-500',
};

export function ResourceProgressBar({ resourceType, value, colorStatus, displayValue }: ResourceProgressBarProps) {
  const { label, Icon } = resourceConfig[resourceType];
  const fillColor = colorMap[colorStatus];
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {label}
        </span>
        <span className="text-slate-500 text-xs">{displayValue ?? `${clampedValue.toFixed(0)}%`}</span>
      </div>
      <div
        className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillColor}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
