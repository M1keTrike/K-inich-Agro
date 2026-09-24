'use client';

import { ChevronRight, FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Report {
  id: string;
  parent_node_id: string;
  report_data: string; // JSON string
  created_at: string;
}

export function DistributionReportsViewer() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = '/api/reports';
      const res = await fetch(url);
      const data = await res.json();
      setReports(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    
    // Escuchar el evento personalizado para actualizar los reportes sin recargar
    const handleUpdate = () => {
      fetchReports();
    };
    window.addEventListener('report-saved', handleUpdate);
    return () => window.removeEventListener('report-saved', handleUpdate);
  }, []);

  if (loading && reports.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
         <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
         <div className="flex gap-4">
           <div className="h-24 bg-slate-200 rounded-xl w-64"></div>
           <div className="h-24 bg-slate-200 rounded-xl w-64"></div>
         </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-indigo-500" />
        Reportes Históricos de Repartición
      </h3>
      
      {/* Scrollable Container */}
      <div className="flex overflow-x-auto pb-2 gap-4 scrollbar-thin scrollbar-thumb-slate-300">
        {reports.map(report => (
          <div 
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className="flex-shrink-0 w-64 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                #{report.id.slice(0,6)}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            <p className="text-sm text-slate-700 font-medium mb-1 truncate">
              {report.parent_node_id === 'global' ? 'Repartición Global' : `Padre: ${report.parent_node_id}`}
            </p>
            <div className="flex items-center text-xs text-slate-500 group-hover:text-indigo-600 font-medium mt-3">
              Ver desglose completo <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal for viewing report */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                Desglose de Repartición #{selectedReport.id.slice(0,6)}
              </h2>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Árbol de Asignaciones (Nodos Hojas)</h4>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                  {JSON.stringify(JSON.parse(selectedReport.report_data), null, 2)}
                </pre>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-white rounded-b-2xl flex justify-end">
               <button 
                  onClick={() => setSelectedReport(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cerrar
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
