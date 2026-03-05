"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export type Tier = "free" | "philosopher" | "pro" | "practice";

export type SessionMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  depth: number;
};

export interface SessionSummary {
  id: string;
  createdAt: string;
  messageCount: number;
  maxDepth: number;
  preview: string;
  messages: SessionMessage[];
}

export type UserRole = "patient" | "therapist";

interface UserProfile {
  tier: Tier;
  sessionsThisMonth: number;
  lastSessionDate: string | null;
  role?: UserRole;
  practiceId?: string;
  clientIds?: string[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoaded: boolean;
  authError: string | null;
  sessions: SessionSummary[];
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  isTherapist: boolean;
  getIdToken: () => Promise<string | null>;
  incrementSession: () => Promise<boolean>;
  clearAuthError: () => void;
  saveSession: (messages: SessionMessage[], maxDepth: number) => Promise<void>;
  loadSessions: () => Promise<void>;
  verifySubscription: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!!auth);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    if (!auth) {
      return;
    }
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      // Clean up previous profile listener
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (u) {
        if (db) {
          try {
            const docRef = doc(db, "users", u.uid);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              const defaultProfile: UserProfile = { tier: "free", sessionsThisMonth: 0, lastSessionDate: null };
              await setDoc(docRef, defaultProfile);
            }

            // #11 Real-time profile listener — picks up webhook changes immediately
            unsubProfile = onSnapshot(docRef, (snap) => {
              if (snap.exists()) {
                const p = snap.data() as UserProfile;
                setProfile(p);
                localStorage.setItem(`sorca_profile_${u.uid}`, JSON.stringify(p));
              }
            }, (error) => {
              console.error("Profile snapshot error:", error);
            });
          } catch (error: unknown) {
            console.error("Firestore error loading profile:", error);
            const localProfile = localStorage.getItem(`sorca_profile_${u.uid}`);
            if (localProfile) {
              setProfile(JSON.parse(localProfile));
            } else {
              setProfile({ tier: "free", sessionsThisMonth: 0, lastSessionDate: null });
            }
          }
        } else {
          const localProfile = localStorage.getItem(`sorca_profile_${u.uid}`);
          if (localProfile) {
            setProfile(JSON.parse(localProfile));
          } else {
            setProfile({ tier: "free", sessionsThisMonth: 0, lastSessionDate: null });
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const signIn = async () => {
    if (!auth) return;
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign in error", error);
      if (error.code === 'auth/configuration-not-found') {
        setAuthError("Google Sign-In is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError("This domain is not authorized for OAuth operations. Please add it to the authorized domains list in the Firebase Console under Authentication > Settings > Authorized domains.");
      } else {
        setAuthError(error.message || "Failed to sign in.");
      }
    }
  };

  const logOut = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (e) {
      console.error('Failed to get ID token:', e);
      return null;
    }
  }, [user]);

  const incrementSession = async (): Promise<boolean> => {
    if (!user || !profile) return false;
    
    let newProfile = { ...profile };

    // Check limits
    if (profile.tier === "free" && profile.sessionsThisMonth >= 5) {
      // Check if it's a new month
      const lastDate = profile.lastSessionDate ? new Date(profile.lastSessionDate) : null;
      const now = new Date();
      if (lastDate && (lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear())) {
        return false; // Limit reached
      } else {
        // Reset for new month
        newProfile = { ...profile, sessionsThisMonth: 1, lastSessionDate: now.toISOString() };
      }
    } else {
      newProfile = { 
        ...profile, 
        sessionsThisMonth: profile.sessionsThisMonth + 1,
        lastSessionDate: new Date().toISOString()
      };
    }

    setProfile(newProfile);
    localStorage.setItem(`sorca_profile_${user.uid}`, JSON.stringify(newProfile));

    if (db) {
      try {
        await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
      } catch (e) {
        console.error("Firestore save error", e);
      }
    }
    return true;
  };

