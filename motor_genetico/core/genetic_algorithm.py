import numpy as np
from typing import Tuple
from .schemas import EvolutionParams
from .fitness import evaluate_population

class GeneticAlgorithm:
    def __init__(self, params: EvolutionParams):
        self.params = params
        self.pop_size = params.population_size
        # Columns: [water_human, water_irrigation, energy_habitat, energy_agro]
        self.population = np.zeros((self.pop_size, 4))
        self.fitness = np.zeros(self.pop_size)
        self.generation = 0

    def initialize_population(self):
        # Uniform initialization within [0, total_resource]
        self.population[:, 0] = np.random.uniform(0, self.params.water_total_liters, self.pop_size)
        self.population[:, 1] = np.random.uniform(0, self.params.water_total_liters, self.pop_size)
        self.population[:, 2] = np.random.uniform(0, self.params.energy_total_kwh, self.pop_size)
        self.population[:, 3] = np.random.uniform(0, self.params.energy_total_kwh, self.pop_size)
        self.fitness = evaluate_population(self.population, self.params)

    def evolve_one_generation(self):
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
        self.fitness = evaluate_population(self.population, self.params)
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
            # 5% perturbation
            sigma_water = 0.05 * self.params.water_total_liters
            sigma_energy = 0.05 * self.params.energy_total_kwh
            ind[0] += np.random.normal(0, sigma_water)
            ind[1] += np.random.normal(0, sigma_water)
            ind[2] += np.random.normal(0, sigma_energy)
            ind[3] += np.random.normal(0, sigma_energy)
            
            # Clip to valid ranges [0, max]
            ind[0] = np.clip(ind[0], 0, self.params.water_total_liters)
            ind[1] = np.clip(ind[1], 0, self.params.water_total_liters)
            ind[2] = np.clip(ind[2], 0, self.params.energy_total_kwh)
            ind[3] = np.clip(ind[3], 0, self.params.energy_total_kwh)
        return ind

    def get_avg_fitness(self) -> float:
        return float(np.mean(self.fitness))

    def get_max_fitness(self) -> float:
        return float(np.max(self.fitness))
        
    def get_viable_count(self) -> int:
        return int(np.sum(self.fitness > 0))
