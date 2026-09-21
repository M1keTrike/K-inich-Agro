# Research: Motor Genético Real con Transparencia SSE y Edición en Vivo

**Feature**: 003-genetic-engine-sse-livedit
**Phase**: 0 (Research)
**Date**: 2026-09-20

---

## Tema 1 — FastAPI SSE: Implementación de Server-Sent Events

**Decision**: Usar **`sse-starlette`** (`EventSourceResponse`) en lugar de `StreamingResponse` raw.

**Rationale**:
- `EventSourceResponse` maneja automáticamente: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, formato correcto del protocolo SSE (`data: ...\n\n`) y heartbeat integrado.
- Cuando el cliente se desconecta, Uvicorn inyecta `asyncio.CancelledError` en el generador. Es **obligatorio** capturar y re-lanzar (`raise`) esta excepción; no re-lanzarla causa goroutines huérfanas y leaks de recursos del servidor.
- `await request.is_disconnected()` se usa como guardia secundaria dentro del loop.
- **Crítico**: `GZipMiddleware` de FastAPI almacena el body completo en memoria — rompe silenciosamente todos los streams SSE. Debe deshabilitarse globalmente.
- El header `X-Accel-Buffering: no` debe agregarse manualmente para proxies Nginx (no lo agrega `sse-starlette` automáticamente).

**Patrón canónico**:
```python
from fastapi import FastAPI, Request
from sse_starlette.sse import EventSourceResponse
import asyncio

app = FastAPI()

async def event_generator(request: Request):
    try:
        while True:
            if await request.is_disconnected():
                break
            yield {"data": "...", "event": "update", "id": "1"}
            await asyncio.sleep(0)  # cede control al event loop
    except asyncio.CancelledError:
        # cleanup: liberar recursos
        raise  # OBLIGATORIO re-lanzar

@app.get("/api/evolution-stream")
async def sse_endpoint(request: Request):
    return EventSourceResponse(event_generator(request))
```

**Headers SSE requeridos**:

| Header | Valor | Quién lo setea |
|---|---|---|
| `Content-Type` | `text/event-stream` | `sse-starlette` automático |
| `Cache-Control` | `no-cache` | `sse-starlette` automático |
| `Connection` | `keep-alive` | `sse-starlette` automático |
| `X-Accel-Buffering` | `no` | Agregar manualmente para Nginx |

**Alternatives considered**:

| Opción | Veredicto |
|---|---|
| `StreamingResponse` raw | Funciona pero requiere formateo manual del protocolo SSE, manejo de desconexiones y heartbeat. Más boilerplate, mismo rendimiento. No recomendado. |
| WebSockets | Comunicación bidireccional, mayor overhead. Exceso de ingeniería para flujo unidireccional servidor→cliente. |
| Long Polling | Mayor carga de servidor por petición; estrictamente peor que SSE para este caso de uso. |

---

## Tema 2 — Algoritmo Genético Python para Optimización Continua

**Decision**: **Implementación from-scratch con NumPy** (sin DEAP ni otras librerías de AG). Con pop=100, vars=4, gen=200, el tiempo total de ejecución estimado es **50–300 ms** — ninguna librería adicional justificada.

**Rationale**:
- Total de evaluaciones: 100 × 200 = 20,000. Con operaciones vectorizadas de NumPy, los operadores genéticos son nanosegundos por individuo.
- Los operadores requeridos (selección por torneo, cruce aritmético BLX-α, mutación gaussiana) son ~5–15 líneas cada uno; total ~70 líneas pure NumPy.
- DEAP agrega ~50 MB de dependencia y un patrón `toolbox/creator` con overhead conceptual significativo — sin beneficio a esta escala.
- Cero dependencias adicionales = imagen Docker más pequeña, sin riesgo de conflictos de versiones en producción.

**Perfil de rendimiento**:

| Escala | Tiempo estimado | Nota |
|---|---|---|
| pop=100, gen=200, fitness simple | 50–150 ms | NumPy vectorizado |
| Ídem + modelo agronómico numpy | 100–300 ms | Aceptable para SSE |
| Ídem + simulador externo | 2–60 s | Requeriría `run_in_executor` |

