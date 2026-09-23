'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EvolutionEvent } from '@/types';

interface Props {
  data: EvolutionEvent[];
}

export function ConvergenceChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500">Esperando datos de evolución...</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="generation" 
            label={{ value: 'Generación', position: 'insideBottomRight', offset: -10 }} 
            tick={{fontSize: 12}}
          />
          <YAxis 
            domain={[0, 1]} 
            label={{ value: 'Fitness', angle: -90, position: 'insideLeft' }}
            tick={{fontSize: 12}}
          />
          <Tooltip 
            formatter={(value: unknown) => typeof value === 'number' ? value.toFixed(3) : String(value)}
            labelFormatter={(label) => `Generación ${label}`}
          />
          <Legend verticalAlign="top" height={36}/>
          <Line 
            type="monotone" 
            dataKey="max_fitness" 
            name="Mejor Individuo" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false} // Disable to avoid weird jumps during live streaming
          />
          <Line 
            type="monotone" 
            dataKey="avg_fitness" 
            name="Promedio Población" 
            stroke="#6366f1" 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
