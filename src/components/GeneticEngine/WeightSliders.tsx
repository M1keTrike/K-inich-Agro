'use client';

import { EvolutionParams } from '@/types';

interface Props {
  params: EvolutionParams;
  onChange: (newParams: EvolutionParams) => void;
  disabled: boolean;
}

export function WeightSliders({ params, onChange, disabled }: Props) {
  const handleChange = (key: keyof EvolutionParams, value: number) => {
    onChange({
      ...params,
      [key]: value
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8 mb-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Ajuste de Prioridades de Evolución</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioridad Humana ({(params.w_human * 100).toFixed(0)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.w_human}
            onChange={(e) => handleChange('w_human', parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full accent-emerald-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioridad Cultivos ({(params.w_crop * 100).toFixed(0)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.w_crop}
            onChange={(e) => handleChange('w_crop', parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full accent-emerald-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Balance Energético ({(params.w_balance * 100).toFixed(0)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.w_balance}
            onChange={(e) => handleChange('w_balance', parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full accent-emerald-600"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        Los pesos se normalizarán automáticamente para sumar 100% en el motor genético. Mover un deslizador reiniciará el cálculo.
      </p>
    </div>
  );
}
