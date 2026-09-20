import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Calendar, Clock, ShieldCheck, FileText, Star, X, CheckCheck } from 'lucide-react';
import { useNotifications, AppNotification } from '../../hooks/useNotifications';
import { MaskIcon } from '../dashboard/MaskIcon';
import { useDismiss } from '../dashboard/useDismiss';
import { DS_ICONS } from '../dashboard/assets';
import '../dashboard/dashboard.css';

interface NotificationBellProps {
  recipientId: string | undefined;
  onNavigate: (path: string) => void;
  /**
   * `default` = the original 40px rounded-xl bell (AdminLayout and any un-restyled chrome).
   * `dashboard` = Figma's Misc. Icons bell cell (317:13566): fills its 44x49 parent cell, 20px `notification-3-line` glyph in Text/tertiary,
   * panel anchored to the right edge of the white Misc pill and faded in (300ms EASE_OUT).
   */
  variant?: 'default' | 'dashboard';
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; border: string; bg: string }> = {
  appointment_booked: { icon: Calendar,    color: 'text-medical-600', border: 'border-medical-400', bg: 'bg-medical-50' },
  delay_alert:        { icon: Clock,       color: 'text-orange-600', border: 'border-orange-400', bg: 'bg-orange-50' },
  approval_status:    { icon: ShieldCheck, color: 'text-green-600',  border: 'border-green-400',  bg: 'bg-green-50' },
  prescription_ready: { icon: FileText,    color: 'text-violet-600', border: 'border-violet-400', bg: 'bg-violet-50' },
  review_received:    { icon: Star,        color: 'text-amber-600',  border: 'border-amber-400',  bg: 'bg-amber-50' },
  system:             { icon: Bell,        color: 'text-slate-500',  border: 'border-slate-300',  bg: 'bg-slate-50' },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ recipientId, onNavigate, variant = 'default' }) => {
  const isDash = variant === 'dashboard';
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(recipientId);

  // Close on outside click / touch / Escape
  const closePanel = useCallback(() => setOpen(false), []);
  useDismiss(panelRef, open, closePanel);

  const handleNotificationClick = useCallback((n: AppNotification) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.link) {
      onNavigate(n.link);
      setOpen(false);
    }
  }, [markAsRead, onNavigate]);

  return (
    <div ref={panelRef} className={isDash ? 'relative flex-1 h-full' : 'relative'}>
      <button
        onClick={() => setOpen(o => !o)}
        className={isDash
          ? 'relative w-full h-full flex items-center justify-center p-3 rounded-lg cursor-pointer text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500'
          : 'relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700'}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {isDash ? <MaskIcon src={DS_ICONS.notification} size={20} /> : <Bell size={20} />}
        {unreadCount > 0 && (
          // Unread badge = functional (not in Figma); fixed semantic red, pinned to the glyph's top-right corner in the dashboard cell.
          <span className={`absolute ${isDash ? 'top-[9px] right-[8px]' : 'top-1 right-1'} w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm animate-pulse motion-reduce:animate-none`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={`absolute w-80 max-w-[calc(100vw-32px)] bg-white rounded-ds-lg shadow-2xl border border-slate-100 z-[70] overflow-hidden ${isDash ? 'ds-fade-in right-[-52px] top-[calc(100%+6px)]' : 'right-0 top-full mt-3 animate-in fade-in zoom-in-95 duration-200'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-400" />
              <span className="font-black text-[13px] text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded-full">{unreadCount} new</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[10px] font-black text-medical-600 hover:text-medical-700 px-2 py-1 rounded-lg hover:bg-medical-50 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={12} /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell size={32} className="mb-3 opacity-20" />
                <p className="font-bold text-sm">You're all caught up</p>
                <p className="text-xs mt-1">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map(n => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 border-l-2 ${cfg.border} ${n.is_read ? 'opacity-60 border-transparent' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] leading-tight mb-0.5 ${n.is_read ? 'font-medium text-slate-600' : 'font-black text-slate-900'}`}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">{n.body}</p>
                        )}
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{relativeTime(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 bg-medical-500 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
