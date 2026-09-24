# Plan de Implementación: Optimización Basada en Consumo y Beneficios

**Feature**: `005-benefit-aware-resource-optimization`  
**Fecha**: 2026-09-24  
**Estado**: Diseño previo a implementación  
**Dependencias**: `004-dynamic-environments`, motor genético SSE y prioridades jerárquicas

## 1. Objetivo

Ampliar el motor genético para que no optimice únicamente la distribución de recursos consumidos, sino también los beneficios que cada nodo produce. El sistema deberá evitar soluciones matemáticamente válidas pero estratégicamente absurdas, especialmente aquellas que dependen de ciclos de producción imposibles o de recursos que todavía no existen.

Ejemplo válido:

```text
Reservas iniciales -> Planta energética -> Energía -> Cultivo -> Comida
```

Ejemplo inválido:

```text
Planta energética -> Cultivo -> Planta energética
```

La funcionalidad debe conservar:

- El modo manual nodo por nodo.
- Las tres soluciones Pareto locales del nodo seleccionado.
- El recorrido automático y sus tres soluciones globales.
- Las prioridades estratégicas jerárquicas ya implementadas.

## 2. Decisiones de diseño

### 2.1 Producción temporal por periodos

La producción no estará disponible en el mismo instante en que se consume. Cada solución se evaluará en periodos discretos:

1. Se parte del inventario inicial.
2. Se verifican los recursos disponibles.
3. Se ejecutan los nodos habilitados.
4. Se descuentan consumos.
5. Se agregan beneficios producidos.
6. Los beneficios estarán disponibles para el siguiente periodo.

Esto evita que una solución se autojustifique usando producción futura como entrada presente.

### 2.2 Grafo acíclico de dependencias

Los beneficios y consumos formarán un grafo dirigido de recursos y nodos. Antes de ejecutar el algoritmo se deberá:

- Construir las dependencias de entrada y salida.
- Ejecutar una validación topológica.
- Rechazar ciclos directos o indirectos.
- Mostrar el ciclo detectado con su ruta completa.

El árbol actual de consumidores seguirá siendo válido, pero las relaciones de producción se validarán como un grafo adicional.

### 2.3 Beneficio útil, no producción bruta

La utilidad no se calculará sobre toda la producción nominal. Se aplicará:

```text
beneficio_util = min(produccion_real, demanda_restante)
```

La producción excedente podrá:

- Tener valor cero si no existe almacenamiento.
- Tener un valor reducido si existe almacenamiento limitado.
- Mantener valor completo únicamente si satisface una demanda futura explícita.

### 2.4 Reservas críticas

Antes de asignar recursos a producción se protegerán las reservas mínimas definidas para la operación:

- Agua vital.
- Energía de soporte.
- Comida mínima.
- Oxígeno u otros recursos críticos.

Una solución que viole una reserva crítica será inviable aunque produzca beneficios elevados.

### 2.5 Prioridad estratégica como factor secundario

La prioridad local y la prioridad efectiva heredada seguirán existiendo, pero no sustituirán al valor de los beneficios. El orden de decisión será:

1. Cumplir restricciones de seguridad y reservas críticas.
2. Evitar ciclos y dependencias imposibles.
3. Cubrir demandas críticas.
4. Maximizar beneficios útiles.
5. Usar la prioridad estratégica para desempatar o ponderar objetivos equivalentes.

## 3. Modelo de datos propuesto

### 3.1 Producción de un nodo

Añadir a `ConsumerDef` una colección de salidas:

```text
outputs: Record<string, OutputDef>
```

Cada `OutputDef` deberá contener inicialmente:

- `resource_name`: recurso producido.
- `amount_per_unit`: cantidad producida por unidad de operación.
- `efficiency`: eficiencia entre `0` y `1`.
- `max_output`: límite máximo opcional por periodo.
- `available_after_periods`: retraso de disponibilidad, por defecto `1`.

La representación puede mantenerse como mapa por nombre de recurso si se conserva un contrato JSON sencillo.

### 3.2 Demanda y valoración

El template deberá incorporar una sección global de valoración:

```text
benefit_values: Record<string, BenefitValueDef>
```

Cada beneficio deberá definir:

- `unit_value`: valor normalizado del recurso.
- `target_demand`: demanda objetivo.
- `critical`: si su déficit afecta la viabilidad.
- `minimum_reserve`: reserva mínima que no puede consumirse.
- `storage_capacity`: capacidad de almacenamiento opcional.

### 3.3 Estado de simulación

Crear una estructura interna de simulación con:

- Inventario inicial.
- Inventario disponible por periodo.
- Consumo por nodo y recurso.
- Producción por nodo y recurso.
- Déficit acumulado.
- Excedente almacenado.
- Violaciones de reserva.
- Dependencias pendientes.
- Periodo actual.

