# Contrato REST Complementario: Microservicio Motor Genético

**Feature**: 003-genetic-engine-sse-livedit
**Tipo**: REST API (OpenAPI 3.0 compatible)
**Versión**: 1.0

> El endpoint principal de esta feature es SSE (`/api/evolution-stream`). Los endpoints REST documentados aquí son de soporte: health check, validación de parámetros e integración con el sistema de votos existente.

---

## Base URL

```
https://motor-genetico.railway.app   (producción)
http://localhost:8000                 (desarrollo local)
```

Configurado en el frontend como: `NEXT_PUBLIC_GENETIC_ENGINE_URL`

---

## Endpoints

### `GET /health`

Verificación de disponibilidad del microservicio. Usado por el frontend antes de iniciar el stream y por pipelines de CI/CD para validar el despliegue.

**Request**: Sin body ni parámetros.

**Response 200 OK**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-09-20T22:00:00Z"
}
```

---

### `GET /api/evolution-stream`

Ver contrato completo en [`sse-stream.md`](./sse-stream.md).

**Tipo de respuesta**: `text/event-stream` (SSE, no REST convencional)

---

### `POST /api/validate-params`

Valida un conjunto de parámetros de optimización **antes** de abrir el stream SSE. Permite que el frontend proporcione feedback inmediato al usuario sobre parámetros inválidos sin necesidad de establecer la conexión de streaming.

**Request Body** (`application/json`):
```json
{
  "water_total_liters": 1000.0,
  "energy_total_kwh": 50.0,
  "num_inhabitants": 10,
  "cultivable_area_m2": 20.0,
  "w_human": 0.4,
  "w_crop": 0.35,
  "w_balance": 0.25
}
```

**Response 200 OK** (parámetros válidos):
```json
{
  "valid": true,
  "warnings": [],
  "normalized_weights": {
    "w_human": 0.4,
    "w_crop": 0.35,
    "w_balance": 0.25
  },
  "feasibility_estimate": "viable",
  "min_viable_water_per_day": 500.0,
  "min_viable_energy_per_day": 15.0
}
```

**Response 200 OK** (parámetros válidos con advertencias):
```json
{
  "valid": true,
  "warnings": [
    "Los pesos no suman 1.0 (suma=1.2). Se normalizarán automáticamente.",
    "El agua disponible (50L) puede ser insuficiente para 10 habitantes (mínimo recomendado: 500L/día)."
  ],
  "normalized_weights": {
    "w_human": 0.333,
    "w_crop": 0.292,
    "w_balance": 0.208
  },
  "feasibility_estimate": "critical",
  "min_viable_water_per_day": 500.0,
  "min_viable_energy_per_day": 15.0
}
```

**Response 422 Unprocessable Entity** (parámetros inválidos):
```json
{
  "valid": false,
  "errors": [
    {"field": "water_total_liters", "message": "Debe ser mayor que 0"},
    {"field": "num_inhabitants", "message": "Debe ser un entero positivo"}
  ]
}
```

---

## Códigos de Estado HTTP

| Código | Situación |
|---|---|
| `200 OK` | Request exitoso (REST) o stream iniciado (SSE) |
| `422 Unprocessable Entity` | Parámetros de entrada inválidos (tipos incorrectos, valores fuera de rango) |
| `500 Internal Server Error` | Error inesperado del servidor |

---

## CORS

El microservicio permite peticiones desde:

```python
origins = [
    "https://*.vercel.app",          # Previews de Vercel
    "https://kinich-agro.vercel.app", # Producción frontend
    "http://localhost:3000",          # Desarrollo local
]
```

---

## Documentación OpenAPI Autogenerada

FastAPI genera documentación interactiva automáticamente:

- **Swagger UI**: `GET /docs`
- **ReDoc**: `GET /redoc`
- **OpenAPI JSON**: `GET /openapi.json`

---

## Integración con el Sistema de Votos Existente (Next.js)

El sistema de votos del frontend (`/api/vote` — ruta Next.js existente) **no cambia**. Al votar un escenario de Pareto, el frontend adapta el `ParetoScenario` al formato `Vote` existente:

```typescript
// Mapeo en el cliente al momento de votar
function paretoScenarioToVote(scenario: ParetoScenario): Vote {
  return {
    scenario_id: scenario.scenario_id,   // e.g. "human_priority"
    applied_at: new Date().toISOString(),
  };
}

// POST /api/vote (Next.js API route existente, sin cambios)
await fetch('/api/vote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(paretoScenarioToVote(selectedScenario))
});
```

---

## Colección Postman

Archivo: `postman/kinich-agro-genetic-engine.json`

Incluye las siguientes requests preconfiguradas:

| Nombre | Método | URL |
|---|---|---|
| Health Check | GET | `{{base_url}}/health` |
| Validate Params (viable) | POST | `{{base_url}}/api/validate-params` |
| Validate Params (critical) | POST | `{{base_url}}/api/validate-params` (agua=50L) |
| Evolution Stream (default weights) | GET | `{{base_url}}/api/evolution-stream?water_total_liters=1000&energy_total_kwh=50&num_inhabitants=10&cultivable_area_m2=20` |
| Evolution Stream (human priority) | GET | Ídem con `w_human=0.7&w_crop=0.2&w_balance=0.1` |
| Evolution Stream (degenerate) | GET | Con `water_total_liters=0.1&energy_total_kwh=0.01` |

**Variable de entorno Postman**: `base_url` = `http://localhost:8000` (local) o URL de Railway/Render.