**Operadores de referencia**:
```python
import numpy as np

# Selección por torneo (k=3)
def tournament_select(pop, fitnesses, k=3):
    idx = np.random.choice(len(pop), k, replace=False)
    return pop[idx[np.argmax(fitnesses[idx])]]

# Cruce aritmético (BLX-α)
def arithmetic_crossover(p1, p2, alpha=0.5):
    return alpha * p1 + (1 - alpha) * p2

# Mutación gaussiana
def gaussian_mutate(individual, sigma=0.1, prob=0.1):
    mask = np.random.rand(len(individual)) < prob
    individual[mask] += np.random.normal(0, sigma, mask.sum())
    return individual
```

**Alternatives considered**:

| Opción | Veredicto |
|---|---|
| **DEAP** | Ideal para NSGA-II y estructuras complejas. Sobre-ingenierizado aquí. Considerar si el problema escala. |
| **pymoo** | Estándar de referencia para MOO. Usar si se migra a NSGA-II. |
| **scipy.optimize** | Optimización basada en gradiente / evolución diferencial — familia de algoritmos diferente, no es un GA. |
| **pygad** | Librería GA liviana. Punto medio razonable pero igualmente innecesario a esta escala. |

---

## Tema 3 — Frente de Pareto en Python

**Decision**: **Filtro de no-dominación NumPy inline** (~15 líneas). Extracción de 3 arquetipos con `argmax`/`argmin`/`norm` sobre el frente. Sin librería adicional a escala pop=100.

**Rationale**:
- Con N=100 puntos y 2–3 objetivos, el algoritmo ingenuo O(M·N²) completa en **microsegundos**. No justifica overhead de librería.
- Los 3 arquetipos se mapean directamente a operaciones simples de NumPy sobre el subconjunto del frente de Pareto.
- Si la población escala a N > 10,000, migrar a librería `paretoset` sin cambio de API.

**Implementación de referencia**:
```python
import numpy as np

def pareto_front(objectives: np.ndarray) -> np.ndarray:
    """Retorna máscara booleana de puntos no dominados (maximización)."""
    n = len(objectives)
    is_efficient = np.ones(n, dtype=bool)
    for i in range(n):
        if is_efficient[i]:
            dominated = (np.all(objectives >= objectives[i], axis=1) &
                         np.any(objectives > objectives[i], axis=1))
            dominated[i] = False
            is_efficient[dominated] = False
    return is_efficient

def extract_archetypes(front: np.ndarray) -> dict:
    """3 arquetipos desde un Frente de Pareto (objetivos a maximizar)."""
    a_human   = int(np.argmax(front[:, 0]))          # max f_human
    a_crop    = int(np.argmax(front[:, 1]))          # max f_crop
    utopian   = np.max(front, axis=0)                # punto utópico
    distances = np.linalg.norm(front - utopian, axis=1)
    a_balance = int(np.argmin(distances))            # más cercano al utópico
    return {"human_priority": a_human, "crop_viability": a_crop, "balanced": a_balance}
```

**Alternatives considered**:

| Opción | Veredicto |
|---|---|
| **`paretoset`** | Excelente para N > 10,000. API limpia pandas/numpy. Innecesario aquí. |
| **`pymoo`** | Framework MOO completo con hipervolumen y crowding distance. Usar si se migra a NSGA-II. |
| **`scipy` convex hull** | Solo funciona en 2D; no generaliza a 3+ objetivos. |
| **`fast-pareto`** | NumPy optimizado. Considerar si la población escala significativamente. |

---

## Tema 4 — Next.js 14 App Router: EventSource + Patrón de Debounce

**Decision**: **Dos `useEffect` separados**: uno para debounce del slider (250ms `setTimeout`), otro para el ciclo de vida del `EventSource` vinculado al valor debounced. La garantía de cleanup de React maneja el cierre de la conexión anterior sin referencias manuales.

**Rationale**:
- React garantiza que el cleanup de un efecto previo se ejecuta **antes** del siguiente efecto. Por lo tanto, `eventSource.close()` siempre se llama antes de abrir el nuevo `EventSource` — previene conexiones concurrentes sin gestión manual de referencias.
- Separar debounce y conexión en efectos distintos mantiene cada uno pequeño, con una sola responsabilidad y testeable.
- **Crítico**: `EventSource` **debe** crearse dentro de `useEffect`. Next.js pre-renderiza los componentes `'use client'` en el servidor; `EventSource` es browser-only y lanzará `"EventSource is not defined"` en tiempo de build si se coloca fuera de `useEffect`.

