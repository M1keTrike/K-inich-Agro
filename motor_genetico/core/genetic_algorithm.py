import numpy as np
from typing import Tuple, List, Dict
from .schemas import DynamicTemplate

def build_gene_mapping(template: DynamicTemplate) -> List[Tuple[str, str]]:
    """Returns a list of (consumer_name, resource_name) for each gene."""
    mapping = []
    for c_name, consumer in template.consumers.items():
        for r_name in consumer.requirements.keys():
            mapping.append((c_name, r_name))
    return mapping

class GeneticAlgorithm:
    def __init__(self, template: DynamicTemplate):
        self.template = template
        self.pop_size = template.population_size
        self.mapping = build_gene_mapping(template)
        self.num_genes = len(self.mapping)
        self.population = np.zeros((self.pop_size, self.num_genes))
        self.fitness = np.zeros(self.pop_size)
        self.generation = 0

    def initialize_population(self):
        from .fitness import evaluate_population
        # Initialize each gene uniformly between 0 and resource max
        for i, (c_name, r_name) in enumerate(self.mapping):
            max_val = self.template.resources[r_name].value
            self.population[:, i] = np.random.uniform(0, max_val, self.pop_size)
        self.fitness, self.viable_mask = evaluate_population(self.population, self.template, self.mapping)

    def evolve_one_generation(self):
        from .fitness import evaluate_population
        new_population = np.zeros_like(self.population)
        
        # Elitism
        best_idx = np.argmax(self.fitness)
        new_population[0] = self.population[best_idx]
        
        # Fill the rest
        for i in range(1, self.pop_size):
            p1 = self._tournament_select()
            p2 = self._tournament_select()
            child = self._crossover(self.population[p1], self.population[p2])
            child = self._mutate(child)
            new_population[i] = child
            
        self.population = new_population
        self.fitness, self.viable_mask = evaluate_population(self.population, self.template, self.mapping)
        self.generation += 1

    def _tournament_select(self, k=2) -> int:
        idx = np.random.choice(self.pop_size, k, replace=False)
        return idx[np.argmax(self.fitness[idx])]

    def _crossover(self, p1: np.ndarray, p2: np.ndarray) -> np.ndarray:
        alpha = np.random.uniform(0, 1)
        return alpha * p1 + (1 - alpha) * p2

    def _mutate(self, ind: np.ndarray) -> np.ndarray:
        prob = 0.1
        if np.random.random() < prob:
            for i, (c_name, r_name) in enumerate(self.mapping):
                max_val = self.template.resources[r_name].value
                sigma = 0.05 * max_val if max_val > 0 else 1.0
                ind[i] += np.random.normal(0, sigma)
                ind[i] = np.clip(ind[i], 0, max_val)
        return ind

    def get_avg_fitness(self) -> float:
        return float(np.mean(self.fitness))

    def get_max_fitness(self) -> float:
        return float(np.max(self.fitness))
        
    def get_viable_count(self) -> int:
        return int(np.sum(self.viable_mask))
