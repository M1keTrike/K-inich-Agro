'use client';

import { DynamicTemplate } from '@/types';
import { useState, useEffect } from 'react';

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

interface Props {
  template: DynamicTemplate;
  onChange: (newTemplate: DynamicTemplate) => void;
  disabled: boolean;
}

export function DynamicControls({ template, onChange, disabled }: Props) {
  // Use local state for debouncing
  const [localTemplate, setLocalTemplate] = useState<DynamicTemplate>(template);

  useEffect(() => {
    setLocalTemplate(template);
  }, [template]);

  const handleResourceChange = (rName: string, value: number) => {
    const newT = { ...localTemplate };
    newT.resources[rName].value = value;
    setLocalTemplate(newT);
    onChange(newT);
  };

  const handleRequirementChange = (cName: string, rName: string, value: number) => {
    const newT = { ...localTemplate };
    newT.consumers[cName].requirements[rName].value = value;
    setLocalTemplate(newT);
    onChange(newT);
  };

  const handleWeightChange = (cName: string, value: number) => {
    const newT = { ...localTemplate };
    newT.consumers[cName].priority_weight = value;
    setLocalTemplate(newT);
    onChange(newT);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8 mb-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Controles Dinámicos: {template.name}</h3>
      <p className="text-sm text-slate-600 mb-6">{template.description}</p>
      
      {/* Recursos Totales */}
      <div className="mb-8">
        <h4 className="font-medium text-slate-800 mb-3 border-b pb-2">Recursos Disponibles</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(localTemplate.resources).map(([rName, rDef]) => (
            <div key={`res-${rName}`}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {translateToSpanish(rName)} ({rDef.value.toFixed(0)} / {rDef.max.toFixed(0)})
              </label>
              <input
                type="range"
                min="0"
                max={rDef.max}
                step="1"
                value={rDef.value}
                onChange={(e) => handleResourceChange(rName, parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full accent-blue-600"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Consumidores (Requisitos y Pesos) */}
      <div>
        <h4 className="font-medium text-slate-800 mb-3 border-b pb-2">Asignación por Consumidor</h4>
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(localTemplate.consumers).map(([cName, cDef]) => (
            <details key={`cons-${cName}`} className="bg-slate-50 rounded-lg border border-slate-200 group">
              <summary className="flex flex-wrap justify-between items-center p-4 cursor-pointer list-none hover:bg-slate-100 transition-colors">
                <h5 className="font-medium text-indigo-900 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {translateToSpanish(cName)}
                </h5>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Prioridad</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={cDef.priority_weight}
                    onChange={(e) => handleWeightChange(cName, parseFloat(e.target.value))}
                    disabled={disabled}
                    className="w-24 accent-emerald-600"
                  />
                  <span className="text-xs text-slate-700 font-medium w-8 text-right">
                    {(cDef.priority_weight * 100).toFixed(0)}%
                  </span>
                </div>
              </summary>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 pt-4 border-t border-slate-200">
                {Object.entries(cDef.requirements).map(([rName, req]) => (
                  <div key={`req-${cName}-${rName}`}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Req. {translateToSpanish(rName)} ({req.value.toFixed(0)} / {req.max.toFixed(0)})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={req.max}
                      step="1"
                      value={req.value}
                      onChange={(e) => handleRequirementChange(cName, rName, parseFloat(e.target.value))}
                      disabled={disabled}
                      className="w-full accent-indigo-400"
                    />
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