**Patrón canónico**:
```tsx
'use client';
import { useState, useEffect } from 'react';

export default function OptimizerSlider() {
  const [sliderValue, setSliderValue]     = useState(50);
  const [debouncedValue, setDebouncedValue] = useState(50);
  const [events, setEvents] = useState<any[]>([]);

  // Efecto 1: debounce del slider → 250ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(sliderValue), 250);
    return () => clearTimeout(timer);
  }, [sliderValue]);

  // Efecto 2: ciclo de vida del EventSource
  useEffect(() => {
    const es = new EventSource(`/api/evolution-stream?budget=${debouncedValue}`);
    es.onmessage = (e) => setEvents(prev => [...prev, JSON.parse(e.data)]);
    es.onerror   = () => es.close();
    return () => es.close(); // cierra conexión vieja antes de abrir la nueva
  }, [debouncedValue]);

  return (
    <input type="range" min={0} max={100} value={sliderValue}
           onChange={e => setSliderValue(+e.target.value)} />
  );
}
```

**Gotchas conocidos**:

| Problema | Solución |
|---|---|
| `EventSource is not defined` (SSR) | Siempre crear dentro de `useEffect` |
| Múltiples conexiones por slide rápido | El debounce de 250ms lo previene |
| Auth via headers no soportado | Pasar token como query param; validar en servidor |
| `GZipMiddleware` en FastAPI | Deshabilitar globalmente — destruye el streaming |
| Timeout de Vercel/Netlify edge corta el stream | Usar Railway/Render para FastAPI (ver Tema 5) |
| React Strict Mode doble montaje | El cleanup lo maneja; ambas conexiones se cierran correctamente |

**Alternatives considered**:

| Opción | Veredicto |
|---|---|
| `useRef` para instancia de EventSource | Funciona pero requiere bookkeeping manual; el cleanup de React es más limpio |
| `usehooks-ts` `useEventSource` hook | Oculta el control del ciclo de vida necesario para el patrón de debounce en slider |
| WebSockets | Overhead bidireccional; ningún beneficio para streams de solo lectura |
| `react-query` con polling | DX más simple pero el polling introduce picos de latencia en el límite del intervalo |

---

## Tema 5 — Despliegue de FastAPI para SSE de Larga Duración

**Decision**: **NO usar Vercel para el backend FastAPI**. Usar **Railway** para desarrollo/staging y **Render** para producción. Configuración mínima: `Dockerfile` + `uvicorn` bindeado a `$PORT`.

**Rationale**:
- Las serverless functions de Vercel tienen **timeout de 10–30s** (según plan). SSE requiere una conexión HTTP persistente — fundamentalmente incompatible.
- Railway y Render ejecutan **contenedores Docker persistentes** sin timeouts artificiales de conexión.
- Railway: DX más rápido (auto-detect desde GitHub, ~2 min de setup, opción zero-Dockerfile con `railway.json`), billing por uso (bueno para picos de cómputo variables del AG).
- Render: precios mensuales predecibles, mejores SLAs de uptime para producción, setup ligeramente más elaborado.
- **Arquitectura recomendada**: Frontend Next.js en **Vercel** (su caso de uso nativo) + Backend FastAPI en **Railway/Render** = lo mejor de ambos mundos.

