"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, query, orderBy, limit } from "firebase/firestore";

export type Tier = "free" | "philosopher" | "pro";

export type SessionMessage = {
  id: string;
  role: "user" | "oracle";
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

interface UserProfile {
  tier: Tier;
  sessionsThisMonth: number;
  lastSessionDate: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  sessions: SessionSummary[];
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  upgradeTier: (tier: Tier) => Promise<void>;
  incrementSession: () => Promise<boolean>;
  clearAuthError: () => void;
  saveSession: (messages: SessionMessage[], maxDepth: number) => Promise<void>;
  loadSessions: () => Promise<void>;
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
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        let loadedProfile: UserProfile | null = null;
        if (db) {
          try {
            const docRef = doc(db, "users", u.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              loadedProfile = docSnap.data() as UserProfile;
            } else {
              loadedProfile = { tier: "free", sessionsThisMonth: 0, lastSessionDate: null };
              await setDoc(docRef, loadedProfile);
            }
          } catch (error: any) {
            console.error("Firestore error loading profile:", error);
            const localProfile = localStorage.getItem(`oracle_profile_${u.uid}`);
            if (localProfile) {
              loadedProfile = JSON.parse(localProfile);
            } else {
              loadedProfile = { tier: "free", sessionsThisMonth: 0, lastSessionDate: null };
            }
          }
        } else {
          const localProfile = localStorage.getItem(`oracle_profile_${u.uid}`);
          if (localProfile) {
            loadedProfile = JSON.parse(localProfile);
          } else {
            loadedProfile = { tier: "free", sessionsThisMonth: 0, lastSessionDate: null };
          }
        }
        setProfile(loadedProfile);
        if (loadedProfile) {
          localStorage.setItem(`oracle_profile_${u.uid}`, JSON.stringify(loadedProfile));
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadSessions();
    } else {
      setSessions([]);
    }
  }, [user, loadSessions]);

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

  const upgradeTier = useCallback(async (tier: Tier) => {
    if (!user) return;
    const currentProfile = profile || { tier: "free" as Tier, sessionsThisMonth: 0, lastSessionDate: null };
    const newProfile = { ...currentProfile, tier };
    setProfile(newProfile);
    localStorage.setItem(`oracle_profile_${user.uid}`, JSON.stringify(newProfile));
    if (db) {
      try {
        await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
      } catch (e) {
        console.error("Firestore save error", e);
      }
    }
  }, [user, profile]);

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
    localStorage.setItem(`oracle_profile_${user.uid}`, JSON.stringify(newProfile));

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
        loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SessionSummary));
      } catch (e) {
        console.error("Firestore sessions load error", e);
      }
    }

    if (loaded.length === 0) {
      const localSessions = localStorage.getItem(`oracle_sessions_${user.uid}`);
      if (localSessions) {
        try {
          loaded = JSON.parse(localSessions);
        } catch (e) {
          console.error("localStorage sessions parse error", e);
        }
      }
    }

    setSessions(loaded);
  }, [user]);

  const saveSession = useCallback(async (messages: SessionMessage[], maxDepth: number) => {
    if (!user) return;

    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length === 0) return;

    const session: SessionSummary = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      messageCount: messages.length,
      maxDepth,
      preview: userMessages[0]?.content.slice(0, 120) || "...",
      messages,
    };

    // Save to Firestore
    if (db) {
      try {
        await addDoc(collection(db, "users", user.uid, "sessions"), {
          ...session,
        });
      } catch (e) {
        console.error("Firestore session save error", e);
      }
    }

    // Always save to localStorage as fallback
    const existingSessions = localStorage.getItem(`oracle_sessions_${user.uid}`);
    let allSessions: SessionSummary[] = [];
    if (existingSessions) {
      try {
        allSessions = JSON.parse(existingSessions);
      } catch (e) { /* ignore */ }
    }
    allSessions.unshift(session);
    allSessions = allSessions.slice(0, 50);
    localStorage.setItem(`oracle_sessions_${user.uid}`, JSON.stringify(allSessions));

    setSessions(allSessions);
  }, [user]);

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, sessions, signIn, logOut, upgradeTier, incrementSession, clearAuthError, saveSession, loadSessions }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
