# Quickstart Validation Guide: Motor Genético con SSE

**Feature**: 003-genetic-engine-sse-livedit
**Purpose**: Guía de validación end-to-end para verificar que la feature funciona correctamente antes y después de cada despliegue.

---

## Prerequisites

- Python 3.11+ instalado localmente
- Node.js 18+ y npm instalado
- `uvicorn` disponible o instalable via pip
- El repositorio clonado y en la rama `003-genetic-engine-sse-livedit`

---

## Escenario 1 — Arranque del Microservicio Python

### Setup
```bash
cd motor_genetico
pip install -r requirements.txt
```

### Arranque
```bash
uvicorn main:app --reload --port 8000
```

### Validación
```bash
curl http://localhost:8000/health
```
**Resultado esperado**:
```json
{"status": "ok", "version": "1.0.0"}
```

---

## Escenario 2 — Ejecución del Stream SSE (Herramienta de línea de comandos)

### Comando
```bash
curl -N "http://localhost:8000/api/evolution-stream?water_total_liters=1000&energy_total_kwh=50&num_inhabitants=10&cultivable_area_m2=20&w_human=0.4&w_crop=0.35&w_balance=0.25"
```

### Resultado esperado (extracto de los primeros 3 eventos)

```
data: {"generation":0,"avg_fitness":0.12,"max_fitness":0.61,"top3":[{"scenario_id":"human_priority","label":"Prioridad Humana","water_liters_per_day":680.0,"energy_kwh_per_day":32.0,"fitness_score":0.61,"pareto_rank":1},{"scenario_id":"crop_viability","label":"Viabilidad de Cultivos","water_liters_per_day":450.0,"energy_kwh_per_day":45.0,"fitness_score":0.53,"pareto_rank":1},{"scenario_id":"balanced","label":"Supervivencia Equilibrada","water_liters_per_day":560.0,"energy_kwh_per_day":38.0,"fitness_score":0.57,"pareto_rank":1}],"is_final":false,"viable_count":38}

data: {"generation":5,"avg_fitness":0.31,...}

data: {"generation":199,"avg_fitness":0.78,"max_fitness":0.94,...,"is_final":true}
```

**Criterios de validación**:
- [ ] El primer evento llega en menos de 2 s
- [ ] Cada evento incrementa `generation` en `emit_every_n` (5 por defecto)
- [ ] El último evento tiene `is_final: true`
- [ ] `max_fitness` siempre ≥ `avg_fitness` en todos los eventos
- [ ] `viable_count` aumenta o se mantiene estable a lo largo de las generaciones

---

## Escenario 3 — Penalización Estricta (Test Unitario)

### Comando
```bash
cd motor_genetico
pytest tests/test_fitness.py -v
```

### Resultado esperado
```
PASSED tests/test_fitness.py::test_inviable_individual_gets_zero_fitness
PASSED tests/test_fitness.py::test_water_overflow_gives_zero
PASSED tests/test_fitness.py::test_energy_overflow_gives_zero
PASSED tests/test_fitness.py::test_viable_individual_gets_positive_fitness
PASSED tests/test_fitness.py::test_fitness_is_between_zero_and_one
```

**Criterio clave**: El test `test_inviable_individual_gets_zero_fitness` crea 1000 individuos aleatorios con `water_human + water_irrigation > water_total_liters` y verifica que exactamente el 100% recibe `fitness = 0.0`.

---

## Escenario 4 — Pareto Front y Arquetipos (Test Unitario)

### Comando
```bash
cd motor_genetico
pytest tests/test_pareto.py -v
```

### Resultado esperado
```
PASSED tests/test_pareto.py::test_pareto_front_extracts_three_archetypes
PASSED tests/test_pareto.py::test_human_priority_maximizes_f_human
PASSED tests/test_pareto.py::test_crop_viability_maximizes_f_crop
PASSED tests/test_pareto.py::test_balanced_minimizes_distance_to_utopian
PASSED tests/test_pareto.py::test_degenerate_front_returns_unavailable
```

---

## Escenario 5 — Frontend: Gráfica de Convergencia en Tiempo Real

### Setup
```bash
# En .env.local del proyecto Next.js
NEXT_PUBLIC_GENETIC_ENGINE_URL=http://localhost:8000
```
```bash
npm run dev
```

### Validación Manual

1. Abrir `http://localhost:3000`
2. Inyectar una crisis via el formulario existente
3. **Observar**: La gráfica de convergencia comienza a animarse automáticamente mostrando dos líneas (fitness promedio y fitness máximo)
4. **Verificar**: La gráfica se actualiza cada ~1-2 segundos con nuevos puntos de datos
5. **Verificar**: Al completar la optimización aparece el mensaje "Optimización completada" con checkmark verde
6. **Verificar**: Las tres tarjetas de escenario (Prioridad Humana, Viabilidad de Cultivos, Supervivencia Equilibrada) muestran valores actualizados

---

## Escenario 6 — Reconexión al Mover Sliders (Criterio SC-002)

### Validación Manual

1. Con la optimización corriendo (gráfica animándose):
2. Mover el slider "Prioridad Agua Humana" a un nuevo valor
3. **Verificar**: La gráfica se reinicia visualmente a generación 0 en menos de 600 ms
4. **Verificar**: Aparece brevemente el indicador "Recalculando con nuevos parámetros..."
5. **Verificar**: No hay error en la consola del navegador (F12 → Console)
6. **Verificar**: La nueva optimización inicia con los pesos actualizados (inspeccionar Network tab → nueva petición a `/api/evolution-stream` con `w_human` actualizado)

### Validación con DevTools (Timeline)

1. Abrir Chrome DevTools → Network → filtrar por "evolution-stream"
2. Mover un slider
3. Verificar que aparece una nueva fila de request SSE
4. El timestamp de inicio de la nueva request debe estar < 600 ms después del evento `change` del slider

---

## Escenario 7 — Tolerancia a Fallos (Edge Cases)

### 7a: Recursos Extremadamente Bajos (todos fitness = 0)

```bash
curl -N "http://localhost:8000/api/evolution-stream?water_total_liters=0.1&energy_total_kwh=0.01&num_inhabitants=100&cultivable_area_m2=500"
```

**Resultado esperado**: Todos los eventos muestran `viable_count: 0` y `top3` con los tres escenarios como `scenario_id: "unavailable"`. El frontend muestra la advertencia "Las restricciones actuales limitan las alternativas disponibles".

### 7b: Desconexión del Backend

1. Iniciar la optimización en el frontend
2. Detener el servidor FastAPI (`Ctrl+C`)
3. **Verificar**: El frontend muestra el error de conexión y el botón "Reintentar"
4. **Verificar**: Se intenta reconexión automática máximo 3 veces antes de mostrar el error

### 7c: 10 Conexiones Simultáneas (SC-005)

```bash
cd motor_genetico
pytest tests/test_load_sse.py -v -s
```

**Resultado esperado**: 10 conexiones simultáneas reciben todos los eventos SSE sin que ninguna se retrase más de 1s respecto a las demás.

---

## Referencias

- [Contratos SSE](./contracts/sse-stream.md)
- [Contratos REST](./contracts/rest-api.md)
- [Modelo de Datos](./data-model.md)
- [Plan de Implementación](./plan.md)
