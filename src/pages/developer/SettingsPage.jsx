import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useFaultLens } from '../../context/FaultLensContext';
import api from '../../services/api';
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

const PRESET_AVATARS = [
  {
    id: 'avatar-nexus',
    name: 'Nexus Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nexus&backgroundColor=1e1b4b'
  },
  {
    id: 'avatar-circuit',
    name: 'Circuit SRE',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Circuit&backgroundColor=064e3b'
  },
  {
    id: 'avatar-glitch',
    name: 'Glitch Ops',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Glitch&backgroundColor=831843'
  },
  {
    id: 'avatar-vortex',
    name: 'Vortex Dev',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Vortex&backgroundColor=1e293b'
  },
  {
    id: 'avatar-byte',
    name: 'Cyber Byte',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber&backgroundColor=312e81'
  },
  {
    id: 'avatar-quantum',
    name: 'Quantum Core',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Quantum&backgroundColor=0f172a'
  }
];

export const SettingsPage = () => {
  const { addToast } = useToast();
  const { currentUser, setCurrentUser } = useFaultLens();
  const [activeTab, setActiveTab] = useState('profile'); // profile | security | notifications | monitoring

  // Profile state
  const [name, setName] = useState(currentUser?.name || 'Developer');
  const [email, setEmail] = useState(currentUser?.email || 'dev@faultlens.dev');
  const [role, setRole] = useState(currentUser?.role === 'ADMIN' ? 'Platform Administrator' : 'Senior Backend Engineer');

  const getInitialAvatar = () => {
    const saved = currentUser?.photoURL || currentUser?.avatar || localStorage.getItem('faultlens_avatar');
    if (saved && !saved.includes('unsplash.com')) {
      return saved;
    }
    return PRESET_AVATARS[0].url;
  };

  const [avatar, setAvatar] = useState(getInitialAvatar);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.role) setRole(currentUser.role === 'ADMIN' ? 'Platform Administrator' : 'Senior Backend Engineer');
      const userPic = currentUser.photoURL || currentUser.avatar;
      if (userPic && !userPic.includes('unsplash.com')) {
        setAvatar(userPic);
      }
    }
  }, [currentUser]);

  // Security state - API keys loaded from backend
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadApiKeys() {
      setIsLoadingKeys(true);
      try {
        const res = await api.get('/api-keys');
        if (isMounted && res && Array.isArray(res)) {
          setApiKeys(res);
        }
      } catch (err) {
        console.error('Failed to load API keys:', err);
      } finally {
        if (isMounted) setIsLoadingKeys(false);
      }
    }

    loadApiKeys();
    return () => {
      isMounted = false;
    };
  }, []);

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
    if (section === 'Profile' || section === 'Avatar') {
      localStorage.setItem('faultlens_avatar', avatar);
      if (setCurrentUser) {
        setCurrentUser((prev) => ({
          ...(prev || {}),
          name,
          photoURL: avatar,
          avatar: avatar
        }));
      }
    }
    addToast({
      title: 'Settings Saved',
      message: `${section} preferences updated successfully`,
      type: 'success'
    });
  };

  const handleGenerateKey = async () => {
    const keyName = window.prompt('Enter a name for this API Key:', 'Production Telemetry Key');
    if (!keyName) return;

    try {
      const res = await api.post('/api-keys', { name: keyName });
      if (res) {
        const newKey = {
          id: res.id,
          name: res.name,
          key: res.rawKey || res.keyPrefix,
          created: 'Just now',
          lastUsed: 'Never'
        };
        setApiKeys((prev) => [newKey, ...prev]);
        addToast({
          title: 'API Key Generated',
          message: 'New secret key provisioned successfully',
          type: 'success'
        });
      }
    } catch (err) {
      addToast({
        title: 'Error Generating Key',
        message: err.message || 'Failed to create API key',
        type: 'error'
      });
    }
  };

  const handleDeleteKey = async (id) => {
    try {
      await api.delete(`/api-keys/${id}`);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      addToast({
        title: 'API Key Revoked',
        message: 'Revoked key credentials',
        type: 'info'
      });
    } catch (err) {
      addToast({
        title: 'Error Revoking Key',
        message: err.message || 'Failed to revoke API key',
        type: 'error'
      });
    }
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

            {/* Avatar Selector Section */}
            <div className="p-4 rounded-xl bg-[#080B12] border border-[#1E2633] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2633]/60">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={avatar}
                      alt="Active Avatar"
                      className="w-14 h-14 rounded-full border-2 border-indigo-500 shadow-md shadow-indigo-500/20 object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#080B12]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                      <span>Selected Avatar</span>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Active Profile
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Pick any of the 6 avatars below to customize your team presence
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Avatar Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  Choose Avatar Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {PRESET_AVATARS.map((item) => {
                    const isSelected = avatar === item.url;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setAvatar(item.url);
                          localStorage.setItem('faultlens_avatar', item.url);
                          if (setCurrentUser) {
                            setCurrentUser((prev) => ({
                              ...(prev || {}),
                              photoURL: item.url,
                              avatar: item.url
                            }));
                          }
                          addToast({
                            title: 'Avatar Selected',
                            message: `${item.name} set as profile picture`,
                            type: 'success'
                          });
                        }}
                        className={`group relative flex flex-col items-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/40 shadow-sm'
                            : 'bg-[#0F141D] border-[#1E2633] hover:border-slate-600 hover:bg-[#151D2A]'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-12 h-12 rounded-full object-cover border border-[#1E2633] group-hover:scale-105 transition-transform"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-[#0F141D] flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-slate-300 mt-1.5 truncate max-w-full text-center">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
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

            {/* Email Address - View Only (Cannot be changed) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Email Address <span className="text-[11px] text-slate-500 font-normal ml-1">(View only)</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-[#080B12] px-2 py-0.5 rounded border border-[#1E2633]">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Locked
                </span>
              </div>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B12]/60 border border-[#1E2633] text-sm text-slate-400 cursor-not-allowed select-none font-mono focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Email address is bound to your account and cannot be modified.
              </p>
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
                {apiKeys.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-slate-500 border border-[#1E2633] rounded-lg bg-[#080B12]">
                    {isLoadingKeys ? 'Loading API keys...' : 'No active ingest keys provisioned yet. Click "Generate New Key" to create one.'}
                  </div>
                ) : (
                  apiKeys.map((key) => (
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
                  ))
                )}
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
