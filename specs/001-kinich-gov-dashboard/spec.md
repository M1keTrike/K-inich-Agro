# Feature Specification: Kinich-Gov Dashboard (MVP)

**Feature Branch**: `[kinich-gov-dashboard-mvp]`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Genera el documento de especificación de producto (.speckit/specification.md) para el MVP de K'inich-Agro. Este sistema será utilizado como el tablero interactivo principal para la toma de decisiones en asamblea..."

## Clarifications

### Session 2026-09-20
- Q: How should the deterministic mathematical engine be implemented for this MVP? → A: Option A - Build a local mock module/function within the application that returns predefined JSON responses for testing.
- Q: How should the moderator input the assembly's decision into the dashboard? → A: Option A - The moderator simply clicks an "Apply Scenario" button on the winning card (no manual vote tallying in the UI).
- Q: What happens to the dashboard state immediately after a winning scenario is applied? → A: Option A - The dashboard immediately returns to the real-time normal state, with the base metrics updated to reflect the scenario's allocations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Asamblea Visualiza el Estado Base (Priority: P1)

Como participante de la asamblea, quiero ver los indicadores visuales del nivel actual de agua, energía y biomasa del invernadero, para entender el estado de salud actual del sistema K'inich-Agro.

**Why this priority**: Es la vista inicial y el contexto fundamental sin el cual ninguna crisis o decisión tendría sentido.

**Independent Test**: Can be fully tested by loading the dashboard and verifying the UI accurately renders the simulated base state values for water, energy, and biomass.

**Acceptance Scenarios**:

1. **Given** el sistema está en estado normal, **When** el usuario abre el dashboard, **Then** se muestran los medidores (gauges/charts) con el nivel actual de agua, energía y biomasa.

---

### User Story 2 - Simulación de Crisis y Comparación de Escenarios (Priority: P1)

Como moderador de la asamblea, quiero inyectar una falla (ej. pérdida del 40% de agua), para que el sistema pause el estado normal, calcule los escenarios óptimos (Top 3) mediante el motor matemático, y el LLM traduzca las métricas a un lenguaje natural para los asambleístas.

**Why this priority**: Es el núcleo funcional del MVP. Permite a la asamblea entender las alternativas disponibles ante una emergencia.

**Independent Test**: Can be fully tested by injecting a JSON crisis payload and verifying the UI correctly displays 3 distinct scenarios with natural language explanations.

**Acceptance Scenarios**:

1. **Given** el panel de estado base activo, **When** se envía un Input de Crisis, **Then** el dashboard se pausa temporalmente.
2. **Given** el estado en pausa, **When** el motor matemático responde, **Then** la UI muestra 3 tarjetas contrastando el impacto de cada decisión, cada una con su traducción a lenguaje natural generada por el LLM.

---

### User Story 3 - Votación y Aplicación del Escenario (Priority: P2)

Como participante de la asamblea, quiero poder votar por uno de los 3 escenarios propuestos, para que la decisión democrática se registre y el sistema aplique el escenario ganador.

**Why this priority**: Cierra el ciclo de toma de decisiones participativas.

**Independent Test**: Can be fully tested by selecting an option and verifying the system state updates to reflect the chosen scenario's resource allocations.

**Acceptance Scenarios**:

1. **Given** los 3 escenarios en pantalla, **When** el moderador hace clic en el botón "Aplicar Escenario" de la tarjeta ganadora (sin necesidad de conteo manual en la UI), **Then** el dashboard retorna inmediatamente al estado normal en tiempo real, con los indicadores de estado base actualizados según las nuevas métricas del escenario.

---

### Edge Cases

