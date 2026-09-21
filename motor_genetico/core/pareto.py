import numpy as np
from typing import List, Dict
from .schemas import ParetoScenario

def pareto_front(objectives: np.ndarray) -> np.ndarray:
    """Returns boolean mask of non-dominated points (maximization)."""
    n = len(objectives)
    is_efficient = np.ones(n, dtype=bool)
    for i in range(n):
        if is_efficient[i]:
            dominated = (np.all(objectives >= objectives[i], axis=1) &
                         np.any(objectives > objectives[i], axis=1))
            dominated[i] = False
            is_efficient[dominated] = False
    return is_efficient

def extract_archetypes(population: np.ndarray, fitness: np.ndarray, objectives: np.ndarray) -> List[ParetoScenario]:
    """
    Extracts the Top-3 archetypes from the population.
    If no viable solutions, returns "unavailable" scenarios.
    """
    viable_mask = fitness > 0
    if not np.any(viable_mask):
        return _unavailable_scenarios()

    # Calculate Pareto front on viable individuals only
    viable_indices = np.where(viable_mask)[0]
    viable_objectives = objectives[viable_mask]
    
    is_efficient = pareto_front(viable_objectives)
    front_indices = viable_indices[is_efficient]
    front_objectives = viable_objectives[is_efficient]

    # If the front is degenerate (less than 3 distinct solutions)
    if len(front_indices) < 3:
        # Fallback: just pick the best viable ones by fitness to pad out, 
        # or return unavailable for the rest as per spec
        pass # The logic below will handle choosing the same if they are identical, 
             # but spec says "If the front produces less than 3 non-dominated solutions, 
             # the missing archetypes are marked as unavailable".
             # Let's see how many unique we have.
        unique_front = np.unique(front_objectives, axis=0)
        if len(unique_front) < 3:
            return _unavailable_scenarios()

    a_human_idx = front_indices[np.argmax(front_objectives[:, 0])]
    a_crop_idx = front_indices[np.argmax(front_objectives[:, 1])]
    
    utopian = np.max(front_objectives, axis=0)
    distances = np.linalg.norm(front_objectives - utopian, axis=1)
    a_balance_idx = front_indices[np.argmin(distances)]

    # Check if they are distinct
    chosen = set()
    archetypes = []
    
    scenarios = [
        ("human_priority", "Prioridad Humana", a_human_idx),
        ("crop_viability", "Viabilidad de Cultivos", a_crop_idx),
        ("balanced", "Supervivencia Equilibrada", a_balance_idx)
    ]

    for sc_id, label, idx in scenarios:
        if idx in chosen:
            # Degenerate case fallback
            archetypes.append(_unavailable_scenario())
            continue
        
        chosen.add(idx)
        ind = population[idx]
        fit = fitness[idx]
        archetypes.append(ParetoScenario(
            scenario_id=sc_id,
            label=label,
            water_liters_per_day=ind[0] + ind[1],
            energy_kwh_per_day=ind[2] + ind[3],
            water_human_liters=ind[0],
            water_irrigation_liters=ind[1],
            energy_habitat_kwh=ind[2],
            energy_agro_kwh=ind[3],
            fitness_score=fit,
            pareto_rank=1
        ))

    # If some are unavailable but we have enough, we might want to fill them?
    # Spec: "Si el Frente produce menos de 3 soluciones no dominadas, los arquetipos faltantes se marcan como null con scenario_id: 'unavailable'"
    return archetypes

def _unavailable_scenario() -> ParetoScenario:
    return ParetoScenario(
        scenario_id="unavailable",
        label="No disponible",
        water_liters_per_day=0.0,
        energy_kwh_per_day=0.0,
        water_human_liters=0.0,
        water_irrigation_liters=0.0,
        energy_habitat_kwh=0.0,
        energy_agro_kwh=0.0,
        fitness_score=0.0,
        pareto_rank=0
    )

def _unavailable_scenarios() -> List[ParetoScenario]:
    return [_unavailable_scenario() for _ in range(3)]
