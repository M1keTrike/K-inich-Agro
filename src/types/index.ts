export interface ResourceDef {
  value: number;
  max: number;
}

export interface RequirementDef {
  value: number;
  original_demand?: number;
}

export interface OutputDef {
  amount_per_unit: number;
  efficiency: number;
  max_output?: number;
  available_after_periods: number;
}

export interface BenefitValueDef {
  unit_value: number;
  target_demand: number;
  critical: boolean;
  minimum_reserve: number;
  storage_capacity?: number;
}

export interface ConsumerDef {
  requirements: Record<string, RequirementDef>;
  priority_weight: number;
  outputs?: Record<string, OutputDef>;
  subconsumers?: Record<string, ConsumerDef>;
}

export interface CrisisDef {
  name: string;
  description: string;
  intensity: number;
  impact_resource: Record<string, number>;
}

export interface DynamicTemplate {
  template_id: string;
  name: string;
  description: string;
  crisis_factors: Record<string, CrisisDef>;
  resources: Record<string, ResourceDef>;
  consumers: Record<string, ConsumerDef>;
  benefit_values?: Record<string, BenefitValueDef>;
  max_periods?: number;
  population_size: number;
  max_generations: number;
  emit_every_n: number;
  mutation_rate: number;
  mutation_strength: number;
  crossover_rate: number;
  elitism_count: number;
  tournament_size: number;
}

export interface ParetoScenario {
  scenario_id: string;
  label: string;
  allocations: Record<string, number>;
  allocation_preferences?: Record<string, number>;
  fitness_score: number;
  pareto_rank: number;
  feasible?: boolean;
  useful_benefits?: Record<string, number>;
  demand_deficits?: Record<string, number>;
  critical_deficits?: Record<string, number>;
  reserve_violations?: Record<string, number>;
  periods?: Array<Record<string, unknown>>;
}

export interface EvolutionEvent {
  generation: number;
  avg_fitness: number;
  max_fitness: number;
  top3: ParetoScenario[];
  is_final: boolean;
  viable_count: number;
  weights_normalized: boolean;
  period?: number;
  available_resources?: Record<string, number>;
  consumed_resources?: Record<string, number>;
  produced_resources?: Record<string, number>;
  useful_benefits?: Record<string, number>;
  demand_deficits?: Record<string, number>;
  critical_deficits?: Record<string, number>;
  reserve_violations?: Record<string, number>;
  dependency_status?: Record<string, string>;
}

export interface SystemState { water_liters: number; energy_watts: number; biomass_kg: number; status: 'normal' | 'crisis_paused'; }
export interface Crisis { crisis_type: string; severity_percent: number; affected_resources: string[]; timestamp: string; }
export interface Scenario { id: string; allocations: { water_liters: number; energy_watts: number; }; survival_index: number; priority_focus: string; llm_explanation: string; }
export interface Vote { scenario_id: string; applied_at: string; }
export interface EvolutionParams { water_total_liters: number; energy_total_kwh: number; num_inhabitants: number; cultivable_area_m2: number; w_human: number; w_crop: number; w_balance: number; emit_every_n: number; }
