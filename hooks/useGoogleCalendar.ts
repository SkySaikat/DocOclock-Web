/**
 * Google Calendar Sync for Doctors and Patients
 *
 * Setup: Add VITE_GOOGLE_CLIENT_ID to your .env file.
 * Get a Client ID from Google Cloud Console:
 *   → APIs & Services → Credentials → Create OAuth 2.0 Client ID
 *   → Application type: Web application
 *   → Authorized JavaScript origins: http://localhost:3000 (dev) + your production URL
 *   → Authorized redirect URIs: same origins
 *
 * Enable "Google Calendar API" in your Google Cloud project.
 */

import { useState, useCallback, useEffect } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const STORAGE_KEY = 'dococlock_gcal_token';
const EVENT_IDS_KEY = 'dococlock_gcal_event_ids'; // { [appointmentId]: calendarEventId }

interface GCalToken {
  access_token: string;
  expires_at: number;
}

function getStoredEventIds(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(EVENT_IDS_KEY) || '{}'); } catch { return {}; }
}

function saveEventId(appointmentId: string, calendarEventId: string) {
  const ids = getStoredEventIds();
  ids[appointmentId] = calendarEventId;
  localStorage.setItem(EVENT_IDS_KEY, JSON.stringify(ids));
}

export const useGoogleCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [token, setToken] = useState<GCalToken | null>(null);

  // Restore token from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved: GCalToken = JSON.parse(raw);
      if (saved.expires_at > Date.now()) {
        setToken(saved);
        setIsConnected(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const connect = useCallback(() => {
    if (!CLIENT_ID) {
      alert('Google Calendar is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.');
      return;
    }

    // redirect_uri must exactly match one of the Authorized Redirect URIs in Google Cloud Console
    const redirectUri = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: SCOPES,
      include_granted_scopes: 'true',
      state: 'gcal_connect',
    });

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      'gcal_auth',
      'width=500,height=600,left=200,top=100'
    );

    // Listen for the token from the popup redirect
    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) { clearInterval(interval); return; }
        const hash = popup.location.hash;
        if (!hash || !hash.includes('access_token')) return;
        const tokenParams = new URLSearchParams(hash.substring(1));
        const access_token = tokenParams.get('access_token');
        const expires_in = Number(tokenParams.get('expires_in') || 3600);
        if (access_token) {
          const newToken: GCalToken = {
            access_token,
            expires_at: Date.now() + expires_in * 1000,
          };
          setToken(newToken);
          setIsConnected(true);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newToken));
          popup.close();
        }
        clearInterval(interval);
      } catch {
        // Cross-origin error while popup is on Google domain — ignore
      }
    }, 500);
  }, []);

  const disconnect = useCallback(() => {
    setToken(null);
    setIsConnected(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Sync a list of appointments to Google Calendar.
   * Each appointment becomes a calendar event. Patient email is added as attendee
   * so they receive Google Calendar notifications when the event changes.
   */
  const syncAppointments = useCallback(async (appointments: Array<{
    id: string;
    patientName: string;
    patientEmail?: string;
    date: string;       // 'YYYY-MM-DD'
    time: string;       // 'HH:mm'
    chamberName?: string;
    chamberLocation?: string;
    fee?: number;
    serialNumber: number;
  }>) => {
    if (!token || !isConnected) {
      throw new Error('Google Calendar not connected. Please connect first.');
    }

    setIsSyncing(true);
    let synced = 0;
    let failed = 0;

    try {
      for (const appt of appointments) {
        try {
          const [year, month, day] = appt.date.split('-').map(Number);
          const [hour, minute] = appt.time.split(':').map(Number);
          const startDate = new Date(year, month - 1, day, hour, minute);
          const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30-min slot

          const event: any = {
            summary: `Patient #${appt.serialNumber} — ${appt.patientName}`,
            location: appt.chamberLocation || appt.chamberName || '',
            description: `DocOclock appointment\nChamber: ${appt.chamberName || ''}\nFee: ৳${appt.fee || 0}\nAppointment ID: ${appt.id}`,
            start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Dhaka' },
            end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Dhaka' },
            extendedProperties: { private: { dococlock_appointment_id: appt.id } },
          };

          // Add patient as attendee so they get notifications
          if (appt.patientEmail) {
            event.attendees = [{ email: appt.patientEmail, displayName: appt.patientName }];
            event.guestsCanSeeOtherGuests = false;
          }

          const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            }
          );

          if (response.ok) {
            const created = await response.json();
            if (created.id) saveEventId(appt.id, created.id);
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }
    } finally {
      setIsSyncing(false);
    }

    return { synced, failed };
  }, [token, isConnected]);

  /**
   * Update existing calendar events when doctor announces a delay.
   * Shifts event start times forward by delayMinutes.
   */
  const syncDelay = useCallback(async (appointments: Array<{
    id: string;
    patientName: string;
    date: string;
    time: string;
    serialNumber: number;
  }>, delayMinutes: number) => {
    if (!token || !isConnected || delayMinutes <= 0) return;
    if (token.expires_at <= Date.now()) { disconnect(); return; }

    const eventIds = getStoredEventIds();

    for (const appt of appointments) {
      const calEventId = eventIds[appt.id];
      if (!calEventId) continue;

      try {
        const [year, month, day] = appt.date.split('-').map(Number);
        const [hour, minute] = appt.time.split(':').map(Number);
        const origStart = new Date(year, month - 1, day, hour, minute);
        const newStart = new Date(origStart.getTime() + delayMinutes * 60 * 1000);
        const newEnd = new Date(newStart.getTime() + 30 * 60 * 1000);

        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${calEventId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: `⏰ DELAYED +${delayMinutes}min — Patient #${appt.serialNumber} ${appt.patientName}`,
              start: { dateTime: newStart.toISOString(), timeZone: 'Asia/Dhaka' },
              end: { dateTime: newEnd.toISOString(), timeZone: 'Asia/Dhaka' },
              description: `Doctor will be ${delayMinutes} minutes late.\nOriginal time: ${appt.time}\nDocOclock appointment ID: ${appt.id}`,
            }),
          }
        );
      } catch {
        // Non-blocking — individual event update failure shouldn't stop the rest
      }
    }
  }, [token, isConnected, disconnect]);

  /**
   * Auto-sync today's schedule (appointments) for a doctor.
   * Call this automatically after loading doctor's appointments.
   */
  const autoSync = useCallback(async (appointments: Parameters<typeof syncAppointments>[0]) => {
    if (!isConnected || !token) return;
    if (token.expires_at <= Date.now()) {
      disconnect();
      return;
    }
    try {
      await syncAppointments(appointments);
    } catch {
      // Auto-sync failures are silent
    }
  }, [isConnected, token, syncAppointments, disconnect]);

  return {
    isConnected,
    isSyncing,
    connect,
    disconnect,
    syncAppointments,
    syncDelay,
    autoSync,
    isConfigured: !!CLIENT_ID,
  };
};
