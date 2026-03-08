'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';

const THERAPY_PROFILE_KEY = 'sorca_therapy_profile';

export interface TherapyProfile {
  inTherapy: boolean;
  therapistId: string | null;
  therapistName: string | null;
  nextSessionDate: string | null;
  sessionDay: string | null; // 'monday', 'tuesday', etc.
  sessionTime: string | null; // '10:00'
  consentSettings: {
    shareWeekSummary: boolean;
    shareHomeworkProgress: boolean;
    sharePatternAlerts: boolean;
    shareMoodData: boolean;
  };
  safeMode: boolean; // Therapist-controlled: limits depth, shows grounding, no escalation
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function createDefaultTherapyProfile(): TherapyProfile {
  const now = new Date().toISOString();
  return {
    inTherapy: false,
    therapistId: null,
    therapistName: null,
    nextSessionDate: null,
    sessionDay: null,
    sessionTime: null,
    consentSettings: {
      shareWeekSummary: false,
      shareHomeworkProgress: false,
      sharePatternAlerts: false,
      shareMoodData: false,
    },
    safeMode: false,
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function useTherapy() {
  const { user } = useAuth();
  const [therapyProfile, setTherapyProfile] = useState<TherapyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTherapyOnboarding, setShowTherapyOnboarding] = useState(false);

  // Load therapy profile
  useEffect(() => {
    if (!user) {
      setTherapyProfile(null);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const loadProfile = async () => {
      // Always load from localStorage first for immediate data
      const local = localStorage.getItem(`${THERAPY_PROFILE_KEY}_${user.uid}`);
      if (local && mounted) {
        try {
          setTherapyProfile(JSON.parse(local));
        } catch {
          // Invalid localStorage data, ignore
        }
      }

      // Try Firestore for real-time sync (may fail if auth not ready)
      if (isFirebaseConfigured && db) {
        try {
          const docRef = doc(db, 'therapyProfiles', user.uid);
          
          // Real-time listener for therapy profile
          unsubscribe = onSnapshot(docRef, (snap) => {
            if (!mounted) return;
            if (snap.exists()) {
              const data = snap.data() as TherapyProfile;
              setTherapyProfile(data);
              localStorage.setItem(`${THERAPY_PROFILE_KEY}_${user.uid}`, JSON.stringify(data));
            }
            setLoading(false);
          }, (error) => {
            // Permission errors are expected if user just signed in or profile doesn't exist yet
            // This is not a critical error - localStorage fallback is already loaded
            if (error.code !== 'permission-denied') {
              console.error('Therapy profile snapshot error:', error);
            }
            if (mounted) {
              setLoading(false);
            }
          });
          return;
        } catch (e) {
          console.error('Firestore therapy profile error:', e);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Start therapy onboarding
  const startTherapyOnboarding = useCallback(() => {
    setShowTherapyOnboarding(true);
  }, []);

  // Dismiss therapy onboarding
  const dismissTherapyOnboarding = useCallback(() => {
    setShowTherapyOnboarding(false);
  }, []);

  const persistProfile = useCallback(async (updatedProfile: TherapyProfile) => {
    if (!user) return;
    localStorage.setItem(`${THERAPY_PROFILE_KEY}_${user.uid}`, JSON.stringify(updatedProfile));
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'therapyProfiles', user.uid), updatedProfile, { merge: true });
      } catch (e) {
        console.error('Failed to save therapy profile:', e);
      }
    }
  }, [user]);

  // Set "I'm in therapy" status
  const setInTherapy = useCallback(async (inTherapy: boolean) => {
    if (!user) return;
    let saved: TherapyProfile | null = null;
    setTherapyProfile(prev => {
      saved = {
        ...(prev || createDefaultTherapyProfile()),
        inTherapy,
        updatedAt: new Date().toISOString(),
      };
      return saved;
    });
    if (saved) await persistProfile(saved);
  }, [user, persistProfile]);

  // Update therapy session schedule
  const updateSessionSchedule = useCallback(async (schedule: {
    nextSessionDate?: string;
    sessionDay?: string;
    sessionTime?: string;
    therapistName?: string;
  }) => {
    if (!user) return;
    let saved: TherapyProfile | null = null;
    setTherapyProfile(prev => {
      saved = {
        ...(prev || createDefaultTherapyProfile()),
        ...schedule,
        updatedAt: new Date().toISOString(),
      };
      return saved;
    });
    if (saved) await persistProfile(saved);
  }, [user, persistProfile]);

  // Update consent settings
  const updateConsentSettings = useCallback(async (settings: Partial<TherapyProfile['consentSettings']>) => {
    if (!user) return;
    const defaultConsent = createDefaultTherapyProfile().consentSettings;
    let saved: TherapyProfile | null = null;
    setTherapyProfile(prev => {
      saved = {
        ...(prev || createDefaultTherapyProfile()),
        consentSettings: {
          ...(prev?.consentSettings || defaultConsent),
          ...settings,
        },
        updatedAt: new Date().toISOString(),
      };
      return saved;
    });
    if (saved) await persistProfile(saved);
  }, [user, persistProfile]);

  // Complete therapy onboarding
  const completeTherapyOnboarding = useCallback(async (profile: Partial<TherapyProfile>) => {
    if (!user) return;
    let saved: TherapyProfile | null = null;
    setTherapyProfile(prev => {
      saved = {
        ...createDefaultTherapyProfile(),
        ...profile,
        onboardingCompleted: true,
        createdAt: prev?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return saved;
    });
    setShowTherapyOnboarding(false);
    if (saved) await persistProfile(saved);
  }, [user, persistProfile]);

  // Check if session is within 24 hours (for Session Debrief Mode)
  const isWithin24HoursOfSession = useCallback((): boolean => {
    if (!therapyProfile?.nextSessionDate) return false;
    
    const sessionDate = new Date(therapyProfile.nextSessionDate);
    const now = new Date();
    const hoursSinceSession = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceSession >= 0 && hoursSinceSession <= 24;
  }, [therapyProfile?.nextSessionDate]);

  // Check if session is within 1 hour (for Pre-Session Primer)
  const isWithin1HourOfSession = useCallback((): boolean => {
    if (!therapyProfile?.nextSessionDate) return false;
    
    const sessionDate = new Date(therapyProfile.nextSessionDate);
    const now = new Date();
    const hoursUntilSession = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilSession >= 0 && hoursUntilSession <= 1;
  }, [therapyProfile?.nextSessionDate]);

  return {
    therapyProfile,
    loading,
    showTherapyOnboarding,
    startTherapyOnboarding,
    dismissTherapyOnboarding,
    setInTherapy,
    updateSessionSchedule,
    updateConsentSettings,
    completeTherapyOnboarding,
    isWithin24HoursOfSession,
    isWithin1HourOfSession,
    isInTherapy: therapyProfile?.inTherapy || false,
  };
}
