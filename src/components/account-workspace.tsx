"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/platform/supabase";

export function AccountWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === "signup") {
        if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin + basePath + "/account/"
          }
        });
        if (error) throw error;
        if (data.session) {
          setUser(data.user);
          setMessage("Your account has been created and you are signed in.");
        } else {
          setMessage("Your account request was received. Check your email for the confirmation link before signing in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        setUser(data.user);
        setMessage("You are now signed in to ADAPT OS.");
      }
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!supabase || !email.trim()) {
      setMessage("Enter your email address first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + basePath + "/account/"
      });
      if (error) throw error;
      setMessage("If password recovery is enabled, a reset link will be sent to your email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request a password reset.");
    } finally {
      setBusy(false);
    }
  };

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user) return;
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      if (error) throw error;
      setUser(data.user);
      setMessage("Your profile name has been updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your profile.");
    } finally {
      setBusy(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !supabase || !user) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Profile images must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const objectPath = user.id + "/" + crypto.randomUUID() + "-" + safeName;
      const { error: uploadError } = await supabase.storage.from("adapt-avatars").upload(objectPath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type
      });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("adapt-avatars").getPublicUrl(objectPath);
      const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: publicData.publicUrl } });
      if (error) throw error;
      setUser(data.user);
      setMessage("Your profile photo has been uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile photo upload failed. Check the avatar storage migration.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setName("");
      setMessage("You have been signed out. Your local workspace data remains on this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (user) setName(String(user.user_metadata?.full_name ?? ""));
  }, [user]);

  const avatarUrl = String(user?.user_metadata?.avatar_url ?? "");
  const displayName = String(user?.user_metadata?.full_name ?? user?.email ?? "ADAPT OS member");

  return (
    <div className="account-page">
      <div className="account-shell">
        <section className="account-intro">
          <div>
            <div className="account-brand"><span className="account-brand-mark">A+</span><span>ADAPT OS</span></div>
            <div className="eyebrow" style={{ marginTop: 48 }}>YOUR PERSONAL OPERATING ENVIRONMENT</div>
            <h1>One identity. Every part of your workspace.</h1>
            <p>Create an account to manage your ADAPT OS identity, keep your profile details together and prepare your workspace for secure cloud features.</p>
          </div>
          <div className="account-feature-list">
            <span><i>✓</i> Personal account and profile</span>
            <span><i>✓</i> Profile photo upload</span>
            <span><i>✓</i> Email and password sign-in</span>
            <span><i>✓</i> Optional cloud workspace sync</span>
          </div>
        </section>
        <section className="account-form-side">
          <div className="eyebrow">ACCOUNT CENTRE / IDENTITY</div>
          {loading ? <><h2>Checking your session</h2><p>Preparing your secure account space…</p></> : user ? (
            <div className="account-user-profile">
              <div><h2>Your account</h2><p>Manage your public profile details and profile photo.</p></div>
              <div className="account-avatar-row">
                <div className="account-avatar">{avatarUrl ? <img src={avatarUrl} alt="Profile" /> : displayName.slice(0, 1).toUpperCase()}</div>
                <div><strong>{displayName}</strong><small>{user.email}</small><label className="account-upload">{busy ? "Working…" : "Upload profile photo"}<input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={busy} onChange={uploadAvatar}/></label></div>
              </div>
              <form className="account-fields" onSubmit={saveName}>
                <label>Display name<input value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder="Your name"/></label>
                <button className="account-submit" type="submit" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save profile details"}</button>
              </form>
              <div className="account-profile-actions"><button className="danger" type="button" disabled={busy} onClick={() => void signOut()}>Sign out</button><a href={basePath + "/"}>Return to workspace</a></div>
            </div>
          ) : (
            <>
              <h2>{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
              <p>{mode === "signup" ? "Set up your ADAPT OS identity and unlock account-based features." : "Sign in to continue to your personal workspace."}</p>
              <div className="account-tabs"><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Create account</button><button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Log in</button></div>
              <form className="account-fields" onSubmit={submitAuth}>
                {mode === "signup" ? <label>Full name<input required value={name} onChange={event => setName(event.target.value)} autoComplete="name" maxLength={80} placeholder="Your name"/></label> : null}
                <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com"/></label>
                <label>Password<input required type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="At least 8 characters"/></label>
                <button className="account-submit" type="submit" disabled={busy || !supabase}>{busy ? "Please wait…" : mode === "signup" ? "Create ADAPT OS account" : "Log in securely"}</button>
              </form>
              {mode === "login" ? <button type="button" className="text-link" style={{ marginTop: 12 }} disabled={busy} onClick={() => void resetPassword()}>Forgot your password?</button> : null}
              {!supabase ? <div className="account-setup-note">Account services are not configured on this deployment yet. Add the Supabase project URL and public anonymous key, then apply the account avatar migration to enable registration, login and photo uploads.</div> : null}
            </>
          )}
          {message ? <div className="account-message" role="status">{message}</div> : null}
          <a className="account-back-link" href={basePath + "/"}>← Back to ADAPT OS workspace</a>
        </section>
      </div>
    </div>
  );
}
