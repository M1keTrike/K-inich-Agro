# Feature Specification: Motor Genético Real con Transparencia SSE y Edición en Vivo

**Feature Branch**: `003-genetic-engine-sse-livedit`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Reemplazar el motor determinista simulado por un Algoritmo Genético real construido en Python (FastAPI), implementando transparencia total y edición reactiva, con cálculo del Frente de Pareto para tres escenarios, streaming SSE y controles deslizantes en vivo en el frontend Next.js."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visualización del Proceso de Optimización en Tiempo Real (Priority: P1)

Como miembro de la asamblea comunitaria, quiero ver cómo el sistema está evolucionando matemáticamente hacia la mejor distribución de recursos mientras el algoritmo trabaja, para poder confiar en que el resultado final no es una "caja negra" sino un proceso transparente y verificable.

**Why this priority**: Es el núcleo de la constitución: el sistema debe ser transparente. Sin esta historia, el resto de la plataforma regresa al modelo de caja negra que la constitución prohíbe explícitamente.

**Independent Test**: Se puede probar de forma independiente activando el motor genético con parámetros por defecto y verificando que el panel del tablero muestra una gráfica animada de convergencia. No se requiere ninguna otra historia para entregar este valor.

**Acceptance Scenarios**:

1. **Given** el tablero está abierto y los recursos actuales han sido cargados, **When** el usuario inicia el cálculo de escenarios, **Then** el tablero muestra en tiempo real una gráfica que se actualiza con el número de generación actual, el fitness promedio de la población y el fitness del mejor individuo encontrado hasta ese momento.
2. **Given** el proceso de optimización está en curso, **When** la gráfica de convergencia se actualiza, **Then** cada actualización ocurre en menos de 500 ms desde que el motor emite el evento correspondiente, de forma que la animación sea perceptiblemente fluida para el usuario.
3. **Given** el proceso de optimización ha concluido, **When** el algoritmo alcanza el criterio de parada (número máximo de generaciones), **Then** el tablero muestra una señal visual clara de "Cálculo completado" y presenta el Top-3 de escenarios finales.

---

### User Story 2 — Ajuste de Prioridades en Vivo sin Interrumpir la Sesión (Priority: P2)

Como delegado técnico de la asamblea, quiero modificar los pesos de las variables de optimización (prioridad al agua humana, prioridad energética, peso de viabilidad agrícola) mediante controles deslizantes mientras el motor trabaja, y ver inmediatamente cómo cambia el proceso de optimización con las nuevas restricciones, sin tener que recargar la página ni reiniciar la sesión.

**Why this priority**: Permite que la asamblea explore escenarios con diferentes valores de forma interactiva durante una sesión de deliberación, lo cual es la propuesta de valor central del sistema de gobernanza.

**Independent Test**: Se puede probar de forma independiente moviendo cualquier control deslizante y verificando que se inicia un nuevo ciclo de optimización visible en la gráfica. La historia 1 debe estar operativa, pero esta historia agrega el ciclo de re-parametrización.

**Acceptance Scenarios**:

1. **Given** el motor genético está ejecutándose y el stream SSE está activo, **When** el usuario mueve un control deslizante a un nuevo valor, **Then** el frontend cancela la conexión SSE actual y establece una nueva conexión con los parámetros actualizados en menos de 300 ms, y la gráfica de convergencia se reinicia visualmente desde la generación 0.
2. **Given** el usuario ajusta simultáneamente múltiples controles deslizantes en rápida sucesión, **When** el usuario termina de ajustar (evento de "soltar" el control), **Then** el sistema envía únicamente una petición de reconexión con los últimos valores consolidados (sin disparar múltiples reconexiones intermedias).
3. **Given** el motor reinicia con nuevos parámetros, **When** la nueva optimización comienza, **Then** el Top-3 de escenarios previo permanece visible en el tablero como referencia comparativa hasta que el nuevo cálculo produce su primer resultado válido del Frente de Pareto.

---

### User Story 3 — Presentación del Top-3 de Escenarios de Supervivencia (Priority: P3)

