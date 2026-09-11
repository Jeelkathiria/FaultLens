import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialWebsites } from '../data/websites';
import { initialApis } from '../data/apis';
import { initialIncidents } from '../data/incidents';
import { initialDeployments } from '../data/deployments';
import { initialLogs } from '../data/logs';
import { initialUsers, initialAdminStats } from '../data/users';
import { useToast } from './ToastContext';

const FaultLensContext = createContext(null);

export const FaultLensProvider = ({ children }) => {
  const { addToast } = useToast();

  // Role state: 'developer' | 'admin'
  const [role, setRole] = useState('developer');

  // Core entities
  const [websites, setWebsites] = useState(initialWebsites);
  const [apis, setApis] = useState(initialApis);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [deployments, setDeployments] = useState(initialDeployments);
  const [logs, setLogs] = useState(initialLogs);
  const [users, setUsers] = useState(initialUsers);
  const [adminStats, setAdminStats] = useState(initialAdminStats);

  // Live simulation toggle
  const [isLiveSimulation, setIsLiveSimulation] = useState(false);

  // Helper: toggle user role for demo
  const switchRole = useCallback((newRole) => {
    setRole(newRole);
    addToast({
      title: `Switched to ${newRole === 'admin' ? 'Admin' : 'Developer'} View`,
      message: newRole === 'admin' ? 'Viewing multi-tenant platform and system health' : 'Viewing application and API observability',
      type: 'info'
    });
  }, [addToast]);

  // Action: Add Website
  const addWebsite = useCallback((websiteData) => {
    const newId = `w-${Date.now().toString(36)}`;
    const newWebsite = {
      id: newId,
      name: websiteData.name,
      url: websiteData.url.startsWith('http') ? websiteData.url : `https://${websiteData.url}`,
      displayUrl: websiteData.url.replace(/^https?:\/\//, ''),
      environment: websiteData.environment || 'Production',
      health: 'healthy',
      uptime: 100.00,
      apiCount: 0,
      totalRequests24h: 0,
      activeIncidents: 0,
      lastChecked: 'Just now',
      description: websiteData.description || 'Newly registered application monitor',
      createdDate: new Date().toISOString().split('T')[0],
      uptimeHistory: Array(90).fill(1)
    };

    setWebsites(prev => [newWebsite, ...prev]);
    setAdminStats(prev => ({
      ...prev,
      websitesCount: prev.websitesCount + 1
    }));

    addToast({
      title: 'Website Added',
      message: `${newWebsite.name} is now configured for active monitoring`,
      type: 'success'
    });

    return newWebsite;
  }, [addToast]);

  // Action: Add API to Website
  const addApi = useCallback((websiteId, apiData) => {
    const newApiId = `api-${Date.now().toString(36)}`;
    const newApi = {
      id: newApiId,
      websiteId,
      name: apiData.name,
      endpoint: apiData.endpoint.startsWith('/') ? apiData.endpoint : `/${apiData.endpoint}`,
      method: apiData.method || 'GET',
      status: 'healthy',
      uptime: 100.00,
      p95Latency: 95,
      p50Latency: 35,
      p99Latency: 140,
      errorRate: 0.0,
      requestsCount: 1,
      monitoringInterval: apiData.monitoringInterval || '60s',
      healthCheckEndpoint: apiData.healthCheckEndpoint || `${apiData.endpoint}/health`,
      lastChecked: 'Just now',
      correlatedIncidentId: null,
      endpointsTable: [
        {
          endpoint: `${apiData.method || 'GET'} ${apiData.endpoint}`,
          requests: 1,
          errorRate: '0.0%',
          p95: '95ms',
          status: 200
        }
      ]
    };

    setApis(prev => [...prev, newApi]);
    
    // Increment API count on website
    setWebsites(prev => prev.map(w => {
      if (w.id === websiteId) {
        return { ...w, apiCount: w.apiCount + 1 };
      }
      return w;
    }));

    setAdminStats(prev => ({
      ...prev,
      apisCount: prev.apisCount + 1
    }));

    addToast({
      title: 'API Monitor Registered',
      message: `${newApi.method} ${newApi.endpoint} is now live with interval ${newApi.monitoringInterval}`,
      type: 'success'
    });

    return newApi;
  }, [addToast]);

  // Action: Update Incident Status
  // Progression: detected -> investigating -> mitigated -> resolved
  const updateIncidentStatus = useCallback((incidentId, newStatus) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const updated = {
          ...inc,
          status: newStatus,
          severity: newStatus === 'resolved' ? 'resolved' : inc.severity,
          activityLog: [
            ...inc.activityLog,
            {
              user: 'Jeel (Developer)',
              action: `Status updated to ${newStatus.toUpperCase()}`,
              time: timeNow
            }
          ]
        };
        return updated;
      }
      return inc;
    }));

    // If resolved, update API & Website status
    if (newStatus === 'resolved') {
      const inc = incidents.find(i => i.id === incidentId);
      if (inc) {
        setApis(prev => prev.map(a => {
          if (a.id === inc.apiId) {
            return { ...a, status: 'healthy', errorRate: 0.2, p95Latency: 140 };
          }
          return a;
        }));
        setWebsites(prev => prev.map(w => {
          if (w.id === inc.websiteId) {
            return { ...w, health: 'healthy', activeIncidents: Math.max(0, w.activeIncidents - 1) };
          }
          return w;
        }));
      }
    }

    addToast({
      title: 'Incident Status Updated',
      message: `Incident ${incidentId} marked as ${newStatus.toUpperCase()}`,
      type: newStatus === 'resolved' ? 'success' : 'info'
    });
  }, [incidents, addToast]);

  // Action: Toggle Admin User
  const toggleUserStatus = useCallback((userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Disabled' : 'Active';
        addToast({
          title: `User ${nextStatus}`,
          message: `${u.name} is now ${nextStatus.toLowerCase()}`,
          type: nextStatus === 'Active' ? 'success' : 'warning'
        });
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  }, [addToast]);

  // Action: Trigger Anomaly Simulation Demo
  const triggerAnomalyDemo = useCallback(() => {
    addToast({
      title: 'Simulating Anomaly Progression',
      message: 'Payment API is transitioning: Healthy -> Degraded -> Critical',
      type: 'warning'
    });

    // Step 1: Degraded
    setTimeout(() => {
      setApis(prev => prev.map(a => a.id === 'api-payment' ? { ...a, status: 'degraded', errorRate: 5.4, p95Latency: 840 } : a));
      addToast({
        title: '⚠️ Latency Warning',
        message: 'Payment API P95 latency increased to 840ms',
        type: 'warning'
      });
    }, 1500);

    // Step 2: Critical & Incident Created
    setTimeout(() => {
      setApis(prev => prev.map(a => a.id === 'api-payment' ? { ...a, status: 'critical', errorRate: 17.8, p95Latency: 2800 } : a));
      setWebsites(prev => prev.map(w => w.id === 'w-ecommerce' ? { ...w, health: 'critical', activeIncidents: 1 } : w));
      addToast({
        title: '🚨 Incident #1042 Triggered',
        message: 'Payment API error rate spiked to 17.8% correlated with Deployment v1.8',
        type: 'critical'
      });
    }, 3500);
  }, [addToast]);

  // Live Simulation Engine Effect: slight periodic telemetry updates
  useEffect(() => {
    if (!isLiveSimulation) return;

    const interval = setInterval(() => {
      // 1. Subtle jitter to request counts & latencies
      setApis(prev => prev.map(api => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return {
          ...api,
          requestsCount: Math.max(10, api.requestsCount + Math.floor(Math.random() * 8) + 1),
          p95Latency: Math.max(40, api.p95Latency + delta)
        };
      }));

      // 2. Add realistic live HTTP log entry
      const sampleEndpoints = [
        { method: 'POST', endpoint: '/api/payment', status: Math.random() > 0.3 ? 500 : 200, website: 'w-ecommerce', api: 'api-payment' },
        { method: 'GET', endpoint: '/api/orders', status: 200, website: 'w-ecommerce', api: 'api-orders' },
        { method: 'POST', endpoint: '/api/login', status: 200, website: 'w-ecommerce', api: 'api-login' },
        { method: 'GET', endpoint: '/api/v1/restaurants', status: 200, website: 'w-foodapp', api: 'api-restaurants' },
        { method: 'GET', endpoint: '/api/v2/ledger', status: 200, website: 'w-fintech', api: 'api-ledger' }
      ];
      const randomEp = sampleEndpoints[Math.floor(Math.random() * sampleEndpoints.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const isError = randomEp.status >= 500;

      const newLog = {
        id: `log-live-${Date.now()}`,
        timestamp: timeStr,
        fullTimestamp: now.toISOString(),
        method: randomEp.method,
        endpoint: randomEp.endpoint,
        statusCode: randomEp.status,
        latency: isError ? Math.floor(1600 + Math.random() * 800) : Math.floor(80 + Math.random() * 160),
        severity: isError ? 'error' : 'info',
        websiteId: randomEp.website,
        websiteName: randomEp.website === 'w-ecommerce' ? 'My E-Commerce' : 'Food Delivery',
        apiId: randomEp.api,
        apiName: randomEp.api === 'api-payment' ? 'Payment API' : 'Orders API',
        ip: `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 250)}`,
        userAgent: 'FaultLens-Telemetry/1.0',
        message: isError ? 'Upstream gateway error during request execution' : 'Request fulfilled successfully',
        headers: { 'X-Live-Ingest': 'true' },
        payload: { sample: true }
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]); // keep latest 50
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveSimulation]);

  return (
    <FaultLensContext.Provider
      value={{
        role,
        switchRole,
        websites,
        apis,
        incidents,
        deployments,
        logs,
        users,
        adminStats,
        addWebsite,
        addApi,
        updateIncidentStatus,
        toggleUserStatus,
        isLiveSimulation,
        toggleLiveSimulation: () => {
          setIsLiveSimulation(prev => {
            const next = !prev;
            addToast({
              title: next ? 'Live Simulation Active ●' : 'Live Simulation Paused',
              message: next ? 'Simulating real-time telemetry events and live logs' : 'Paused live metric stream',
              type: next ? 'success' : 'info'
            });
            return next;
          });
        },
        triggerAnomalyDemo
      }}
    >
      {children}
    </FaultLensContext.Provider>
  );
};

export const useFaultLens = () => {
  const context = useContext(FaultLensContext);
  if (!context) {
    throw new Error('useFaultLens must be used within a FaultLensProvider');
  }
  return context;
};