- ¿Qué pasa si el servicio de OpenRouter (LLM) no responde o tarda demasiado? (Se debe mostrar un fallback genérico o el texto en crudo si no hay traducción a tiempo).
- ¿Qué pasa si el motor matemático devuelve menos de 3 escenarios (ej. solo 1 viable)? (La UI debe adaptarse para mostrar solo las opciones viables).
- ¿Qué pasa si hay un empate exacto en la votación de la asamblea? (El sistema debería solicitar un desempate o el moderador debe tomar la decisión).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El Dashboard MUST mostrar visualmente (ej. barras, anillos) los niveles de agua, energía y biomasa.
- **FR-002**: El sistema MUST tener un "Módulo de Simulación de Crisis" que permita seleccionar/ingresar qué recurso ha fallado y en qué proporción.
- **FR-003**: El sistema MUST pausar los indicadores en tiempo real al detectar/inyectar una crisis.
- **FR-004**: El sistema MUST llamar a un motor matemático determinista enviando el Input de Crisis y recibir un Output de Escenarios (Max 3).
- **FR-005**: El sistema MUST consumir un LLM (vía OpenRouter) enviando los resultados matemáticos para generar una explicación humana y comprensible para cada escenario (ej. "Consumo humano inmediato vs. viabilidad del cultivo a futuro").
- **FR-006**: El Dashboard MUST presentar las opciones generadas en una interfaz de "Comparador de Escenarios" lado a lado.
- **FR-007**: El sistema MUST incluir un "Módulo de Votación" que permita al moderador aplicar la opción más votada mediante un simple botón de "Aplicar Escenario" en la tarjeta correspondiente, sin conteo manual de votos en la UI.
- **FR-008**: El frontend MUST estar estructurado para un despliegue continuo en Vercel, conectado al repositorio de GitHub.
- **FR-009**: Las estructuras de Datos (APIs/JSON) MUST adherirse estrictamente a los siguientes esquemas de ejemplo.
- **FR-010**: El sistema MUST proveer una arquitectura base de webhooks para permitir futuras automatizaciones con sistemas externos genéricos.

### Data Structures & API Schemas (JSON)

- **Input de Crisis (Endpoint)**
```json
{
  "crisis_type": "water_shortage",
  "severity_percent": 40,
  "affected_resources": ["water"],
  "timestamp": "2026-09-20T12:00:00Z"
}
```

- **Output del Motor Matemático**
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
      "priority_focus": "human_immediate"
    },
    {
      "id": "scenario_2",
      "allocations": {
        "water_liters": 200,
        "energy_watts": 2000
      },
      "survival_index": 0.60,
      "priority_focus": "crop_viability"
    },
    {
      "id": "scenario_3",
      "allocations": {
        "water_liters": 350,
        "energy_watts": 1600
      },
      "survival_index": 0.75,
      "priority_focus": "balanced"
    }
  ]
}
```

### Key Entities

- **Crisis**: Representa la falla inyectada en el invernadero (tipo, severidad, recursos afectados).
- **Scenario**: Representa una alternativa de asignación de recursos calculada, incluyendo los litros exactos de agua, watts de energía y el índice de supervivencia.
- **Vote**: Registro de la elección democrática de la asamblea para resolver la crisis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El MVP frontend puede ser accedido públicamente a través de una URL de Vercel (despliegue exitoso).
- **SC-002**: El módulo de crisis puede ser probado mediante Postman (los esquemas JSON son válidos y parseables).
- **SC-003**: El tiempo de respuesta total entre la inyección de la crisis y la renderización de las explicaciones generadas por OpenRouter no excede los 10 segundos.
- **SC-004**: Los usuarios (asambleístas/moderador) pueden completar un ciclo completo de inyección de crisis -> visualización de opciones -> votación en un flujo ininterrumpido.

## Assumptions

- El motor matemático (requerido por la constitución como algoritmo genético) se implementará temporalmente como un módulo/función mock local determinista dentro de la aplicación frontend que retornará respuestas JSON predefinidas para propósitos de prueba en el MVP.
- Se asume que la asamblea tomará la decisión interactuando con un moderador que opera el dashboard (una sola pantalla compartida/proyectada), por lo que el módulo de votación no requiere gestión de usuarios individuales (auth) en el MVP.
- Se asume que las llaves de OpenRouter se configurarán de forma segura en las variables de entorno de Vercel.
