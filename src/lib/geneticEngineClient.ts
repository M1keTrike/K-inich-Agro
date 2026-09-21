import { useState, useEffect, useCallback, useRef } from 'react';
import { EvolutionEvent, EvolutionParams } from '../types';

export function useEvolutionStream(params: EvolutionParams) {
  const [data, setData] = useState<EvolutionEvent[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'timeout' | 'finished'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // Clear timeout if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus('connecting');
    setErrorMsg(null);
    setData([]); // Reset data on new connection

    const baseUrl = process.env.NEXT_PUBLIC_GENETIC_ENGINE_URL || 'http://localhost:8000';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value.toString());
    });

    const url = `${baseUrl}/api/evolution-stream?${searchParams.toString()}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    // Timeout logic: > 30s without event -> timeout error
    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        es.close();
        setStatus('timeout');
        setErrorMsg('El cálculo está tomando más tiempo de lo esperado (Timeout 30s).');
      }, 30000);
    };

    resetTimeout();

    es.onopen = () => {
      setStatus('connected');
      retryCountRef.current = 0; // Reset retries on successful connection
    };

    es.onmessage = (event) => {
      resetTimeout();
      try {
        const payload: EvolutionEvent = JSON.parse(event.data);
        setData(prev => {
          // Avoid appending duplicate generation
          if (prev.length > 0 && prev[prev.length - 1].generation === payload.generation) {
            return prev;
          }
          return [...prev, payload];
        });

        if (payload.is_final) {
          es.close();
          setStatus('finished');
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      } catch (err) {
        console.error('Error parsing SSE data', err);
      }
    };

    es.onerror = (err) => {
      console.error('SSE Error', err);
      es.close();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(() => connect(), 1000 * retryCountRef.current); // Exponential backoff
      } else {
        setStatus('error');
        setErrorMsg('Error de red. Se interrumpió la conexión al motor genético.');
      }
    };
  }, [params]); // Reconnect when params change

  // This handles T019 US2 Add debounce logic to trigger reconnections
  useEffect(() => {
    const handler = setTimeout(() => {
      connect();
    }, 250); // 250ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [connect]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { data, status, errorMsg, reconnect: connect };
}
