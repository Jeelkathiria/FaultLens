import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  AlertOctagon,
  ArrowLeft,
  Compass,
  Terminal,
  Activity,
  Zap,
  Globe,
  Radio,
  Layers,
  Home,
  RefreshCw,
  CreditCard,
  Lock,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const NotFoundPage = ({ inDashboard = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Mode: '402' (Payment Required / Enterprise Tier) vs '404' (Route Not Found)
  // Default to 402 as requested by user, with toggle to 404
  const [activeCode, setActiveCode] = useState('402');
  const [terminalOutput, setTerminalOutput] = useState([
    `[TRACE] Ingest probe initialized for "${location.pathname}"`,
    `[GATEWAY] Routing table searched across 12 distributed cluster nodes...`,
    `[DIAGNOSTIC] Status ${activeCode}: Zero telemetry ingress streams matched "${location.pathname}"`
  ]);
  const [customCommand, setCustomCommand] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    setTerminalOutput([
      `[TRACE] Ingest probe initialized for "${location.pathname}"`,
      `[GATEWAY] Routing table searched across 12 distributed cluster nodes...`,
      activeCode === '402'
        ? `[ALERT 402] Ingestion quota deficit or endpoint feature-locked: "${location.pathname}"`
        : `[ALERT 404] Target endpoint not found in routing catalog: "${location.pathname}"`
    ]);
  }, [activeCode, location.pathname]);

  const handleRunCommand = (e) => {
    e?.preventDefault();
    const cmd = (customCommand || '').trim().toLowerCase();
    if (!cmd) return;

    const newOutputs = [...terminalOutput, `> ${customCommand}`];

    if (cmd === 'help') {
      newOutputs.push(
        'Available diagnostic commands:',
        '  ping       - Ping telemetry edge nodes',
        '  routes     - List registered application endpoints',
        '  status     - Toggle between HTTP 402 and HTTP 404 mode',
        '  fix        - Automatically return to main telemetry dashboard',
        '  clear      - Clear terminal console'
      );
    } else if (cmd === 'ping') {
      newOutputs.push(
        'Pinging gateway edge cluster...',
        '  64 bytes from ingress-gateway: icmp_seq=1 ttl=58 time=3.2ms',
        '  64 bytes from ingress-gateway: icmp_seq=2 ttl=58 time=2.9ms',
        '  Result: Gateway is healthy, but route target is unmapped.'
      );
    } else if (cmd === 'routes') {
      newOutputs.push(
        'Active Registered Endpoints in FaultLens:',
        '  /dashboard              [200 OK]',
        '  /websites               [200 OK]',
        '  /incidents              [200 OK]',
        '  /deployments            [200 OK]',
        '  /logs                   [200 OK]',
        '  /settings               [200 OK]',
        '  /admin/system-health    [200 OK]'
      );
    } else if (cmd === 'status') {
      const next = activeCode === '402' ? '404' : '402';
      setActiveCode(next);
      newOutputs.push(`Switched display diagnostic mode to HTTP ${next}`);
    } else if (cmd === 'fix' || cmd === 'home') {
      newOutputs.push('Initiating reroute to /dashboard in 1 second...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } else if (cmd === 'clear') {
      setTerminalOutput([]);
      setCustomCommand('');
      return;
    } else {
      newOutputs.push(`Command not recognized: "${cmd}". Type "help" for available commands.`);
    }

    setTerminalOutput(newOutputs);
    setCustomCommand('');
  };

  const runSimulatedScan = () => {
    setIsScanning(true);
    addToast({
      title: 'Running Deep Telemetry Scan',
      message: `Probing cluster nodes for route "${location.pathname}"`,
      type: 'info'
    });

    setTimeout(() => {
      setTerminalOutput((prev) => [
        ...prev,
        `> faultlens --deep-probe ${location.pathname}`,
        `[SCAN RESULT] 100% packet loss. Zero active heartbeats detected on this URI.`,
        activeCode === '402'
          ? `[SUGGESTION] Upgrade workspace license or register route via /websites`
          : `[SUGGESTION] Verify URL spelling or return to /dashboard`
      ]);
      setIsScanning(false);
      addToast({
        title: 'Scan Complete',
        message: 'Endpoint confirmed unmapped or tier-restricted',
        type: 'warning'
      });
    }, 1200);
  };

  return (
    <div className={`min-h-[80vh] flex flex-col justify-center items-center py-10 px-4 relative overflow-hidden ${!inDashboard ? 'bg-[#080B12]' : ''}`}>
      {/* Background Animated Gradient Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl relative z-10 space-y-8 text-center">
        
        {/* Top Badges & Status Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F141D] border border-[#1E2633] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-slate-400">FAULT PROTOCOL:</span>
            <span className="font-bold text-red-400">HTTP {activeCode}</span>
          </div>

          {/* Mode Switcher Pill */}
          <div className="inline-flex items-center p-1 rounded-lg bg-[#0F141D] border border-[#1E2633] text-xs font-mono">
            <button
              onClick={() => setActiveCode('402')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeCode === '402'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              402 Payment Required
            </button>
            <button
              onClick={() => setActiveCode('404')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeCode === '404'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              404 Not Found
            </button>
          </div>
        </div>

        {/* Hero Code Visual Banner */}
        <div className="relative">
          <div className="text-8xl sm:text-9xl font-extrabold tracking-tighter font-mono select-none text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-300 to-slate-700 opacity-90 drop-shadow-2xl">
            {activeCode}
          </div>
          <div className="text-sm sm:text-base font-bold tracking-wider uppercase font-mono mt-2 text-indigo-400 flex items-center justify-center gap-2">
            {activeCode === '402' ? (
              <>
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Telemetry Ingestion Quota Locked / Payment Required</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Telemetry Route Unmapped / Signal Lost</span>
              </>
            )}
          </div>
        </div>

        {/* Explanatory Description */}
        <div className="max-w-xl mx-auto space-y-2">
          <p className="text-sm text-slate-300 leading-relaxed">
            {activeCode === '402' ? (
              <span>
                The endpoint <code className="px-2 py-0.5 rounded bg-[#0F141D] border border-[#1E2633] text-amber-300 font-mono text-xs">{location.pathname}</code> is either restricted under your current workspace quota, locked to enterprise tiers, or unindexed in the telemetry pipeline.
              </span>
            ) : (
              <span>
                We looked across all cluster gateways and timeseries ingestion queues, but could not discover any handler registered for <code className="px-2 py-0.5 rounded bg-[#0F141D] border border-[#1E2633] text-indigo-300 font-mono text-xs">{location.pathname}</code>.
              </span>
            )}
          </p>
          <div className="text-xs text-slate-500 font-mono">
            Origin Gateway: <span className="text-slate-400">envoy-edge-ingress-01</span> • Latency: <span className="text-emerald-400">0.42ms</span> • Protocol: <span className="text-slate-400">HTTP/2</span>
          </div>
        </div>

        {/* Interactive Diagnostic Probe Shell (Killer Feature) */}
        <div className="max-w-2xl mx-auto rounded-xl border border-[#1E2633] bg-[#0B0F17] overflow-hidden text-left shadow-2xl">
          {/* Terminal Titlebar */}
          <div className="px-4 py-2.5 bg-[#0F141D] border-b border-[#1E2633] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="text-xs font-mono font-medium text-slate-400 ml-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>faultlens-probe-shell ~ v3.4.1</span>
              </span>
            </div>

            <button
              onClick={runSimulatedScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-600/20 px-2 py-0.5 rounded border border-indigo-500/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Probing...' : 'Run Probe'}</span>
            </button>
          </div>

          {/* Terminal Console Body */}
          <div className="p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto text-slate-300">
            {terminalOutput.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.startsWith('>')
                    ? 'text-indigo-400 font-bold'
                    : line.includes('ALERT') || line.includes('404') || line.includes('402')
                    ? 'text-amber-400'
                    : line.includes('RESULT')
                    ? 'text-red-400'
                    : 'text-slate-400'
                }
              >
                {line}
              </div>
            ))}
          </div>

          {/* Command Input Prompt */}
          <form onSubmit={handleRunCommand} className="p-2.5 bg-[#080B12] border-t border-[#1E2633] flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-xs font-bold pl-2">$</span>
            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder='Type "help", "ping", "routes", or "fix"...'
              className="flex-1 bg-transparent text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-colors"
            >
              Execute
            </button>
          </form>
        </div>

        {/* Action Button Navigation Matrix */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/25"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/websites')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F141D] hover:bg-slate-800 border border-[#1E2633] text-slate-200 text-xs font-semibold transition-colors"
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Browse Monitored Websites</span>
          </button>

          <button
            onClick={() => navigate('/incidents')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F141D] hover:bg-slate-800 border border-[#1E2633] text-slate-200 text-xs font-semibold transition-colors"
          >
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span>View Active Incidents</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Helpful Footnote */}
        <div className="pt-4 border-t border-[#1E2633]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono max-w-2xl mx-auto">
          <span>FaultLens Telemetry Engine</span>
          <span>Target: {location.pathname}</span>
          <Link to="/settings" className="hover:text-indigo-400 transition-colors">
            Configure API Keys →
          </Link>
        </div>

      </div>
    </div>
  );
};
