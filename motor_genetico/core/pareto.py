import numpy as np
from typing import List, Dict, Tuple
from .schemas import ParetoScenario, DynamicTemplate

def pareto_front(objectives: np.ndarray) -> np.ndarray:
    n = len(objectives)
    is_efficient = np.ones(n, dtype=bool)
    for i in range(n):
        if is_efficient[i]:
            dominated = (np.all(objectives >= objectives[i], axis=1) &
                         np.any(objectives > objectives[i], axis=1))
            dominated[i] = False
            is_efficient[dominated] = False
    return is_efficient

def extract_archetypes(population: np.ndarray, fitness: np.ndarray, objectives: np.ndarray, template: DynamicTemplate, mapping: List[Tuple[str, str]]) -> List[ParetoScenario]:
    # Use all individuals, even if penalized, to ensure we always return a Pareto front (Rule 3)
    is_efficient = pareto_front(objectives)
    front_indices = np.where(is_efficient)[0]
    front_objectives = objectives[is_efficient]

    if len(front_indices) == 0:
        return _unavailable_scenarios(template, mapping)

    # Decode genes to absolute allocations for the UI
    from .genetic_algorithm import decode_to_absolute
    abs_pop = decode_to_absolute(population, template, mapping)

    # Calculate distances to utopian point to find a balanced one
    utopian = np.max(front_objectives, axis=0)
    distances = np.linalg.norm(front_objectives - utopian, axis=1)
    
    # We want 3 distinct scenarios. We can pick max for Consumer 0, max for Consumer 1, and balanced.
    a_c1_idx = front_indices[np.argmax(front_objectives[:, 0])]
    a_c2_idx = front_indices[np.argmax(front_objectives[:, -1])] # Maximize last consumer
    a_balance_idx = front_indices[np.argmin(distances)]

    indices_to_use = [a_c1_idx, a_c2_idx, a_balance_idx]
    
    # If they are not distinct enough, fill with random from front or best overall
    unique_indices = list(set(indices_to_use))
    while len(unique_indices) < 3 and len(unique_indices) < len(front_indices):
        for idx in front_indices:
            if idx not in unique_indices:
                unique_indices.append(idx)
                break
    
    labels = ["Prioridad " + mapping[0][0].replace('_', ' ').title(), 
              "Prioridad " + mapping[-1][0].replace('_', ' ').title(), 
              "Balance SistÃ©mico"]

    archetypes = []
    for i in range(3):
        if i < len(unique_indices):
            idx = unique_indices[i]
            ind = abs_pop[idx] # Use absolute allocations
            fit = fitness[idx]
            
            allocations = {}
            for j, (node_path, r_name) in enumerate(mapping):
                allocations[f"{node_path}.{r_name}"] = float(ind[j])
                
            archetypes.append(ParetoScenario(
                scenario_id=f"escenario_{i}",
                label=labels[i] if i < len(labels) else f"Variante {i}",
                allocations=allocations,
                fitness_score=float(fit),
                pareto_rank=1
            ))
        else:
            archetypes.append(_unavailable_scenario(template, mapping))
            
    return archetypes

def _unavailable_scenario(template: DynamicTemplate, mapping: List[Tuple[str, str]]) -> ParetoScenario:
    allocations = {}
    for node_path, r_name in mapping:
        allocations[f"{node_path}.{r_name}"] = 0.0
        
    return ParetoScenario(
        scenario_id="unavailable",
        label="No disponible",
        allocations=allocations,
        fitness_score=0.0,
        pareto_rank=0
    )

def _unavailable_scenarios(template: DynamicTemplate, mapping: List[Tuple[str, str]]) -> List[ParetoScenario]:
    return [_unavailable_scenario(template, mapping) for _ in range(3)]
