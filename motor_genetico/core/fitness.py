import numpy as np
from typing import Tuple
from .schemas import EvolutionParams

def evaluate_population(population: np.ndarray, params: EvolutionParams) -> np.ndarray:
    """
    Evaluates a population matrix where each row is an individual:
    [water_human, water_irrigation, energy_habitat, energy_agro]
    Returns a 1D numpy array of fitness values.
    """
    water_human = population[:, 0]
    water_irrigation = population[:, 1]
    energy_habitat = population[:, 2]
    energy_agro = population[:, 3]

    # Hard constraints: irrevocable fitness = 0
    water_viable = (water_human + water_irrigation) <= params.water_total_liters
    energy_viable = (energy_habitat + energy_agro) <= params.energy_total_kwh
    viable_mask = water_viable & energy_viable

    fitness = np.zeros(len(population))

    if not np.any(viable_mask):
        return fitness

    # Calculate objectives only for viable individuals
    req_water_human = params.num_inhabitants * 50.0
    f_human = np.minimum(1.0, water_human[viable_mask] / req_water_human) if req_water_human > 0 else np.ones(viable_mask.sum())

    req_water_crop = params.cultivable_area_m2 * 3.0
    water_crop_cov = np.minimum(1.0, water_irrigation[viable_mask] / req_water_crop) if req_water_crop > 0 else np.ones(viable_mask.sum())
    
    req_energy_agro = params.cultivable_area_m2 * 2.0  # Assumed 2.0 kWh/m2
    energy_agro_cov = np.minimum(1.0, energy_agro[viable_mask] / req_energy_agro) if req_energy_agro > 0 else np.ones(viable_mask.sum())
    f_crop = water_crop_cov * energy_agro_cov

    total_energy_used = energy_habitat[viable_mask] + energy_agro[viable_mask]
    f_balance_penalty = np.abs(total_energy_used - params.energy_total_kwh) / params.energy_total_kwh if params.energy_total_kwh > 0 else np.zeros(viable_mask.sum())
    f_balance_penalty = np.clip(f_balance_penalty, 0.0, 1.0)

    viable_fitness = (
        params.w_human * f_human +
        params.w_crop * f_crop +
        params.w_balance * (1.0 - f_balance_penalty)
    )

    fitness[viable_mask] = viable_fitness
    return fitness

def get_objectives(population: np.ndarray, params: EvolutionParams) -> np.ndarray:
    """
    Returns (f_human, f_crop) for the population, to be used for Pareto front calculation.
    """
    water_human = population[:, 0]
    water_irrigation = population[:, 1]
    energy_habitat = population[:, 2]
    energy_agro = population[:, 3]

    req_water_human = params.num_inhabitants * 50.0
    f_human = np.minimum(1.0, water_human / req_water_human) if req_water_human > 0 else np.ones(len(population))

    req_water_crop = params.cultivable_area_m2 * 3.0
    water_crop_cov = np.minimum(1.0, water_irrigation / req_water_crop) if req_water_crop > 0 else np.ones(len(population))
    
    req_energy_agro = params.cultivable_area_m2 * 2.0
    energy_agro_cov = np.minimum(1.0, energy_agro / req_energy_agro) if req_energy_agro > 0 else np.ones(len(population))
    f_crop = water_crop_cov * energy_agro_cov

    return np.column_stack((f_human, f_crop))
