import asyncio
from fastapi import APIRouter, Request, HTTPException
from sse_starlette.sse import EventSourceResponse
from core.schemas import DynamicTemplate, SSEPayload
from core.genetic_algorithm import GeneticAlgorithm
from core.pareto import extract_archetypes
from core.fitness import get_objectives
from core.templates import get_templates

router = APIRouter()

# Global state for active template
active_template: DynamicTemplate = get_templates()[0]

@router.post("/scenarios/active")
async def set_active_template(template: DynamicTemplate):
    global active_template
    active_template = template
    return {"status": "ok", "template_id": active_template.template_id}

@router.get("/scenarios/templates")
async def list_templates():
    return [t.model_dump() for t in get_templates()]

async def evolution_generator(request: Request, template: DynamicTemplate):
    ga = GeneticAlgorithm(template)
    ga.initialize_population()
    
    try:
        for generation in range(template.max_generations):
            if await request.is_disconnected():
                break
                
            ga.evolve_one_generation()
            
            is_final = (generation == template.max_generations - 1)
            
            if generation % template.emit_every_n == 0 or is_final:
                objs = get_objectives(ga.population, template, ga.mapping)
                top3 = extract_archetypes(ga.population, ga.fitness, objs, template, ga.mapping)
                
                payload = SSEPayload(
                    generation=generation,
                    avg_fitness=ga.get_avg_fitness(),
                    max_fitness=ga.get_max_fitness(),
                    top3=top3,
                    is_final=is_final,
                    viable_count=ga.get_viable_count(),
                    weights_normalized=(generation == 0)
                )
                
                yield {"data": payload.model_dump_json()}
                
            await asyncio.sleep(0.02)  # Yield control to event loop, slight delay for visualization
            
    except asyncio.CancelledError:
        pass

@router.get("/evolution-stream")
async def sse_endpoint(request: Request):
    global active_template
    # Re-instantiate the GA using the current active template
    return EventSourceResponse(
        evolution_generator(request, active_template),
        headers={"X-Accel-Buffering": "no"}
    )
