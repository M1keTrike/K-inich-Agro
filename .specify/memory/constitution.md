# Constitución Fundacional: K'inich-Agro
## Gemelo Digital de Gobernanza Comunitaria

Este documento establece los principios innegociables de arquitectura e ingeniería para K'inich-Agro, un sistema diseñado para gestionar recursos críticos en condiciones de escasez extrema (como una colonia marciana), garantizando la supervivencia y la cohesión social.

### 1. Soberanía de la Asamblea (La IA no decide)
El sistema opera estrictamente como un asesor tecnológico. Mediante un **algoritmo genético multipropósito**, procesa el estado actual de los recursos (agua, energía, biomasa) y calcula el *Top 3 de escenarios de supervivencia*. **El sistema no puede ejecutar acciones unilateralmente**; la aplicación de cualquier escenario requiere siempre la votación democrática de la asamblea comunitaria.

### 2. Cálculo Determinista Obligatorio
Queda estrictamente prohibido delegar la optimización matemática, las simulaciones del invernadero inteligente o el cálculo de racionamiento a la generación de texto de un LLM, para evitar alucinaciones en decisiones críticas. Todo el cálculo de recursos debe manejarse mediante **algoritmos estructurados y precisos**. Los LLMs, integrados a través de OpenRouter, se utilizarán exclusivamente para:
- La interpretación del lenguaje natural.
- La estructuración de peticiones y consultas.
- La explicación clara de los escenarios matemáticos a los usuarios.

### 3. Transparencia y Anti-Acaparamiento
Toda la información sobre el estado de los recursos y las proyecciones a futuro debe exponerse de forma **transparente y pública** en el tablero interactivo. La interfaz debe priorizar la claridad visual de las consecuencias (comparativas claras de *qué pasa si se toma la decisión A vs. B*), democratizando el acceso a la información y previniendo el acaparamiento.

### 4. Infraestructura Ágil y Despliegue Continuo
Todo el código base debe estar rígidamente versionado en repositorios de **GitHub**. El frontend del tablero interactivo debe estar diseñado y configurado para un **despliegue continuo, rápido y sin fricciones a través de Vercel**.

### 5. Arquitectura Orientada a APIs y Flujos
El sistema debe ser **altamente modular**. Debe permitir el consumo e inyección de variables simuladas (ej. alertas de fugas o caídas de energía) a través de **APIs bien documentadas y probadas con Postman**. Esta arquitectura base debe garantizar la viabilidad para la futura integración de flujos logísticos automatizados.
