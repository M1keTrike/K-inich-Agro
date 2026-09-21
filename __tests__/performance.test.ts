import { explainScenarioWithLLM } from '../src/lib/openRouter';
import { Scenario } from '../src/types';

describe('Performance & Latency', () => {
  it('should resolve in less than 11 seconds (timeout configured to 10s)', async () => {
    // If API key is not set, it resolves immediately with fallback.
    // If it is set and the server hangs, our abort controller will kill it in 10s.
    
    const mockScenario: Scenario = {
      id: 'mock-1',
      allocations: { water_liters: 100, energy_watts: 500 },
      survival_index: 0.9,
      priority_focus: 'human_immediate',
      llm_explanation: ''
    };

    const start = Date.now();
    await explainScenarioWithLLM(mockScenario);
    const end = Date.now();

    expect(end - start).toBeLessThan(11000);
  });
});
