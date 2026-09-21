import { calculateScenarios, INITIAL_STATE } from '../src/lib/mathEngine';
import { Crisis } from '../src/types';

describe('Math Engine', () => {
  it('should return exactly 3 scenarios on a 40% crisis', () => {
    const crisis: Crisis = {
      crisis_type: 'water_shortage',
      severity_percent: 40,
      affected_resources: ['water'],
      timestamp: new Date().toISOString()
    };
    
    const scenarios = calculateScenarios(INITIAL_STATE, crisis);
    
    expect(scenarios).toHaveLength(3);
    
    scenarios.forEach(sc => {
      expect(sc.allocations.water_liters).toBeGreaterThanOrEqual(0);
      expect(sc.allocations.energy_watts).toBeGreaterThanOrEqual(0);
      expect(sc.survival_index).toBeGreaterThanOrEqual(0.7); // Minimum survival index assumption
    });
  });
});
