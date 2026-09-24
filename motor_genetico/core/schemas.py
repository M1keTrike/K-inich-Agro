from pydantic import BaseModel, Field
from typing import Dict, List

class ResourceDef(BaseModel):
    value: float = Field(..., ge=0.0)

class RequirementDef(BaseModel):
    value: float = Field(..., ge=0.0)

class ConsumerDef(BaseModel):
    requirements: Dict[str, RequirementDef] = Field(default_factory=dict)
    priority_weight: float = Field(..., ge=0.0, le=1.0)
    subconsumers: Dict[str, 'ConsumerDef'] = Field(default_factory=dict)

class CrisisDef(BaseModel):
    name: str
    description: str
    intensity: float = Field(0.0, ge=0.0, le=1.0)
    impact_resource: Dict[str, float] = Field(default_factory=dict) # e.g. "OXIGENO_L": -0.5 meaning -50% at full intensity

class DynamicTemplate(BaseModel):
    template_id: str
    name: str
    description: str
    crisis_factors: Dict[str, CrisisDef] = Field(default_factory=dict)
    resources: Dict[str, ResourceDef]
    consumers: Dict[str, ConsumerDef]
    
    population_size: int = Field(100, ge=10)
    max_generations: int = Field(200, ge=1)
    emit_every_n: int = Field(5, ge=1)
    mutation_rate: float = Field(0.1, ge=0.0, le=1.0)
    mutation_strength: float = Field(0.1, ge=0.0, le=1.0)
    crossover_rate: float = Field(1.0, ge=0.0, le=1.0)
    elitism_count: int = Field(1, ge=1)
    tournament_size: int = Field(2, ge=2)

class ParetoScenario(BaseModel):
    scenario_id: str
    label: str
    allocations: Dict[str, float] # Changed to a single flat dict for simplicity or keep hierarchical
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
