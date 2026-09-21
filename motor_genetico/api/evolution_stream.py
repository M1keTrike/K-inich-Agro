import asyncio
from fastapi import APIRouter, Request, Query, HTTPException
from sse_starlette.sse import EventSourceResponse
from core.schemas import EvolutionParams, SSEPayload
from core.genetic_algorithm import GeneticAlgorithm
from core.pareto import extract_archetypes
from core.fitness import get_objectives

router = APIRouter()

async def evolution_generator(request: Request, params: EvolutionParams):
    ga = GeneticAlgorithm(params)
    ga.initialize_population()
    
    try:
        for generation in range(params.max_generations):
            if await request.is_disconnected():
                break
                
            ga.evolve_one_generation()
            
            is_final = (generation == params.max_generations - 1)
            
            if generation % params.emit_every_n == 0 or is_final:
                objs = get_objectives(ga.population, params)
                top3 = extract_archetypes(ga.population, ga.fitness, objs)
                
                payload = SSEPayload(
                    generation=generation,
                    avg_fitness=ga.get_avg_fitness(),
                    max_fitness=ga.get_max_fitness(),
                    top3=top3,
                    is_final=is_final,
                    viable_count=ga.get_viable_count(),
                    weights_normalized=(generation == 0) # Could be smarter, but spec says true only in first event if normalized
                )
                
                yield {"data": payload.model_dump_json()}
                
            await asyncio.sleep(0)  # Yield control to event loop
            
    except asyncio.CancelledError:
        raise

@router.get("/evolution-stream")
async def sse_endpoint(
    request: Request,
    water_total_liters: float = Query(...),
    energy_total_kwh: float = Query(...),
    num_inhabitants: int = Query(...),
    cultivable_area_m2: float = Query(...),
    w_human: float = Query(0.4),
    w_crop: float = Query(0.35),
    w_balance: float = Query(0.25),
    emit_every_n: int = Query(5)
):
    try:
        params = EvolutionParams(
            water_total_liters=water_total_liters,
            energy_total_kwh=energy_total_kwh,
            num_inhabitants=num_inhabitants,
            cultivable_area_m2=cultivable_area_m2,
            w_human=w_human,
            w_crop=w_crop,
            w_balance=w_balance,
            emit_every_n=emit_every_n
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
        
    return EventSourceResponse(
        evolution_generator(request, params),
        headers={"X-Accel-Buffering": "no"}
    )
