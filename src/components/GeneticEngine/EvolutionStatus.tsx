'use client';

import { EvolutionEvent } from '@/types';
import { AlertCircle, CheckCircle2, Loader2, WifiOff } from 'lucide-react';

interface Props {
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'timeout' | 'finished';
  errorMsg: string | null;
  lastEvent: EvolutionEvent | null;
}

export function EvolutionStatus({ status, errorMsg, lastEvent }: Props) {
  if (status === 'error' || status === 'timeout') {
    return (
      <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-md">
        <WifiOff className="w-5 h-5 text-red-500 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-red-800">Error de Conexión</h4>
          <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center space-x-2 text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Recalculando con nuevos parámetros...</span>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-amber-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Evolucionando (Generación {lastEvent?.generation || 0})</span>
        </div>
        {lastEvent && (
          <p className="text-xs text-gray-500">
            {lastEvent.viable_count} alternativas viables encontradas de 100 evaluadas.
          </p>
        )}
      </div>
    );
  }

  if (status === 'finished') {
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Optimización Completada</span>
        </div>
        {lastEvent && (
          <p className="text-xs text-gray-500">
            Frente de Pareto estabilizado en la generación {lastEvent.generation}.
          </p>
        )}
      </div>
    );
  }

  return null;
}
