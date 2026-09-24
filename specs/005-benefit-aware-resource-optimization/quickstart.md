# Validación rápida: Feature 005

## Requisitos

- Python y dependencias de `motor_genetico/requirements.txt` instaladas.
- Node dependencies instaladas para comprobar el frontend.

## Pruebas del motor

Desde `motor_genetico/`:

```powershell
python -m pytest tests/test_dependencies.py tests/test_simulation.py
```

Escenarios cubiertos: grafo acíclico, ciclo, reserva inválida, eficiencia, disponibilidad diferida y déficit crítico al terminar el horizonte antes de recibir un output.

## Comprobación TypeScript

Desde la raíz:

```powershell
npx tsc --noEmit
```

## Flujo manual de API

1. Iniciar FastAPI con `uvicorn main:app --reload` desde `motor_genetico/`.
2. Activar una plantilla acíclica con `POST /api/scenarios/active`, outputs valorados y `max_periods >= 3`.
3. Conectar `GET /api/evolution-stream`; inspeccionar `avg_fitness`, top3, periodo, inventario, producción útil y déficits.
4. Enviar una plantilla con output desconocido, reserva inválida y ciclo por separado. Cada activación debe devolver 422 con un código legible y la de ciclo una ruta.
5. Enviar `POST /api/scenarios/evaluate` con el template global y las preferencias combinadas. Confirmar resultado global con periodos y `feasible`.

## Flujo UI

1. Abrir la configuración de un nodo, añadir output y ajustar cantidad, eficiencia, límite y retraso.
2. Abrir “Beneficios y reservas”, definir demanda/valor/criticidad/reserva/capacidad y horizonte.
3. Generar alternativas locales y revisar utilidad, déficit y reserva.
4. Ejecutar el recorrido automático, abrir una alternativa global, inspeccionar periodos y confirmar que una no factible no se puede aplicar.
5. Repetir con un template antiguo sin outputs para confirmar compatibilidad.

Los formatos están definidos en `contracts/`; las entidades en `data-model.md`.
