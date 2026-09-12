import React, { useState } from 'react';
import { LucideIcon, Menu, X, LogOut, Globe, MoreHorizontal } from 'lucide-react';
import { NotificationBell } from '../ui/NotificationBell';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  navItems: AdminNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onLogout: () => void;
  onBrowsePublicSite?: () => void;
  recipientId?: string;
  onNavigateNotification?: (path: string) => void;
  children: React.ReactNode;
}

/**
 * Shared chrome for every admin-tier role (Super Admin, Hospital Admin,
 * Branch Manager, Assistant) — replaces the header+sidebar shell each of
 * those dashboards previously hand-built independently, and is the one
 * place mobile nav (drawer + bottom dock) needs to be built and fixed,
 * instead of four separate patches. `navItems`/`activeId`/`onSelect` are
 * intentionally generic (not URL-route-shaped) so it works whether the
 * caller drives navigation with internal tab state (Super/Hospital/Branch
 * dashboards) or with the app's path-based router (Assistant) — the
 * caller decides what an `id` means.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  title,
  subtitle,
  navItems,
  activeId,
  onSelect,
  onLogout,
  onBrowsePublicSite,
  recipientId,
  onNavigateNotification,
  children,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const dockItems = navItems.slice(0, 4);
  const overflowItems = navItems.slice(4);

  const handleSelect = (id: string) => {
    onSelect(id);
    setDrawerOpen(false);
    setMoreOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col bg-white border-r border-ink-100 h-screen sticky top-0">
        <div className="p-6 border-b border-ink-100">
          <p className="text-[10px] uppercase tracking-widest font-black text-medical-500 mb-1">Dococlock</p>
          <h1 className="font-display font-black text-lg text-ink-800 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-ink-500 font-bold truncate mt-0.5">{subtitle}</p>}
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-ds-sm font-bold text-sm transition-all ${
                  isActive ? 'bg-medical-50 text-medical-600' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <item.icon size={20} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {!!item.badge && (
                  <span className="shrink-0 text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-lg font-black">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ink-100 space-y-2">
          {onBrowsePublicSite && (
            <button
              onClick={onBrowsePublicSite}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-medical-600 bg-medical-50 rounded-ds-sm hover:bg-medical-100 transition-colors"
            >
              <Globe size={16} /> View Website
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 rounded-ds-sm hover:bg-rose-100 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile slide-in drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[80%] max-w-[300px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-ink-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-medical-500 mb-1">Dococlock</p>
                <h1 className="font-display font-black text-lg text-ink-800">{title}</h1>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-ink-50 text-ink-400">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              {navItems.map(item => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-ds-sm font-bold text-sm transition-all ${
                      isActive ? 'bg-medical-50 text-medical-600' : 'text-ink-500 hover:bg-ink-50'
                    }`}
                  >
                    <span className="flex items-center gap-3"><item.icon size={20} />{item.label}</span>
                    {!!item.badge && <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-lg font-black">{item.badge}</span>}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-ink-100 space-y-2">
              {onBrowsePublicSite && (
                <button onClick={onBrowsePublicSite} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-medical-600 bg-medical-50 rounded-ds-sm">
                  <Globe size={16} /> View Website
                </button>
              )}
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 rounded-ds-sm">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile "More" sheet (overflow nav items beyond the bottom dock's first 4) */}
      {moreOpen && overflowItems.length > 0 && (
        <div className="lg:hidden fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1.5 bg-ink-200 rounded-full mx-auto mb-4" />
            <div className="space-y-1.5">
              {overflowItems.map(item => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-ds-sm font-bold text-sm transition-all ${
                      isActive ? 'bg-medical-50 text-medical-600' : 'text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <span className="flex items-center gap-3"><item.icon size={20} />{item.label}</span>
                    {!!item.badge && <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-lg font-black">{item.badge}</span>}
                  </button>
                );
              })}
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-ds-sm font-bold text-sm text-rose-600 hover:bg-rose-50">
                <LogOut size={20} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-ink-100 px-4 lg:px-8 h-16 flex items-center justify-between pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-ink-50 text-ink-600 shrink-0">
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <h2 className="font-display font-black text-ink-800 text-base lg:text-lg truncate">{title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {recipientId && onNavigateNotification && (
              <NotificationBell recipientId={recipientId} onNavigate={onNavigateNotification} />
            )}
            <button
              onClick={onLogout}
              className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom dock — top 4 nav items + a "More" slot for the rest.
          Fixes the pre-existing gap where admin-tier roles (Assistant most
          acutely) had no mobile navigation at all. */}
      <div className="lg:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[420px] z-50">
        <div className="bg-white border border-ink-100 shadow-2xl px-1.5 flex justify-around items-center h-16 rounded-[24px]">
          {dockItems.map(item => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className="relative flex-1 flex flex-col items-center justify-center min-h-[48px] gap-0.5"
              >
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${isActive ? 'bg-medical-50 text-medical-600' : 'text-ink-400'}`}>
                  <item.icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
                </div>
                {!!item.badge && (
                  <span className="absolute top-0 right-3 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
          {overflowItems.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className="relative flex-1 flex flex-col items-center justify-center min-h-[48px] gap-0.5"
            >
              <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${overflowItems.some(i => i.id === activeId) ? 'bg-medical-50 text-medical-600' : 'text-ink-400'}`}>
                <MoreHorizontal size={19} />
                <span className="text-[9px] font-black uppercase tracking-widest">More</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
