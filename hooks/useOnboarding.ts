'use client';

import { useState, useCallback } from 'react';

const ONBOARDING_KEY = 'sorca_onboarding_seen';
const NIGHT_BANNER_KEY = 'sorca_night_banner_seen';
const STREAK_KEY = 'sorca_streak_data';

interface StreakData {
  currentStreak: number;
  lastSessionDate: string | null;
  longestStreak: number;
}

function getInitialWelcome(): boolean {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem(ONBOARDING_KEY);
}

function getInitialStreak(): StreakData {
  if (typeof window === 'undefined') return { currentStreak: 0, lastSessionDate: null, longestStreak: 0 };
  const raw = localStorage.getItem(STREAK_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* ignore */ }
  }
  return { currentStreak: 0, lastSessionDate: null, longestStreak: 0 };
}

export function useOnboarding() {
  const [showWelcome, setShowWelcome] = useState(getInitialWelcome);
  const [showNightBanner, setShowNightBanner] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [streak, setStreak] = useState(getInitialStreak);

  const dismissWelcome = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowWelcome(false);
  }, []);

  const showNightExplanation = useCallback(() => {
    const hasSeen = localStorage.getItem(NIGHT_BANNER_KEY);
    if (!hasSeen) {
      setShowNightBanner(true);
      localStorage.setItem(NIGHT_BANNER_KEY, 'true');
      // Auto-dismiss after 6 seconds
      setTimeout(() => setShowNightBanner(false), 6000);
    }
  }, []);

  const dismissNightBanner = useCallback(() => {
    setShowNightBanner(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  const dismissHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  // Update streak on session completion
  const recordSession = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    
    setStreak(prev => {
      const lastDate = prev.lastSessionDate;
      let newStreak = prev.currentStreak;

      if (lastDate === today) {
        // Already recorded today
        return prev;
      }

      if (lastDate) {
        const last = new Date(lastDate);
        const now = new Date(today);
        const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak = prev.currentStreak + 1;
        } else if (diffDays > 1) {
          newStreak = 1; // Reset streak
        }
      } else {
        newStreak = 1; // First session ever
      }

      const updated: StreakData = {
        currentStreak: newStreak,
        lastSessionDate: today,
        longestStreak: Math.max(prev.longestStreak, newStreak),
      };

      localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    showWelcome,
    showNightBanner,
    showHelp,
    streak,
    dismissWelcome,
    showNightExplanation,
    dismissNightBanner,
    toggleHelp,
    dismissHelp,
    recordSession,
  };
}
