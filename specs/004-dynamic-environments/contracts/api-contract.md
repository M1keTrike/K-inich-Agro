# API Contracts: Entornos Dinámicos

## `POST /api/scenarios/inject`
Injects a Scenario Template to update the active simulation state.

**Request Body**:
```json
{
  "template_id": "dust_storm_01",
  "resources": [
    {
      "id": "oxygen_level",
      "current_value": 85.5,
      "max_value": 100.0,
      "min_value": 70.0,
      "unit": "%",
      "type": "environmental",
      "priority_weight": 0.95
    },
    {
      "id": "water_reserves",
      "current_value": 500.0,
      "max_value": 1000.0,
      "min_value": 0.0,
      "unit": "L",
      "type": "consumable",
      "priority_weight": 0.8
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Scenario injected. Simulation updating.",
  "active_dimensions": 2
}
```

## `GET /api/stream/simulation`
Server-Sent Events (SSE) endpoint emitting the real-time simulation state and the Top-3 scenarios.

**Event Stream Payload** (`message` event):
```json
{
  "tick": 1423,
  "resources": {
    "oxygen_level": 85.4,
    "water_reserves": 498.5
  },
  "scenarios": {
    "vital_priority": {
      "rationing_policy": "Strict",
      "estimated_survival_days": 14
    },
    "sociological_analysis": "Según los principios de Ostrom..."
  }
}
```
