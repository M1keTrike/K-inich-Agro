'use client';
import { useState, useEffect, useRef } from 'react';
import { ConvergenceChart } from '@/components/GeneticEngine/ConvergenceChart';
import { ResourceLock } from '@/components/GeneticEngine/ResourceLock';
import { DynamicControls } from '@/components/GeneticEngine/DynamicControls';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { DynamicTemplate, EvolutionEvent, ParetoScenario } from '@/types';

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
  const [activeTemplate, setActiveTemplate] = useState<DynamicTemplate | null>(null);
  
  const [data, setData] = useState<EvolutionEvent | null>(null);
  const [history, setHistory] = useState<EvolutionEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch templates on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/scenarios/templates')
      .then(res => res.json())
      .then((d: DynamicTemplate[]) => {
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

  const [focusPath, setFocusPath] = useState<string[]>([]);

  const getSubTemplate = (template: DynamicTemplate, path: string[]): DynamicTemplate => {
    if (!path || path.length === 0) return template;
    
    let currentConsumer = template.consumers[path[0]];
    if (!currentConsumer) return template;
    for (let i = 1; i < path.length; i++) {
      if (!currentConsumer.subconsumers) return template;
      currentConsumer = currentConsumer.subconsumers[path[i]];
      if (!currentConsumer) return template;
    }
    
    // Si queremos aislarlo de forma segura, asignamos sus requerimientos como recursos disponibles
    const subResources: Record<string, import('@/types').ResourceDef> = {};
    for (const [reqName, reqDef] of Object.entries(currentConsumer.requirements || {})) {
      subResources[reqName] = { value: reqDef.value, max: reqDef.value }; 
    }
    
    return {
      ...template,
      resources: subResources,
      consumers: currentConsumer.subconsumers || {}
    };
  };

  const executeGA = (template: DynamicTemplate, path: string[]) => {
    const targetTemplate = getSubTemplate(template, path);
    
    // Clear any previous error
    setError(null);

    // If there are no consumers in the sub-template, there's nothing to optimize
    if (Object.keys(targetTemplate.consumers).length === 0) {
      if (eventSourceRef.current) eventSourceRef.current.close();
      setData(null);
      setHistory([]);
      return;
    }

    // Check if we are trying to distribute resources for a child but the parent has no resources allocated (no requirements defined)
    if (path.length > 0 && Object.keys(targetTemplate.resources).length === 0) {
      if (eventSourceRef.current) eventSourceRef.current.close();
      setData(null);
      setHistory([]);
      setError("No se puede iniciar una repartición del hijo cuando aún no se tiene repartido un recurso del padre directo.");
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch('http://localhost:8000/api/scenarios/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetTemplate)
      }).then(() => {
        connectSSE(); // Restart evolution with isolated scope
      }).catch(console.error);
    }, 500); // 500ms debounce
  };

  // 3. Inject new template
  const handleInject = (template: DynamicTemplate) => {
    setActiveTemplate(template);
    executeGA(template, focusPath);
  };

  // 4. Update template on the fly
  const handleTemplateChange = (newTemplate: DynamicTemplate) => {
    setActiveTemplate(newTemplate);
    executeGA(newTemplate, focusPath);
  };

  const handleFocusChange = (path: string[]) => {
    setFocusPath(path);
    if (activeTemplate) {
      executeGA(activeTemplate, path);
    }
  };

  const handleSelectScenario = (scenario: ParetoScenario) => {
    if (!activeTemplate) return;
    
    // Create a deep copy of the template
    const newTemplate = JSON.parse(JSON.stringify(activeTemplate)) as DynamicTemplate;
    
    // Navigate to the current focus node's subconsumers
    let currentConsumers = newTemplate.consumers;
    if (focusPath.length > 0) {
      let current = newTemplate.consumers[focusPath[0]];
      for (let i = 1; i < focusPath.length; i++) {
        if (!current.subconsumers) current.subconsumers = {};
        current = current.subconsumers[focusPath[i]];
      }
      if (!current.subconsumers) current.subconsumers = {};
      currentConsumers = current.subconsumers;
    }
    
    // Apply allocations as requirements for the children
    for (const [key, val] of Object.entries(scenario.allocations)) {
      // key might be "HABITAT.WATER" or "HABITAT.SUB.WATER"
      const parts = key.split('.');
      if (parts.length >= 2) {
        const resourceName = parts.pop()!;
        
        let targetConsumer = currentConsumers;
        let valid = true;
        for (let i = 0; i < parts.length - 1; i++) {
          if (targetConsumer[parts[i]] && targetConsumer[parts[i]].subconsumers) {
             targetConsumer = targetConsumer[parts[i]].subconsumers!;
          } else {
             valid = false;
             break;
          }
        }
        
        if (valid) {
           const finalConsumerName = parts[parts.length - 1];
           if (targetConsumer[finalConsumerName] && targetConsumer[finalConsumerName].requirements[resourceName]) {
               targetConsumer[finalConsumerName].requirements[resourceName].value = val;
           }
        }
      }
    }
    
    handleTemplateChange(newTemplate);
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

        {error && (
          <div className="mb-6">
            <AlertBanner 
              crisisId="restriction-error" 
              title="Restricción de Jerarquía" 
              description={error} 
              severity="warning" 
              onDismiss={() => setError(null)} 
            />
          </div>
        )}

        {/* DASHBOARD: Vista de Resultados y Monitor */}
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Módulo de Recursos (Columna Izquierda) */}
          <div className="xl:col-span-1">
            <ResourceLock 
              template={activeTemplate} 
              onChange={handleTemplateChange} 
              disabled={false} 
            />
          </div>

          {/* Mejores Soluciones (Pareto) */}
          <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Mejores Soluciones Genéticas (Pareto)</h3>
            {data && data.top3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.top3.map((sc, idx) => (
                  <div key={idx} className="p-4 border border-indigo-100 bg-indigo-50/40 rounded-xl">
                    <h3 className="font-semibold text-indigo-900 mb-1">{sc.label}</h3>
                    {sc.scenario_id === "unavailable" ? (
                      <p className="text-sm text-slate-500 italic">Buscando soluciones viables...</p>
                    ) : (
                      <div className="flex flex-col h-full">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 mb-3">Fitness: {sc.fitness_score.toFixed(3)}</p>
                        <div className="bg-white p-3 rounded-lg border border-indigo-50 max-h-56 overflow-y-auto space-y-2 flex-grow mb-3">
                          {Object.entries(sc.allocations).map(([pathStr, val]) => {
                            const parts = pathStr.split('.');
                            const rName = parts.pop()!;
                            const consumerPath = parts.map(p => translateToSpanish(p)).join(' → ');
                            
                            return (
                              <div key={pathStr} className="text-xs flex justify-between border-b border-slate-50 pb-1">
                                <span className="text-slate-500 truncate pr-2" title={`${consumerPath}: ${translateToSpanish(rName)}`}>
                                  <span className="font-medium text-slate-700">{consumerPath}</span> | {translateToSpanish(rName)}
                                </span>
                                <span className="font-bold text-slate-800">{val.toFixed(0)}</span>
                              </div>
                            );
                          })}
                        </div>
                        {data?.is_final && (
                          <button 
                            onClick={() => handleSelectScenario(sc)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Usar como Base
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="xl:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Convergencia Evolutiva</h3>
            <div className="h-64">
              <ConvergenceChart data={history} />
            </div>
          </div>
        </div>

        {/* PANEL DE CONTROL: Edición y Configuración */}
        <DynamicControls 
          template={activeTemplate} 
          onChange={handleTemplateChange} 
          disabled={false} 
          allocations={(() => {
            if (!data?.top3?.[0]?.allocations) return undefined;
            const globalAllocations: Record<string, number> = {};
            const prefix = focusPath.length > 0 ? focusPath.join('.') + '.' : '';
            for (const [key, val] of Object.entries(data.top3[0].allocations)) {
              globalAllocations[prefix + key] = val;
            }
            return globalAllocations;
          })()}
          onFocusChange={handleFocusChange}
        />
      </div>
    </div>
  );
}