Este estado no debe exponerse directamente como genes del algoritmo; será una capa de evaluación determinista.

## 4. Cambios en el motor genético

### Fase 1: Contratos y validación

1. Extender los esquemas Pydantic con `outputs`, valoración y reservas.
2. Validar rangos numéricos:
   - Eficiencias entre `0` y `1`.
   - Valores y demandas mayores o iguales a `0`.
   - Retrasos enteros mayores o iguales a `0`.
3. Implementar el constructor del grafo de dependencias.
4. Implementar detección de ciclos mediante ordenamiento topológico.
5. Crear errores de validación legibles para la UI.
6. Rechazar templates inválidos antes de iniciar SSE.

### Fase 2: Simulador determinista

1. Crear un simulador de periodos independiente del algoritmo genético.
2. Consumir recursos únicamente desde el inventario disponible.
3. Programar outputs para el periodo correspondiente.
4. Aplicar eficiencia y límites de producción.
5. Aplicar almacenamiento y capacidad máxima.
6. Calcular demanda restante después de cada producción.
7. Separar beneficio útil, excedente y déficit.
8. Registrar un desglose explicable por nodo y periodo.

### Fase 3: Nueva función de fitness

La función de evaluación deberá producir como mínimo:

```text
fitness_total =
    utilidad_de_beneficios
    - penalizacion_por_deficit
    - penalizacion_por_consumo_excesivo
    - penalizacion_por_reservas
    - penalizacion_por_excedentes_no_utiles
```

Reglas:

- Una violación crítica debe marcar el individuo como inviable.
- Los beneficios deben valorarse con la demanda restante.
- Los recursos producidos en un periodo no pueden consumirse antes de estar disponibles.
- La prioridad efectiva puede ponderar la utilidad de un nodo, pero no anular las restricciones de seguridad.
- Mantener la función actual como modo de compatibilidad cuando un template no declare outputs.

### Fase 4: Objetivos Pareto

Los objetivos deben representar dimensiones estratégicas separadas, por ejemplo:

- Cobertura de comida.
- Cobertura de energía.
- Cobertura de agua potable.
- Cobertura de oxígeno.
- Déficit total.
- Consumo total o eficiencia.
- Cumplimiento de reservas críticas.

No se debe reducir todo a una única suma demasiado pronto. La frontera Pareto debe conservar alternativas con diferentes intercambios estratégicos.

### Fase 5: Recorrido automático global

El recorrido automático actual deberá utilizar la evaluación de beneficios al comparar ramas globales:

1. Generar alternativas locales para el nodo.
2. Simular su impacto en el inventario y periodos.
3. Propagar únicamente estados válidos.
4. Mantener el beam de soluciones parciales.
5. Puntuar cada rama con utilidad global y restricciones.
6. Presentar las tres soluciones globales completas.
7. Mantener el flujo manual sin cambios.

La rama no debe copiar únicamente los `fitness_score` locales. Debe recalcularse con la utilidad acumulada del árbol completo.

## 5. Cambios en la interfaz

### Editor de nodos

Añadir una sección de producción junto a los requerimientos:

- Recursos consumidos.
- Beneficios producidos.
- Eficiencia.
- Capacidad por periodo.
- Retraso de disponibilidad.
- Prioridad local.
- Prioridad efectiva heredada.

### Configuración global

Añadir un modal para configurar:

- Valor de cada beneficio.
- Demanda objetivo.
- Reservas mínimas.
- Capacidad de almacenamiento.
- Número máximo de periodos.

### Resultados locales

Mantener las tres tarjetas actuales, agregando:

- Beneficios generados.
- Déficits restantes.
- Consumo total.
- Periodos utilizados.
- Alertas de reservas o excedentes.

### Resultados globales

Mantener la vista previa antes de aplicar y añadir:

- Beneficio total útil.
- Cobertura por recurso.
- Déficit crítico.
- Consumo y producción por periodo.
- Nodos que habilitaron otros nodos.
- Alertas de dependencias o capacidad.

Una solución con ciclo o reserva crítica incumplida no deberá aparecer como aplicable.

## 6. API y SSE

### Validación del template

El endpoint de activación deberá validar el grafo antes de aceptar el template. La respuesta deberá distinguir:

- Error de esquema.
- Ciclo de dependencias.
- Reserva inválida.
- Recurso producido sin definición de valor.

### Eventos SSE

Extender los eventos de evolución con información opcional:

- `period`.
- `available_resources`.
- `produced_resources`.
- `useful_benefits`.
- `critical_deficits`.
- `dependency_status`.

Los clientes antiguos deberán poder ignorar esos campos.

## 7. Compatibilidad y migración

