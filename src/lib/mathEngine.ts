import { Crisis, Scenario, SystemState } from '../types';

export const INITIAL_STATE: SystemState = {
  water_liters: 1000,
  energy_watts: 5000,
  biomass_kg: 500,
  status: 'normal',
};

export function calculateScenarios(
  currentState: SystemState,
  crisis: Crisis
): Scenario[] {
  // Apply crisis impact
  const availableWater = crisis.affected_resources.includes('water')
    ? currentState.water_liters * (1 - crisis.severity_percent / 100)
    : currentState.water_liters;

  const availableEnergy = crisis.affected_resources.includes('energy')
    ? currentState.energy_watts * (1 - crisis.severity_percent / 100)
    : currentState.energy_watts;

  // We must return exactly 3 scenarios based on the reduced resources.
  return [
    {
      id: 'sc-1-human-focus',
      allocations: {
        water_liters: availableWater * 0.7,
        energy_watts: availableEnergy * 0.6,
      },
      survival_index: 0.85,
      priority_focus: 'human_immediate',
      llm_explanation: '', // To be filled by LLM
    },
    {
      id: 'sc-2-crop-focus',
      allocations: {
        water_liters: availableWater * 0.4,
        energy_watts: availableEnergy * 0.8,
      },
      survival_index: 0.75,
      priority_focus: 'crop_viability',
      llm_explanation: '',
    },
    {
      id: 'sc-3-balanced',
      allocations: {
        water_liters: availableWater * 0.55,
        energy_watts: availableEnergy * 0.7,
      },
      survival_index: 0.80,
      priority_focus: 'balanced_survival',
      llm_explanation: '',
    },
  ];
}
