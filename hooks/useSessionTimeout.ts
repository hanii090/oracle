'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const WARNING_MS = 25 * 60 * 1000; // Show warning at 25 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

/**
 * Session timeout hook — logs user out after 30 minutes of inactivity.
 * Shows a warning at 25 minutes. Resets on any user interaction.
 * Only active when user is logged in.
 */
export function useSessionTimeout() {
  const { user, logOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const showWarningRef = useRef(showWarning);
  showWarningRef.current = showWarning;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();
    if (!user) return;

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_MS);

    timeoutRef.current = setTimeout(() => {
      logOut();
      setShowWarning(false);
    }, TIMEOUT_MS);
  }, [user, logOut, clearTimers]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    resetTimer();

    const handler = () => {
      if (!showWarningRef.current) resetTimer();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handler, { passive: true });
    }

    return () => {
      clearTimers();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handler);
      }
    };
  }, [user, resetTimer, clearTimers]);

  return { showWarning, dismissWarning };
}
