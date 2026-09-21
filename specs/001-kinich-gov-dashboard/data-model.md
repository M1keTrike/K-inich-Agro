# Data Model

Extraído de la especificación técnica.

## 1. System State (In-Memory para MVP)
Estado actual del invernadero.
- **Fields**:
  - `water_liters`: number (Nivel actual de agua)
  - `energy_watts`: number (Nivel actual de energía)
  - `biomass_kg`: number (Nivel actual de biomasa)
  - `status`: string ('normal' | 'crisis_paused')

## 2. Crisis
Representa la falla inyectada en el sistema.
- **Fields**:
  - `crisis_type`: string (ej. "water_shortage")
  - `severity_percent`: number (0-100)
  - `affected_resources`: string[] (ej. ["water"])
  - `timestamp`: string (ISO)

## 3. Scenario
Alternativa de asignación de recursos calculada determinísticamente.
- **Fields**:
  - `id`: string
  - `allocations`: { `water_liters`: number, `energy_watts`: number }
  - `survival_index`: number (0.0 - 1.0)
  - `priority_focus`: string (ej. "human_immediate", "crop_viability")
  - `llm_explanation`: string (Generada por OpenRouter)

## 4. Vote (Acción de Aplicar Escenario)
Registro de la elección para resolver la crisis.
- **Fields**:
  - `scenario_id`: string (ID del escenario seleccionado)
  - `applied_at`: string (ISO timestamp)