**Configuración mínima**:
```dockerfile
# Dockerfile (compatible Railway + Render)
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

```json
// railway.json (alternativa zero-Dockerfile para Railway)
{
  "$schema": "https://railway.app/railway.schema.json",
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT"
  }
}
```

**Comparativa de plataformas**:

| Factor | Vercel | Railway | Render |
|---|---|---|---|
| Soporte SSE | ❌ Timeout 10–30s | ✅ Persistente | ✅ Persistente |
| Tiempo de setup | ~5 min | **~2 min** | ~5 min |
| Modelo de precios | Por petición | Por segundo de uso | Mensual fijo |
| Cold starts | Sí | Mínimos | Mínimos |
| Mejor para | **Frontend** Next.js | FastAPI dev/staging | FastAPI producción |

**Alternatives considered**:

| Opción | Veredicto |
|---|---|
| **Fly.io** | Contenedores persistentes excelentes, edge global. Alternativa válida a Railway; curva CLI ligeramente más pronunciada. |
| **Heroku** | Legacy, costoso, sin tier gratuito. No recomendado. |
| **AWS Lambda** | El mismo problema de timeout serverless. Lambda Response Streaming es preview/beta. |
| **Google Cloud Run** | Soporta streaming pero la complejidad de setup GCP es desproporcionada para este proyecto. |

---

## Tema 6 — Librería de Gráficas para Next.js 14 + Tailwind

**Decision**: **Recharts** (vía el wrapper de **shadcn/ui charts**). Deshabilitar `isAnimationActive` en `<Line>` para streaming. Usar `dynamic(() => import('./Chart'), { ssr: false })` si aparecen errores de hidratación.

**Rationale**:
- shadcn/ui charts es un wrapper de Recharts pre-estilizado para Tailwind + Next.js — cero configuración para gráficas responsivas y bonitas.
- A la frecuencia de emisión del AG (1 evento/seg), los re-renders SVG son imperceptibles. Las alternativas basadas en Canvas (Chart.js) solo ganan a 30–60 fps.
- Recharts es React declarativo — sin `useRef` a contexto canvas, actualizaciones fáciles por estado.
- **Crítico para streaming**: `isAnimationActive={false}` en `<Line>` es obligatorio. La animación por punto entra en conflicto con los appends en tiempo real y causa jank visible. La gráfica "se siente viva" porque los datos llegan continuamente.

**Patrón de actualización para datos en streaming**:
```tsx
'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function ConvergenceChart({ data }: { data: ConvergenceDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="generation" />
        <YAxis domain={[0, 1]} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="avg_fitness"
          stroke="#3b82f6"
          dot={false}
          isAnimationActive={false}  // ← OBLIGATORIO para streaming
        />
        <Line
          type="monotone"
          dataKey="max_fitness"
          stroke="#16a34a"
          dot={false}
          isAnimationActive={false}  // ← OBLIGATORIO para streaming
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Comparativa de librerías**:

| Librería | Rendering | Bundle | Real-time 1/s | Next.js 14 | Tailwind DX |
|---|---|---|---|---|---|
| **Recharts (shadcn)** | SVG | ~120KB | ✅ Excelente | ✅ Nativo | ✅ Óptimo |
| **Chart.js** | Canvas | ~200KB | ✅ Excelente | ⚠️ Necesita `ssr:false` | ⚠️ Estilos inline |
| **Nivo** | SVG/Canvas | ~350KB | ⚠️ Aceptable | ⚠️ Issues conocidos | ⚠️ Tema custom |
| **visx** | SVG (D3) | ~80KB | ✅ Excelente | ✅ Nativo | ❌ Layout manual |
| **SVG plano** | SVG | 0KB | ✅ Control total | ✅ Nativo | ✅ Control total |

**Alternatives considered**:

| Opción | Veredicto |
|---|---|
| **Chart.js / react-chartjs-2** | Mejor para 30+ fps. Considerar si el AG emite > 10 eventos/seg. |
| **visx** | Máxima flexibilidad (grado Airbnb). 3–5× más tiempo de implementación. No justificado. |
| **Nivo** | Defaults más bonitos pero historial de responsividad deficiente y preocupaciones de mantenimiento. Descartar. |
| **SVG plano** | Cero dependencias. Viable para una línea simple, impracticable para ejes y tooltips. |

---

## Resumen de Decisiones

| # | Tema | Decisión | Riesgo Crítico |
|---|---|---|---|
| 1 | FastAPI SSE | `sse-starlette` + `EventSourceResponse` | Deshabilitar `GZipMiddleware` globalmente |
| 2 | Python GA | NumPy from-scratch (~70 líneas, sin DEAP) | Función fitness debe ser `await`-safe |
| 3 | Frente de Pareto | Filtro de no-dominación NumPy inline | Migrar a `paretoset`/`pymoo` si N > 1,000 |
| 4 | EventSource Next.js | Patrón de dos `useEffect` con debounce | Tokens de auth solo via query param |
| 5 | Despliegue | Railway (dev) + Render (prod) para FastAPI | Nunca usar Vercel para el backend SSE |
| 6 | Gráficas | Recharts vía shadcn/ui | `isAnimationActive={false}` en cada `<Line>` |
