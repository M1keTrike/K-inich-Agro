import { explainScenarioWithLLM } from '../src/lib/openRouter';
import { Scenario } from '../src/types';

describe('OpenRouter Client Isolation', () => {
  it('should fallback to mathematical values without hallucinations when API is unavailable', async () => {
    // We do not set OPENROUTER_API_KEY, so it falls back
    const originalEnv = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const mockScenario: Scenario = {
      id: 'mock-1',
      allocations: {
        water_liters: 100,
        energy_watts: 500
      },
      survival_index: 0.9,
      priority_focus: 'human_immediate',
      llm_explanation: ''
    };

    const explanation = await explainScenarioWithLLM(mockScenario);
    
    // The fallback explanation MUST contain the exact numbers from the JSON to avoid hallucination
    expect(explanation).toContain('100.00L');
    expect(explanation).toContain('500.00W');
    expect(explanation).toContain('0.9');

    process.env.OPENROUTER_API_KEY = originalEnv;
  });
});
