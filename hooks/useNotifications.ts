import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export interface AppNotification {
  id: string;
  recipient_id: string;
  title: string;
  body?: string;
  type: string;
  is_read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export const useNotifications = (recipientId: string | undefined) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!recipientId) return;
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', recipientId)
        .order('created_at', { ascending: false })
        .limit(50);
      const list = data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: AppNotification) => !n.is_read).length);
    } catch {
      // Silently fail
    }
  }, [recipientId]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch {
      // Revert optimistic update on failure
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!recipientId) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', recipientId).eq('is_read', false);
    } catch {
      fetchNotifications();
    }
  }, [recipientId, fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    if (!recipientId) return;
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [recipientId, fetchNotifications]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!recipientId) return;
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [recipientId, fetchNotifications]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetchNotifications };
};
