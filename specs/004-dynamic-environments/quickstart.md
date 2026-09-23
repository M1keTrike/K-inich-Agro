# Validation Quickstart: Entornos Dinámicos

## Prerequisites
- Backend (FastAPI) running on `http://localhost:8000`
- Frontend (Next.js) running on `http://localhost:3000`
- OpenRouter API Key configured in `.env` (`OPENROUTER_API_KEY`)

## Scenario 1: Inject a New Template & Validate Math Separation

1. Open the Frontend UI at `http://localhost:3000`. You should see the default simulation.
2. Using cURL (or the UI Template Selector), inject a mixed scenario with 3 variables:

```bash
curl -X POST http://localhost:8000/api/scenarios/inject \
-H "Content-Type: application/json" \
-d '{
  "template_id": "mixed_crisis",
  "resources": [
    {"id": "oxygen", "current_value": 80, "max_value": 100, "min_value": 75, "unit": "%", "type": "environmental", "priority_weight": 0.9},
    {"id": "food", "current_value": 50, "max_value": 100, "min_value": 0, "unit": "kg", "type": "consumable", "priority_weight": 0.6},
    {"id": "temperature", "current_value": 22, "max_value": 30, "min_value": 15, "unit": "C", "type": "environmental", "priority_weight": 0.7}
  ]
}'
```

3. **Expected Outcome**:
   - The cURL command returns a `200 OK`.
   - The Frontend UI *immediately* updates to show precisely 3 progress bars: `oxygen`, `food`, and `temperature`.
   - The SSE stream does not drop (check Network tab in DevTools).
   - The LLM justification appears within a few seconds, referencing the specific resources (oxygen, food, temperature) and grounding its explanation in the governance framework.

## Scenario 2: Validate 20-Dimension Stress Test

1. Run the backend stress test script:
```bash
pytest tests/test_genetic_engine.py::test_20_dimensions
```
2. **Expected Outcome**: The test passes, completing the genetic evolution tick in under 5.0 seconds.
