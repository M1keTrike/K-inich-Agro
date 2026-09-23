# Research & Architecture Decisions: Módulo de Entornos Dinámicos

## Decision 1: Scenario Templates Storage
- **Decision**: Store templates as flat JSON configuration files in the backend.
- **Rationale**: Keeps the architecture simple and aligned with the "Infraestructura Ágil" principle. No database overhead is needed for static configuration templates, and it allows easy version control of scenarios directly in the Git repository.
- **Alternatives considered**: Relational database (PostgreSQL) - rejected due to unnecessary complexity for read-only template structures.

## Decision 2: LLM Context Integration
- **Decision**: Inject a static Markdown document (`governance.md`) directly into the system prompt via OpenRouter.
- **Rationale**: The governance knowledge base (e.g., Elinor Ostrom's principles) is finite and relatively static. Injecting it directly ensures the LLM has complete context without the latency, complexity, and non-determinism of a RAG / Vector Database system.
- **Alternatives considered**: Vector database with RAG - rejected because the knowledge domain is constrained enough to fit comfortably within modern LLM context windows (e.g., Claude 3 or GPT-4o).

## Decision 3: Mathematical Differentiation in Genetic Engine
- **Decision**: Differentiate fitness calculation by `type`.
- **Rationale**: Consumables (like food, water) must be optimized to minimize usage to extend survival. Environmental factors (like temperature, radiation) cannot be "consumed", so they must be treated as hard boundary constraints where individuals falling outside thresholds are penalized or invalidated.
- **Alternatives considered**: Treating all variables identically with `priority_weight` - rejected because it violates basic physical reality and would lead to nonsensical scenarios (e.g., trying to "minimize" oxygen levels to save resources).
