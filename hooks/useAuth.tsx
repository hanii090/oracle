"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type Tier = "free" | "philosopher" | "pro";

interface UserProfile {
  tier: Tier;
  sessionsThisMonth: number;
  lastSessionDate: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  upgradeTier: (tier: Tier) => Promise<void>;
  incrementSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && db) {
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = { tier: "free", sessionsThisMonth: 0, lastSessionDate: null };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error", error);
    }
  };

  const logOut = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const upgradeTier = async (tier: Tier) => {
    if (!user || !db || !profile) return;
    const newProfile = { ...profile, tier };
    await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
    setProfile(newProfile);
  };

  const incrementSession = async (): Promise<boolean> => {
    if (!user || !db || !profile) return false;
    
    // Check limits
    if (profile.tier === "free" && profile.sessionsThisMonth >= 5) {
      // Check if it's a new month
      const lastDate = profile.lastSessionDate ? new Date(profile.lastSessionDate) : null;
      const now = new Date();
      if (lastDate && (lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear())) {
        return false; // Limit reached
      } else {
        // Reset for new month
        const newProfile = { ...profile, sessionsThisMonth: 1, lastSessionDate: now.toISOString() };
        await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
        setProfile(newProfile);
        return true;
      }
    }

    const newProfile = { 
      ...profile, 
      sessionsThisMonth: profile.sessionsThisMonth + 1,
      lastSessionDate: new Date().toISOString()
    };
    await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
    setProfile(newProfile);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logOut, upgradeTier, incrementSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
