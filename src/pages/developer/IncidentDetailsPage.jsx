import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatusBadge } from '../../components/common/Badge';
import { IncidentTimeline } from '../../components/incident/IncidentTimeline';
import { DeploymentCorrelationCard } from '../../components/incident/DeploymentCorrelationCard';
import { StatusWorkflow } from '../../components/incident/StatusWorkflow';
import {
  ArrowLeft,
  AlertOctagon,
  TrendingUp,
  Clock,
  Layers,
  Activity,
  Users,
  Terminal,
  ChevronRight,
  ExternalLink,
  Globe
} from 'lucide-react';

export const IncidentDetailsPage = () => {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { incidents, websites, updateIncidentStatus } = useFaultLens();

  const incident = incidents.find(i => i.id === incidentId);

  if (!incident) {
    return (
      <div className="space-y-6">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </Link>
        <div className="p-12 text-center text-xs font-mono text-slate-400 border border-[#1E2633] rounded-xl bg-[#0F141D]">
          Incident not found. The requested incident does not exist or has been removed.
        </div>
      </div>
    );
  }

  const handleStatusChange = (newStatus) => {
    updateIncidentStatus(incident.id, newStatus);
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation */}
      <div>
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </Link>

        {/* Incident Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/20 via-[#0F141D] to-[#0F141D]">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 shrink-0">
              <AlertOctagon className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xs font-bold text-red-400 tracking-wider">
                  INCIDENT {incident.number || 'N/A'}
                </span>
                {(incident.websiteName || websites?.find(w => w.id === incident.websiteId)?.name) && (
                  <span className="text-xs font-medium text-indigo-300 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-1.5 font-mono">
                    <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span>{incident.websiteName || websites?.find(w => w.id === incident.websiteId)?.name}</span>
                  </span>
                )}
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                  {incident.apiName || 'N/A'}
                </span>
                <StatusBadge status={incident.severity || 'healthy'} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5">
                {incident.title || 'N/A'}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span>Domain: {incident.websiteName || 'N/A'}</span>
                <span>•</span>
                <span>Detected: {incident.detectedAt || 'N/A'}</span>
                <span>•</span>
                <span>Active duration: {incident.duration || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (incident.websiteId && incident.apiId) {
                  navigate(`/websites/${incident.websiteId}/apis/${incident.apiId}`);
                } else {
                  navigate('/websites');
                }
              }}
              className="px-4 py-2 rounded-lg bg-[#080B12] hover:bg-slate-800 border border-[#1E2633] text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>Inspect API Telemetry</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Jump Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Error Rate jump */}
        <div className="p-5 rounded-xl border border-red-500/30 bg-red-950/15">
          <div className="flex items-center justify-between text-xs font-medium text-red-400 mb-1 font-mono uppercase tracking-wider">
            <span>Error Rate Spike</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {incident.metrics?.errorRateBefore || 'N/A'} → <span className="underline decoration-wavy">{incident.metrics?.errorRateCurrent || 'N/A'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 font-sans">
            Baseline normal to current 5xx rate
          </div>
        </div>

        {/* Latency jump */}
        <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-950/15">
          <div className="flex items-center justify-between text-xs font-medium text-amber-400 mb-1 font-mono uppercase tracking-wider">
            <span>P95 Latency Degradation</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {incident.metrics?.latencyBefore || 'N/A'} → {incident.metrics?.latencyCurrent || 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 font-sans">
            {incident.metrics?.latencyBefore && incident.metrics?.latencyCurrent
              ? `Degradation from ${incident.metrics.latencyBefore} to ${incident.metrics.latencyCurrent}`
              : 'Latency regression window'}
          </div>
        </div>

        {/* Detected Time */}
        <div className="p-5 rounded-xl border border-[#1E2633] bg-[#0F141D]">
          <div className="text-xs font-medium text-slate-400 mb-1 font-mono uppercase tracking-wider">
            Detected
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {incident.detectedAt || 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 font-sans">
            Automated anomaly trigger
          </div>
        </div>

        {/* Duration */}
        <div className="p-5 rounded-xl border border-[#1E2633] bg-[#0F141D]">
          <div className="text-xs font-medium text-slate-400 mb-1 font-mono uppercase tracking-wider">
            Duration
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {incident.duration || 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 font-sans">
            Continuous regression window
          </div>
        </div>
      </div>

      {/* KILLER FEATURE: Deployment Correlation Section */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-100">Deployment Correlation Analysis</h2>
          <p className="text-xs text-slate-400">
            FaultLens maps deployment release timestamps directly against statistical anomaly spikes
          </p>
        </div>

        <DeploymentCorrelationCard deployment={incident.correlatedDeployment} />
      </div>

      {/* Incident Status Workflow Stepper */}
      <StatusWorkflow
        currentStatus={incident.status}
        onStatusChange={handleStatusChange}
      />

      {/* Incident Timeline & Activity Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-[#1E2633] bg-[#0F141D] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Incident Event Progression Timeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">Chronological breakdown from deployment to triage</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{incident.timeline?.length || 0} logged events</span>
          </div>

          <IncidentTimeline timeline={incident.timeline} />
        </div>

        {/* Audit & Impact Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Estimated User Impact</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#080B12] border border-[#1E2633]">
                <div className="text-slate-500 text-[10px] uppercase tracking-wider">Affected Requests</div>
                <div className="text-slate-200 font-bold text-sm mt-0.5">{incident.metrics?.affectedRequests !== undefined && incident.metrics?.affectedRequests !== null ? incident.metrics.affectedRequests : '0'}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#080B12] border border-[#1E2633]">
                <div className="text-slate-500 text-[10px] uppercase tracking-wider">Impacted User Sessions</div>
                <div className="text-amber-400 font-bold text-sm mt-0.5">{incident.metrics?.impactedUsers || 'N/A (HTTP Synthetic Probe)'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">Audit Trail</h3>
            <div className="space-y-2 font-mono text-[11px]">
              {(incident.activityLog || []).map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#080B12] border border-[#1E2633]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-slate-200">{item.user}</span>
                    <span>{item.time}</span>
                  </div>
                  <div className="text-slate-300 mt-1">{item.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
