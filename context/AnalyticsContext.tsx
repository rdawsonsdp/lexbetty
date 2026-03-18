'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface AnalyticsEvent {
  event_name: string;
  event_category?: string;
  event_data?: Record<string, unknown>;
  page_path?: string;
  timestamp: string;
}

interface AnalyticsContextType {
  track: (eventName: string, data?: Record<string, unknown>, category?: string) => void;
  getSessionId: () => string | null;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Simple hash for anonymous visitor ID
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'v_' + Math.abs(hash).toString(36);
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  const stored = localStorage.getItem('lb_visitor_id');
  if (stored) return stored;

  const fingerprint = [
    navigator.userAgent,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join('|');

  const id = hashString(fingerprint);
  localStorage.setItem('lb_visitor_id', id);
  return id;
}

function getDeviceInfo() {
  if (typeof window === 'undefined') return {};
  const ua = navigator.userAgent;
  const width = screen.width;

  let device_type = 'desktop';
  if (width < 768 || /Mobile|Android|iPhone/i.test(ua)) device_type = 'mobile';
  else if (width < 1024 || /iPad|Tablet/i.test(ua)) device_type = 'tablet';

  let browser = 'unknown';
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edge/i.test(ua)) browser = 'Edge';

  let os = 'unknown';
  if (/Mac/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { device_type, browser, os, screen_width: screen.width, screen_height: screen.height };
}

function getUTMParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(key => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });
  return utm;
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const visitorIdRef = useRef<string>('');
  const eventQueueRef = useRef<AnalyticsEvent[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const pageCountRef = useRef<number>(0);
  const pageviewIdRef = useRef<string | null>(null);
  const initRef = useRef(false);

  // Flush event queue to server
  const flushEvents = useCallback(() => {
    const events = eventQueueRef.current.splice(0);
    if (events.length === 0) return;

    const sid = sessionStorage.getItem('lb_session_id');
    const vid = visitorIdRef.current;

    const payload = JSON.stringify({ session_id: sid, visitor_id: vid, events });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/events', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  // Track function
  const track = useCallback((eventName: string, data?: Record<string, unknown>, category?: string) => {
    eventQueueRef.current.push({
      event_name: eventName,
      event_category: category,
      event_data: data,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      timestamp: new Date().toISOString(),
    });

    // Auto-flush at batch size 10
    if (eventQueueRef.current.length >= 10) {
      flushEvents();
    }
  }, [flushEvents]);

  // Initialize session
  useEffect(() => {
    if (initRef.current || typeof window === 'undefined') return;
    initRef.current = true;

    const vid = getVisitorId();
    visitorIdRef.current = vid;
    sessionStartRef.current = Date.now();

    // Check for existing session
    const existingSession = sessionStorage.getItem('lb_session_id');
    if (existingSession) {
      setSessionId(existingSession);
      return;
    }

    // Create new session
    const deviceInfo = getDeviceInfo();
    const utmParams = getUTMParams();

    fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: vid,
        ...deviceInfo,
        referrer: document.referrer || null,
        ...utmParams,
        landing_page: window.location.pathname,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.session_id) {
          sessionStorage.setItem('lb_session_id', data.session_id);
          setSessionId(data.session_id);
        }
      })
      .catch(() => {});
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (!sessionId) return;

    pageCountRef.current++;

    // Record pageview
    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        visitor_id: visitorIdRef.current,
        page_path: pathname,
        page_title: document.title,
        previous_pageview_id: pageviewIdRef.current,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.pageview_id) pageviewIdRef.current = data.pageview_id;
      })
      .catch(() => {});

    track('page_view', { path: pathname }, 'navigation');
  }, [pathname, sessionId, track]);

  // Flush timer (every 5 seconds)
  useEffect(() => {
    flushTimerRef.current = setInterval(flushEvents, 5000);
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, [flushEvents]);

  // Session heartbeat and cleanup on visibility change / unload
  useEffect(() => {
    const updateSession = () => {
      const sid = sessionStorage.getItem('lb_session_id');
      if (!sid) return;
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      const payload = JSON.stringify({
        session_id: sid,
        exit_page: window.location.pathname,
        page_count: pageCountRef.current,
        duration_seconds: duration,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/session', new Blob([payload], { type: 'application/json' }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushEvents();
        updateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => {
      flushEvents();
      updateSession();
    });

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(updateSession, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
    };
  }, [flushEvents]);

  const getSessionId = useCallback(() => sessionId, [sessionId]);

  return (
    <AnalyticsContext.Provider value={{ track, getSessionId }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return no-op if outside provider (SSR safety)
    return {
      track: () => {},
      getSessionId: () => null,
    };
  }
  return context;
}
