'use client';
import React, { useState } from 'react';
import { ParetoScenario } from '@/types';
import { StatePill } from '@/components/ui/StatePill';
import { ResourceProgressBar } from '@/components/ui/ResourceProgressBar';
import { Button } from '@/components/ui/Button';

interface Props {
  scenario: ParetoScenario;
  onVote: (id: string) => Promise<void>;
  disabled: boolean;
}

function getSurvivalStatus(index: number): 'stable' | 'warning' | 'critical' {
  if (index >= 0.8) return 'stable';
  if (index >= 0.4) return 'warning';
  return 'critical';
}

function getSurvivalColorStatus(index: number): 'safe' | 'caution' | 'danger' {
  if (index >= 0.8) return 'safe';
  if (index >= 0.4) return 'caution';
  return 'danger';
}

const MAX_WATER_LITERS = 5000;
const MAX_ENERGY_WATTS = 10000;

export function ScenarioCard({ scenario, onVote, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    setLoading(true);
    await onVote(scenario.scenario_id);
    setLoading(false);
  };

  const isUnavailable = scenario.scenario_id === 'unavailable';

  if (isUnavailable) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-5 flex flex-col items-center justify-center h-full opacity-60">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Alternativa no viable</h4>
        <p className="text-xs text-gray-400 text-center">
          Las restricciones actuales limitan las alternativas disponibles en este arquetipo.
        </p>
      </div>
    );
  }

  const survivalPct = scenario.fitness_score * 100;
  const survivalStatus = getSurvivalStatus(scenario.fitness_score);
  const survivalColorStatus = getSurvivalColorStatus(scenario.fitness_score);

  const waterPct  = Math.min(100, (scenario.water_liters_per_day / MAX_WATER_LITERS) * 100);
  const energyPct = Math.min(100, (scenario.energy_kwh_per_day / MAX_ENERGY_WATTS) * 100);

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-md p-5 flex flex-col justify-between h-full hover:border-gray-300 hover:shadow-md transition-all">
      <div>
        <div className="flex items-start justify-between gap-2 mb-4">
          <h4 className="text-sm font-semibold text-slate-700 leading-tight">
            {scenario.label}
          </h4>
          <StatePill
            label={survivalStatus === 'stable' ? 'Óptimo' : survivalStatus === 'warning' ? 'Regular' : 'Bajo'}
            status={survivalStatus}
          />
        </div>

        <div className="mb-5">
          <p className="text-xs text-slate-500 mb-1">Fitness Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={survivalPct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${survivalColorStatus === 'safe' ? 'bg-green-500' : survivalColorStatus === 'caution' ? 'bg-yellow-400' : 'bg-red-500'}`}
                style={{ width: `${survivalPct}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-700 w-10 text-right">{survivalPct.toFixed(0)}%</span>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <ResourceProgressBar
            resourceType="water"
            value={waterPct}
            colorStatus={waterPct >= 60 ? 'safe' : waterPct >= 30 ? 'caution' : 'danger'}
            displayValue={`${scenario.water_liters_per_day.toFixed(0)} L`}
          />
          <ResourceProgressBar
            resourceType="energy"
            value={energyPct}
            colorStatus={energyPct >= 60 ? 'safe' : energyPct >= 30 ? 'caution' : 'danger'}
            displayValue={`${scenario.energy_kwh_per_day.toFixed(0)} kWh`}
          />
        </div>

        <div className="mb-4 text-xs text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded flex flex-col space-y-1">
          <span>Agua humana: {scenario.water_human_liters.toFixed(0)} L</span>
          <span>Agua riego: {scenario.water_irrigation_liters.toFixed(0)} L</span>
          <span>Energía hábitat: {scenario.energy_habitat_kwh.toFixed(0)} kWh</span>
          <span>Energía agro: {scenario.energy_agro_kwh.toFixed(0)} kWh</span>
        </div>
      </div>

      <Button
        onClick={handleVote}
        disabled={disabled || loading}
        isLoading={loading}
        loadingText="Aplicando..."
        className="w-full mt-2"
      >
        Votar y Aplicar
      </Button>
    </div>
  );
}
