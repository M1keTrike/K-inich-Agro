export interface SystemState {
  water_liters: number;
  energy_watts: number;
  biomass_kg: number;
  status: 'normal' | 'crisis_paused';
}

export interface Crisis {
  crisis_type: string;
  severity_percent: number;
  affected_resources: string[];
  timestamp: string;
}

export interface Scenario {
  id: string;
  allocations: {
    water_liters: number;
    energy_watts: number;
  };
  survival_index: number;
  priority_focus: string;
  llm_explanation: string;
}

export interface Vote {
  scenario_id: string;
  applied_at: string;
}

export interface ParetoScenario {
  scenario_id: string;
  label: string;
  water_liters_per_day: number;
  energy_kwh_per_day: number;
  water_human_liters: number;
  water_irrigation_liters: number;
  energy_habitat_kwh: number;
  energy_agro_kwh: number;
  fitness_score: number;
  pareto_rank: number;
}

export interface EvolutionEvent {
  generation: number;
  avg_fitness: number;
  max_fitness: number;
  top3: ParetoScenario[];
  is_final: boolean;
  viable_count: number;
  weights_normalized: boolean;
}

export interface EvolutionParams {
  water_total_liters: number;
  energy_total_kwh: number;
  num_inhabitants: number;
  cultivable_area_m2: number;
  w_human: number;
  w_crop: number;
  w_balance: number;
  emit_every_n: number;
}
