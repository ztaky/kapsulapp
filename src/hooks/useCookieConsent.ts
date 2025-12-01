import { useState, useEffect, useCallback } from "react";

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean; // GTM
  marketing: boolean; // FB Pixel
  acceptedAt?: string;
}

const COOKIE_CONSENT_KEY = "cookie_consent";

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences(parsed);
        setHasConsented(true);
      } catch {
        setPreferences(null);
        setHasConsented(false);
      }
    } else {
      setHasConsented(false);
    }
    setIsLoaded(true);
  }, []);

  const savePreferences = useCallback((newPreferences: CookiePreferences) => {
    const prefsWithTimestamp = {
      ...newPreferences,
      essential: true, // Always true
      acceptedAt: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefsWithTimestamp));
    setPreferences(prefsWithTimestamp);
    setHasConsented(true);
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
    });
  }, [savePreferences]);

  const rejectAll = useCallback(() => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
    });
  }, [savePreferences]);

  const updatePreferences = useCallback((updates: Partial<CookiePreferences>) => {
    const current = preferences || defaultPreferences;
    savePreferences({
      ...current,
      ...updates,
      essential: true, // Always true
    });
  }, [preferences, savePreferences]);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    setPreferences(null);
    setHasConsented(false);
  }, []);

  return {
    preferences,
    hasConsented,
    isLoaded,
    acceptAll,
    rejectAll,
    updatePreferences,
    savePreferences,
    resetConsent,
  };
}
