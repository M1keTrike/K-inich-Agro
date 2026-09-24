'use client';

import { DynamicTemplate } from '@/types';
import { Settings2 } from 'lucide-react';

interface Props {
  template: DynamicTemplate;
  onChange: (template: DynamicTemplate) => void;
  disabled: boolean;
  bare?: boolean;
}

const fields = [
  { key: 'population_size', label: 'Población inicial', help: 'Individuos por generación', min: 10, max: 5000, step: 10 },
  { key: 'max_generations', label: 'Máximo de generaciones', help: 'Iteraciones del algoritmo', min: 1, max: 5000, step: 1 },
  { key: 'emit_every_n', label: 'Emitir cada N generaciones', help: 'Frecuencia de actualización visual', min: 1, max: 100, step: 1 },
  { key: 'mutation_rate', label: 'Tasa de mutación', help: 'Probabilidad de mutar un individuo', min: 0, max: 1, step: 0.01 },
  { key: 'mutation_strength', label: 'Fuerza de mutación', help: 'Desviación aplicada a los genes', min: 0, max: 1, step: 0.01 },
  { key: 'crossover_rate', label: 'Tasa de cruce', help: 'Probabilidad de combinar progenitores', min: 0, max: 1, step: 0.01 },
  { key: 'elitism_count', label: 'Individuos élite', help: 'Mejores individuos conservados', min: 1, max: 5000, step: 1 },
  { key: 'tournament_size', label: 'Tamaño del torneo', help: 'Individuos comparados al seleccionar', min: 2, max: 100, step: 1 },
] as const;

type SettingKey = (typeof fields)[number]['key'];

export function AlgorithmSettings({ template, onChange, disabled, bare = false }: Props) {
  const updateSetting = (key: SettingKey, value: number) => {
    const nextTemplate = { ...template, [key]: value };
    if (key === 'population_size') {
      nextTemplate.elitism_count = Math.min(nextTemplate.elitism_count, Math.max(1, value - 1));
      nextTemplate.tournament_size = Math.min(nextTemplate.tournament_size, value);
    }
    onChange(nextTemplate);
  };

  const content = (
    <div className="border-t border-slate-100 px-5 py-4">
        <p className="mb-4 text-xs text-slate-500">
          Ajusta estos parámetros antes de generar una repartición. Los cambios se aplican al siguiente ciclo.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {fields.map(field => (
            <label key={field.key} className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">{field.label}</span>
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={template[field.key]}
                disabled={disabled}
                onChange={event => updateSetting(field.key, Number(event.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              />
              <span className="text-[11px] leading-tight text-slate-400">{field.help}</span>
            </label>
          ))}
        </div>
      </div>
  );

  if (bare) return content;

  return (
    <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer select-none px-5 py-3 flex items-center justify-between text-sm font-semibold text-slate-800">
        <span className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-indigo-600" />
          Configuraciones adicionales
        </span>
        <span className="text-xs font-medium text-slate-500">Algoritmo genético</span>
      </summary>
      {content}
    </details>
  );
}