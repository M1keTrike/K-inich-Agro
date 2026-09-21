# Quickstart Validation Guide

## Prerrequisitos
- Node.js 18+
- Postman
- Una clave API válida de OpenRouter.

## Setup del Proyecto
1. Clonar el repositorio.
2. Ejecutar `npm install` o `pnpm install`.
3. Crear un archivo `.env.local` en la raíz con:
   ```env
   OPENROUTER_API_KEY=tu_clave_aqui
   ```
4. Ejecutar el servidor de desarrollo: `npm run dev`.
5. Acceder a `http://localhost:3000`.

## Validaciones End-to-End

### Validación de UI Inicial (Estado Base)
- **Acción**: Abre el navegador en `http://localhost:3000`.
- **Esperado**: Ver los indicadores (gauges) mostrando valores base (ej. 1000L agua, 3000W energía). No hay ninguna crisis activa.

### Validación de API (Postman)
- **Acción**: Importa `kinich_agro_collection.json` en Postman.
- **Acción**: Ejecuta el request "1. Inyectar Crisis" (`POST /api/crisis`).
- **Esperado**: `200 OK` con un `crisis_id`.
- **Acción**: Ejecuta el request "2. Calcular Escenarios" (`POST /api/scenarios`).
- **Esperado**: `200 OK` retornando 3 escenarios, cada uno con el campo `llm_explanation` con lenguaje natural comprensible.

### Validación de Ciclo Completo (Dashboard UI)
- **Acción**: En el Dashboard, usa el "Panel de Crisis" para enviar una crisis del 40% de Agua.
- **Esperado**:
  1. Los indicadores base se "pausan".
  2. Aparece un loading mientras se consulta el API.
  3. Aparecen 3 tarjetas de escenarios (Top 3) lado a lado, con las explicaciones del LLM y los indicadores de impacto.
- **Acción**: Haz clic en "Aplicar Escenario" en la primera tarjeta.
- **Esperado**: El sistema vuelve a la vista de estado base normal, pero los niveles de recursos han sido actualizados con los valores del escenario elegido.
