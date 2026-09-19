import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFaultLens } from '../../context/FaultLensContext';
import { AlertOctagon, Zap, Globe, Layers } from 'lucide-react';

export const SimulateIncidentModal = ({ isOpen, onClose, defaultWebsiteId = null }) => {
  const { websites, apis, simulateIncident, addApi } = useFaultLens();

  const [selectedWebsiteId, setSelectedWebsiteId] = useState(defaultWebsiteId || websites[0]?.id || '');
  const [selectedApiId, setSelectedApiId] = useState('');
  const [severity, setSeverity] = useState('critical');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter APIs belonging to selected website
  const availableApis = apis.filter((a) => a.websiteId === selectedWebsiteId);

  useEffect(() => {
    if (defaultWebsiteId) {
      setSelectedWebsiteId(defaultWebsiteId);
    } else if (!selectedWebsiteId && websites.length > 0) {
      setSelectedWebsiteId(websites[0].id);
    }
  }, [defaultWebsiteId, websites]);

  useEffect(() => {
    if (availableApis.length > 0) {
      setSelectedApiId(availableApis[0].id);
    } else {
      setSelectedApiId('');
    }
  }, [selectedWebsiteId, apis]);

  useEffect(() => {
    const site = websites.find((w) => w.id === selectedWebsiteId);
    const api = availableApis.find((a) => a.id === selectedApiId);
    const targetName = api?.name || site?.name || 'Service';
    setTitle(`High Error Rate & Latency Regression on ${targetName}`);
    setDescription(`Automated probe detected 4.5σ statistical deviation and 5xx responses on ${api?.endpoint || '/'}`);
  }, [selectedWebsiteId, selectedApiId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let targetApiId = selectedApiId;
      if (!targetApiId) {
        // Automatically create a root endpoint if this website has no APIs yet
        const newApi = await addApi(selectedWebsiteId, {
          name: 'Root Endpoint',
          endpoint: '/',
          method: 'GET',
          healthCheckEndpoint: '/'
        });
        targetApiId = newApi.id;
      }

      await simulateIncident({
        apiId: targetApiId,
        title: title.trim() || 'Simulated API Outage',
        description: description.trim() || 'Observability regression triggered',
        severity
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to trigger incident');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Simulate Real-Time Incident">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Website Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Website *</span>
          </label>
          <select
            value={selectedWebsiteId}
            onChange={(e) => setSelectedWebsiteId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {websites.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.url})
              </option>
            ))}
          </select>
        </div>

        {/* API Route Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Route / API *</span>
          </label>
          {availableApis.length > 0 ? (
            <select
              value={selectedApiId}
              onChange={(e) => setSelectedApiId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {availableApis.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.method} {a.endpoint} — {a.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-2.5 rounded-lg bg-[#080B12] border border-amber-500/30 text-amber-400 text-xs">
              This website has no endpoints yet. A default route ('/') will be automatically created and monitored.
            </div>
          )}
        </div>

        {/* Severity */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Incident Severity</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSeverity('critical')}
              className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                severity === 'critical'
                  ? 'bg-red-500/20 border-red-500 text-red-300 shadow-sm shadow-red-500/20'
                  : 'bg-[#080B12] border-[#1E2633] text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Critical (P0)</span>
            </button>
            <button
              type="button"
              onClick={() => setSeverity('warning')}
              className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                severity === 'warning'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                  : 'bg-[#080B12] border-[#1E2633] text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Warning (P1)</span>
            </button>
          </div>
        </div>

        {/* Incident Title */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Incident Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#080B12] border border-[#1E2633] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Incident Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Description / Root Cause</label>
          <textarea
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#080B12] border border-[#1E2633] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2633]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || websites.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Triggering...' : 'Trigger Incident'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