1. Los templates actuales sin `outputs` deben continuar funcionando.
2. Los nodos sin beneficios conservarán el comportamiento actual de consumo y prioridad.
3. Los valores existentes de `priority_weight` se mantendrán.
4. La interfaz deberá mostrar una configuración de producción vacía, no inventar outputs.
5. La validación de ciclos solo será obligatoria cuando existan relaciones de producción.
6. Se deberá añadir una plantilla de ejemplo con:
   - Planta energética.
   - Cultivo de papas.
   - Inventario inicial limitado.
   - Dependencia válida por periodos.
   - Caso de ciclo inválido.

## 8. Pruebas

### Unitarias

- Validar rangos de outputs y beneficios.
- Detectar ciclo directo.
- Detectar ciclo indirecto.
- Aceptar un grafo acíclico válido.
- Impedir consumo antes de producción.
- Aplicar correctamente la eficiencia.
- Limitar producción por capacidad.
- Limitar beneficios por demanda restante.
- Proteger reservas críticas.
- Penalizar excedentes sin almacenamiento.
- Calcular prioridad efectiva sin duplicarla en la distribución entre hermanos.

### Motor genético

- Comparar una solución que produce comida útil contra otra que produce excedente inútil.
- Verificar que una planta energética no sea favorecida si no tiene agua inicial suficiente.
- Verificar que el cultivo pueda usar energía producida en un periodo anterior.
- Confirmar que las soluciones con ciclos sean inviables.
- Confirmar que Pareto preserve alternativas con distintos intercambios.

### API y SSE

- Rechazar templates con ciclos antes de iniciar SSE.
- Emitir eventos de periodo y producción.
- Mantener compatibilidad con templates antiguos.
- Conservar desconexión y cancelación del stream.

### Interfaz

- Mostrar outputs editables.
- Mostrar reservas y déficits.
- Conservar el modo manual.
- Generar tres soluciones globales con el recorrido automático.
- Permitir revisar una solución global antes de aplicarla.
- Impedir aplicar una solución inválida.

## 9. Orden de implementación recomendado

1. Definir el contrato de outputs, beneficios, demandas y reservas.
2. Implementar validación del grafo y detección de ciclos.
3. Crear el simulador determinista por periodos.
4. Añadir pruebas unitarias del simulador.
5. Integrar el simulador con fitness y objetivos Pareto.
6. Actualizar el endpoint de templates y SSE.
7. Añadir una plantilla válida y una inválida para pruebas.
8. Actualizar el editor de nodos y configuración global.
9. Actualizar las tarjetas de resultados locales.
10. Integrar utilidad global con el recorrido automático.
11. Actualizar la vista previa de soluciones globales.
12. Ejecutar validación end-to-end y pruebas de regresión.

## 10. Criterios de aceptación

- El sistema rechaza cualquier ciclo de producción antes de ejecutar el algoritmo.
- Ningún nodo puede consumir producción futura en el mismo periodo.
- Una producción solo recibe valor cuando cubre una demanda real o una capacidad de almacenamiento válida.
- Las reservas críticas se respetan en todas las soluciones aplicables.
- El modo manual sigue generando tres soluciones para el nodo seleccionado.
- El modo automático sigue generando tres soluciones globales completas.
- Las soluciones globales se pueden revisar antes de aplicarse.
- Los templates actuales continúan funcionando sin declarar beneficios.
- La interfaz explica por qué una solución recibe penalización o es rechazada.
- Los resultados muestran consumo, producción, déficit, excedente y utilidad de forma auditable.

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Crecimiento combinatorio de alternativas | Beam search con ancho configurable y poda por inviabilidad |
| Ciclos de producción | Validación topológica antes de iniciar el motor |
| Beneficios artificiales por producción excedente | Valorar solo demanda restante y almacenamiento válido |
| Doble conteo de recursos producidos | Inventario por periodo y trazabilidad de cada entrada/salida |
| Cambios bruscos en resultados existentes | Compatibilidad para templates sin outputs y pruebas de regresión |
| Modelo difícil de configurar | Valores por defecto, validación en UI y plantilla de ejemplo |
| Prioridades que contradicen seguridad | Reservas y restricciones duras antes de ponderaciones estratégicas |
| SSE demasiado pesado | Emitir resúmenes por periodo y mantener detalles bajo demanda |

## 12. Resultado esperado

El motor dejará de buscar únicamente una distribución de consumo y pasará a evaluar planes de producción y consumo temporalmente válidos. Las soluciones favorecidas serán aquellas que:

- Sean físicamente y temporalmente posibles.
- No dependan de ciclos circulares.
- Protejan las reservas críticas.
- Cubran necesidades reales.
- Produzcan beneficios útiles.
- Usen la prioridad estratégica como contexto, no como sustituto del valor real.
