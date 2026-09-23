from pydantic import BaseModel, Field
from typing import Dict, List

class ResourceDef(BaseModel):
    value: float = Field(..., ge=0.0)
    max: float = Field(..., ge=0.0)

class RequirementDef(BaseModel):
    value: float = Field(..., ge=0.0)
    max: float = Field(..., ge=0.0)

class ConsumerDef(BaseModel):
    requirements: Dict[str, RequirementDef]
    priority_weight: float = Field(..., ge=0.0)

class DynamicTemplate(BaseModel):
    template_id: str
    name: str
    description: str
    resources: Dict[str, ResourceDef]
    consumers: Dict[str, ConsumerDef]
    
    population_size: int = Field(100, ge=10)
    max_generations: int = Field(200, ge=1)
    emit_every_n: int = Field(5, ge=1)

class ParetoScenario(BaseModel):
    scenario_id: str
    label: str
    allocations: Dict[str, Dict[str, float]] 
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
