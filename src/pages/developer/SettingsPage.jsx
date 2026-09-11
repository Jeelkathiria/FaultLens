import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Shield,
  Bell,
  Sliders,
  Check,
  Key,
  Copy,
  Plus,
  Trash2,
  Lock,
  Globe
} from 'lucide-react';

export const SettingsPage = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile'); // profile | security | notifications | monitoring

  // Profile state
  const [name, setName] = useState('Jeel Kathiria');
  const [email, setEmail] = useState('jeel@faultlens.dev');
  const [role, setRole] = useState('Senior Backend Engineer');

  // Security state
  const [apiKeys, setApiKeys] = useState([
    { id: 'key-1', name: 'Production Telemetry Ingest', key: 'fl_live_948a92bb4f01c8', created: '2026-02-10', lastUsed: 'Just now' },
    { id: 'key-2', name: 'Staging CI Agent', key: 'fl_stage_881c201a44e99b', created: '2026-04-14', lastUsed: '3 hours ago' }
  ]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Notifications state
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/XXXXX');
  const [pagerDutyKey, setPagerDutyKey] = useState('pd_live_4819aa01');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalSms, setCriticalSms] = useState(false);

  // Monitoring state
  const [defaultInterval, setDefaultInterval] = useState('30s');
  const [latencyThresholdMs, setLatencyThresholdMs] = useState(600);
  const [errorRateThresholdPct, setErrorRateThresholdPct] = useState(2.5);

  const handleSave = (section) => {
    addToast({
      title: 'Settings Saved',
      message: `${section} preferences updated successfully`,
      type: 'success'
    });
  };

  const handleGenerateKey = () => {
    const newKey = {
      id: `key-${Date.now()}`,
      name: 'New Integration Key',
      key: `fl_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 8)}`,
      created: 'Today',
      lastUsed: 'Never'
    };
    setApiKeys(prev => [newKey, ...prev]);
    addToast({
      title: 'API Key Generated',
      message: 'New secret key provisioned',
      type: 'success'
    });
  };

  const handleDeleteKey = (id) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    addToast({
      title: 'API Key Revoked',
      message: 'Revoked key credentials',
      type: 'info'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure profile details, security credentials, notification channels, and monitoring thresholds.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E2633] gap-6 text-xs font-semibold">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'security', label: 'Security & API Keys', icon: Shield },
          { id: 'notifications', label: 'Alert Notifications', icon: Bell },
          { id: 'monitoring', label: 'Monitoring Engine', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 pt-1 border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-xl border border-[#1E2633] bg-[#0F141D] p-6 max-w-3xl">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave('Profile');
            }}
            className="space-y-5"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Personal Information</h3>
              <p className="text-xs text-slate-400 mt-0.5">Update your display information and workspace handle</p>
            </div>

            <div className="flex items-center gap-4 py-2">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&crop=face"
                alt="Jeel"
                className="w-16 h-16 rounded-full border-2 border-indigo-500/40"
              />
              <div>
                <button
                  type="button"
                  onClick={() => handleSave('Avatar')}
                  className="px-3 py-1.5 rounded-lg bg-[#080B12] hover:bg-slate-800 border border-[#1E2633] text-xs font-semibold text-slate-200 transition-colors"
                >
                  Change Avatar
                </button>
                <div className="text-[11px] text-slate-500 mt-1">JPG, GIF or PNG. Max size of 2MB</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Role Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-[#1E2633] flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Security Credentials & Tokens</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage ingestion API tokens and multi-factor authentication</p>
            </div>

            {/* API Keys List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Active Ingest Keys</span>
                <button
                  onClick={handleGenerateKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate New Key</span>
                </button>
              </div>

              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-3.5 rounded-lg bg-[#080B12] border border-[#1E2633] flex items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 font-sans">{key.name}</div>
                      <div className="text-slate-400 mt-0.5 text-[11px]">{key.key}</div>
                      <div className="text-[10px] text-slate-500 font-sans mt-1">
                        Created {key.created} • Last active: {key.lastUsed}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(key.key);
                          addToast({ title: 'Copied', message: 'API Key copied to clipboard', type: 'info' });
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 rounded"
                        title="Copy Key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2FA Toggle */}
            <div className="pt-4 border-t border-[#1E2633] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Two-Factor Authentication (2FA)</div>
                <div className="text-xs text-slate-400 mt-0.5">Require TOTP authenticator token on login</div>
              </div>
              <button
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  handleSave('2FA');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  twoFactorEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    twoFactorEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave('Notifications');
            }}
            className="space-y-5"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Incident Alert Channels</h3>
              <p className="text-xs text-slate-400 mt-0.5">Dispatch automated alerts when API error rate or latency breaches SLA</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Slack Incoming Webhook URL</label>
              <input
                type="text"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">PagerDuty Integration Routing Key</label>
              <input
                type="text"
                value={pagerDutyKey}
                onChange={(e) => setPagerDutyKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-3 pt-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded border-[#1E2633] bg-[#080B12] text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-300">Send email digests on incident creation and mitigation</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalSms}
                  onChange={(e) => setCriticalSms(e.target.checked)}
                  className="rounded border-[#1E2633] bg-[#080B12] text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-300">Enable high-priority SMS escalation for Critical (P0) incidents</span>
              </label>
            </div>

            <div className="pt-4 border-t border-[#1E2633] flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
              >
                Save Notification Preferences
              </button>
            </div>
          </form>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave('Monitoring Thresholds');
            }}
            className="space-y-5"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Telemetry & Anomaly Sensitivity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tune automated statistical anomaly detection parameters</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Default Telemetry Probe Interval
                </label>
                <select
                  value={defaultInterval}
                  onChange={(e) => setDefaultInterval(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="15s">15 seconds (High Frequency)</option>
                  <option value="30s">30 seconds (Recommended)</option>
                  <option value="60s">60 seconds (Standard)</option>
                  <option value="5m">5 minutes (Economy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Global P95 SLA Threshold (ms)
                </label>
                <input
                  type="number"
                  value={latencyThresholdMs}
                  onChange={(e) => setLatencyThresholdMs(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B12] border border-[#1E2633] text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Error Rate Anomaly Ceiling (%): <span className="font-mono text-indigo-400 font-bold">{errorRateThresholdPct}%</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={errorRateThresholdPct}
                onChange={(e) => setErrorRateThresholdPct(e.target.value)}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>0.5% (Strict)</span>
                <span>2.5% (Default)</span>
                <span>10.0% (Relaxed)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1E2633] flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
              >
                Apply Monitoring Rules
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
