'use client';
import React, { useState } from 'react';
import { Crisis } from '@/types';
import { Button } from '@/components/ui/Button';

interface Props {
  onCrisisInjected: (crisisData: Crisis) => void;
  disabled: boolean;
}

export function CrisisForm({ onCrisisInjected, disabled }: Props) {
  const [severity, setSeverity] = useState(40);
  const [resource, setResource] = useState('water');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/crisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crisis_type: `${resource}_shortage`,
          severity_percent: severity,
          affected_resources: [resource]
        })
      });
      const data = await res.json();
      onCrisisInjected(data.crisis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-md p-6 mb-6">
      <h2 className="text-base font-semibold text-slate-700 mb-4">Inyectar simulacro de crisis</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Recurso afectado
          </label>
          <select
            disabled={disabled || loading}
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            className="bg-white border border-gray-300 text-slate-700 text-sm p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="water">Agua</option>
            <option value="energy">Energía</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Severidad (%)
          </label>
          <input
            type="number"
            disabled={disabled || loading}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            min="1" max="100"
            className="bg-white border border-gray-300 text-slate-700 text-sm p-2 rounded-md w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <Button
          type="submit"
          variant="danger"
          disabled={disabled}
          isLoading={loading}
          loadingText="Inyectando..."
        >
          Iniciar simulacro
        </Button>
      </form>
    </div>
  );
}
