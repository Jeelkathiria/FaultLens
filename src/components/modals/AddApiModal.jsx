import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useFaultLens } from '../../context/FaultLensContext';
import { Network, Activity, Clock } from 'lucide-react';

export const AddApiModal = ({ isOpen, onClose, websiteId, websiteName }) => {
  const { addApi } = useFaultLens();

  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [method, setMethod] = useState('GET');
  const [healthCheckEndpoint, setHealthCheckEndpoint] = useState('');
  const [monitoringInterval, setMonitoringInterval] = useState('30s');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'API Name is required';
    }
    if (!endpoint.trim()) {
      newErrors.endpoint = 'Endpoint path is required';
    } else if (!endpoint.startsWith('/')) {
      newErrors.endpoint = 'Endpoint must begin with a forward slash (e.g. /api/users)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      addApi(websiteId, {
        name: name.trim(),
        endpoint: endpoint.trim(),
        method,
        healthCheckEndpoint: healthCheckEndpoint.trim() || `${endpoint.trim()}/health`,
        monitoringInterval
      });
      setIsSubmitting(false);
      setName('');
      setEndpoint('');
      setMethod('GET');
      setHealthCheckEndpoint('');
      setMonitoringInterval('30s');
      setErrors({});
      onClose();
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Register API Endpoint — ${websiteName || 'Website'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* API Name */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">API Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: null }));
            }}
            placeholder="e.g. Payment Gateway or User Auth Service"
            className={`w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
              errors.name ? 'border-red-500/80' : 'border-[#1E2633]'
            }`}
          />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>

        {/* Method & Endpoint Row */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">HTTP Method & Path *</label>
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-28 px-3 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 font-mono font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <div className="relative flex-1">
              <input
                type="text"
                value={endpoint}
                onChange={(e) => {
                  setEndpoint(e.target.value);
                  if (errors.endpoint) setErrors(prev => ({ ...prev, endpoint: null }));
                }}
                placeholder="/api/v1/payments"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border text-sm text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${
                  errors.endpoint ? 'border-red-500/80' : 'border-[#1E2633]'
                }`}
              />
            </div>
          </div>
          {errors.endpoint && <p className="text-xs text-red-400 mt-1">{errors.endpoint}</p>}
        </div>

        {/* Health Check Endpoint */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Dedicated Health Check URL (Optional)
          </label>
          <input
            type="text"
            value={healthCheckEndpoint}
            onChange={(e) => setHealthCheckEndpoint(e.target.value)}
            placeholder="e.g. /api/v1/payments/health (Defaults to {endpoint}/health)"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Monitoring Interval */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Telemetry Interval</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'High Precision', val: '30s' },
              { label: 'Standard', val: '60s' },
              { label: 'Lightweight', val: '5m' }
            ].map((opt) => (
              <button
                type="button"
                key={opt.val}
                onClick={() => setMonitoringInterval(opt.val)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  monitoringInterval === opt.val
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                    : 'bg-[#080B12] border-[#1E2633] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold font-mono">{opt.val}</div>
                <div className="text-[10px] text-slate-500">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2633]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            {isSubmitting ? 'Registering...' : '+ Register API'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
