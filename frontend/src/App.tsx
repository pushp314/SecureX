import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { IncidentsView } from './components/IncidentsView';
import { InvestigationWorkspaceView } from './components/InvestigationWorkspaceView';
import { ThreatHuntingView } from './components/ThreatHuntingView';
import { IdentityITDRView } from './components/IdentityITDRView';
import { ComplianceView } from './components/ComplianceView';
import { CloudPostureView } from './components/CloudPostureView';
import { MalwareSandboxView } from './components/MalwareSandboxView';
import { NetworkMonitorView } from './components/NetworkMonitorView';
import { DevSecOpsView } from './components/DevSecOpsView';
import { VulnerabilityScannerView } from './components/VulnerabilityScannerView';
import { RuleStudioView } from './components/RuleStudioView';
import { TelemetryExplorerView } from './components/TelemetryExplorerView';
import { SiemQueryConsoleView } from './components/SiemQueryConsoleView';
import { ThreatIntelView } from './components/ThreatIntelView';
import { UniversalLogParsersView } from './components/UniversalLogParsersView';
import { UebaAnalyticsView } from './components/UebaAnalyticsView';
import { GeoThreatRadarView } from './components/GeoThreatRadarView';
import { DataRetentionView } from './components/DataRetentionView';
import { SigmaCompilerView } from './components/SigmaCompilerView';
import { BreachSimulationView } from './components/BreachSimulationView';
import { BlastRadiusView } from './components/BlastRadiusView';
import { NoiseCancellationView } from './components/NoiseCancellationView';
import { SimulationModal } from './components/SimulationModal';
import { WebhookModal } from './components/WebhookModal';
import { AuditKeysModal } from './components/AuditKeysModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { api } from './services/api';
import { getSocket } from './services/socket';
import { Incident, Alert, TelemetryEvent, TelemetryStats, AuthUser } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isWebhookOpen, setIsWebhookOpen] = useState<boolean>(false);
  const [isAuditKeysOpen, setIsAuditKeysOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [liveEventCount, setLiveEventCount] = useState<number>(0);

  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentEvents, setRecentEvents] = useState<TelemetryEvent[]>([]);

  // Check initial session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.getProfile();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  // Global Keydown (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Socket & Live Telemetry listener
  useEffect(() => {
    if (!currentUser) return;

    refreshAllData();

    const socket = getSocket();

    socket.on('connect', () => {
      setIsWsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsWsConnected(false);
    });

    socket.on('telemetry:event', (event: TelemetryEvent) => {
      setLiveEventCount((prev) => prev + 1);
      setRecentEvents((prev) => [event, ...prev.slice(0, 49)]);
    });

    socket.on('detection:alert', (newAlert: Alert) => {
      setAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);
      refreshStatsAndIncidents();
    });

    socket.on('incident:update', (_updatedIncident: Incident) => {
      refreshStatsAndIncidents();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry:event');
      socket.off('detection:alert');
      socket.off('incident:update');
    };
  }, [currentUser]);

  const refreshAllData = async () => {
    try {
      const [s, inc, alt, evts] = await Promise.all([
        api.getStats().catch(() => null),
        api.getIncidents().catch(() => []),
        api.getAlerts().catch(() => []),
        api.getEvents(50).catch(() => []),
      ]);
      if (s) setStats(s);
      setIncidents(inc);
      setAlerts(alt);
      setRecentEvents(evts);
    } catch (err) {
      console.error('Error refreshing SecureX data:', err);
    }
  };

  const refreshStatsAndIncidents = async () => {
    try {
      const [s, inc] = await Promise.all([
        api.getStats().catch(() => null),
        api.getIncidents().catch(() => []),
      ]);
      if (s) setStats(s);
      setIncidents(inc);
    } catch (err) {
      console.error('Error refreshing incidents:', err);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
    setCurrentTab('investigation');
  };

  const handleUpdateIncidentStatus = async (id: string, status: string) => {
    try {
      await api.updateIncidentStatus(id, status);
      refreshStatsAndIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-cyan-400 tracking-wider">Verifying SecureX Session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex">
      {/* Sleek Vertical Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        openSimulator={() => setIsSimulatorOpen(true)}
        openWebhooks={() => setIsWebhookOpen(true)}
        openAuditKeys={() => setIsAuditKeysOpen(true)}
        openDiagnostics={() => setIsDiagnosticsOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isWsConnected={isWsConnected}
        liveEventCount={liveEventCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar">
        {/* Top Header Bar with Breadcrumb & Search */}
        <TopHeader
          currentTab={currentTab}
          openCommandPalette={() => setIsCommandPaletteOpen(true)}
          openSimulator={() => setIsSimulatorOpen(true)}
          isWsConnected={isWsConnected}
          liveEventCount={liveEventCount}
        />

        {/* Dynamic View Component */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              incidents={incidents}
              alerts={alerts}
              recentEvents={recentEvents}
              onSelectIncident={handleSelectIncident}
              onOpenSimulator={() => setIsSimulatorOpen(true)}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onUpdateStatus={handleUpdateIncidentStatus}
            />
          )}

          {currentTab === 'investigation' && (
            <InvestigationWorkspaceView
              incidentId={selectedIncidentId}
              onBackToIncidents={() => setCurrentTab('incidents')}
              onSelectIncident={setSelectedIncidentId}
              incidents={incidents}
            />
          )}

          {currentTab === 'hunting' && <ThreatHuntingView />}

          {currentTab === 'itdr' && <IdentityITDRView />}

          {currentTab === 'compliance' && <ComplianceView />}

          {currentTab === 'cloud' && <CloudPostureView />}

          {currentTab === 'sandbox' && <MalwareSandboxView />}

          {currentTab === 'network' && <NetworkMonitorView />}

          {currentTab === 'devsecops' && <DevSecOpsView />}

          {currentTab === 'siem_query' && <SiemQueryConsoleView />}

          {currentTab === 'threat_intel' && <ThreatIntelView />}

          {currentTab === 'ueba' && <UebaAnalyticsView />}

          {currentTab === 'geo_radar' && <GeoThreatRadarView />}

          {currentTab === 'parsers' && <UniversalLogParsersView />}

          {currentTab === 'retention' && <DataRetentionView />}

          {currentTab === 'vulnerabilities' && <VulnerabilityScannerView />}

          {currentTab === 'rules' && <RuleStudioView />}

          {currentTab === 'explorer' && <TelemetryExplorerView />}

          {currentTab === 'sigma' && <SigmaCompilerView />}

          {currentTab === 'bas' && <BreachSimulationView />}

          {currentTab === 'blast_radius' && <BlastRadiusView />}

          {currentTab === 'noise_cancel' && <NoiseCancellationView />}
        </main>
      </div>

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentTab}
        onSelectIncident={handleSelectIncident}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        incidents={incidents}
      />

      {/* Attack Simulation Modal */}
      <SimulationModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulationTriggered={() => {
          setTimeout(refreshAllData, 500);
        }}
      />

      {/* Webhook Modal */}
      <WebhookModal
        isOpen={isWebhookOpen}
        onClose={() => setIsWebhookOpen(false)}
      />

      {/* Audit & API Keys Modal */}
      <AuditKeysModal
        isOpen={isAuditKeysOpen}
        onClose={() => setIsAuditKeysOpen(false)}
      />

      {/* Observability & Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
};

export default App;
