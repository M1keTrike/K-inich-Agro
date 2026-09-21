import { NextResponse } from 'next/server';
import { calculateScenarios, INITIAL_STATE } from '@/lib/mathEngine';
import { explainScenarioWithLLM } from '@/lib/openRouter';
import { store } from '@/lib/store';

export async function GET() {
  if (!store.currentCrisis) {
    return NextResponse.json({ error: 'No active crisis' }, { status: 400 });
  }

  const scenarios = calculateScenarios(INITIAL_STATE, store.currentCrisis);
  
  // Call LLM for each scenario
  const enrichedScenarios = await Promise.all(
    scenarios.map(async (sc) => {
      const explanation = await explainScenarioWithLLM(sc);
      return { ...sc, llm_explanation: explanation };
    })
  );

  return NextResponse.json({ scenarios: enrichedScenarios });
}
