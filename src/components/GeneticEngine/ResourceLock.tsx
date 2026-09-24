'use client';

import { ConsumerDef, DynamicTemplate } from '@/types';
import { AnimatePresence, motion, MotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { Lock, Plus, Settings2, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Modal } from '../ui/Modal';

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

// Componente individual del Anillo para manejar sus propios hooks de animación
function ResourceRing({ 
  rName, 
  rDef, 
  template, 
  index, 
  scrollY, 
  setEditingResource 
}: { 
  rName: string, 
  rDef: { value: number }, 
  template: DynamicTemplate, 
  index: number, 
  scrollY: MotionValue<number>,
  setEditingResource: (r: string) => void 
}) {
  // Expandimos la altura invisible en el DOM a 100px. 
  // Esto obliga al navegador a hacer más scroll para pasar cada elemento (ralentiza el giro nativamente sin hackear la rueda).
  const DOM_HEIGHT = 100; 
  const centerPos = index * DOM_HEIGHT;
  
  // Rango de animación basado en la altura del DOM
  const range = [centerPos - DOM_HEIGHT * 2, centerPos, centerPos + DOM_HEIGHT * 2];
  
  const scale = useTransform(scrollY, range, [0.75, 1.05, 0.75]);
  const opacity = useTransform(scrollY, range, [0.3, 1, 0.3]);
  const rotateX = useTransform(scrollY, range, [45, 0, -45]);
  
  // Para que visualmente sigan viéndose muy juntos (como si midieran 48px), 
  // usamos yOffset para empujar los elementos lejanos de vuelta hacia el centro.
  // IMPORTANTE: Si el elemento está "abajo" en el DOM (scroll menor), hay que empujarlo hacia "arriba" (negativo).
  const yOffset = useTransform(scrollY, range, [-110, 0, 110]); 

  let effectiveVal = rDef.value;
  let impact = 0;
  if (template.crisis_factors) {
    for (const crisis of Object.values(template.crisis_factors)) {
      if (crisis.impact_resource && crisis.impact_resource[rName]) {
        impact += crisis.intensity * crisis.impact_resource[rName];
      }
    }
  }
  effectiveVal = Math.max(0, effectiveVal * (1.0 + impact));
  const hasImpact = impact !== 0;

  return (
    <div className="w-full h-[100px] flex-shrink-0 flex items-center justify-center snap-center relative">
      <motion.div
        layout
        style={{ 
          scale, 
          opacity, 
          rotateX,
          y: yOffset,
          transformOrigin: "center center -40px" // Punto de pivote 3D
        }}
        onClick={() => setEditingResource(rName)}
        className="w-full h-12 absolute bg-white border-y border-slate-200 shadow-[0_4px_6px_rgba(0,0,0,0.05)] flex items-center justify-between px-4 cursor-pointer group hover:border-indigo-200 hover:shadow-md transition-shadow"
      >
        <span className="font-mono text-sm font-bold text-slate-700 tracking-widest truncate max-w-[110px] uppercase group-hover:text-indigo-600 transition-colors">
          {translateToSpanish(rName)}
        </span>
        <div className="flex flex-col items-end" style={{ transform: 'translateZ(10px)' }}>
          <span className={`font-mono text-lg font-bold ${hasImpact ? (impact < 0 ? 'text-red-500' : 'text-emerald-500') : 'text-indigo-600'}`}>
            {effectiveVal.toFixed(0)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// Variable global para evitar crear múltiples contextos de audio
let audioCtx: AudioContext | null = null;

const playClickSound = () => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.015);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.015);
  } catch {
  }
};

interface Props {
  template: DynamicTemplate;
  onChange: (newT: DynamicTemplate) => void;
  disabled: boolean;
}