  const loadSessions = useCallback(async () => {
    if (!user) return;
    let loaded: SessionSummary[] = [];

    if (db) {
      try {
        const sessionsRef = collection(db, "users", user.uid, "sessions");
        const q = query(sessionsRef, orderBy("createdAt", "desc"), limit(50));
        const snapshot = await getDocs(q);
        loaded = snapshot.docs.map(d => {
          const data = d.data() as SessionSummary;
          return {
            ...data,
            id: d.id,
            messages: (data.messages || []).map(m => ({
              ...m,
              role: (m.role as string) === 'oracle' ? 'assistant' : m.role,
            })) as SessionMessage[],
          };
        });
      } catch (e) {
        console.error("Firestore sessions load error", e);
      }
    }

    if (loaded.length === 0) {
      const localSessions = localStorage.getItem(`sorca_sessions_${user.uid}`);
      if (localSessions) {
        try {
          loaded = JSON.parse(localSessions);
        } catch (e) {
          console.error("localStorage sessions parse error", e);
        }
      }
    }

    // Enforce 30-day limit for free tier — paid users get full history
    const currentTier = profile?.tier || 'free';
    if (currentTier === 'free') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      loaded = loaded.filter(s => new Date(s.createdAt) > thirtyDaysAgo);
    }

    setSessions(loaded);
  }, [user, profile?.tier]);

  useEffect(() => {
    if (user) {
      loadSessions();
    } else {
      setSessions([]);
    }
  }, [user, loadSessions]);

  const saveSession = useCallback(async (messages: SessionMessage[], maxDepth: number) => {
    if (!user) return;

    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length === 0) return;

    // Check if there's already a session from this active conversation
    // (within the last 30 minutes with the same first user message)
    const firstUserMsg = userMessages[0]?.content.slice(0, 120) || "...";
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Find existing session to update (auto-save during conversation)
    const existingSessions = localStorage.getItem(`sorca_sessions_${user.uid}`);
    let allSessions: SessionSummary[] = [];
    if (existingSessions) {
      try {
        allSessions = JSON.parse(existingSessions);
      } catch { /* ignore */ }
    }

    const existingIdx = allSessions.findIndex(s =>
      s.preview === firstUserMsg && new Date(s.createdAt) > thirtyMinAgo
    );

    let session: SessionSummary;

    if (existingIdx !== -1) {
      // Update existing session in place
      session = {
        ...allSessions[existingIdx],
        messageCount: messages.length,
        maxDepth,
        messages,
      };
      allSessions[existingIdx] = session;
    } else {
      // Create new session
      session = {
        id: crypto.randomUUID(),
        createdAt: now.toISOString(),
        messageCount: messages.length,
        maxDepth,
        preview: firstUserMsg,
        messages,
      };
      allSessions.unshift(session);
    }

    allSessions = allSessions.slice(0, 50);

    // Save to Firestore
    if (db) {
      try {
        await setDoc(doc(db, "users", user.uid, "sessions", session.id), session);
      } catch (e) {
        console.error("Firestore session save error", e);
      }
    }

    // Always save to localStorage as fallback
    localStorage.setItem(`sorca_sessions_${user.uid}`, JSON.stringify(allSessions));

    setSessions(allSessions);
  }, [user]);

  const verifySubscription = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/account', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.synced && data.tier) {
          // Force update local profile immediately
          setProfile(prev => prev ? { ...prev, tier: data.tier } : { tier: data.tier, sessionsThisMonth: 0, lastSessionDate: null });
          return data.tier;
        }
        return data.tier || null;
      }
    } catch (e) {
      console.error('Subscription verification failed:', e);
    }
    return null;
  }, [user]);

  const clearAuthError = () => setAuthError(null);

  const profileLoaded = !loading && user !== null && profile !== null;
  const isTherapist = profileLoaded && (profile?.role === 'therapist' || profile?.tier === 'practice');

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoaded, authError, sessions, signIn, logOut, getIdToken, incrementSession, clearAuthError, saveSession, loadSessions, verifySubscription, isTherapist }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
