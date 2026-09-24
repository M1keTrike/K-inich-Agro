# Modelo de datos: Feature 005

## Recurso (`ResourceDef`)

- `value: number >= 0`: inventario inicial. La clave del mapa es el identificador.

## Output (`OutputDef`)

Asociado a `ConsumerDef.outputs[resource_name]`:

- `amount_per_unit: number >= 0`
- `efficiency: number` en `[0,1]`, default 1
- `max_output?: number >= 0`
- `available_after_periods: integer >= 0`, default 1; cero se habilita al periodo siguiente como mínimo.

## Valoración/reserva (`BenefitValueDef`)

Asociada a `DynamicTemplate.benefit_values[resource_name]`:

- `unit_value: number >= 0`
- `target_demand: number >= 0`, default 0, acumulada en el horizonte
- `critical: boolean`, default false
- `minimum_reserve: number >= 0`, default 0
- `storage_capacity?: number >= 0`

La clave debe existir en `resources`. La reserva no excede inventario inicial ni capacidad declarada.

## Consumidor y template

- `ConsumerDef`: `requirements`, `priority_weight` y `subconsumers` actuales; `outputs` opcional, default vacío.
- `DynamicTemplate`: `benefit_values` opcional, default vacío; `max_periods` entero entre 1 y 100, default 5; conserva los demás parámetros del motor.
- Cada output refiere un recurso existente con valoración. El grafo productor→consumidor se valida y los ciclos se rechazan.

## Resultado de simulación

Inventario disponible, consumo raíz por periodo, producción generada/llegada, beneficio útil, déficit total/crítico, reserva incumplida, penalización de consumo y factibilidad. Las allocations de hijos desglosan el pool del padre y no se descuentan dos veces.

## Escenario Pareto y evento SSE

El escenario conserva su identificador, etiqueta, allocations, fitness y rango; añade `allocation_preferences`, `feasible`, beneficio útil, déficit de demanda/crítico y violaciones de reserva. SSE mantiene todos los campos existentes y añade métricas opcionales de periodo, inventario, consumo, producción, utilidad, déficit, reserva y dependencias.
