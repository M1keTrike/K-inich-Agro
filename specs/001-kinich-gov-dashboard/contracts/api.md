# API Contracts

## 1. POST /api/crisis
Inyecta una crisis en el sistema para desencadenar el cálculo de escenarios.

**Request Body**:
```json
{
  "crisis_type": "water_shortage",
  "severity_percent": 40,
  "affected_resources": ["water"],
  "timestamp": "2026-09-20T12:00:00Z"
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Crisis inyectada. Sistema pausado.",
  "data": {
    "crisis_id": "c-1234"
  }
}
```

## 2. POST /api/scenarios
Obtiene los 3 escenarios óptimos calculados por el motor determinista y enriquecidos por el LLM.

**Request Body**:
```json
{
  "crisis_id": "c-1234"
}
```

**Response (200 OK)**:
```json
{
  "scenarios": [
    {
      "id": "scenario_1",
      "allocations": {
        "water_liters": 500,
        "energy_watts": 1200
      },
      "survival_index": 0.85,
      "priority_focus": "human_immediate",
      "llm_explanation": "Prioriza el consumo humano inmediato de agua, asegurando la supervivencia de la tripulación a corto plazo, pero reduciendo el soporte energético del cultivo."
    }
    // ... hasta 3 escenarios
  ]
}
```

## 3. POST /api/vote
Aplica el escenario seleccionado y retorna el estado actualizado del sistema.

**Request Body**:
```json
{
  "scenario_id": "scenario_1",
  "timestamp": "2026-09-20T12:05:00Z"
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "new_system_state": {
    "water_liters": 500,
    "energy_watts": 1200,
    "biomass_kg": 250,
    "status": "normal"
  }
}
```