Como miembro votante de la asamblea, quiero ver los tres mejores escenarios de distribución de recursos (Prioridad Humana, Viabilidad de Cultivos, Supervivencia Equilibrada) con sus métricas clave, para poder votar de forma informada.

**Why this priority**: Es el output final del proceso completo, y el que vincula el motor matemático con la acción democrática de la asamblea. Depende de las historias P1 y P2, pero puede validarse con datos pre-calculados de forma independiente.

**Independent Test**: Se puede probar inyectando un resultado de Frente de Pareto pre-calculado (sin conectar el stream SSE) y verificando que el tablero muestra las tres tarjetas de escenario con sus métricas.

**Acceptance Scenarios**:

1. **Given** el algoritmo ha completado al menos una generación completa, **When** el Frente de Pareto produce los tres arquetipos, **Then** el tablero muestra tres tarjetas de escenario: "Prioridad Humana", "Viabilidad de Cultivos" y "Supervivencia Equilibrada", cada una con sus valores de asignación de agua, energía y su puntuación de fitness relativo.
2. **Given** el resultado del Frente de Pareto no puede producir tres escenarios diferenciados (e.g., el espacio de soluciones es degenerado por restricciones muy estrictas), **When** el sistema presenta los resultados, **Then** el tablero muestra los escenarios disponibles y una advertencia clara en lenguaje comprensible: "Las restricciones actuales limitan las alternativas disponibles", sin mostrar escenarios duplicados.
3. **Given** la asamblea aprueba uno de los escenarios por votación, **When** el escenario es marcado como "aprobado", **Then** el sistema registra el escenario elegido con su timestamp y los parámetros de peso usados en el cálculo, y esta decisión queda accesible en el historial del tablero.

---

### Edge Cases

- ¿Qué ocurre si los recursos disponibles ingresados son tan bajos que ningún individuo de la población supera el umbral de viabilidad mínima (todos con fitness = 0)? El sistema debe informar al usuario que el escenario es crítico y no tiene solución viable con los recursos actuales.
- ¿Cómo se comporta el tablero si la conexión de red se interrumpe mientras el stream SSE está activo? El frontend debe detectar el cierre del stream e intentar reconectar automáticamente hasta 3 veces antes de mostrar un mensaje de error accionable.
- ¿Qué sucede si el usuario mueve los controles deslizantes tan rápido que genera más de 10 eventos de cambio por segundo? El sistema debe aplicar una limitación por rebote (debounce) de 250 ms en el cliente para consolidar los cambios antes de enviar la petición al motor.
- ¿Qué sucede si el motor genético en el servidor tarda más de 30 segundos en emitir el primer evento? El frontend debe mostrar un indicador de "procesando" y, pasado ese tiempo, un mensaje de advertencia "El cálculo está tomando más tiempo de lo esperado".

---

## Requirements *(mandatory)*

### Functional Requirements

**Motor Genético (Servicio de Optimización)**

- **FR-001**: El servicio DEBE implementar un algoritmo genético completo con las fases de inicialización de población, evaluación de fitness, selección, cruce (crossover) y mutación para optimizar la distribución de recursos hídricos y energéticos.
- **FR-002**: El servicio DEBE calcular una función de fitness multivariable que evalúe simultáneamente la supervivencia humana (consumo de agua potable), la viabilidad de cultivos (riego y temperatura del invernadero) y el balance energético neto de la colonia.
- **FR-003**: El servicio DEBE aplicar penalización estricta: cualquier individuo de la población cuya asignación de recursos supere el total disponible declarado recibirá fitness = 0 de forma irrevocable, sin corrección ni normalización posterior.
- **FR-004**: El servicio DEBE calcular el Frente de Pareto al finalizar cada ciclo de evaluación y extraer tres arquetipos diferenciados: el individuo que maximiza la supervivencia humana, el que maximiza la viabilidad agrícola, y el que minimiza la distancia euclidiana al punto utópico del Frente (Supervivencia Equilibrada).
- **FR-005**: El servicio DEBE aceptar como entrada los parámetros de optimización: volumen total de agua disponible (litros/día), capacidad energética total (kWh/día), número de habitantes, superficie cultivable activa (m²), y los pesos ponderados para cada objetivo (W_humano, W_cultivo, W_balance), todos los cuales deben poder modificarse por petición sin reiniciar el servicio.
- **FR-006**: El servicio DEBE exponer un endpoint de streaming que emita el estado de la evolución en tiempo real durante el proceso de cálculo.

