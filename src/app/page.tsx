'use client';
import { useState, useEffect, useRef } from 'react';
import { ConvergenceChart } from '@/components/GeneticEngine/ConvergenceChart';
import { DynamicControls } from '@/components/GeneticEngine/DynamicControls';
import { DynamicTemplate, EvolutionEvent } from '@/types';

// Formateador simple para convertir llaves como WATER_LITERS a español "Water Liters"
const formatLabel = (key: string) => {
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const translateToSpanish = (key: string) => {
  const dictionary: Record<string, string> = {
    WATER: 'Agua',
    ENERGY: 'Energía',
    O2: 'Oxígeno',
    COOLING: 'Enfriamiento',
    MAIN_ENERGY: 'Energía Principal',
    BATTERIES: 'Baterías',
    CLEAN_WATER: 'Agua Limpia',
    BIOCIDES: 'Biocidas',
    HABITAT: 'Hábitat',
    CROPS: 'Cultivos',
    SHIELDS: 'Escudos',
    COMMS: 'Comunicaciones',
    THERMAL_SEAL: 'Sello Térmico',
    CREW_SURVIVAL: 'Superv. Tripulación',
    LIFE_SUPPORT: 'Soporte Vital',
    MANUFACTURING: 'Manufactura',
    HYDROPONICS: 'Hidroponía',
    QUARANTINE: 'Cuarentena',
    CREW: 'Tripulación'
  };
  return dictionary[key] || formatLabel(key);
};

export default function Home() {
  const [templates, setTemplates] = useState<DynamicTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<DynamicTemplate | null>(null);
  
  const [data, setData] = useState<EvolutionEvent | null>(null);
  const [history, setHistory] = useState<EvolutionEvent[]>([]);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch templates on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/scenarios/templates')
      .then(res => res.json())
      .then((d: DynamicTemplate[]) => {
        setTemplates(d);
        if (d.length > 0) {
          handleInject(d[0]);
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Connect to SSE
  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // Reset history when starting a new stream
    setHistory([]);
    setData(null);

    const eventSource = new EventSource('http://localhost:8000/api/evolution-stream');
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as EvolutionEvent;
        setData(parsed);
        setHistory(prev => {
          const newHistory = [...prev, parsed];
          if (newHistory.length > 50) newHistory.shift();
          return newHistory;
        });
        
        if (parsed.is_final) {
          eventSource.close();
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
    };
    
    eventSourceRef.current = eventSource;
  };

  // 3. Inject new template
  const handleInject = (template: DynamicTemplate) => {
    setActiveTemplate(template);
    fetch('http://localhost:8000/api/scenarios/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    }).then(() => {
      connectSSE();
    }).catch(console.error);
  };

  // 4. Update template on the fly
  const handleTemplateChange = (newTemplate: DynamicTemplate) => {
    setActiveTemplate(newTemplate);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch('http://localhost:8000/api/scenarios/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      }).then(() => {
        connectSSE(); // Restart evolution with new params
      }).catch(console.error);
    }, 500); // 500ms debounce
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!activeTemplate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <p className="text-slate-500 animate-pulse">Conectando con el Motor Genético N-Dimensional...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-slate-800">K&apos;inich-Agro: Entornos Dinámicos</h1>
          <p className="text-sm text-slate-500 mt-1">Gobernanza Agnóstica - Generación: {data ? data.generation : 0}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Selector de Plantillas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Inyectar Crisis</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {templates.map(t => (
                <div key={t.template_id} className={`p-4 border rounded-lg flex justify-between items-center transition ${activeTemplate.template_id === t.template_id ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <h3 className="font-medium text-slate-800">{t.name}</h3>
                    <p className="text-xs text-slate-500">{t.description}</p>
                  </div>
                  <button 
                    onClick={() => handleInject(t)}
                    className="ml-4 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition"
                  >
                    Inyectar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores Dinámicos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Estado de Recursos</h2>
            <div className="space-y-4">
              {Object.entries(activeTemplate.resources).map(([key, rDef]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{translateToSpanish(key)}</span>
                    <span className="text-sm text-slate-500">{rDef.value.toFixed(1)} / {rDef.max.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, Math.max(0, (rDef.value / rDef.max) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Controles Dinámicos */}
        <DynamicControls 
          template={activeTemplate} 
          onChange={handleTemplateChange} 
          disabled={false} 
        />

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Convergencia Genética (Fitness)</h3>
          </div>
          <ConvergenceChart data={history} />
        </div>

        {/* Proyecciones Pareto */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">Mejores soluciones</h2>
          
          {data && data.top3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {data.top3.map((sc, idx) => (
                <div key={idx} className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-lg">
                  <h3 className="font-semibold text-indigo-900 mb-2">{sc.label}</h3>
                  {sc.scenario_id === "unavailable" ? (
                    <p className="text-sm text-slate-500 italic">No disponible en esta generación.</p>
                  ) : (
                    <div>
                      <p className="text-xs text-indigo-700 mb-2 font-medium">Fitness Score: {sc.fitness_score.toFixed(3)}</p>
                      {Object.entries(sc.allocations).map(([cName, resAlloc]) => (
                        <div key={cName} className="mb-2 bg-white/60 p-2 rounded border border-indigo-50">
                          <p className="text-xs font-semibold text-slate-800 border-b border-indigo-100 pb-1 mb-1">{translateToSpanish(cName)}</p>
                          {Object.entries(resAlloc).map(([rName, val]) => (
                            <div key={rName} className="flex justify-between text-xs text-slate-600">
                              <span>{translateToSpanish(rName)}:</span>
                              <span className="font-medium">{val.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
