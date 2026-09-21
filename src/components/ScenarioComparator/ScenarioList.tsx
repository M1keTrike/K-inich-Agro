'use client';
import React from 'react';
import { ParetoScenario } from '@/types';
import { ScenarioCard } from './ScenarioCard';

interface Props {
  scenarios: ParetoScenario[];
  onVote: (id: string) => Promise<void>;
  loading: boolean;
}

export function ScenarioList({ scenarios, onVote, loading }: Props) {
  if (loading) {
    return (
      <div className="mt-8 bg-white border border-gray-200 shadow-sm rounded-md p-8 text-center">
        <p className="text-sm text-slate-500">
          Calculando escenarios y frente de Pareto...
        </p>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Alternativas de Supervivencia (Top 3)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {scenarios.map((sc, i) => (
          <ScenarioCard
            key={sc.scenario_id + i}
            scenario={sc}
            onVote={onVote}
            disabled={false}
          />
        ))}
      </div>
    </div>
  );
}