**Transparencia por Streaming (SSE)**

- **FR-007**: El endpoint de streaming DEBE emitir eventos con el siguiente esquema de datos por cada N generaciones configurables (valor por defecto: cada 5 generaciones):

  ```
  Evento SSE — campo: data
  {
    "generation":    <número entero, generación actual>,
    "avg_fitness":   <número decimal, fitness promedio de la población>,
    "max_fitness":   <número decimal, fitness del mejor individuo>,
    "top3": [
      {
        "scenario_id": "human_priority" | "crop_viability" | "balanced",
        "label":       <texto legible, nombre del escenario>,
        "water_liters_per_day":  <número decimal>,
        "energy_kwh_per_day":    <número decimal>,
        "fitness_score":         <número decimal>,
        "pareto_rank":           <número entero>
      }
    ],
    "is_final": <booleano, true solo en la última generación>
  }
  ```

- **FR-008**: El endpoint de streaming DEBE cerrar la conexión con un evento de tipo `close` o marcando `is_final: true` en el último payload, para que el cliente pueda distinguir el fin del cálculo de una desconexión inesperada.
- **FR-009**: El servicio DEBE ser capaz de manejar múltiples conexiones SSE simultáneas (al menos 10) sin degradación del rendimiento, dado que múltiples miembros de la asamblea pueden visualizar el tablero en paralelo.

**Frontend Reactivo (Tablero Next.js)**

- **FR-010**: El tablero DEBE integrar la interfaz `EventSource` nativa del navegador para consumir el stream SSE y actualizar los gráficos de convergencia en tiempo real sin recargar la página.
- **FR-011**: El tablero DEBE mostrar un gráfico de líneas animado con dos series: "Fitness Promedio" y "Fitness Máximo", donde el eje X representa el número de generación y el eje Y representa el valor de fitness normalizado (0 a 1).
- **FR-012**: El tablero DEBE mostrar controles deslizantes (sliders) para los tres pesos de optimización (W_humano, W_cultivo, W_balance) con etiquetas en lenguaje natural y un indicador del valor actual en porcentaje.
- **FR-013**: Al modificar cualquier control deslizante, el tablero DEBE: (1) aplicar un debounce de 250 ms para esperar que el usuario termine de ajustar, (2) abortar la conexión SSE activa mediante `EventSource.close()`, (3) construir una nueva URL de conexión con los parámetros actualizados codificados como query params, y (4) establecer una nueva conexión SSE.
- **FR-014**: El tablero DEBE mostrar el estado de reconexión con un indicador visual discreto ("Recalculando con nuevos parámetros...") que desaparezca automáticamente cuando llegue el primer evento SSE de la nueva conexión.
- **FR-015**: El tablero DEBE mostrar el Top-3 de escenarios como tarjetas comparativas, actualizando su contenido en cada evento SSE recibido que contenga datos del Frente de Pareto.

### Key Entities

