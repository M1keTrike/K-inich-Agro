# Tasks: K'inich-Gov Dashboard MVP

**Input**: Design documents from `specs/001-kinich-gov-dashboard/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md

**Organization**: Las tareas están agrupadas en las 5 Fases definidas en el plan, incluyendo los metadatos estrictos requeridos.

---

## Fase 1: Configuración Base y Control de Versiones

- [x] T001 Inicialización del repositorio con Next.js y TailwindCSS en `src/`
  - **Fase**: Fase 1
  - **Archivos**: `/package.json`, `/tsconfig.json`, `/tailwind.config.ts`, `/src/app/globals.css`
  - **Dependencias**: Ninguna.
  - **Criterios de Aceptación**: El repositorio base compila sin errores (`npm run dev`) y muestra la página por defecto de Next.js.

- [x] T002 [P] Limpieza de componentes por defecto y setup de estructura base
  - **Fase**: Fase 1
  - **Archivos**: `/src/app/page.tsx`, `/src/app/layout.tsx`, `/src/components/`, `/src/lib/`, `/src/types/`
  - **Dependencias**: T001
  - **Criterios de Aceptación**: La página principal renderiza un layout en blanco, las carpetas `components`, `lib`, y `types` existen.

---

## Fase 2: Motor Backend y Lógica Determinista (Foundational)

- [x] T003 Estructuración de los esquemas JSON de entrada y salida
  - **Fase**: Fase 2
  - **Archivos**: `/src/types/index.ts`
  - **Dependencias**: T002
  - **Criterios de Aceptación**: Tipos e interfaces de TypeScript definidos para `Crisis`, `Scenario`, `SystemState` y `Vote`, respetando `data-model.md`.

- [x] T004 Implementación del motor determinista local
  - **Fase**: Fase 2
  - **Archivos**: `/src/lib/mathEngine.ts`
  - **Dependencias**: T003
  - **Criterios de Aceptación**: Función que recibe una `Crisis` y retorna 3 `Scenario` simulados. No usa llamados a API externa. Los valores de recursos y supervivencia cumplen matemáticamente con la crisis del 40%.

- [x] T005 [P] Integración del cliente OpenRouter
  - **Fase**: Fase 2
  - **Archivos**: `/src/lib/openRouter.ts`
  - **Dependencias**: T003
  - **Criterios de Aceptación**: Cliente fetch configurado para apuntar a la API de OpenRouter leyendo la variable `process.env.OPENROUTER_API_KEY`. Debe incluir manejo de timeouts y un fallback genérico si la API no responde en menos de 10s.

- [x] T006 Implementación de los endpoints API principales
  - **Fase**: Fase 2
  - **Archivos**: `/src/app/api/crisis/route.ts`, `/src/app/api/scenarios/route.ts`, `/src/app/api/vote/route.ts`
  - **Dependencias**: T004, T005
  - **Criterios de Aceptación**: Endpoints que consumen el motor matemático y el LLM, retornando JSON según `contracts/api.md`.

- [x] T007 Creación de la colección de Postman local
  - **Fase**: Fase 2
  - **Archivos**: `/postman/kinich_agro_collection.json`
  - **Dependencias**: T006
  - **Criterios de Aceptación**: Archivo JSON exportado de Postman listo para su ejecución e importación que cubra las 3 rutas API.

---

## Fase 3: Frontend (Dashboard K'inich-Gov)

- [x] T008 [US1] Construcción de los indicadores visuales del Estado Base
  - **Fase**: Fase 3
  - **Archivos**: `/src/components/Dashboard/StateIndicators.tsx`, `/src/app/page.tsx`
  - **Dependencias**: T003
  - **Criterios de Aceptación**: El tablero renderiza los valores base iniciales de agua, energía y biomasa usando TailwindCSS, simulando el estado normal.

- [x] T009 [US2] Implementación del Panel de Inyección de Crisis
  - **Fase**: Fase 3
  - **Archivos**: `/src/components/CrisisPanel/CrisisForm.tsx`, `/src/app/page.tsx`
  - **Dependencias**: T008, T006
  - **Criterios de Aceptación**: Formulario que envía un request a `/api/crisis`, pausa el estado base de la UI, y consulta `/api/scenarios`.

- [x] T010 [US2] Construcción del Visualizador Comparativo de Escenarios (Top-3)
  - **Fase**: Fase 3
  - **Archivos**: `/src/components/ScenarioComparator/ScenarioCard.tsx`, `/src/components/ScenarioComparator/ScenarioList.tsx`
  - **Dependencias**: T009
  - **Criterios de Aceptación**: La interfaz renderiza dinámicamente de 1 a 3 tarjetas (según los viables retornados por el motor) lado a lado, mostrando el cálculo del escenario y la justificación generada por el LLM o un texto fallback predeterminado en caso de timeout.

- [x] T011 [US3] Implementación del módulo de votación comunitaria
  - **Fase**: Fase 3
  - **Archivos**: `/src/components/ScenarioComparator/ScenarioCard.tsx`, `/src/app/page.tsx`
  - **Dependencias**: T010, T006
  - **Criterios de Aceptación**: Botón "Aplicar Escenario" por cada tarjeta que realiza un request a `/api/vote` y reanuda el dashboard base con los nuevos valores reflejados en tiempo real. En caso de empate en la asamblea, el moderador actúa como decisor final mediante este mismo botón.

---

## Fase 4: Pruebas y Aseguramiento de Calidad (QA)

- [x] T012 Script de prueba automatizada para el motor determinista
  - **Fase**: Fase 4
  - **Archivos**: `/__tests__/mathEngine.test.ts` (con Jest)
  - **Dependencias**: T004
  - **Criterios de Aceptación**: Al inyectar una crisis del 40%, el script valida en un test que el motor devuelva exactamente 3 escenarios viables, sin valores negativos y respetando el mínimo de supervivencia.

- [x] T013 Script de prueba de aislamiento de IA (Anti-Alucinaciones)
  - **Fase**: Fase 4
  - **Archivos**: `/__tests__/openRouter.test.ts`
  - **Dependencias**: T005
  - **Criterios de Aceptación**: Se mockea el JSON del backend hacia el LLM. Un test automatizado procesa la respuesta del LLM y falla si algún valor matemático numérico devuelto no existe en el JSON de origen.

- [x] T014 Ejecución de Pruebas de Integración (Postman)
  - **Fase**: Fase 4
  - **Archivos**: `/postman/kinich_agro_collection.json`
  - **Dependencias**: T007
  - **Criterios de Aceptación**: La colección se ejecuta usando Newman o manualmente validando todos los HTTP 200 y validaciones de esquema JSON en todas las respuestas.

- [x] T015 Pruebas de Interfaz y Simulacro
  - **Fase**: Fase 4
  - **Archivos**: Pruebas manuales (QA manual en navegador) o cypress (opcional). No se requieren nuevos archivos fuente, validación visual.
  - **Dependencias**: T011
  - **Criterios de Aceptación**: El panel refleja el impacto visual, la UI se pausa correctamente y se actualiza solo tras aplicar un voto de mayoría (click).

- [x] T016 Validación de Rendimiento y Latencia (LLM)
  - **Fase**: Fase 4
  - **Archivos**: `/__tests__/performance.test.ts`
  - **Dependencias**: T005
  - **Criterios de Aceptación**: Test que valide que el tiempo de respuesta total simulado para el flujo de crisis hasta la respuesta del LLM se gestiona y falla/cancela correctamente si supera los 10 segundos.

---

## Fase 5: Despliegue e Integración Continua

- [x] T017 Configuración de los archivos base para el despliegue en Vercel
  - **Fase**: Fase 5
  - **Archivos**: `/vercel.json`
  - **Dependencias**: T011
  - **Criterios de Aceptación**: `vercel.json` configurado correctamente con headers y comandos de build en Vercel, habilitando el despliegue automático desde la rama main de GitHub sin fricciones.

- [x] T018 Preparación de la arquitectura de webhooks
  - **Fase**: Fase 5
  - **Archivos**: `/src/app/api/webhooks/route.ts`
  - **Dependencias**: T006
  - **Criterios de Aceptación**: Endpoint base `/api/webhooks` que responda `200 OK` preparado para recibir POST payloads futuros de sistemas externos de automatización.

---

## Dependencies & Execution Order

- **Fase 1** arranca de inmediato.
- **Fase 2** requiere la base de la Fase 1.
- **Fase 3** (Frontend) asume que la Fase 2 está lista para consumir el JSON del motor y del LLM.
- **Fase 4** (QA) puede desarrollarse en paralelo con la Fase 3 siempre que los mocks existan o de manera inmediatamente secuencial a la Fase 3.
- **Fase 5** es la última etapa al tener el código verificado.

### Parallel Opportunities
- La estructura de tipos (T003) puede permitir empezar el frontend mockeado (T008) en paralelo mientras se implementa el backend.
- Los tests de QA (T012, T013) pueden escribirse al mismo tiempo que la Fase 2 por otro desarrollador.

---

## Implementation Strategy
1. Desplegar el esqueleto base (T001-T002).
2. Construir los cimientos lógicos (T003-T007).
3. Enlazar la UI visualmente a estos motores (T008-T011).
4. Asegurar rigurosidad matemática y lógica (T012-T016).
5. Empaquetar y hacer vivo en la nube (T017-T018).
