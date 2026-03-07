"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Account management panel — subscription management & account deletion.
 */
export function AccountSettings({ onClose }: { onClose: () => void }) {
  const { user, profile, logOut, getIdToken } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    if (!user) return;
    setIsLoadingPortal(true);
    setError(null);

    try {
      const token = await getIdToken();
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to open billing portal.");
      }
    } catch {
      setError("Unable to connect to billing service.");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE" || !user) return;
    setIsDeleting(true);
    setError(null);

    try {
      const token = await getIdToken();
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        await logOut();
        window.location.href = "/";
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete account.");
      }
    } catch {
      setError("Unable to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-void border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="font-cinzel text-lg text-gold tracking-widest mb-6">
            Account Settings
          </h2>

          {/* Profile Info */}
          <div className="mb-6 pb-6 border-b border-border">
            <p className="font-courier text-xs text-text-muted tracking-widest uppercase mb-1">
              Signed in as
            </p>
            <p className="font-cormorant text-text-primary">
              {user.email || user.displayName || "Anonymous"}
            </p>
            <p className="font-courier text-xs text-text-muted mt-1">
              Tier:{" "}
              <span className="text-gold capitalize">{profile?.tier || "free"}</span>
            </p>
            {profile?.role === 'therapist' && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="font-courier text-xs text-text-muted tracking-widest uppercase mb-1">
                  Professional Registration
                </p>
                <p className="font-cormorant text-xs text-text-muted italic">
                  BACP/UKCP membership number can be set in your Practice Settings.
                </p>
              </div>
            )}
          </div>

          {/* Manage Subscription */}
          {profile?.tier !== "free" && (
            <div className="mb-6 pb-6 border-b border-border">
              <h3 className="font-courier text-xs text-text-muted tracking-widest uppercase mb-3">
                Subscription
              </h3>
              <button
                onClick={handleManageSubscription}
                disabled={isLoadingPortal}
                className="w-full font-courier text-xs tracking-widest uppercase bg-gold/10 text-gold hover:bg-gold/20 border border-gold/30 rounded px-4 py-3 transition-colors disabled:opacity-50"
              >
                {isLoadingPortal ? "Opening..." : "Manage Subscription"}
              </button>
              <p className="font-cormorant text-xs text-text-muted mt-2 italic">
                Update payment method, view invoices, or cancel.
              </p>
            </div>
          )}

          {/* Danger Zone */}
          <div>
            <h3 className="font-courier text-xs text-red-400/80 tracking-widest uppercase mb-3">
              Danger Zone
            </h3>
            <p className="font-cormorant text-xs text-text-muted mb-3">
              Permanently delete your account and all associated data. This action
              cannot be undone. Type <strong className="text-red-400">DELETE</strong> to
              confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="w-full bg-transparent border border-red-900/30 rounded px-3 py-2 font-courier text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-red-400/50 mb-3"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={confirmText !== "DELETE" || isDeleting}
              className="w-full font-courier text-xs tracking-widest uppercase bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30 rounded px-4 py-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete Account Forever"}
            </button>
          </div>

          {error && (
            <p className="mt-4 font-courier text-xs text-red-400">{error}</p>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full font-courier text-xs tracking-widest uppercase text-text-muted hover:text-text-primary transition-colors py-2"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
