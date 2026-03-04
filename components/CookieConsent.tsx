"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const CONSENT_KEY = "sorca_cookie_consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if consent hasn't been given
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on first paint
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "essential-only");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-void/95 backdrop-blur-sm p-5 shadow-2xl">
            <p className="font-cormorant text-sm text-text-muted leading-relaxed mb-4">
              Sorca uses essential cookies for authentication and session management.
              We do not use tracking cookies or share data with third parties.{" "}
              <a
                href="/privacy"
                className="text-gold hover:text-gold-bright underline underline-offset-2 transition-colors"
              >
                Privacy Policy
              </a>
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleDecline}
                className="font-courier text-xs tracking-widest uppercase text-text-muted hover:text-text-primary transition-colors px-4 py-2"
              >
                Essential Only
              </button>
              <button
                onClick={handleAccept}
                className="font-courier text-xs tracking-widest uppercase bg-gold/10 text-gold hover:bg-gold/20 border border-gold/30 rounded px-4 py-2 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
