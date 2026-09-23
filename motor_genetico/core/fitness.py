import numpy as np
from typing import Tuple, List, Dict
from .schemas import DynamicTemplate

def evaluate_population(population: np.ndarray, template: DynamicTemplate, mapping: List[Tuple[str, str]]) -> np.ndarray:
    pop_size = len(population)
    
    resource_sums = {r_name: np.zeros(pop_size) for r_name in template.resources.keys()}
    for i, (c_name, r_name) in enumerate(mapping):
        resource_sums[r_name] += population[:, i]
        
    penalty = np.zeros(pop_size)
    viable_mask = np.ones(pop_size, dtype=bool)
    for r_name, r_sum in resource_sums.items():
        max_val = template.resources[r_name].value
        if max_val > 0:
            excess = np.maximum(0, r_sum - max_val)
            penalty += (excess / max_val) * 2.0  # Peso de penalización
            viable_mask &= (r_sum <= max_val)
            
    total_viable_fitness = np.zeros(pop_size)
    for c_name, consumer in template.consumers.items():
        c_fitness = np.ones(pop_size)
        for r_name, req in consumer.requirements.items():
            gene_idx = mapping.index((c_name, r_name))
            allocated = population[:, gene_idx]
            req_val = req.value
            coverage = np.minimum(1.0, allocated / req_val) if req_val > 0 else np.ones(pop_size)
            c_fitness *= coverage
            
        total_viable_fitness += consumer.priority_weight * c_fitness

    fitness = total_viable_fitness - penalty
    return fitness, viable_mask

def get_objectives(population: np.ndarray, template: DynamicTemplate, mapping: List[Tuple[str, str]]) -> np.ndarray:
    pop_size = len(population)
    num_consumers = len(template.consumers)
    objs = np.zeros((pop_size, num_consumers))
    
    resource_sums = {r_name: np.zeros(pop_size) for r_name in template.resources.keys()}
    for i, (c_name, r_name) in enumerate(mapping):
        resource_sums[r_name] += population[:, i]
        
    penalty = np.zeros(pop_size)
    for r_name, r_sum in resource_sums.items():
        max_val = template.resources[r_name].value
        if max_val > 0:
            excess = np.maximum(0, r_sum - max_val)
            penalty += (excess / max_val) * 2.0
            
    for c_idx, (c_name, consumer) in enumerate(template.consumers.items()):
        c_fitness = np.ones(pop_size)
        for r_name, req in consumer.requirements.items():
            gene_idx = mapping.index((c_name, r_name))
            allocated = population[:, gene_idx]
            req_val = req.value
            coverage = np.minimum(1.0, allocated / req_val) if req_val > 0 else np.ones(pop_size)
            c_fitness *= coverage
        objs[:, c_idx] = c_fitness - penalty
        
    return objs
