import React from 'react';
import { SystemState } from '@/types';
import { StatePill } from '@/components/ui/StatePill';
import { ResourceProgressBar } from '@/components/ui/ResourceProgressBar';

interface Props {
  state: SystemState;
}

// Reference maximums for visualizing progress bars
const MAX_WATER_LITERS  = 5000;
const MAX_ENERGY_WATTS  = 10000;
const MAX_BIOMASS_KG    = 2000;

function getColorStatus(pct: number): 'safe' | 'caution' | 'danger' {
  if (pct >= 60) return 'safe';
  if (pct >= 30) return 'caution';
  return 'danger';
}

export function StateIndicators({ state }: Props) {
  const isCrisis = state.status === 'crisis_paused';

  const waterPct  = Math.min(100, (state.water_liters / MAX_WATER_LITERS) * 100);
  const energyPct = Math.min(100, (state.energy_watts / MAX_ENERGY_WATTS) * 100);
  const biomassPct = Math.min(100, (state.biomass_kg / MAX_BIOMASS_KG) * 100);

  const systemStatus = isCrisis ? 'critical' : 'stable';
  const systemLabel  = isCrisis ? 'Crisis activa' : 'Sistema estable';

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-700">Estado del sistema</h2>
        <StatePill label={systemLabel} status={systemStatus} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResourceProgressBar
          resourceType="water"
          value={waterPct}
          colorStatus={getColorStatus(waterPct)}
          displayValue={`${state.water_liters.toFixed(0)} L`}
        />
        <ResourceProgressBar
          resourceType="energy"
          value={energyPct}
          colorStatus={getColorStatus(energyPct)}
          displayValue={`${state.energy_watts.toFixed(0)} W`}
        />
        <ResourceProgressBar
          resourceType="biomass"
          value={biomassPct}
          colorStatus={getColorStatus(biomassPct)}
          displayValue={`${state.biomass_kg.toFixed(0)} kg`}
        />
      </div>
    </div>
  );
}
