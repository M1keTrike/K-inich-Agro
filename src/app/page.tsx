'use client';
import { AlgorithmSettings } from '@/components/GeneticEngine/AlgorithmSettings';
import { ConvergenceChart } from '@/components/GeneticEngine/ConvergenceChart';
import { DynamicControls } from '@/components/GeneticEngine/DynamicControls';
import { ResourceLock } from '@/components/GeneticEngine/ResourceLock';
import { DistributionReportsViewer } from '@/components/Reports/DistributionReportsViewer';
import { GlobalDraftPreview } from '@/components/Reports/GlobalDraftPreview';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Modal } from '@/components/ui/Modal';
import { ConsumerDef, DynamicTemplate, EvolutionEvent, ParetoScenario } from '@/types';
import { Archive, Settings2, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

// Rutas de todos los nodos "padre" (raíz incluida), en pre-orden:
// un padre siempre aparece antes que sus hijos, lo que respeta la restricción de jerarquía.
const getParentPaths = (template: DynamicTemplate): string[][] => {
  const paths: string[][] = [[]];
  const walk = (consumers: Record<string, ConsumerDef>, prefix: string[]) => {
    for (const [name, c] of Object.entries(consumers)) {
      if (c.subconsumers && Object.keys(c.subconsumers).length > 0) {
        const p = [...prefix, name];
        paths.push(p);
        walk(c.subconsumers, p);
      }
    }
  };
  walk(template.consumers, []);
  return paths;
};

const applyScenarioToTemplate = (
  template: DynamicTemplate,
  path: string[],
  scenario: ParetoScenario,
): DynamicTemplate => {
  const newTemplate = JSON.parse(JSON.stringify(template)) as DynamicTemplate;
  let currentConsumers = newTemplate.consumers;

  if (path.length > 0) {
    let current = newTemplate.consumers[path[0]];
    for (let i = 1; i < path.length; i++) {
      if (!current.subconsumers) current.subconsumers = {};
      current = current.subconsumers[path[i]];
    }
    if (!current.subconsumers) current.subconsumers = {};
    currentConsumers = current.subconsumers;
  }

  for (const [key, val] of Object.entries(scenario.allocations)) {
    const parts = key.split('.');
    if (parts.length !== 2) continue;

    const childName = parts[0];
    const resourceName = parts[1];
    const child = currentConsumers[childName];
    if (!child) continue;

    if (!child.requirements) child.requirements = {};
    if (child.requirements[resourceName]) {
      if (child.requirements[resourceName].original_demand === undefined) {
        child.requirements[resourceName].original_demand = child.requirements[resourceName].value;
      }
      child.requirements[resourceName].value = val;
    } else {
      child.requirements[resourceName] = { value: val, original_demand: val };
    }
  }

  return newTemplate;
};

interface GlobalScenario {
  scenario_id: string;
  label: string;
  fitness_score: number;
  template: DynamicTemplate;
  selections: Record<string, ParetoScenario>;
}

export default function Home() {
  const [activeTemplate, setActiveTemplate] = useState<DynamicTemplate | null>(null);

  const [data, setData] = useState<EvolutionEvent | null>(null);
  const [history, setHistory] = useState<EvolutionEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopRef = useRef(false);
  const autoRejectRef = useRef<((reason?: unknown) => void) | null>(null);

  const [cache, setCache] = useState<Record<string, ParetoScenario>>({});
  const focusPathRef = useRef<string[]>([]);
  const resultsRef = useRef<HTMLElement | null>(null);

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
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

  const totalParents = activeTemplate ? getParentPaths(activeTemplate).length : 1;
  const configuredParents = Object.keys(cache).length;
  const progressPercent = Math.min(100, Math.round((configuredParents / totalParents) * 100));

  const [isSaving, setIsSaving] = useState(false);
  const [activeSettingsModal, setActiveSettingsModal] = useState<'resources' | 'algorithm' | null>(null);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState({ completed: 0, total: 0, node: 'Preparando recorrido' });
  const [globalScenarios, setGlobalScenarios] = useState<GlobalScenario[]>([]);
  const [selectedGlobalScenario, setSelectedGlobalScenario] = useState<GlobalScenario | null>(null);

  const buildPayloadTemplate = (targetTemplate: DynamicTemplate) => {
    const payloadTemplate = JSON.parse(JSON.stringify(targetTemplate)) as DynamicTemplate;
    const restoreDemands = (consumers: Record<string, ConsumerDef>) => {
      for (const cDef of Object.values(consumers)) {
        if (cDef.requirements) {
          for (const req of Object.values(cDef.requirements)) {
            if (req.original_demand !== undefined) req.value = req.original_demand;
          }
        }
        if (cDef.subconsumers) restoreDemands(cDef.subconsumers);
      }
    };
    restoreDemands(payloadTemplate.consumers);
    return payloadTemplate;
  };

  const runEvolutionForTemplate = async (payloadTemplate: DynamicTemplate): Promise<EvolutionEvent> => {
    await fetch('http://localhost:8000/api/scenarios/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadTemplate)
    });

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource('http://localhost:8000/api/evolution-stream');
      autoRejectRef.current = reject;
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as EvolutionEvent;
          setData(parsed);
          setHistory(prev => [...prev, parsed].slice(-50));
          if (parsed.is_final) {
            eventSource.close();
            autoRejectRef.current = null;
            resolve(parsed);
          }
        } catch (error) {
          eventSource.close();
          autoRejectRef.current = null;
          reject(error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        autoRejectRef.current = null;
        reject(new Error('El motor genético perdió la conexión durante el recorrido automático.'));
      };
    });
  };

  const stopAutomaticRun = () => {
    autoStopRef.current = true;
    eventSourceRef.current?.close();
    autoRejectRef.current?.(new Error('Proceso automático detenido por el usuario.'));
    setIsAutoRunning(false);
    setSuccessMessage('Recorrido automático detenido. Puedes continuar nodo por nodo.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const startAutomaticRun = async () => {
    if (!activeTemplate || isAutoRunning || isRunning) return;

    const paths = getParentPaths(activeTemplate);
    const pending = paths.filter(path => !cache[path.join('.')]);

    if (pending.length === 0) {
      setSuccessMessage('Todos los nodos ya tienen una repartición asignada.');
      setTimeout(() => setSuccessMessage(null), 4000);
      return;
    }

    autoStopRef.current = false;
    setIsAutoRunning(true);
    setError(null);
    setGlobalScenarios([]);
    setAutoProgress({ completed: paths.length - pending.length, total: paths.length, node: 'Preparando recorrido' });

    try {
      const beamWidth = 9;
      let beam: Array<{
        template: DynamicTemplate;
        selections: Record<string, ParetoScenario>;
        score: number;
      }> = [{
        template: JSON.parse(JSON.stringify(activeTemplate)) as DynamicTemplate,
        selections: { ...cache },
        score: 0,
      }];

      for (let index = 0; index < pending.length; index++) {
        if (autoStopRef.current) return;

        const path = pending[index];
        const pathKey = path.join('.');
        const nodeName = path.length > 0 ? translateToSpanish(path[path.length - 1]) : 'Raíz';
        setFocusPath(path);
        setAutoProgress({ completed: paths.length - pending.length + index, total: paths.length, node: `${nodeName} · ${beam.length} recorridos` });

        const expandedBeam: typeof beam = [];
        for (const branch of beam) {
          if (autoStopRef.current) return;

          const targetTemplate = getSubTemplate(branch.template, path);
          if (Object.keys(targetTemplate.consumers).length === 0) {
            expandedBeam.push(branch);
            continue;
          }
          if (path.length > 0 && Object.keys(targetTemplate.resources).length === 0) {
            continue;
          }

          const finalEvent = await runEvolutionForTemplate(buildPayloadTemplate(targetTemplate));
          if (autoStopRef.current) return;

          const scenarios = finalEvent.top3.filter(item => item.scenario_id !== 'unavailable');
          for (const scenario of scenarios) {
            expandedBeam.push({
              template: applyScenarioToTemplate(branch.template, path, scenario),
              selections: { ...branch.selections, [pathKey]: scenario },
              score: branch.score + scenario.fitness_score,
            });
          }
        }

        if (expandedBeam.length === 0) {
          throw new Error(`No se encontró una solución viable para ${nodeName}.`);
        }

        beam = expandedBeam
          .sort((first, second) => second.score - first.score)
          .slice(0, beamWidth);

        const bestBranch = beam[0];
        setActiveTemplate(bestBranch.template);
        setCache(bestBranch.selections);
        setAutoProgress({ completed: paths.length - pending.length + index + 1, total: paths.length, node: `${nodeName} · ${beam.length} recorridos` });
      }

      setGlobalScenarios(beam.slice(0, 3).map((branch, index) => ({
        scenario_id: `global_${index + 1}`,
        label: `Solución global ${index + 1}`,
        fitness_score: branch.score,
        template: branch.template,
        selections: branch.selections,
      })));
      setSuccessMessage('Recorrido automático completado. Se generaron las 3 mejores soluciones globales.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      if (!autoStopRef.current) {
        setError(error instanceof Error ? error.message : 'No se pudo completar el recorrido automático.');
      }
    } finally {
      setIsAutoRunning(false);
      autoRejectRef.current = null;
    }
  };

  const handleApplyGlobalScenario = (scenario: GlobalScenario) => {
    const selectedTemplate = JSON.parse(JSON.stringify(scenario.template)) as DynamicTemplate;
    setActiveTemplate(selectedTemplate);
    setCache(scenario.selections);
    setGlobalScenarios([]);
    setSelectedGlobalScenario(null);
    setFocusPathState([]);
    focusPathRef.current = [];
    setData(null);
    setHistory([]);
    setSuccessMessage(`${scenario.label} aplicada al árbol completo.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

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
    setSuccessMessage(`Base asignada al nodo ${focusPath.length > 0 ? translateToSpanish(focusPath[focusPath.length - 1]) : 'Raíz'}. Los hijos han sido desbloqueados.`);
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
      autoStopRef.current = true;
      if (eventSourceRef.current) eventSourceRef.current.close();
      autoRejectRef.current?.(new Error('Componente desmontado.'));
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

  // ---- Estado derivado para el layout ----
  const currentKey = focusPath.join('.');
  const currentAssigned = cache[currentKey];
  const isRunning = !!data && !data.is_final;
  const pendingPaths = getParentPaths(activeTemplate).filter(p => !cache[p.join('.')]);
  const nextPending = pendingPaths.find(p => p.join('.') !== currentKey);
  const breadcrumb = ['Raíz', ...focusPath.map(translateToSpanish)];
  const resourceCount = Object.keys(activeTemplate.resources).length;

  // Los componentes hijos traen su propia tarjeta con márgenes/alturas fijas (mt-8, mb-8, h-full).
  // Las variantes [&>div]:... los neutralizan desde aquí sin tocar esos archivos.
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Barra fija en dos filas: (1) identidad, progreso, guardar; (2) dónde estoy + acción principal */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="py-2 flex flex-wrap items-center gap-x-8 gap-y-2">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800 leading-tight">K&apos;inich-Agro: Entornos Dinámicos</h1>
              <p className="text-xs text-slate-500">Gobernanza Agnóstica · Generación {data ? data.generation : 0}</p>
            </div>

            <div className="flex-1 min-w-[220px] max-w-md">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">
                  Nodos configurados: {configuredParents} de {totalParents}
                </span>
                <span className="font-bold text-indigo-600">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleFinalizeReport}
              disabled={progressPercent < 100 || isSaving}
              title={progressPercent < 100 ? `Faltan ${pendingPaths.length} nodo(s) por configurar` : 'Guardar el reporte global'}
              className="ml-auto px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar y finalizar'}
            </button>
          </div>

          <div className="py-2 border-t border-slate-200 flex flex-wrap items-center gap-3">
            <nav aria-label="Ruta del nodo" className="flex flex-wrap items-center gap-1.5 text-sm min-w-0">
              <span className="text-slate-500">Repartiendo en:</span>
              {breadcrumb.map((name, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-slate-300">/</span>}
                  <span className={i === breadcrumb.length - 1 ? 'font-bold text-indigo-700' : 'text-slate-600'}>
                    {name}
                  </span>
                </span>
              ))}
              {currentAssigned && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                  Base asignada
                </span>
              )}
            </nav>

            {/* Una sola acción primaria a la vez (Hick): generar, o pasar al siguiente nodo */}
            <div className="ml-auto flex flex-wrap justify-end gap-2">
              {isAutoRunning ? (
                <button
                  onClick={stopAutomaticRun}
                  className="px-5 py-2.5 rounded-lg bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 text-sm font-semibold shadow-sm transition-colors"
                >
                  Detener recorrido
                </button>
              ) : (
                <button
                  onClick={startAutomaticRun}
                  disabled={isRunning}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-sm font-semibold shadow-sm transition-colors"
                >
                  Recorrido automático
                </button>
              )}

              {!isAutoRunning && !currentAssigned ? (
                <button
                  onClick={() => executeGA(activeTemplate, focusPath)}
                  disabled={isRunning}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  {isRunning ? `Evolucionando… gen. ${data?.generation}` : 'Generar repartición'}
                </button>
              ) : !isAutoRunning && nextPending ? (
                <button
                  onClick={() => handleFocusChange(nextPending)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Siguiente nodo pendiente ({pendingPaths.length})
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {(error || successMessage || isAutoRunning) && (
          <div className="mb-6 space-y-3">
            {error && (
              <AlertBanner
                crisisId="restriction-error"
                title="Restricción de Jerarquía"
                description={error}
                severity="warning"
                onDismiss={() => setError(null)}
              />
            )}
            {successMessage && (
              <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-xl px-4 py-3">
                {successMessage}
              </div>
            )}
            {isAutoRunning && (
              <div role="status" aria-live="polite" className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-indigo-900">Recorrido automático en progreso</span>
                  <span className="font-bold text-indigo-700">
                    {autoProgress.total > 0 ? Math.round((autoProgress.completed / autoProgress.total) * 100) : 0}%
                  </span>
                </div>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-indigo-100">
                  <div
                    className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${autoProgress.total > 0 ? (autoProgress.completed / autoProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-indigo-800">
                  Procesando nodo: <strong>{autoProgress.node}</strong> · {autoProgress.completed} de {autoProgress.total}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mb-8 space-y-6">
          {/* Espacio de trabajo: mapa dominante y controles contextuales al alcance */}
          <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12" aria-label="Mapa y configuración">
            <div className="min-w-0 lg:col-span-8 [&>div]:my-0">
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

            <aside className="min-w-0 space-y-4 lg:col-span-4" aria-label="Controles de configuración">
              <div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
                  Borrador global
                  <span className="text-xs font-medium text-slate-500">{configuredParents} de {totalParents} nodos</span>
                </div>
                <div className="mt-3">
                  <GlobalDraftPreview template={activeTemplate} configuredPaths={Object.keys(cache)} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSettingsModal('resources')}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-indigo-600" />Recursos globales</span>
                  <span className="text-xs font-medium text-slate-500">{resourceCount} recurso(s)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsModal('algorithm')}
                disabled={isRunning}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-indigo-600" />Configuraciones adicionales</span>
                <span className="text-xs font-medium text-slate-500">Algoritmo genético</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReportsModalOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <span className="flex items-center gap-2"><Archive className="h-4 w-4 text-indigo-600" />Reportes guardados</span>
                <span className="text-xs font-medium text-slate-500">Consultar archivo</span>
              </button>
            </aside>
          </section>

          {/* Resultados: ancho completo para comparar soluciones y evolución */}
          <section ref={resultsRef} className="grid min-w-0 scroll-mt-40 grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Resultados">
            <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-w-0 ${history.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Mejores soluciones (Pareto)</h2>
                {isRunning && (
                  <span className="text-xs font-medium text-indigo-600">Evolucionando… generación {data?.generation}</span>
                )}
              </div>

              {!data && !currentAssigned && (
                <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center px-4">
                  <p className="text-slate-500 font-medium">
                    Elige un nodo en el mapa y pulsa &quot;Generar repartición&quot; en la barra superior.
                  </p>
                </div>
              )}

              {!data && currentAssigned && (
                <div className="p-5 border-2 border-indigo-200 bg-indigo-50 rounded-xl">
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-indigo-900 font-bold text-lg mb-1">Repartición base asignada</h3>
                      <p className="text-indigo-700 text-sm">
                        Los hijos de este nodo ya tienen estos recursos.
                      </p>
                    </div>
                    <button
                      onClick={handleDiscard}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors border border-red-200"
                    >
                      Descartar y regenerar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                    {Object.entries(currentAssigned.allocations)
                      .filter(([pathStr]) => pathStr.split('.').length === 2)
                      .map(([pathStr, val]) => {
                        const parts = pathStr.split('.');
                        const rName = parts.pop()!;
                        const consumerPath = parts.map(p => translateToSpanish(p)).join(' → ');
                        return (
                          <div key={pathStr} className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100 min-w-0">
                            <span className="text-xs text-slate-500 font-medium truncate">{consumerPath}</span>
                            <span className="text-sm font-bold text-indigo-700">{translateToSpanish(rName)}: {val.toFixed(0)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {data && data.top3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.top3.map((sc, idx) => (
                    <div key={idx} className="p-4 border border-indigo-100 bg-indigo-50/40 rounded-xl flex flex-col min-w-0">
                      <h3 className="font-semibold text-indigo-900 mb-1">{sc.label}</h3>
                      {sc.scenario_id === "unavailable" ? (
                        <p className="text-sm text-slate-500 italic flex-1">Buscando soluciones viables...</p>
                      ) : (
                        <div className="flex flex-col flex-1 h-full">
                          <p className="text-xs font-semibold text-indigo-600 mb-3">Fitness: {sc.fitness_score.toFixed(3)}</p>
                          <div className="bg-white p-3 rounded-lg border border-indigo-50 max-h-48 overflow-y-auto space-y-2 flex-grow mb-3">
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
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors mt-auto"
                            >
                              Usar como base
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="lg:col-span-4 min-w-0 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Convergencia evolutiva</h2>
                <div className="h-56">
                  <ConvergenceChart data={history} />
                </div>
              </div>
            )}
          </section>

          {globalScenarios.length > 0 && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm" aria-label="Mejores soluciones globales">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Mejores soluciones globales</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Combinaciones completas generadas durante el recorrido automático.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Árbol completo
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {globalScenarios.map(scenario => (
                  <article key={scenario.scenario_id} className="flex min-w-0 flex-col rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-emerald-900">{scenario.label}</h3>
                      <span className="shrink-0 text-xs font-bold text-emerald-700">
                        Fitness: {scenario.fitness_score.toFixed(3)}
                      </span>
                    </div>

                    <div className="mb-4 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3">
                      {Object.entries(scenario.selections).map(([pathKey, selection]) => (
                        <div key={pathKey} className="flex items-start justify-between gap-2 border-b border-slate-200 pb-1 text-xs last:border-0 last:pb-0">
                          <span className="min-w-0 truncate font-medium text-slate-600">
                            {pathKey ? pathKey.split('.').map(translateToSpanish).join(' → ') : 'Raíz'}
                          </span>
                          <span className="shrink-0 text-right text-slate-800">{selection.label}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedGlobalScenario(scenario)}
                      disabled={isAutoRunning}
                      className="mt-auto w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Revisar solución
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

      </main>

      <Modal
        isOpen={selectedGlobalScenario !== null}
        onClose={() => setSelectedGlobalScenario(null)}
        title={selectedGlobalScenario?.label ?? 'Vista previa global'}
        footer={selectedGlobalScenario ? (
          <>
            <button
              type="button"
              onClick={() => setSelectedGlobalScenario(null)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Seguir comparando
            </button>
            <button
              type="button"
              onClick={() => handleApplyGlobalScenario(selectedGlobalScenario)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Aplicar esta solución
            </button>
          </>
        ) : undefined}
      >
        {selectedGlobalScenario && (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-900">
                Vista previa completa del árbol. Esta solución aún no se ha aplicado.
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Fitness global: {selectedGlobalScenario.fitness_score.toFixed(3)}
              </p>
            </div>
            <GlobalDraftPreview
              template={selectedGlobalScenario.template}
              configuredPaths={Object.keys(selectedGlobalScenario.selections)}
            />
          </div>
        )}
      </Modal>

      <Modal
        isOpen={activeSettingsModal === 'resources'}
        onClose={() => setActiveSettingsModal(null)}
        title="Recursos globales"
      >
        <ResourceLock
          template={activeTemplate}
          onChange={handleTemplateChange}
          disabled={false}
        />
      </Modal>

      <Modal
        isOpen={activeSettingsModal === 'algorithm'}
        onClose={() => setActiveSettingsModal(null)}
        title="Configuraciones adicionales"
      >
        <AlgorithmSettings
          template={activeTemplate}
          onChange={handleTemplateChange}
          disabled={isRunning}
          bare
        />
      </Modal>

      <Modal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        title="Reportes guardados"
      >
        <DistributionReportsViewer />
      </Modal>
    </div>
  );
}