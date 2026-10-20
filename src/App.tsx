import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AuthLoadingScreen } from './auth/AuthLoadingScreen';
import { RoleGuard } from './auth/RoleGuard';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MinesPage } from './pages/MinesPage';
import { InspectionsPage } from './pages/InspectionsPage';
import { CompliancePage } from './pages/CompliancePage';
import { AiAnalysisPage } from './pages/AiAnalysisPage';
import { AiSafetyVisionPage } from './pages/AiSafetyVisionPage';
import { RiskIntelligencePage } from './pages/RiskIntelligencePage';
import { PredictiveIntelligencePage } from './pages/PredictiveIntelligencePage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdministrationPage } from './pages/AdministrationPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppRoute, Mine, Inspection } from './types';

const VALID_ROUTES: AppRoute[] = [
  'login',
  'dashboard',
  'mines',
  'inspections',
  'compliance',
  'ai-analysis',
  'safety-vision',
  'risk-intelligence',
  'predictive-intelligence',
  'alerts',
  'reports',
  'analytics',
  'administration',
  'settings',
];

const getCandidateFromUrl = (): string => {
  const hash = window.location.hash.replace('#/', '').replace('#', '').split('?')[0];
  const path = window.location.pathname.replace(/^\//, '').split('?')[0];
  return hash || path;
};

// Pure deterministic route resolver
const resolveTargetRoute = (candidate: string, authenticated: boolean): AppRoute => {
  if (!authenticated) {
    return 'login';
  }
  // When authenticated:
  if (!candidate || candidate === 'login') {
    return 'dashboard';
  }
  if (VALID_ROUTES.includes(candidate as AppRoute)) {
    return candidate as AppRoute;
  }
  return 'dashboard';
};

function MainAppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const candidate = getCandidateFromUrl();
    if (VALID_ROUTES.includes(candidate as AppRoute)) {
      return candidate as AppRoute;
    }
    return 'login';
  });

  const [selectedMineId, setSelectedMineId] = useState<string | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [scheduleMineId, setScheduleMineId] = useState<string | undefined>(undefined);

  // Synchronize route and browser URL with auth state changes
  useEffect(() => {
    if (isLoading) return;

    const candidate = getCandidateFromUrl();
    const resolved = resolveTargetRoute(candidate, isAuthenticated);

    if (currentRoute !== resolved) {
      setCurrentRoute(resolved);
    }

    // Keep URL hash in sync without breaking history
    const targetHash = `#/${resolved}`;
    const currentHash = window.location.hash;
    if (currentHash !== targetHash) {
      try {
        window.history.replaceState({}, '', targetHash);
      } catch {
        window.location.hash = targetHash;
      }
    }
  }, [isAuthenticated, isLoading, currentRoute]);

  // Sync state with browser back/forward buttons (popstate protection)
  useEffect(() => {
    const handlePopState = () => {
      if (isLoading) return;

      const candidate = getCandidateFromUrl();
      const resolved = resolveTargetRoute(candidate, isAuthenticated);

      setCurrentRoute(resolved);

      // If user attempted to navigate to a protected route while unauthenticated,
      // or to login while authenticated, replace history to prevent bypass via Back
      if ((!isAuthenticated && candidate !== 'login') || (isAuthenticated && candidate === 'login')) {
        try {
          window.history.replaceState({}, '', `#/${resolved}`);
        } catch {
          window.location.hash = `#/${resolved}`;
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, isLoading]);

  // Update route with history API and hash fallback
  const handleRouteChange = (
    route: AppRoute,
    params?: { mineId?: string; inspectionId?: string }
  ) => {
    // If unauthenticated, force login
    if (!isAuthenticated && route !== 'login') {
      setCurrentRoute('login');
      try {
        window.history.replaceState({}, '', '#/login');
      } catch {
        window.location.hash = '#/login';
      }
      return;
    }

    // If authenticated and route is login, redirect to dashboard
    if (isAuthenticated && route === 'login') {
      setCurrentRoute('dashboard');
      try {
        window.history.replaceState({}, '', '#/dashboard');
      } catch {
        window.location.hash = '#/dashboard';
      }
      return;
    }

    if (params?.mineId) {
      setSelectedMineId(params.mineId);
    } else if (route !== 'mines') {
      setSelectedMineId(null);
    }

    if (params?.inspectionId) {
      setSelectedInspectionId(params.inspectionId);
    } else if (route !== 'inspections' && route !== 'ai-analysis') {
      setSelectedInspectionId(null);
    }

    setCurrentRoute(route);
    try {
      window.history.pushState({}, '', `#/${route}`);
    } catch {
      window.location.hash = `#/${route}`;
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentRoute('login');
    try {
      window.history.replaceState({}, '', '#/login');
    } catch {
      window.location.hash = '#/login';
    }
  };

  // While initializing authentication session, display the official DGMS AuthLoadingScreen
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // If unauthenticated or explicit login route, render the Login page
  if (!isAuthenticated || currentRoute === 'login') {
    return (
      <Login
        onLoginSuccess={() => {
          handleRouteChange('dashboard');
        }}
      />
    );
  }

  return (
    <ProtectedRoute
      fallbackToLogin={
        <Login onLoginSuccess={() => handleRouteChange('dashboard')} />
      }
    >
      {user && (
        <AppShell
          currentRoute={currentRoute}
          onRouteChange={(route) => handleRouteChange(route)}
          user={user}
          onLogout={handleLogout}
        >
          <RoleGuard
            route={currentRoute}
            onNavigateHome={() => handleRouteChange('dashboard')}
          >
            {currentRoute === 'dashboard' && (
              <Dashboard
                onNavigate={handleRouteChange}
                onSelectMine={(mine: Mine) => {
                  setSelectedMineId(mine.id);
                  handleRouteChange('mines');
                }}
                onSelectInspection={(ins: Inspection) => {
                  setSelectedInspectionId(ins.id);
                  handleRouteChange('inspections');
                }}
              />
            )}

            {currentRoute === 'mines' && (
              <MinesPage
                selectedMineId={selectedMineId || undefined}
                onSelectMineId={(id) => setSelectedMineId(id)}
                onNavigateToInspection={(insId) => {
                  setSelectedInspectionId(insId);
                  handleRouteChange('inspections');
                }}
                onScheduleInspection={(mineId) => {
                  setScheduleMineId(mineId);
                  handleRouteChange('inspections');
                }}
              />
            )}

            {currentRoute === 'inspections' && (
              <InspectionsPage
                selectedInspectionId={selectedInspectionId || undefined}
                onSelectInspectionId={(id) => setSelectedInspectionId(id)}
                initialScheduleMineId={scheduleMineId}
                onNavigateToMine={(mineId) => {
                  setSelectedMineId(mineId);
                  handleRouteChange('mines');
                }}
                onNavigateToAiAnalysis={(insId) => {
                  setSelectedInspectionId(insId);
                  handleRouteChange('ai-analysis', { inspectionId: insId });
                }}
              />
            )}

            {currentRoute === 'compliance' && <CompliancePage />}

            {currentRoute === 'ai-analysis' && <AiAnalysisPage />}

            {currentRoute === 'safety-vision' && <AiSafetyVisionPage />}

            {currentRoute === 'risk-intelligence' && (
              <RiskIntelligencePage
                onNavigate={handleRouteChange}
                initialMineId={selectedMineId || undefined}
              />
            )}

            {currentRoute === 'predictive-intelligence' && (
              <PredictiveIntelligencePage
                onNavigate={handleRouteChange}
                initialMineId={selectedMineId || undefined}
              />
            )}

            {currentRoute === 'alerts' && <AlertsPage />}

            {currentRoute === 'reports' && <ReportsPage />}

            {currentRoute === 'analytics' && <AnalyticsPage />}

            {currentRoute === 'administration' && <AdministrationPage />}

            {currentRoute === 'settings' && <SettingsPage user={user} onLogout={handleLogout} />}
          </RoleGuard>
        </AppShell>
      )}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
