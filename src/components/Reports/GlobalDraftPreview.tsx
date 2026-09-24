'use client';
import { useState } from 'react';
import { DynamicTemplate, ConsumerDef } from '@/types';
import { ChevronRight, ChevronDown, CheckCircle2, Circle } from 'lucide-react';

const translateToSpanish = (key: string) => {
  const dictionary: Record<string, string> = {
    WATER: 'Agua', ENERGY: 'Energía', O2: 'Oxígeno', COOLING: 'Enfriamiento',
    MAIN_ENERGY: 'Energía Principal', BATTERIES: 'Baterías', CLEAN_WATER: 'Agua Limpia',
    BIOCIDES: 'Biocidas', HABITAT: 'Hábitat', CROPS: 'Cultivos', SHIELDS: 'Escudos',
    COMMS: 'Comunicaciones', THERMAL_SEAL: 'Sello Térmico', CREW_SURVIVAL: 'Superv. Tripulación',
    LIFE_SUPPORT: 'Soporte Vital', MANUFACTURING: 'Manufactura', HYDROPONICS: 'Hidroponía',
    QUARANTINE: 'Cuarentena', CREW: 'Tripulación'
  };
  return dictionary[key] || key.replace(/_/g, ' ');
};

interface TreeNodeProps {
  name: string;
  def: ConsumerDef;
  path: string[];
  configuredPaths: string[];
}

function TreeNode({ name, def, path, configuredPaths }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const pathStr = path.join('.');
  const parentPathStr = path.length > 1 ? path.slice(0, -1).join('.') : '';
  const isConfigured = configuredPaths.includes(pathStr);
  const isParentConfigured = configuredPaths.includes(parentPathStr);
  
  const hasChildren = def.subconsumers && Object.keys(def.subconsumers).length > 0;
  const requirementsCount = Object.keys(def.requirements || {}).length;

  return (
    <div className="ml-4 mt-2 border-l border-slate-200 pl-2">
      <div className="flex items-center group cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-4 h-4 mr-1 flex items-center justify-center text-slate-400">
          {hasChildren ? (expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : null}
        </div>
        <div className="flex items-center gap-2">
          {hasChildren ? (
            isConfigured ? <CheckCircle2 className="w-4 h-4 text-indigo-500" /> : <Circle className="w-4 h-4 text-slate-300" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-slate-300 ml-1"></div>
          )}
          <span className={`text-sm font-semibold ${isConfigured ? 'text-indigo-800' : 'text-slate-700'}`}>
            {translateToSpanish(name)}
          </span>
        </div>
      </div>
      
      {expanded && (
        <div className="ml-5 mt-1">
          {/* Requerimientos (Recursos Asignados a este nodo por su padre) */}
          {isParentConfigured && requirementsCount > 0 ? (
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(def.requirements!).map(([rName, rDef]) => {
                const isDeficit = rDef.original_demand !== undefined && Math.round(rDef.value) < Math.round(rDef.original_demand);
                if (isDeficit) {
                  return (
                    <span key={rName} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1" title="Recibió menos de lo solicitado">
                      ⚠️ {translateToSpanish(rName)}: {Math.round(rDef.value)} / {Math.round(rDef.original_demand!)}
                    </span>
                  );
                }
                return (
                  <span key={rName} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium shadow-sm">
                    {translateToSpanish(rName)}: {Math.round(rDef.value)}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 italic mb-2">Sin recursos asignados (esperando al padre)</div>
          )}
          
          {/* Subconsumidores */}
          {hasChildren && Object.entries(def.subconsumers!).map(([cName, cDef]) => (
            <TreeNode 
              key={cName} 
              name={cName} 
              def={cDef} 
              path={[...path, cName]} 
              configuredPaths={configuredPaths} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function GlobalDraftPreview({ template, configuredPaths }: { template: DynamicTemplate, configuredPaths: string[] }) {
  const isRootConfigured = configuredPaths.includes("");
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-2 border-b pb-2">Borrador Global en Progreso</h3>
      <p className="text-xs text-slate-500 mb-4">
        Este árbol representa el estado actual de tu repartición. Los nodos con <CheckCircle2 className="w-3 h-3 inline text-indigo-500"/> ya han repartido sus recursos a sus hijos.
      </p>
      
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-x-auto max-h-96 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          {isRootConfigured ? <CheckCircle2 className="w-5 h-5 text-indigo-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
          <span className="text-base font-bold text-slate-800">Sistema Raíz (Global)</span>
        </div>
        
        <div className="ml-5 border-l border-slate-300 pl-2">
          {Object.entries(template.consumers).map(([cName, cDef]) => (
            <TreeNode 
              key={cName} 
              name={cName} 
              def={cDef} 
              path={[cName]} 
              configuredPaths={configuredPaths} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
