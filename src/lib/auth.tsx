import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/**
 * Pranam Auth module.
 *
 * Backed by Lovable Cloud — token issuance, refresh, and session storage are
 * handled by the platform. This module exposes a small surface that mirrors
 * the conceptual endpoints (send OTP, verify OTP, Google sign-in, refresh,
 * logout) on top of it.
 *
 * Token model:
 *   - Access token: short-lived JWT (auto-refreshed every ~hour)
 *   - Refresh token: long-lived, rotated on use, stored in localStorage
 *   - Logout invalidates the refresh token server-side
 */

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

// Normalize to E.164 (+91…) — Supabase phone OTP requires it.
function toE164(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe FIRST, then read existing session (avoid missed events).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendPhoneOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
    if (error) throw error;
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: toE164(phone),
      token,
      type: "sms",
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) throw result.error;
  };

  const refreshSession = async () => {
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider
      value={{ user, session, loading, sendPhoneOtp, verifyPhoneOtp, signInWithGoogle, refreshSession, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