export function ResourceLock({ template, onChange, disabled }: Props) {
  const [editingResource, setEditingResource] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceValue, setNewResourceValue] = useState(100);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  
  const smoothScrollY = useSpring(scrollY, { stiffness: 60, damping: 30, mass: 2 });
  
  const lastIndex = useRef(0);
  
  useMotionValueEvent(smoothScrollY, "change", (latest) => {
    const currentIndex = Math.floor((latest + 50) / 100);
    if (currentIndex !== lastIndex.current) {
      lastIndex.current = currentIndex;
      playClickSound();
    }
  });

  const resourceEntries = Object.entries(template.resources);

  const isResourceUsed = (rName: string) => {
    let used = false;
    const checkNode = (consumers: Record<string, ConsumerDef>) => {
      for (const c of Object.values(consumers)) {
        if (c.requirements && c.requirements[rName]) {
          used = true;
          return;
        }
        if (c.subconsumers) checkNode(c.subconsumers);
      }
    };
    if (template.consumers) checkNode(template.consumers);
    return used;
  };

  const handleUpdateResource = (rName: string, value: number) => {
    const newT = JSON.parse(JSON.stringify(template));
    newT.resources[rName].value = value;
    onChange(newT);
  };

  const handleDeleteResource = (rName: string) => {
    if (isResourceUsed(rName)) return; 
    const newT = JSON.parse(JSON.stringify(template));
    delete newT.resources[rName];
    onChange(newT);
    setEditingResource(null);
  };

  const handleAddResource = () => {
    if (!newResourceName.trim()) return;
    const cleanName = newResourceName.trim().toUpperCase().replace(/\s+/g, '_');
    const newT = JSON.parse(JSON.stringify(template));
    newT.resources[cleanName] = { value: newResourceValue };
    onChange(newT);
    setNewResourceName("");
    setNewResourceValue(100);
    setIsAddModalOpen(false);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center justify-center">
            Módulo de Recursos
          </h2>
          <p className="text-xs text-slate-500 mt-1">Gira el tambor y presiona un anillo para calibrarlo.</p>
        </div>

        <div className="relative flex items-center justify-center bg-white p-4 rounded-2xl shadow-[inset_0_4px_10px_rgba(0,0,0,0.05),0_4px_15px_rgba(0,0,0,0.05)] border border-slate-200 max-w-sm w-full mx-auto"
             style={{ perspective: '1000px' }}>
          
          <div className="relative w-full h-64 bg-slate-50 rounded-xl shadow-[inset_0_5px_15px_rgba(0,0,0,0.1)] border border-slate-200 flex items-center justify-center overflow-hidden"
               style={{ transformStyle: 'preserve-3d' }}>
            
            <div className="absolute left-0 right-0 h-4 bg-slate-200 top-1/2 -translate-y-1/2 opacity-50 z-0"></div>

            <div 
              ref={scrollRef}
              className="w-56 h-full overflow-y-auto hide-scrollbar flex flex-col snap-y snap-mandatory relative z-10"
              style={{
                transform: 'rotateY(-25deg) rotateX(5deg)',
                paddingTop: '100px', 
                paddingBottom: '100px',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)'
              }}
            >
              <AnimatePresence mode="popLayout">
                {resourceEntries.map(([key, rDef], index) => (
                  <ResourceRing 
                    key={key}
                    rName={key}
                    rDef={rDef}
                    template={template}
                    index={index}
                    scrollY={smoothScrollY}
                    setEditingResource={setEditingResource}
                  />
                ))}
              </AnimatePresence>
              
              {resourceEntries.length === 0 && (
                <div className="text-slate-400 text-sm font-mono italic opacity-50 py-4 text-center w-full">Vacío</div>
              )}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-[0.1] pointer-events-none z-30"></div>
          </div>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="mt-6 flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-200"
        >
          <Plus size={16} className="mr-2" /> Nuevo Recurso
        </button>
      </div>

      <Modal
        isOpen={!!editingResource}
        onClose={() => setEditingResource(null)}
        title={editingResource ? `Calibrar: ${translateToSpanish(editingResource)}` : ""}
        footer={
          <div className="flex justify-between w-full">
            {editingResource && !isResourceUsed(editingResource) ? (
              <button 
                onClick={() => handleDeleteResource(editingResource)} 
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center transition-colors border border-red-200"
              >
                <Trash2 size={16} className="mr-2"/> Extraer Anillo
              </button>
            ) : (
              <div 
                className="px-4 py-2 bg-slate-50 text-slate-400 rounded-lg text-sm font-medium flex items-center border border-slate-200 cursor-not-allowed"
                title="No se puede eliminar porque está asignado a un consumidor."
              >
                <Lock size={16} className="mr-2"/> Bloqueado (En uso)
              </div>
            )}
            <button 
              onClick={() => setEditingResource(null)} 
              className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 shadow-sm"
            >
              Listo
            </button>
          </div>
        }
      >
        {editingResource && (
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <Settings2 size={32} className="mx-auto mb-3 text-slate-400" />
              <label className="block text-sm font-bold text-slate-700 mb-2">Capacidad Base</label>
              <input
                type="number"
                min="0"
                step="1"
                value={template.resources[editingResource]?.value || 0}
                onChange={(e) => handleUpdateResource(editingResource, parseFloat(e.target.value))}
                disabled={disabled}
                className="w-32 text-center text-xl font-mono font-bold bg-white border-2 border-slate-300 rounded-lg px-3 py-2 focus:ring-slate-500 focus:border-slate-500 shadow-inner"
              />
              <p className="text-xs text-slate-500 mt-4">
                Ajusta la capacidad nominal de este recurso. Si deseas eliminar el anillo, asegúrate de que ningún consumidor lo esté requiriendo.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Insertar Nuevo Anillo de Recurso"
        footer={
          <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 border border-slate-300">
            Cancelar
          </button>
        }
      >
        <div className="space-y-4 py-2">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Identificador del Recurso</label>
              <input 
                type="text" 
                value={newResourceName} 
                onChange={e => setNewResourceName(e.target.value)} 
                placeholder="Ej. COMBUSTIBLE" 
                className="w-full text-sm border-slate-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Capacidad Inicial</label>
              <input 
                type="number" 
                min="0"
                value={newResourceValue} 
                onChange={e => setNewResourceValue(parseFloat(e.target.value))} 
                className="w-full text-sm border-slate-300 rounded-md px-3 py-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <button 
              onClick={handleAddResource} 
              disabled={disabled || !newResourceName.trim()} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Plus size={16} className="mr-2"/> Insertar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
