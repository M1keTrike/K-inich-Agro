from pydantic import BaseModel, Field, model_validator
from typing import List, Literal

class EvolutionParams(BaseModel):
    water_total_liters: float = Field(..., ge=0.0)
    energy_total_kwh: float = Field(..., ge=0.0)
    num_inhabitants: int = Field(..., ge=1)
    cultivable_area_m2: float = Field(..., ge=0.0)
    w_human: float = Field(0.4, ge=0.0)
    w_crop: float = Field(0.35, ge=0.0)
    w_balance: float = Field(0.25, ge=0.0)
    population_size: int = Field(100, ge=10)
    max_generations: int = Field(200, ge=1)
    emit_every_n: int = Field(5, ge=1)

    @model_validator(mode='after')
    def normalize_weights(self) -> 'EvolutionParams':
        total = self.w_human + self.w_crop + self.w_balance
        if total == 0:
            self.w_human, self.w_crop, self.w_balance = 0.333, 0.333, 0.334
        elif abs(total - 1.0) > 1e-6:
            self.w_human /= total
            self.w_crop /= total
            self.w_balance /= total
        return self

class Individual(BaseModel):
    water_human: float
    water_irrigation: float
    energy_habitat: float
    energy_agro: float
    fitness: float = 0.0

    @property
    def is_viable(self) -> bool:
        return self.fitness > 0.0

class ParetoScenario(BaseModel):
    scenario_id: Literal["human_priority", "crop_viability", "balanced", "unavailable"]
    label: str
    water_liters_per_day: float
    energy_kwh_per_day: float
    water_human_liters: float
    water_irrigation_liters: float
    energy_habitat_kwh: float
    energy_agro_kwh: float
    fitness_score: float
    pareto_rank: int

class SSEPayload(BaseModel):
    generation: int
    avg_fitness: float
    max_fitness: float
    top3: List[ParetoScenario]
    is_final: bool
    viable_count: int
    weights_normalized: bool = False
