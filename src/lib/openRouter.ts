import { Scenario } from '../types';

export async function explainScenarioWithLLM(scenario: Scenario): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  const priorityLabels: Record<string, string> = {
    'human_immediate': 'la supervivencia humana inmediata',
    'crop_viability': 'la viabilidad de los cultivos a largo plazo',
    'balanced_survival': 'un balance equilibrado de supervivencia'
  };
  const focusName = priorityLabels[scenario.priority_focus] || scenario.priority_focus;

  const fallbackExplanation = `Este escenario prioriza ${focusName}, asignando ${scenario.allocations.water_liters.toFixed(0)} L de agua y ${scenario.allocations.energy_watts.toFixed(0)} W de energía. Índice de supervivencia estimado: ${(scenario.survival_index * 100).toFixed(0)}%.`;

  if (!apiKey) {
    return fallbackExplanation;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const prompt = `Actúa como asesor de supervivencia. Explica este escenario brevemente para una asamblea ciudadana en español: Prioridad: ${focusName}, Agua asignada: ${scenario.allocations.water_liters}L, Energía: ${scenario.allocations.energy_watts}W, Índice de supervivencia: ${scenario.survival_index}.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Kinich-Agro Dashboard'
      },
      body: JSON.stringify({
        model: 'google/gemini-pro',
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallbackExplanation;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || fallbackExplanation;
  } catch {
    clearTimeout(timeoutId);
    return fallbackExplanation;
  }
}
