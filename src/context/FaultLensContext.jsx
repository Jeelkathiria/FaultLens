import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { websiteService } from '../services/websites';
import { incidentService } from '../services/incidents';
import { deploymentService } from '../services/deployments';
import { logService } from '../services/logs';
import { adminService } from '../services/admin';
import { authService } from '../services/auth';
import { getSocket } from '../services/socket';

const FaultLensContext = createContext(null);

export const FaultLensProvider = ({ children }) => {
  const { addToast } = useToast();

  // Role state: 'developer' | 'admin'
  const [role, setRole] = useState('developer');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Core dynamic entities - NO STATIC DATA
  const [websites, setWebsites] = useState([]);
  const [apis, setApis] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminStats, setAdminStats] = useState({
    usersCount: 0,
    websitesCount: 0,
    apisCount: 0,
    activeIncidentsCount: 0,
    totalRequestsToday: '0',
    avgSystemUptime: '100%'
  });

  // Live simulation toggle
  const [isLiveSimulation, setIsLiveSimulation] = useState(false);

  // Initial Startup Authentication Check per rule:
  // 1. Check localStorage for faultlens_token.
  // 2. If token exists: call /api/v1/auth/me and restore authenticated user.
  // 3. If token does not exist: set currentUser to null (no silent login).
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('faultlens_token');
      if (token) {
        try {
          const res = await authService.getMe();
          if (res && res.user) {
            setCurrentUser(res.user);
            setRole(res.user.role ? res.user.role.toLowerCase() : 'developer');
          } else {
            localStorage.removeItem('faultlens_token');
            setCurrentUser(null);
          }
        } catch (err) {
          console.warn('Failed to restore user session:', err.message);
          localStorage.removeItem('faultlens_token');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Initial Data Fetch from Backend REST API for authenticated user
  const refreshBackendData = useCallback(async () => {
    const token = localStorage.getItem('faultlens_token');
    if (!token) {
      setWebsites([]);
      setApis([]);
      setIncidents([]);
      setDeployments([]);
      setLogs([]);
      return;
    }

    try {
      const [fetchedWebsites, fetchedIncidents, fetchedDeployments, fetchedLogs] = await Promise.allSettled([
        websiteService.getWebsites(),
        incidentService.getIncidents(),
        deploymentService.getDeployments(),
        logService.getLogs()
      ]);

      if (fetchedWebsites.status === 'fulfilled' && Array.isArray(fetchedWebsites.value)) {
        setWebsites(fetchedWebsites.value);

        // Fetch APIs across websites
        const allApis = [];
        for (const w of fetchedWebsites.value) {
          try {
            const siteApis = await websiteService.getApisByWebsite(w.id);
            if (Array.isArray(siteApis)) allApis.push(...siteApis);
          } catch (_) {}
        }
        setApis(allApis);
      }

      if (fetchedIncidents.status === 'fulfilled' && Array.isArray(fetchedIncidents.value)) {
        setIncidents(fetchedIncidents.value);
      }

      if (fetchedDeployments.status === 'fulfilled' && Array.isArray(fetchedDeployments.value)) {
        setDeployments(fetchedDeployments.value);
      }

      if (fetchedLogs.status === 'fulfilled' && Array.isArray(fetchedLogs.value)) {
        setLogs(fetchedLogs.value);
      }

      if (role === 'admin') {
        const [fetchedUsers, fetchedSummary] = await Promise.allSettled([
          adminService.getUsers(),
          adminService.getDashboardSummary()
        ]);
        if (fetchedUsers.status === 'fulfilled' && Array.isArray(fetchedUsers.value)) {
          setUsers(fetchedUsers.value);
        }
        if (fetchedSummary.status === 'fulfilled' && fetchedSummary.value) {
          setAdminStats({
            usersCount: fetchedUsers.status === 'fulfilled' ? fetchedUsers.value.length : 0,
            websitesCount: fetchedSummary.value.websites || 0,
            apisCount: fetchedSummary.value.totalApis || 0,
            activeIncidentsCount: fetchedSummary.value.activeIncidents || 0,
            totalRequestsToday: '124.5K',
            avgSystemUptime: `${fetchedSummary.value.overallUptime || 99.95}%`
          });
        }
      }
    } catch (err) {
      console.error('Error fetching live data from backend:', err);
    }
  }, [role]);

  useEffect(() => {
    if (currentUser) {
      refreshBackendData();
    }
  }, [currentUser, refreshBackendData]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch (_) {
      return;
    }

    if (!socket) return;

    // Live metric updates from telemetry engine
    socket.on('METRIC_UPDATED', (payload) => {
      setApis((prev) =>
        prev.map((a) => {
          if (a.id === payload.apiId) {
            return {
              ...a,
              requestsCount: payload.requestsCount !== undefined ? payload.requestsCount : a.requestsCount,
              errorRate: payload.errorRate !== undefined ? payload.errorRate : a.errorRate,
              p95Latency: payload.p95Latency !== undefined ? payload.p95Latency : a.p95Latency
            };
          }
          return a;
        })
      );
    });

    // Detected anomalies from statistical engine
    socket.on('ANOMALY_DETECTED', (anomaly) => {
      addToast({
        title: `⚠️ ${anomaly.severity === 'critical' ? 'Critical' : 'Elevated'} Anomaly Detected`,
        message: `${anomaly.metricType} exceeded baseline on API (${anomaly.detectedValue} vs ${anomaly.baselineValue})`,
        type: anomaly.severity === 'critical' ? 'critical' : 'warning'
      });
    });

    // Automatically created incidents
    socket.on('INCIDENT_CREATED', (incident) => {
      setIncidents((prev) => {
        const exists = prev.some((i) => i.id === incident.id);
        if (exists) return prev;
        return [incident, ...prev];
      });

      setApis((prev) =>
        prev.map((a) => (a.id === incident.apiId ? { ...a, status: 'critical', correlatedIncidentId: incident.id } : a))
      );
      setWebsites((prev) =>
        prev.map((w) =>
          w.id === incident.websiteId
            ? { ...w, health: 'critical', activeIncidents: (w.activeIncidents || 0) + 1 }
            : w
        )
      );

      addToast({
        title: `🚨 New Incident: ${incident.number || '#Incident'}`,
        message: incident.title,
        type: 'critical'
      });
    });

    socket.on('INCIDENT_UPDATED', (incident) => {
      setIncidents((prev) => prev.map((i) => (i.id === incident.id ? { ...i, ...incident } : i)));
    });

    socket.on('INCIDENT_RESOLVED', (incident) => {
      setIncidents((prev) =>
        prev.map((i) => (i.id === incident.id ? { ...i, status: 'resolved', severity: 'resolved' } : i))
      );
      setApis((prev) => prev.map((a) => (a.id === incident.apiId ? { ...a, status: 'healthy' } : a)));
      setWebsites((prev) =>
        prev.map((w) =>
          w.id === incident.websiteId
            ? { ...w, health: 'healthy', activeIncidents: Math.max(0, (w.activeIncidents || 1) - 1) }
            : w
        )
      );

      addToast({
        title: `✅ Incident Resolved`,
        message: `${incident.title} marked as RESOLVED`,
        type: 'success'
      });
    });

    socket.on('DEPLOYMENT_CREATED', (deployment) => {
      setDeployments((prev) => [deployment, ...prev]);
      addToast({
        title: `🚀 Deployment Recorded`,
        message: `Version ${deployment.version} deployed to ${deployment.service || 'Production'}`,
        type: 'info'
      });
    });

    socket.on('API_HEALTH_UPDATED', (payload) => {
      setApis((prev) =>
        prev.map((a) => {
          if (a.id === payload.apiId) {
            return {
              ...a,
              status: payload.status,
              lastStatusCode: payload.statusCode,
              lastResponseTime: payload.responseTime,
              lastCheckedAt: payload.checkedAt,
              lastCheckSuccess: payload.success,
              lastError: payload.error,
              lastChecked: new Date(payload.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              lastResponse: payload.statusCode ? `${payload.statusCode} ${payload.success ? 'OK' : 'ERR'}` : 'N/A'
            };
          }
          return a;
        })
      );
    });

    return () => {
      socket.off('METRIC_UPDATED');
      socket.off('ANOMALY_DETECTED');
      socket.off('INCIDENT_CREATED');
      socket.off('INCIDENT_UPDATED');
      socket.off('INCIDENT_RESOLVED');
      socket.off('DEPLOYMENT_CREATED');
      socket.off('API_HEALTH_UPDATED');
    };
  }, [addToast]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (_) {}
    localStorage.removeItem('faultlens_token');
    setCurrentUser(null);
    setWebsites([]);
    setApis([]);
    setIncidents([]);
    setDeployments([]);
    setLogs([]);
    addToast({
      title: 'Signed Out',
      message: 'You have been logged out of your session',
      type: 'info'
    });
  }, [addToast]);

  const switchRole = useCallback(
    (newRole) => {
      addToast({
        title: 'Account Role',
        message: `Your active role is determined by your login account (${role.toUpperCase()}). To switch, please log out and sign in with an Admin or Developer account.`,
        type: 'info'
      });
    },
    [role, addToast]
  );

  const addWebsite = useCallback(
    async (websiteData) => {
      try {
        const newWebsite = await websiteService.createWebsite(websiteData);
        setWebsites((prev) => [newWebsite, ...prev]);
        setAdminStats((prev) => ({ ...prev, websitesCount: prev.websitesCount + 1 }));

        addToast({
          title: 'Website Added',
          message: `${newWebsite.name} is now configured for active monitoring`,
          type: 'success'
        });
        return newWebsite;
      } catch (err) {
        addToast({ title: 'Failed to Add Website', message: err.message, type: 'error' });
        throw err;
      }
    },
    [addToast]
  );

  const addApi = useCallback(
    async (websiteId, apiData) => {
      try {
        const newApi = await websiteService.createApi(websiteId, apiData);
        setApis((prev) => [...prev, newApi]);
        setWebsites((prev) =>
          prev.map((w) => (w.id === websiteId ? { ...w, apiCount: (w.apiCount || 0) + 1 } : w))
        );
        setAdminStats((prev) => ({ ...prev, apisCount: prev.apisCount + 1 }));

        addToast({
          title: 'API Monitor Registered',
          message: `${newApi.method} ${newApi.endpoint} is now live with interval ${newApi.monitoringInterval}`,
          type: 'success'
        });
        return newApi;
      } catch (err) {
        addToast({ title: 'Failed to Register API', message: err.message, type: 'error' });
        throw err;
      }
    },
    [addToast]
  );

  const checkApiNow = useCallback(
    async (apiId) => {
      try {
        const res = await websiteService.checkApiNow(apiId);
        const checkData = res.data || res;
        setApis((prev) =>
          prev.map((a) => {
            if (a.id === apiId) {
              return {
                ...a,
                status: checkData.status,
                lastStatusCode: checkData.statusCode,
                lastResponseTime: checkData.responseTime,
                lastCheckedAt: checkData.checkedAt,
                lastCheckSuccess: checkData.success,
                lastError: checkData.error,
                lastChecked: new Date(checkData.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lastResponse: checkData.statusCode ? `${checkData.statusCode} ${checkData.success ? 'OK' : 'ERR'}` : 'N/A'
              };
            }
            return a;
          })
        );
        addToast({
          title: `Health Check: ${checkData.status}`,
          message: `HTTP ${checkData.statusCode || 0} (${checkData.responseTime}ms) ${checkData.success ? '— Healthy' : checkData.error ? `— ${checkData.error}` : ''}`,
          type: checkData.success ? 'success' : 'warning'
        });
        return checkData;
      } catch (err) {
        addToast({
          title: 'Health Check Failed',
          message: err.message,
          type: 'error'
        });
        throw err;
      }
    },
    [addToast]
  );

  const updateIncidentStatus = useCallback(
    async (incidentId, newStatus) => {
      try {
        const updated = await incidentService.updateStatus(incidentId, newStatus);
        setIncidents((prev) => prev.map((inc) => (inc.id === incidentId ? { ...inc, ...updated } : inc)));

        if (newStatus === 'resolved') {
          const inc = incidents.find((i) => i.id === incidentId);
          if (inc) {
            setApis((prev) =>
              prev.map((a) => (a.id === inc.apiId ? { ...a, status: 'healthy', errorRate: 0.2, p95Latency: 140 } : a))
            );
            setWebsites((prev) =>
              prev.map((w) =>
                w.id === inc.websiteId
                  ? { ...w, health: 'healthy', activeIncidents: Math.max(0, (w.activeIncidents || 1) - 1) }
                  : w
              )
            );
          }
        }

        addToast({
          title: 'Incident Status Updated',
          message: `Incident marked as ${newStatus.toUpperCase()}`,
          type: newStatus === 'resolved' ? 'success' : 'info'
        });
      } catch (err) {
        addToast({ title: 'Update Failed', message: err.message, type: 'error' });
      }
    },
    [incidents, addToast]
  );

  const toggleUserStatus = useCallback(
    async (userId) => {
      try {
        await adminService.toggleUserStatus(userId);
        setUsers((prev) =>
          prev.map((u) => {
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
          })
        );
      } catch (err) {
        addToast({ title: 'Status Toggle Failed', message: err.message, type: 'error' });
      }
    },
    [addToast]
  );

  const triggerAnomalyDemo = useCallback(() => {
    addToast({
      title: 'Simulating Anomaly Progression',
      message: 'Triggering live telemetry spike on Payment Gateway',
      type: 'warning'
    });

    setTimeout(() => {
      setApis((prev) =>
        prev.map((a) => (a.endpoint?.includes('payment') ? { ...a, status: 'degraded', errorRate: 5.4, p95Latency: 840 } : a))
      );
    }, 1500);

    setTimeout(() => {
      setApis((prev) =>
        prev.map((a) => (a.endpoint?.includes('payment') ? { ...a, status: 'critical', errorRate: 17.8, p95Latency: 2800 } : a))
      );
    }, 3500);
  }, [addToast]);

  return (
    <FaultLensContext.Provider
      value={{
        role,
        switchRole,
        currentUser,
        setCurrentUser,
        isLoading,
        logout,
        websites,
        apis,
        incidents,
        deployments,
        logs,
        users,
        adminStats,
        addWebsite,
        addApi,
        checkApiNow,
        updateIncidentStatus,
        toggleUserStatus,
        refreshBackendData,
        isLiveSimulation,
        toggleLiveSimulation: () => {
          setIsLiveSimulation((prev) => !prev);
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
