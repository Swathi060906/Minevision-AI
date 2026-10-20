import React from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { AppRoute } from '../../types';
import { AuthUser } from '../../auth/authTypes';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  user: AuthUser;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onOpenDemoGuide?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  currentRoute,
  onRouteChange,
  user,
  onLogout,
  onOpenProfile,
  onOpenDemoGuide,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative flex w-72 max-w-xs flex-1 flex-col bg-slate-950 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div className="absolute right-2 top-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Sidebar
          currentRoute={currentRoute}
          onRouteChange={onRouteChange}
          user={user}
          onLogout={onLogout}
          onOpenProfile={onOpenProfile}
          onOpenDemoGuide={onOpenDemoGuide}
          onCloseMobile={onClose}
        />
      </div>
    </div>
  );
};
