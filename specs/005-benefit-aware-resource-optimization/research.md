# Investigación y decisiones: Feature 005

## Preferencias genéticas por nodo y recurso

**Decisión**: conservar el cromosoma proporcional existente `[0,1]`, volver a resolver la distribución jerárquica sobre el inventario disponible al inicio de cada periodo y guardar las preferencias de cada escenario para reevaluar ramas globales.

**Motivo**: el genoma actual ya es proporcional y `decode_to_absolute` implementa el reparto por prioridad y jerarquía. Reutilizarlo permite que un consumidor reciba recursos generados en periodos posteriores.

**Alternativa descartada**: congelar allocations absolutas del primer periodo; impediría que un consumidor use producción tardía.

## Disponibilidad de outputs

**Decisión**: agendar outputs para `period + max(1, available_after_periods)` y procesar llegadas al comienzo de cada periodo.

**Motivo**: evita autoconsumo del mismo paso y hace la evolución temporal independiente del orden de nodos. Retraso cero se mantiene válido, con disponibilidad segura al siguiente periodo.

**Alternativa descartada**: ordenar nodos topológicamente y permitir consumo secuencial dentro del mismo periodo; sus resultados dependen del orden y no respetan el modelo temporal acordado.

## Valoración y factibilidad

**Decisión**: contabilizar utilidad cuando llega la producción, limitarla por demanda restante, conservar excedentes según capacidad declarada y tratar reservas/demandas críticas como restricciones duras.

**Motivo**: separa producción bruta de producto útil y evita premiar excedentes sin consumidor.

## Validación y evaluación global

**Decisión**: validar en `POST /scenarios/active` antes de SSE y añadir `POST /scenarios/evaluate` para puntuar preferencias combinadas sobre el template completo.

**Motivo**: separar simulación global de evoluciones locales y eliminar la suma engañosa de fitness parciales.

**Alternativa descartada**: lanzar una nueva evolución completa por cada rama del beam; aumenta el costo y no representa con precisión las preferencias ya seleccionadas.

## Compatibilidad

Outputs, `benefit_values` y métricas nuevas SSE tienen defaults vacíos u opcionales. Sin `benefit_values`, se conserva la ruta de fitness existente.
