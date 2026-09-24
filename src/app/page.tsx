'use client';
import { useState, useEffect, useRef } from 'react';
import { ConvergenceChart } from '@/components/GeneticEngine/ConvergenceChart';
import { ResourceLock } from '@/components/GeneticEngine/ResourceLock';
import { DynamicControls } from '@/components/GeneticEngine/DynamicControls';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { DistributionReportsViewer } from '@/components/Reports/DistributionReportsViewer';
import { GlobalDraftPreview } from '@/components/Reports/GlobalDraftPreview';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [cache, setCache] = useState<Record<string, ParetoScenario>>({});
  const focusPathRef = useRef<string[]>([]);

  const handleDiscard = () => {
    const currentPathKey = focusPathRef.current.join('.');
    
    // 1. Remove from cache this node and ALL its descendants
    setCache(prev => {
       const newCache = { ...prev };
       for (const key of Object.keys(newCache)) {
          if (key === currentPathKey || (currentPathKey === '' ? true : key.startsWith(currentPathKey + '.'))) {
             delete newCache[key];
          }
       }
       return newCache;
    });

    setData(null);
    setHistory([]);
    setSuccessMessage("Base descartada. Los nodos dependientes han sido marcados para re-configuración.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  // 1. Fetch templates on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/scenarios/templates')
      .then(res => res.json())
      .then((d: DynamicTemplate[]) => {
        if (d.length > 0) {
          setActiveTemplate(d[0]);
          // No auto-execute, wait for user
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

  const [focusPath, setFocusPathState] = useState<string[]>([]);
  const setFocusPath = (path: string[]) => {
    setFocusPathState(path);
    focusPathRef.current = path;
  };

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
      // Restore true demands for the GA
      const payloadTemplate = JSON.parse(JSON.stringify(targetTemplate)) as DynamicTemplate;
      const restoreDemands = (consumers: Record<string, ConsumerDef>) => {
         for (const cDef of Object.values(consumers)) {
            if (cDef.requirements) {
               for (const req of Object.values(cDef.requirements)) {
                  if (req.original_demand !== undefined) {
                     req.value = req.original_demand;
                  }
               }
            }
            if (cDef.subconsumers) restoreDemands(cDef.subconsumers);
         }
      };
      restoreDemands(payloadTemplate.consumers);

      fetch('http://localhost:8000/api/scenarios/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadTemplate)
      }).then(() => {
        connectSSE(); // Restart evolution with isolated scope
      }).catch(console.error);
    }, 500); // 500ms debounce
  };

  // 3. Update template on the fly
  const handleTemplateChange = (newTemplate: DynamicTemplate) => {
    setActiveTemplate(newTemplate);
    // Don't auto-execute here either unless we want to invalidate caches. We'll just let it be.
  };

  const handleFocusChange = (path: string[]) => {
    setFocusPath(path);
    setData(null);
    setHistory([]);
    if (eventSourceRef.current) eventSourceRef.current.close();
  };

  const getTotalParents = (template: DynamicTemplate) => {
    let count = 1; // Root
    const traverse = (consumers: Record<string, ConsumerDef>) => {
      for (const c of Object.values(consumers)) {
        if (c.subconsumers && Object.keys(c.subconsumers).length > 0) {
          count++;
          traverse(c.subconsumers);
        }
      }
    };
    traverse(template.consumers);
    return count;
  };

  const totalParents = activeTemplate ? getTotalParents(activeTemplate) : 1;
  const configuredParents = Object.keys(cache).length;
  const progressPercent = Math.min(100, Math.round((configuredParents / totalParents) * 100));

  const [isSaving, setIsSaving] = useState(false);

  const handleFinalizeReport = async () => {
    setIsSaving(true);
    try {
      const reportId = Math.random().toString(36).substring(2, 9);
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          parent_node_id: 'global',
          report_data: activeTemplate
        })
      });
      window.dispatchEvent(new Event('report-saved'));
      
      // Reset everything to start a new report
      const res = await fetch('http://localhost:8000/api/scenarios/templates');
      const d = await res.json();
      if (d.length > 0) {
        setActiveTemplate(d[0]);
      }
      
      setCache({});
      setFocusPathState([]);
      focusPathRef.current = [];
      setData(null);
      setHistory([]);
      
      setSuccessMessage("¡Reporte general guardado y finalizado con éxito! El sistema está listo para un nuevo borrador.");
      setTimeout(() => setSuccessMessage(null), 5000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error("Error saving report", e);
      setError("No se pudo guardar el reporte");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectScenario = async (scenario: ParetoScenario) => {
    if (!activeTemplate) return;
    
    const newTemplate = JSON.parse(JSON.stringify(activeTemplate)) as DynamicTemplate;
    
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
    
    // Apply allocations ONLY to immediate children
    for (const [key, val] of Object.entries(scenario.allocations)) {
      const parts = key.split('.');
      if (parts.length === 2) {
         const childName = parts[0];
         const resourceName = parts[1];
         if (currentConsumers[childName]) {
             if (!currentConsumers[childName].requirements) {
                 currentConsumers[childName].requirements = {};
             }
             // Si el requerimiento existe, guarda su demanda original y actualiza el valor asignado
             if (currentConsumers[childName].requirements[resourceName]) {
                 if (currentConsumers[childName].requirements[resourceName].original_demand === undefined) {
                     currentConsumers[childName].requirements[resourceName].original_demand = currentConsumers[childName].requirements[resourceName].value;
                 }
                 currentConsumers[childName].requirements[resourceName].value = val;
             } else {
                 currentConsumers[childName].requirements[resourceName] = { value: val, original_demand: val };
             }
         }
      }
    }
    
    // Feedback visual rápido
    setSuccessMessage(`Base asignada exitosamente al nodo ${focusPath.length > 0 ? focusPath[focusPath.length-1] : 'Raíz'}. Los hijos han sido desbloqueados.`);
    setTimeout(() => setSuccessMessage(null), 4000);
    
    // Mark as configured in cache if not already
    const currentPathKey = focusPath.join('.');
    const isNew = !cache[currentPathKey];
    if (isNew) {
       setCache(prev => ({ ...prev, [currentPathKey]: scenario }));
    }
    
    handleTemplateChange(newTemplate);
    setData(null);
    setHistory([]);
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

        {/* Progreso de Configuración */}
        <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Progreso de Repartición Global</h3>
            <span className="text-xs font-bold text-indigo-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
            <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
          
          {progressPercent === 100 ? (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
               <p className="text-sm text-emerald-700 font-medium mb-3 sm:mb-0">
                  ¡Todas las bases han sido configuradas! El borrador está listo para guardarse.
               </p>
               <button 
                 onClick={handleFinalizeReport}
                 disabled={isSaving}
                 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
               >
                 {isSaving ? 'Guardando...' : 'Guardar y Finalizar'}
               </button>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500">
              El reporte histórico general podrá guardarse en SQLite cuando todos los sub-sistemas ({totalParents}) tengan su repartición base configurada.
            </p>
          )}
        </div>

        {/* Módulo de Progreso del Borrador */}
        <GlobalDraftPreview template={activeTemplate} configuredPaths={Object.keys(cache)} />

        {/* Galería de Reportes Finales en SQLite */}
        <DistributionReportsViewer />

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
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-slate-800">Mejores Soluciones Genéticas (Pareto)</h3>
               <button 
                 onClick={() => executeGA(activeTemplate, focusPath)}
                 disabled={!!cache[focusPath.join('.')]}
                 className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-sm ${!!cache[focusPath.join('.')] ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
               >
                 Generar Repartición
               </button>
            </div>
            
            {!data && !successMessage && !cache[focusPath.join('.')] && (
               <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-slate-500 font-medium">Haz clic en &quot;Generar Repartición&quot; para calcular las opciones de este nodo.</p>
               </div>
            )}
            
            {!data && !successMessage && cache[focusPath.join('.')] && (
               <div className="p-6 border-2 border-indigo-200 bg-indigo-50 rounded-xl">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                       <h4 className="text-indigo-900 font-bold text-lg mb-1">Repartición Base Asignada</h4>
                       <p className="text-indigo-700 text-sm">Esta es la repartición que has oficializado para este nodo. Los hijos ya han sido desbloqueados con estos recursos.</p>
                     </div>
                     <button onClick={handleDiscard} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors border border-red-200">
                       Descartar y Regenerar
                     </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                     {Object.entries(cache[focusPath.join('.')].allocations)
                        .filter(([pathStr]) => pathStr.split('.').length === 2)
                        .map(([pathStr, val]) => {
                           const parts = pathStr.split('.');
                           const rName = parts.pop()!;
                           const consumerPath = parts.map(p => translateToSpanish(p)).join(' → ');
                           return (
                             <div key={pathStr} className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100">
                               <span className="text-[10px] text-slate-500 font-medium truncate">{consumerPath}</span>
                               <span className="text-sm font-bold text-indigo-700">{translateToSpanish(rName)}: {val.toFixed(0)}</span>
                             </div>
                           );
                     })}
                  </div>
               </div>
            )}
            
            {successMessage && (
               <div className="flex flex-col items-center justify-center h-48 border-2 border-emerald-200 bg-emerald-50 rounded-xl mb-4 animate-in fade-in zoom-in duration-300">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <p className="text-emerald-700 font-semibold">{successMessage}</p>
                  <p className="text-emerald-600 text-sm mt-1">Ahora puedes navegar a los nodos desbloqueados en el mapa.</p>
               </div>
            )}

            {data && data.top3 && !successMessage && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.top3.map((sc, idx) => (
                  <div key={idx} className="p-4 border border-indigo-100 bg-indigo-50/40 rounded-xl flex flex-col">
                    <h3 className="font-semibold text-indigo-900 mb-1">{sc.label}</h3>
                    {sc.scenario_id === "unavailable" ? (
                      <p className="text-sm text-slate-500 italic flex-1">Buscando soluciones viables...</p>
                    ) : (
                      <div className="flex flex-col flex-1 h-full">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 mb-3">Fitness: {sc.fitness_score.toFixed(3)}</p>
                        <div className="bg-white p-3 rounded-lg border border-indigo-50 max-h-56 overflow-y-auto space-y-2 flex-grow mb-3">
                          {Object.entries(sc.allocations)
                            .filter(([pathStr]) => pathStr.split('.').length === 2) // Solo hijos inmediatos
                            .map(([pathStr, val]) => {
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
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors mt-auto"
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
              if (key.split('.').length === 2) {
                globalAllocations[prefix + key] = val;
              }
            }
            return globalAllocations;
          })()}
          onFocusChange={handleFocusChange}
          focusPath={focusPath}
          configuredPaths={Object.keys(cache)}
        />
      </div>
    </div>
  );
}
