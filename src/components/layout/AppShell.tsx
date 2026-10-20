import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';
import { AppRoute } from '../../types';
import { AuthUser } from '../../auth/authTypes';
import { ProfileModal } from '../profile/ProfileModal';
import { DemoScenarioModal } from '../demo/DemoScenarioModal';
import { useAuth } from '../../auth/AuthContext';

interface AppShellProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  user: AuthUser;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onRouteChange,
  user,
  onLogout,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const { quickSwitchRole } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Desktop Sidebar (hidden on mobile/tablet screens < lg) */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar
          currentRoute={currentRoute}
          onRouteChange={onRouteChange}
          user={user}
          onLogout={onLogout}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenDemoGuide={() => setIsDemoModalOpen(true)}
        />
      </div>

      {/* Mobile drawer navigation */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        user={user}
        onLogout={onLogout}
        onOpenProfile={() => {
          setIsMobileMenuOpen(false);
          setIsProfileModalOpen(true);
        }}
        onOpenDemoGuide={() => {
          setIsMobileMenuOpen(false);
          setIsDemoModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          currentRoute={currentRoute}
          user={user}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={onRouteChange}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenDemoGuide={() => setIsDemoModalOpen(true)}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-y-auto bg-slate-900/50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSwitchRole={async (role) => {
          await quickSwitchRole(role);
          onRouteChange('dashboard');
        }}
      />

      {/* SIH 2026 Demonstration Suite & Flagship Scenario Modal */}
      <DemoScenarioModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onNavigate={(route) => onRouteChange(route as AppRoute)}
        onResetComplete={() => {
          // Force soft re-render or notification
          if (currentRoute === 'ai-analysis' || currentRoute === 'dashboard') {
            onRouteChange(currentRoute);
          }
        }}
      />
    </div>
  );
};
