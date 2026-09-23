import numpy as np
from typing import Tuple, List, Dict, Any
from .schemas import DynamicTemplate, ConsumerDef

def _evaluate_node(
    consumers: Dict[str, ConsumerDef],
    population: np.ndarray,
    mapping: List[Tuple[str, str]],
    parent_allocations: Dict[str, np.ndarray],
    parent_path: str = ""
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Dict[str, np.ndarray]]:
    """
    Returns:
    - total_fitness: np.ndarray
    - penalty: np.ndarray
    - viable_mask: np.ndarray
    - node_allocations: Dict[str, np.ndarray] of allocations at this level, to be used by parent constraint.
    """
    pop_size = len(population)
    total_fitness = np.zeros(pop_size)
    total_penalty = np.zeros(pop_size)
    viable_mask = np.ones(pop_size, dtype=bool)
    
    # Track allocations at this level for each resource to return to parent
    level_allocations = {}
    
    for c_name, consumer in consumers.items():
        current_path = f"{parent_path}.{c_name}" if parent_path else c_name
        
        c_fitness = np.ones(pop_size)
        node_res_allocations = {}
        
        for r_name, req in consumer.requirements.items():
            gene_idx = mapping.index((current_path, r_name))
            allocated = population[:, gene_idx]
            req_val = req.value
            coverage = np.minimum(1.0, allocated / req_val) if req_val > 0 else np.ones(pop_size)
            c_fitness *= coverage
            
            node_res_allocations[r_name] = allocated
            if r_name not in level_allocations:
                level_allocations[r_name] = np.zeros(pop_size)
            level_allocations[r_name] += allocated
            
        total_fitness += consumer.priority_weight * c_fitness
        
        # Evaluate children
        if consumer.subconsumers:
            child_fitness, child_penalty, child_viable, child_allocations = _evaluate_node(
                consumer.subconsumers, population, mapping, node_res_allocations, current_path
            )
            total_fitness += child_fitness
            total_penalty += child_penalty
            viable_mask &= child_viable
            
            # Constraint: child allocations sum <= parent allocation for each resource
            for r_name, c_alloc_sum in child_allocations.items():
                p_alloc = node_res_allocations.get(r_name, np.zeros(pop_size))
                excess = np.maximum(0, c_alloc_sum - p_alloc)
                # Penalize excess, weighted
                p_max = p_alloc.copy()
                p_max[p_max == 0] = 1.0 # avoid div by zero in penalty
                total_penalty += (excess / p_max) * 2.0
                viable_mask &= (c_alloc_sum <= p_alloc)

    return total_fitness, total_penalty, viable_mask, level_allocations


def evaluate_population(population: np.ndarray, template: DynamicTemplate, mapping: List[Tuple[str, str]]) -> Tuple[np.ndarray, np.ndarray]:
    pop_size = len(population)
    
    # 1. Apply crisis factors to resources
    resource_maxes = {}
    for r_name, r_def in template.resources.items():
        base_val = r_def.value
        # Calculate impact from all active crises
        total_impact = 0.0
        for crisis in template.crisis_factors.values():
            if r_name in crisis.impact_resource:
                total_impact += crisis.intensity * crisis.impact_resource[r_name]
        
        # apply impact (e.g., -0.5 means -50% reduction)
        effective_val = base_val * (1.0 + total_impact)
        resource_maxes[r_name] = max(0.0, effective_val)
    
    # 2. Evaluate hierarchy
    total_fitness, total_penalty, viable_mask, top_level_allocations = _evaluate_node(
        template.consumers, population, mapping, {}
    )
    
    # 3. Global constraint on top level allocations
    for r_name, alloc_sum in top_level_allocations.items():
        max_val = resource_maxes.get(r_name, 0.0)
        if max_val > 0:
            excess = np.maximum(0, alloc_sum - max_val)
            total_penalty += (excess / max_val) * 2.0
            viable_mask &= (alloc_sum <= max_val)
        else:
            # If max_val is 0, any allocation > 0 is excess
            excess = alloc_sum
            total_penalty += excess * 2.0
            viable_mask &= (alloc_sum <= 0)

    fitness = total_fitness - total_penalty
    return fitness, viable_mask


def _get_objectives_node(
    consumers: Dict[str, ConsumerDef],
    population: np.ndarray,
    mapping: List[Tuple[str, str]],
    parent_path: str = ""
) -> List[np.ndarray]:
    """Returns a list of objectives for consumers recursively."""
    pop_size = len(population)
    objs = []
    
    for c_name, consumer in consumers.items():
        current_path = f"{parent_path}.{c_name}" if parent_path else c_name
        
        c_fitness = np.ones(pop_size)
        for r_name, req in consumer.requirements.items():
            gene_idx = mapping.index((current_path, r_name))
            allocated = population[:, gene_idx]
            req_val = req.value
            coverage = np.minimum(1.0, allocated / req_val) if req_val > 0 else np.ones(pop_size)
            c_fitness *= coverage
            
        objs.append(c_fitness)
        
        if consumer.subconsumers:
            objs.extend(_get_objectives_node(consumer.subconsumers, population, mapping, current_path))
            
    return objs


def get_objectives(population: np.ndarray, template: DynamicTemplate, mapping: List[Tuple[str, str]]) -> np.ndarray:
    pop_size = len(population)
    
    # 1. Apply crisis factors to resources
    resource_maxes = {}
    for r_name, r_def in template.resources.items():
        base_val = r_def.value
        total_impact = 0.0
        for crisis in template.crisis_factors.values():
            if r_name in crisis.impact_resource:
                total_impact += crisis.intensity * crisis.impact_resource[r_name]
        resource_maxes[r_name] = max(0.0, base_val * (1.0 + total_impact))
    
    # 2. Get global penalties
    total_penalty = np.zeros(pop_size)
    _, penalty_hierarchy, _, top_level_allocations = _evaluate_node(template.consumers, population, mapping, {})
    total_penalty += penalty_hierarchy
    
    for r_name, alloc_sum in top_level_allocations.items():
        max_val = resource_maxes.get(r_name, 0.0)
        if max_val > 0:
            excess = np.maximum(0, alloc_sum - max_val)
            total_penalty += (excess / max_val) * 2.0
        else:
            total_penalty += alloc_sum * 2.0
            
    # 3. Get objectives
    objs_list = _get_objectives_node(template.consumers, population, mapping)
    
    if not objs_list:
        return np.zeros((pop_size, 1))
        
    objs = np.column_stack(objs_list)
    # Apply penalty to all objectives
    objs = objs - total_penalty[:, np.newaxis]
    return objs
