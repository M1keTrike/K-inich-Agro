'use client';
import { useState, useMemo } from 'react';
import { StateIndicators } from '@/components/Dashboard/StateIndicators';
import { CrisisForm } from '@/components/CrisisPanel/CrisisForm';
import { ScenarioList } from '@/components/ScenarioComparator/ScenarioList';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { ConvergenceChart } from '@/components/GeneticEngine/ConvergenceChart';
import { EvolutionStatus } from '@/components/GeneticEngine/EvolutionStatus';
import { WeightSliders } from '@/components/GeneticEngine/WeightSliders';
import { SystemState, Crisis, EvolutionParams, ParetoScenario } from '@/types';
import { INITIAL_STATE } from '@/lib/mathEngine';
import { useEvolutionStream } from '@/lib/geneticEngineClient';

interface ActiveBanner {
  crisisId: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning';
}

export default function Home() {
  const [systemState, setSystemState] = useState<SystemState>(INITIAL_STATE);
  const [banners, setBanners] = useState<ActiveBanner[]>([]);
  
  const [evolutionParams, setEvolutionParams] = useState<EvolutionParams>({
    water_total_liters: INITIAL_STATE.water_liters,
    energy_total_kwh: INITIAL_STATE.energy_watts, // simplifying units for now
    num_inhabitants: 100, // example
    cultivable_area_m2: 50, // example
    w_human: 0.4,
    w_crop: 0.35,
    w_balance: 0.25,
    emit_every_n: 5
  });

  const { data: evolutionData, status: streamStatus, errorMsg } = useEvolutionStream(evolutionParams);

  const lastEvent = evolutionData.length > 0 ? evolutionData[evolutionData.length - 1] : null;
  const top3Scenarios = lastEvent?.top3 || [];

  const handleCrisisInjected = async (crisis: Crisis) => {
    setSystemState(prev => ({ ...prev, status: 'crisis_paused' }));

    const severity: 'critical' | 'warning' = crisis.severity_percent >= 60 ? 'critical' : 'warning';
    const newBanner: ActiveBanner = {
      crisisId: `crisis-${Date.now()}`,
      title: `Crisis detectada: ${crisis.crisis_type.replace(/_/g, ' ')}`,
      description: `Severidad del ${crisis.severity_percent}% en recursos: ${crisis.affected_resources.join(', ')}. Se requiere votación de la asamblea.`,
      severity,
    };
    setBanners(prev => [...prev, newBanner]);
    
    // Decrease resources based on severity to trigger evolution
    const resourceReduction = 1 - (crisis.severity_percent / 100);
    setEvolutionParams(prev => ({
      ...prev,
      water_total_liters: prev.water_total_liters * resourceReduction,
      energy_total_kwh: prev.energy_total_kwh * resourceReduction
    }));
  };

  const handleDismissBanner = (crisisId: string) => {
    setBanners(prev => prev.filter(b => b.crisisId !== crisisId));
  };

  const handleVote = async (scenarioId: string) => {
    const selected = top3Scenarios.find(s => s.scenario_id === scenarioId);
    if (selected) {
      setSystemState(prev => ({
        ...prev,
        status: 'normal',
        water_liters: selected.water_liters_per_day,
        energy_watts: selected.energy_kwh_per_day
      }));
    }
    setBanners([]);
    
    // Call vote API in background
    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId })
    }).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {banners.length > 0 && (
        <div className="w-full px-6 pt-4 space-y-2">
          {banners.map(banner => (
            <AlertBanner
              key={banner.crisisId}
              crisisId={banner.crisisId}
              title={banner.title}
              description={banner.description}
              severity={banner.severity}
              onDismiss={() => handleDismissBanner(banner.crisisId)}
            />
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="mb-8 border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold text-slate-800">K&apos;inich-Gov</h1>
          <p className="text-sm text-slate-500 mt-1">Gemelo digital de gobernanza comunitaria</p>
        </header>

        <StateIndicators state={systemState} />

        <CrisisForm
          onCrisisInjected={handleCrisisInjected}
          disabled={systemState.status === 'crisis_paused'}
        />

        {systemState.status === 'crisis_paused' && (
          <>
            <WeightSliders 
              params={evolutionParams} 
              onChange={setEvolutionParams} 
              disabled={streamStatus === 'connecting'} 
            />

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Motor Genético SSE</h3>
                <EvolutionStatus status={streamStatus} errorMsg={errorMsg} lastEvent={lastEvent} />
              </div>
              <ConvergenceChart data={evolutionData} />
            </div>

            <ScenarioList
              scenarios={top3Scenarios}
              loading={streamStatus === 'connecting' || streamStatus === 'idle'}
              onVote={handleVote}
            />
          </>
        )}
      </div>
    </div>
  );
}
