import React from 'react';
import { useFaultLens } from '../../context/FaultLensContext';
import { StatusBadge } from '../../components/common/Badge';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, Clock, ArrowRight } from 'lucide-react';

export const AdminIncidentsPage = () => {
  const navigate = useNavigate();
  const { incidents } = useFaultLens();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Global Platform Incidents</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of all active anomalies across tenant organizations.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider border-b border-[#1E2633] font-mono">
            <tr>
              <th className="py-3.5 px-5">Incident</th>
              <th className="py-3.5 px-5">Target Service</th>
              <th className="py-3.5 px-5">Severity</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5">Detected</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2633]">
            {incidents.map((inc) => (
              <tr key={inc.id} className="hover:bg-[#141B26] transition-colors">
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-red-400 font-bold">{inc.number}</span>
                    <span className="font-semibold text-slate-100">{inc.title}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5">
                  <span className="font-mono text-slate-300 font-semibold">{inc.apiName}</span>
                  <span className="text-[11px] text-slate-500 block font-mono">({inc.websiteName})</span>
                </td>
                <td className="py-3.5 px-5">
                  <StatusBadge status={inc.severity} size="xs" />
                </td>
                <td className="py-3.5 px-5 font-mono capitalize text-indigo-400 font-semibold">
                  {inc.status}
                </td>
                <td className="py-3.5 px-5 font-mono text-slate-400">
                  {inc.detectedAt} ({inc.timeAgo})
                </td>
                <td className="py-3.5 px-5 text-right">
                  <button
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    View Details →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
