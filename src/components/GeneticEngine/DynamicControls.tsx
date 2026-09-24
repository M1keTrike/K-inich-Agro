'use client';

import { ConsumerDef, DynamicTemplate } from '@/types';
import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { PreziNodeData, PreziViewer } from '../ui/PreziViewer';

const formatLabel = (key: string) => {
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const translateToSpanish = (key: string) => {
  const dictionary: Record<string, string> = {
    WATER: 'Agua', ENERGY: 'Energía', O2: 'Oxígeno', COOLING: 'Enfriamiento',
    MAIN_ENERGY: 'Energía Principal', BATTERIES: 'Baterías', CLEAN_WATER: 'Agua Limpia',
    BIOCIDES: 'Biocidas', HABITAT: 'Hábitat', CROPS: 'Cultivos', SHIELDS: 'Escudos',
    COMMS: 'Comunicaciones', THERMAL_SEAL: 'Sello Térmico', CREW_SURVIVAL: 'Superv. Tripulación',
    LIFE_SUPPORT: 'Soporte Vital', MANUFACTURING: 'Manufactura', HYDROPONICS: 'Hidroponía',
    QUARANTINE: 'Cuarentena', CREW: 'Tripulación'
  };
  return dictionary[key] || formatLabel(key);
};

interface Props {
  template: DynamicTemplate;
  onChange: (newTemplate: DynamicTemplate) => void;
  disabled: boolean;
  allocations?: Record<string, number>;
  onFocusChange?: (path: string[]) => void;
  focusPath: string[];
  configuredPaths: string[];
}

export function DynamicControls({ template, onChange, disabled, allocations, onFocusChange, focusPath, configuredPaths }: Props) {
  const [localTemplate, setLocalTemplate] = useState<DynamicTemplate>(template);

  // Consumer Editing State
  // Path of the consumer currently being edited
  const [editingConsumerPath, setEditingConsumerPath] = useState<string[] | null>(null);
  
  // Adding Consumer state inside Modal
  const [newSubName, setNewSubName] = useState("");
  // Adding Root Consumer
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [newRootName, setNewRootName] = useState("");
  
  // Adding Requirement state inside Modal
  const [selectedReq, setSelectedReq] = useState("");
  const [selectedOutput, setSelectedOutput] = useState("");

  useEffect(() => {
    setLocalTemplate(template);
  }, [template]);

  const updateTemplate = (newT: DynamicTemplate) => {
    setLocalTemplate(newT);
    onChange(newT);
  };

  const getConsumerByPath = (consumers: Record<string, ConsumerDef>, path: string[]) => {
    let current = consumers[path[0]];
    for (let i = 1; i < path.length; i++) {
      current = current.subconsumers![path[i]];
    }
    return current;
  };

  // --- ACTIONS ---
  const handleAddRootConsumer = () => {
    if (!newRootName.trim()) return;
    const cleanName = newRootName.trim().toUpperCase().replace(/\s+/g, '_');
    const newT = JSON.parse(JSON.stringify(localTemplate));
    newT.consumers[cleanName] = { priority_weight: 0.5, requirements: {}, subconsumers: {} };
    updateTemplate(newT);
    setIsAddingRoot(false);
    setNewRootName("");
  };

  // Contextual actions for the currently editing consumer
  const activeConsumer = editingConsumerPath ? getConsumerByPath(localTemplate.consumers, editingConsumerPath) : null;

  const getEffectivePriority = (path: string[]) => {
    let consumers = localTemplate.consumers;
    let effectivePriority = 1;
    for (const name of path) {
      const consumer = consumers[name];
      effectivePriority *= consumer.priority_weight;
      consumers = consumer.subconsumers || {};
    }
    return effectivePriority;
  };

  const activeEffectivePriority = editingConsumerPath ? getEffectivePriority(editingConsumerPath) : 0;
  
  // Calculate which resources are available to be added as requirements
  let availableResources: string[] = [];
  if (editingConsumerPath) {
    if (editingConsumerPath.length === 1) {
      // Root consumers can access any global resource
      availableResources = Object.keys(localTemplate.resources);
    } else {
      // Subconsumers can ONLY access resources that their direct parent already requests
      const parentPath = editingConsumerPath.slice(0, -1);
      const parentConsumer = getConsumerByPath(localTemplate.consumers, parentPath);
      availableResources = Object.keys(parentConsumer.requirements || {});
    }
  }

  const handleUpdateActiveWeight = (val: number) => {
    if (!editingConsumerPath) return;
    const newT = JSON.parse(JSON.stringify(localTemplate));
    const target = getConsumerByPath(newT.consumers, editingConsumerPath);
    target.priority_weight = val;
    updateTemplate(newT);
  };

  const handleAddSubToActive = () => {
    if (!editingConsumerPath || !newSubName.trim()) return;
    const cleanName = newSubName.trim().toUpperCase().replace(/\s+/g, '_');
    const newT = JSON.parse(JSON.stringify(localTemplate));
    const target = getConsumerByPath(newT.consumers, editingConsumerPath);
    if (!target.subconsumers) target.subconsumers = {};
    target.subconsumers[cleanName] = { priority_weight: 0.5, requirements: {}, subconsumers: {} };
    updateTemplate(newT);
    setNewSubName("");
  };

  const handleDeleteActive = () => {
    if (!editingConsumerPath) return;
    const newT = JSON.parse(JSON.stringify(localTemplate));
    if (editingConsumerPath.length === 1) {
      delete newT.consumers[editingConsumerPath[0]];
    } else {
      const parentPath = editingConsumerPath.slice(0, -1);
      const parent = getConsumerByPath(newT.consumers, parentPath);
      delete parent.subconsumers![editingConsumerPath[editingConsumerPath.length - 1]];
    }
    updateTemplate(newT);
    setEditingConsumerPath(null);
  };

  const handleUpdateActiveReq = (rName: string, val: number) => {
    if (!editingConsumerPath) return;
    const newT = JSON.parse(JSON.stringify(localTemplate));
    const target = getConsumerByPath(newT.consumers, editingConsumerPath);
    target.requirements[rName].value = val;
    target.requirements[rName].original_demand = val;
    updateTemplate(newT);
  };

  const handleAddReqToActive = () => {
    if (!editingConsumerPath || !selectedReq) return;
    const newT = JSON.parse(JSON.stringify(localTemplate));
    const target = getConsumerByPath(newT.consumers, editingConsumerPath);
    if (!target.requirements) target.requirements = {};
    
    let baseVal = 100;
    if (editingConsumerPath.length === 1) {
      baseVal = newT.resources[selectedReq]?.value || 100;
    } else {
      const parentPath = editingConsumerPath.slice(0, -1);
      const parent = getConsumerByPath(newT.consumers, parentPath);
      baseVal = parent.requirements[selectedReq]?.value || 100;
    }
    
    target.requirements[selectedReq] = { value: baseVal * 0.1 };
    updateTemplate(newT);
    setSelectedReq("");
  };

  const handleAddOutput = () => {
    if (!editingConsumerPath || !selectedOutput) return;
    const newT = JSON.parse(JSON.stringify(localTemplate)) as DynamicTemplate;
    const target = getConsumerByPath(newT.consumers, editingConsumerPath);
    target.outputs = target.outputs || {};
    target.outputs[selectedOutput] = {
      amount_per_unit: 0,
      efficiency: 1,
      available_after_periods: 1,
    };
    if (!newT.benefit_values?.[selectedOutput]) {
      newT.benefit_values = {
        ...newT.benefit_values,
        [selectedOutput]: { unit_value: 0, target_demand: 0, critical: false, minimum_reserve: 0 },
      };
    }
    updateTemplate(newT);
    setSelectedOutput("");
  };

  const handleUpdateOutput = (resourceName: string, key: 'amount_per_unit' | 'efficiency' | 'max_output' | 'available_after_periods', value: number | undefined) => {
    if (!editingConsumerPath) return;
    const newT = JSON.parse(JSON.stringify(localTemplate)) as DynamicTemplate;
    const target = getConsumerByPath(newT.consumers, editingConsumerPath);
    if (!target.outputs?.[resourceName]) return;
    if (value === undefined) delete target.outputs[resourceName][key];
    else target.outputs[resourceName][key] = value;
    updateTemplate(newT);
  };

  const handleRemoveOutput = (resourceName: string) => {
    if (!editingConsumerPath) return;
    const newT = JSON.parse(JSON.stringify(localTemplate)) as DynamicTemplate;
    const target = getConsumerByPath(newT.consumers, editingConsumerPath);
    delete target.outputs?.[resourceName];
    updateTemplate(newT);
  };

  const handleRemoveReqFromActive = (rName: string) => {
    if (!editingConsumerPath) return;
    const newT = JSON.parse(JSON.stringify(localTemplate));
    const target = getConsumerByPath(newT.consumers, editingConsumerPath);
    delete target.requirements[rName];
    updateTemplate(newT);
  };

  // --- PREZI VIEWER INTEGRATION ---
  
  const buildPreziData = (consumers: Record<string, ConsumerDef>): PreziNodeData => {
    // We need a single root for the radial tree.
    const root: PreziNodeData = {
      id: 'root',
      title: 'Kinich-Agro',
      subtitle: 'Simulación Global',
      data: { path: [] },
      children: []
    };

    const traverse = (cons: Record<string, ConsumerDef>, currentPath: string[]): PreziNodeData[] => {
      return Object.entries(cons).map(([cName, cDef]) => {
        const path = [...currentPath, cName];
        const subCount = Object.keys(cDef.subconsumers || {}).length;
        
        const reqCount = Object.keys(cDef.requirements || {}).length;
        const isUnlocked = path.length === 1 || reqCount > 0;
        
        // Is this node an immediate child of the currently focused path?
        const isImmediateChild = path.length === focusPath.length + 1 && path.slice(0, focusPath.length).every((v, i) => v === focusPath[i]);
        
        let allocStr = "";
        if (allocations && isImmediateChild) {
          // Preview allocation from genetic algorithm
          const resMap = Object.keys(cDef.requirements || {}).map(r => {
             const key = `${path.join('.')}.${r}`;
             const val = Math.round(allocations[key] || 0);
             const demand = cDef.requirements![r].original_demand ?? cDef.requirements![r].value;
             if (val < Math.round(demand)) {
                 return `⚠️${translateToSpanish(r)}:${val}/${Math.round(demand)}`;
             }
             return `${translateToSpanish(r)}:${val}`;
          });
          if (resMap.length > 0) allocStr = " | Pre-Asignado: " + resMap.join(', ');
        } else {
          // Show current actual requirements
          const resMap = Object.keys(cDef.requirements || {}).map(r => {
             const val = Math.round(cDef.requirements![r].value);
             const demand = cDef.requirements![r].original_demand;
             if (demand !== undefined && val < Math.round(demand)) {
                 return `⚠️${translateToSpanish(r)}:${val}/${Math.round(demand)}`;
             }
             return `${translateToSpanish(r)}:${val}`;
          });
          if (resMap.length > 0) allocStr = " | Base: " + resMap.join(', ');
        }
        
        const pathStr = path.join('.');
        const hasBaseSelected = configuredPaths.includes(pathStr);

        const node: PreziNodeData = {
          id: pathStr,
          title: translateToSpanish(cName),
          subtitle: `${(cDef.priority_weight * 100).toFixed(0)}% Pri${allocStr}`,
          data: { path, hasBaseSelected },
          isUnlocked
        };
        if (subCount > 0) {
          node.children = traverse(cDef.subconsumers!, path);
        }
        return node;
      });
    };

    root.children = traverse(consumers, []);
    return root;
  };

  const handleNodeClick = (node: PreziNodeData) => {
    // Only open editor for actual consumer nodes (skip root if it's the fake root)
    if (node.id !== 'root' && node.data) {
      setEditingConsumerPath(node.data.path as string[]);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm ">
        
        {/* Administrador de Colonia (Consumidores) */}
        <div>
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Mapa de Sistemas (Colonia)</h3>
              <p className="text-xs text-slate-500">Navega por el mapa interactivo y haz clic en un nodo para configurarlo.</p>
            </div>
            
            <div className="flex space-x-3">
              {!isAddingRoot ? (
                <button 
                  onClick={() => setIsAddingRoot(true)} 
                  disabled={disabled} 
                  className="flex items-center text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-md font-medium transition-colors"
                >
                  <Plus size={16} className="mr-1" />
                  Nodo Raíz
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-indigo-50 p-1 rounded-md border border-indigo-100">
                  <input 
                    type="text" 
                    value={newRootName} 
                    onChange={e => setNewRootName(e.target.value)} 
                    placeholder="Nombre del nodo..." 
                    className="text-sm border-none focus:ring-0 rounded px-2 py-1 w-40 bg-white shadow-sm"
                    autoFocus
                  />
                  <button onClick={handleAddRootConsumer} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded shadow-sm">Guardar</button>
                  <button onClick={() => setIsAddingRoot(false)} className="text-sm text-slate-500 hover:text-slate-700 px-2">Cancelar</button>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4">
             {Object.keys(localTemplate.consumers).length === 0 ? (
               <div className="flex flex-col items-center justify-center text-slate-400 h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                 <p>La colonia está vacía.</p>
                 <p className="text-xs">Añade un Nodo Raíz para comenzar.</p>
               </div>
             ) : (
               <PreziViewer 
                 data={buildPreziData(localTemplate.consumers)} 
                 onNodeClick={handleNodeClick}
                 onFocusChange={(nodeData) => {
                   if (onFocusChange && nodeData.data?.path) {
                     onFocusChange(nodeData.data.path as string[]);
                   }
                 }}
               />
             )}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Modal de Consumidor */}
      <Modal
        isOpen={!!editingConsumerPath}
        onClose={() => setEditingConsumerPath(null)}
        title={
          editingConsumerPath ? (
            <div className="flex flex-col">
              <span className="text-slate-800 flex items-center">
                {editingConsumerPath.length > 1 && (
                  <button 
                    onClick={() => setEditingConsumerPath(editingConsumerPath.slice(0, -1))}
                    className="mr-2 text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-1 rounded transition-colors text-xs flex items-center"
                    title="Volver al padre"
                  >
                    ← Volver
                  </button>
                )}
                Configurar: {translateToSpanish(editingConsumerPath[editingConsumerPath.length - 1])}
              </span>
              {editingConsumerPath.length > 1 && (
                <span className="text-xs text-slate-400 font-normal mt-1 flex items-center space-x-1">
                  {editingConsumerPath.map((p, idx) => (
                    <span key={idx} className="flex items-center">
                      {idx > 0 && <span className="mx-1 text-slate-300">/</span>}
                      {translateToSpanish(p)}
                    </span>
                  ))}
                </span>
              )}
            </div>
          ) : ""
        }
        footer={
          <div className="flex justify-between w-full">
            <button 
              onClick={handleDeleteActive} 
              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center transition-colors"
            >
              <Trash2 size={16} className="mr-2"/> Eliminar Nodo
            </button>
            <button 
              onClick={() => setEditingConsumerPath(null)} 
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
            >
              Listo
            </button>
          </div>
        }
      >
        {activeConsumer && (
          <div className="space-y-6">
            {/* Prioridad */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-slate-800">Prioridad local</h4>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                  {(activeConsumer.priority_weight * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={activeConsumer.priority_weight}
                onChange={(e) => handleUpdateActiveWeight(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                <span>Define su peso frente a sus hermanos.</span>
                <span className="font-semibold text-indigo-700">Efectiva: {(activeEffectivePriority * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Requerimientos */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-semibold text-slate-800">Requerimientos Base</h4>
                <div className="flex items-center space-x-2">
                  <select 
                    value={selectedReq}
                    onChange={(e) => setSelectedReq(e.target.value)}
                    className="text-xs border border-slate-300 rounded-md px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">+ Añadir Recurso...</option>
                    {availableResources.map(r => (
                      !activeConsumer.requirements[r] && <option key={r} value={r}>{translateToSpanish(r)}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleAddReqToActive} 
                    disabled={!selectedReq} 
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Añadir
                  </button>
                </div>
              </div>
              
              {Object.keys(activeConsumer.requirements || {}).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(activeConsumer.requirements).map(([rName, req]) => (
                    <div key={rName} className="flex items-center space-x-3 bg-slate-50 p-2 rounded-md border border-slate-100">
                      <label className="text-xs font-medium text-slate-700 w-1/3 truncate" title={translateToSpanish(rName)}>
                        {translateToSpanish(rName)}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={req.original_demand ?? req.value}
                        onChange={(e) => handleUpdateActiveReq(rName, parseFloat(e.target.value))}
                        className="flex-1 text-sm border border-slate-200 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                      <button 
                        onClick={() => handleRemoveReqFromActive(rName)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-50 rounded border border-slate-100 border-dashed">
                  No consume recursos directamente.
                </p>
              )}
            </div>

            {/* Producción */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-800">Beneficios producidos</h4>
                <div className="flex items-center gap-2">
                  <select value={selectedOutput} onChange={event => setSelectedOutput(event.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs">
                    <option value="">+ Añadir recurso...</option>
                    {Object.keys(localTemplate.resources).filter(name => !activeConsumer.outputs?.[name]).map(name => <option key={name} value={name}>{translateToSpanish(name)}</option>)}
                  </select>
                  <button type="button" onClick={handleAddOutput} disabled={!selectedOutput} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Añadir</button>
                </div>
              </div>
              {Object.entries(activeConsumer.outputs || {}).length === 0 ? (
                <p className="rounded border border-dashed border-emerald-200 bg-white p-3 text-center text-xs italic text-slate-500">Este nodo no produce recursos.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(activeConsumer.outputs || {}).map(([resource, output]) => (
                    <div key={resource} className="rounded-md border border-emerald-100 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-emerald-900">
                        {translateToSpanish(resource)}
                        <button type="button" onClick={() => handleRemoveOutput(resource)} className="text-red-600">Quitar</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                        {([
                          ['amount_per_unit', 'Cantidad por operación'],
                          ['efficiency', 'Eficiencia (0–1)'],
                          ['max_output', 'Máximo por periodo'],
                          ['available_after_periods', 'Disponible después de periodos'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="space-y-1 text-[10px] font-medium text-slate-600">
                            {label}
                            <input type="number" min="0" max={key === 'efficiency' ? 1 : undefined} step={key === 'available_after_periods' ? 1 : 'any'} value={output[key] ?? ''} placeholder={key === 'max_output' ? 'Sin límite' : '0'} onChange={event => handleUpdateOutput(resource, key, event.target.value === '' ? undefined : Math.min(key === 'efficiency' ? 1 : Infinity, Math.max(0, Number(event.target.value) || 0)))} className="w-full rounded border border-slate-300 px-2 py-1 text-xs" />
                          </label>
                        ))}
                      </div>
                      {!localTemplate.benefit_values?.[resource] && <p className="mt-2 text-xs font-medium text-amber-700">Agrega la valoración y la demanda de este recurso en Configuración de beneficios.</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subconsumidores */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Sub-Consumidores (Hijos)</h4>
              
              <div className="flex space-x-2 mb-4">
                <input 
                  type="text" 
                  value={newSubName} 
                  onChange={e => setNewSubName(e.target.value)} 
                  placeholder="Nombre de sub-división..." 
                  className="flex-1 text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button 
                  onClick={handleAddSubToActive} 
                  disabled={!newSubName.trim()}
                  className="bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Plus size={16} className="mr-1"/> Añadir
                </button>
              </div>

              {Object.keys(activeConsumer.subconsumers || {}).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activeConsumer.subconsumers || {}).map(([subName, subDef]) => (
                    <button 
                      key={subName}
                      onClick={() => setEditingConsumerPath([...editingConsumerPath!, subName])}
                      className="group bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-100 flex items-center transition-colors shadow-sm cursor-pointer"
                      title="Editar sub-consumidor"
                    >
                      <span className="truncate max-w-[120px]">{translateToSpanish(subName)}</span>
                      <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 group-hover:bg-indigo-500 rounded text-[10px] font-bold">
                        {(subDef.priority_weight * 100).toFixed(0)}%
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No hay sub-consumidores dependientes.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
