'use client';

import { BenefitValueDef, DynamicTemplate } from '@/types';
import { useEffect, useRef } from 'react';

interface Props {
  template: DynamicTemplate;
  onChange: (template: DynamicTemplate) => void;
}

const emptyBenefit = (): BenefitValueDef => ({
  unit_value: 1,
  target_demand: 0,
  critical: false,
  minimum_reserve: 0,
});

export function BenefitSettings({ template, onChange }: Props) {
  const values = template.benefit_values ?? {};
  // Keep edits based on the newest template even when React batches rapid input events.
  const latestTemplate = useRef(template);
  useEffect(() => {
    latestTemplate.current = template;
  }, [template]);

  const commit = (edit: (current: DynamicTemplate) => DynamicTemplate) => {
    const next = edit(latestTemplate.current);
    latestTemplate.current = next;
    onChange(next);
  };

  const update = (resource: string, patch: Partial<BenefitValueDef>) => {
    commit(current => {
      const currentValues = current.benefit_values ?? {};
      return {
        ...current,
        benefit_values: {
          ...currentValues,
          [resource]: { ...emptyBenefit(), ...currentValues[resource], ...patch },
        },
      };
    });
  };

  const format = (name: string) => name.split('_').map(part => part[0] + part.slice(1).toLowerCase()).join(' ');

  return (
    <div className="space-y-5 p-1">
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900">
        Define qué producción cubre una demanda y qué inventario debe protegerse. Los recursos intermedios también requieren una valoración, aunque pueden usar valor y demanda cero.
      </div>
      <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
        Periodos máximos de simulación
        <input
          type="number" min="1" max="100" step="1"
          value={template.max_periods ?? 5}
          onChange={event => commit(current => ({ ...current, max_periods: Math.min(100, Math.max(1, Number(event.target.value) || 1)) }))}
          className="w-24 rounded-md border border-slate-300 px-2 py-1"
        />
      </label>
      <div className="space-y-3">
        {Object.entries(values).map(([resource, value]) => (
          <section key={resource} className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">{format(resource)}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                ['unit_value', 'Valor unitario'],
                ['target_demand', 'Demanda objetivo'],
                ['minimum_reserve', 'Reserva mínima'],
                ['storage_capacity', 'Capacidad de almacenamiento'],
              ] as const).map(([key, label]) => (
                <label key={key} className="space-y-1 text-xs font-medium text-slate-600">
                  {label}
                  <input
                    type="number" min="0" step="any"
                    value={value[key] ?? ''}
                    placeholder={key === 'storage_capacity' ? 'Sin límite declarado' : '0'}
                    onChange={event => update(resource, { [key]: key === 'storage_capacity' && event.target.value === '' ? undefined : Math.max(0, Number(event.target.value) || 0) })}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={value.critical} onChange={event => update(resource, { critical: event.target.checked })} />
              Demanda crítica: si queda pendiente, la solución no es aplicable
            </label>
            <button
              type="button"
              onClick={() => {
                commit(current => {
                  const next = { ...(current.benefit_values ?? {}) };
                  delete next[resource];
                  return { ...current, benefit_values: next };
                });
              }}
              className="mt-3 text-xs font-medium text-red-600 hover:text-red-700"
            >Eliminar valoración</button>
          </section>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.keys(template.resources).filter(name => !values[name]).map(resource => (
          <button key={resource} type="button" onClick={() => update(resource, {})} className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
            + {format(resource)}
          </button>
        ))}
      </div>
    </div>
  );
}