- **Individuo** (cromosoma de la población genética): Representa una propuesta de distribución de recursos. Atributos: asignación de agua para consumo humano (litros/día), asignación de agua para riego (litros/día), asignación de energía para habitabilidad (kWh/día), asignación de energía para producción agrícola (kWh/día). Se valida contra los totales disponibles para determinar viabilidad.
- **Generación**: Snapshot del estado de toda la población en un ciclo de evaluación. Atributos: número de generación, fitness promedio, fitness máximo, cromosoma élite (mejor individuo).
- **Escenario de Pareto** (archetype): Individuo seleccionado del Frente de Pareto que representa un arquetipo de decisión. Atributos: ID de escenario, etiqueta descriptiva, valores de asignación de recursos, puntuación de fitness, rango de Pareto.
- **Sesión de Optimización**: Instancia de una ejecución del algoritmo genético. Atributos: parámetros de entrada (recursos disponibles, pesos), timestamp de inicio, número total de generaciones, estado (en curso / completada / cancelada).
- **Parámetros de Peso** (W_humano, W_cultivo, W_balance): Coeficientes que ponderan la importancia relativa de cada objetivo. Deben sumar 1.0 (normalización). Si el usuario los ajusta a valores que no suman 1.0, el sistema normaliza automáticamente y notifica el ajuste.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios perciben las actualizaciones de la gráfica de convergencia como continuas y fluidas — cada actualización visible en pantalla ocurre en menos de 500 ms desde que el motor genético emite el evento, bajo condiciones normales de red local.
- **SC-002**: Al modificar un control deslizante y soltar, el tiempo transcurrido hasta que aparece el primer evento SSE de la nueva sesión de optimización en el tablero es inferior a 600 ms (300 ms de debounce + 250 ms de latencia de reconexión + margen), resultando en una experiencia que los usuarios describen como "imperceptible".
- **SC-003**: El 100% de los individuos cuya suma de recursos asignados supere los recursos disponibles reciben fitness = 0 en toda ejecución del algoritmo, verificable comparando los vectores de asignación con los totales declarados en los parámetros de entrada.
- **SC-004**: El motor es capaz de completar 200 generaciones con una población de 100 individuos en menos de 10 segundos en hardware de grado servidor estándar, permitiendo que las sesiones de deliberación de la asamblea no se extiendan más de lo necesario.
- **SC-005**: El tablero permanece funcional y reactivo con al menos 10 conexiones SSE simultáneas activas, sin que ninguna sesión experimente actualizaciones retrasadas más de 1 segundo respecto a las otras.
- **SC-006**: El Top-3 de escenarios de Pareto muestra tres arquetipos diferenciados en al menos el 90% de las ejecuciones con parámetros de recursos que permiten soluciones factibles (al menos un individuo con fitness > 0).

---

## Assumptions

- El motor genético se desplegará como un microservicio independiente del frontend Next.js, accesible a través de una URL de API configurable por variable de entorno, sin acoplar su ciclo de vida al servidor de renderizado del frontend.
- Los valores de recursos disponibles (agua total, energía total) ya existen en el estado global del tablero (provenientes de la Especificación 001 y 002) y son accesibles como parámetros de entrada al motor sin requerir una pantalla de configuración nueva.
- El número máximo de generaciones del algoritmo genético se fijará en 200 como valor por defecto configurable; esto es suficiente para la convergencia en el espacio de problemas esperado (2-4 variables de asignación continuas).
- El tamaño de la población se fijará en 100 individuos como valor por defecto; este valor balancea la calidad de la solución con la velocidad de cálculo requerida por SC-004.
- La implementación del Frente de Pareto extraerá exactamente tres arquetipos nombrados. Si el frente produce menos de tres soluciones no dominadas, los arquetipos faltantes se marcarán como "No disponible" y se mostrará la advertencia correspondiente (ver Edge Cases).
- Los pesos de optimización (W_humano, W_cultivo, W_balance) se normalizarán automáticamente si su suma difiere de 1.0, con una notificación al usuario pero sin rechazar la petición.
- La función de cruce (crossover) usará un operador aritmético estándar (promedio ponderado de dos padres) y la mutación aplicará perturbaciones gaussianas dentro de los límites de recursos válidos, salvo que la constitución requiera un método específico aprobado por la asamblea técnica.
- El historial de decisiones de la asamblea (escenario votado, parámetros usados, timestamp) se persistirá en el almacenamiento de datos existente del proyecto, sin requerir una nueva base de datos.
- La autenticación y autorización de acceso al endpoint SSE seguirán el esquema ya establecido en la Especificación 001 (token de sesión comunitaria), sin necesidad de un nuevo mecanismo de seguridad.
- El despliegue continuo del microservicio Python seguirá las guías de infraestructura del Principio 4 de la constitución; el destino de despliegue específico (Railway, Render, VPS) queda fuera del alcance de esta especificación.
