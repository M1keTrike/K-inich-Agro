# Phase 0: Research & Technology Decisions

## Decision: Framework Full-Stack
- **Decision**: Utilizar Next.js (App Router) con React y TypeScript.
- **Rationale**: El requerimiento FR-008 exige un despliegue sin fricciones en Vercel. Next.js es el framework nativo de Vercel y permite desarrollar tanto el frontend (React) como el backend (API Routes) en un solo monorepositorio. Esto satisface la necesidad de ejecución rápida, modular y colaboración ágil.
- **Alternatives considered**: Vite + Express. Rechazado porque requiere orquestar dos despliegues o un build process más complejo en Vercel, restando agilidad al MVP.

## Decision: Integración de LLM (OpenRouter)
- **Decision**: Llamada directa desde el backend (Next.js API Route) a OpenRouter.
- **Rationale**: Mantiene el API Key seguro (`OPENROUTER_API_KEY` en entorno de servidor), previene exposición en cliente.
- **Alternatives considered**: Llamadas desde el cliente. Rechazado por problemas de seguridad.

## Decision: Mock Determinista (Motor Matemático)
- **Decision**: Implementar una función puramente TypeScript en `src/lib/mathEngine.ts` que reciba el payload de crisis y devuelva arreglos JSON estáticos simulando los Top 3 escenarios.
- **Rationale**: Cumple con la Asunción y el principio Constitucional 2 de evitar que la IA decida lógicas matemáticas. Permite testear el MVP íntegramente.
- **Alternatives considered**: Desplegar un servicio de Python separado para simular el motor. Rechazado por sobrecomplicar la arquitectura del MVP.
