import React from 'react';
import { useFaultLens } from '../../context/FaultLensContext';
import { LogViewer } from '../../components/logs/LogViewer';
import { Terminal, RefreshCw, Download, Zap } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const LogsPage = () => {
  const { logs, websites, apis, isLiveSimulation } = useFaultLens();
  const { addToast } = useToast();

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `faultlens-telemetry-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({
      title: 'Logs Exported',
      message: 'Exported telemetry log payload as JSON',
      type: 'info'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Live Logs & Telemetry</h1>
            {isLiveSimulation && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Stream
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time access logs, HTTP response codes, and exception stack traces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F141D] hover:bg-slate-800 border border-[#1E2633] text-slate-300 text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Main Log Viewer */}
      <LogViewer logs={logs} websites={websites} apis={apis} />
    </div>
  );
};
