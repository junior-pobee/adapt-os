"use client";

import { useEffect, useState } from "react";
import { cloudSyncAvailable, getCloudUser, restoreWorkspaceSnapshot, sendWorkspaceMagicLink, signOutCloud, syncWorkspaceSnapshot } from "@/platform/cloud-sync";
import type { CloudWorkspaceSnapshot } from "@/platform/cloud-sync";

export function CloudAccountPanel({ snapshot, onRestore }: { snapshot: CloudWorkspaceSnapshot; onRestore: (snapshot: CloudWorkspaceSnapshot) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const configured = cloudSyncAvailable();

  useEffect(() => {
    let active = true;
    void getCloudUser().then(user => { if (active) setUserEmail(user?.email ?? null); }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : "Could not check cloud account."); });
    return () => { active = false; };
  }, []);

  const connect = async () => {
    setBusy(true); setMessage("");
    try {
      await sendWorkspaceMagicLink(email);
      setMessage("Sign-in link sent. Check your email to finish connecting.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send sign-in link.");
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    setBusy(true); setMessage("");
    try {
      await syncWorkspaceSnapshot(snapshot);
      setMessage("Workspace snapshot synced to your cloud account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cloud sync failed.");
    } finally {
      setBusy(false);
    }
  };


  const restore = async () => {
    if (!window.confirm("Restore the saved cloud workspace? This replaces your current profile, tasks, notes, research and study plan. Your local File Vault is kept.")) return;
    setBusy(true); setMessage("");
    try {
      const cloudSnapshot = await restoreWorkspaceSnapshot();
      await onRestore(cloudSnapshot);
      setMessage("Cloud workspace restored. Your local File Vault was preserved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not restore cloud workspace.");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true); setMessage("");
    try {
      await signOutCloud();
      setUserEmail(null);
      setMessage("Signed out. Your local workspace remains on this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel cloud-account-panel">
      <div className="eyebrow">OPTIONAL CLOUD ACCOUNT</div>
      <h2>Multi-device workspace</h2>
      {!configured ? <div className="notice">Cloud sync is not configured. Add the Supabase project URL and public anonymous key to the deployment environment, then apply the database migrations. No private service key belongs in browser settings.</div> : userEmail ? <>
        <div className="status-line"><span>Connected account</span><strong>{userEmail}</strong></div>
        <p>Your local workspace remains available. Sync sends profile, tasks, notes, research and study plans. File contents are not included.</p>
        <div className="hero-actions"><button className="primary" disabled={busy} onClick={() => void sync()}>{busy ? "Working…" : "Upload local changes"}</button><button className="secondary" disabled={busy} onClick={() => void restore()}>Restore cloud copy</button><button className="secondary" disabled={busy} onClick={() => void disconnect()}>Sign out</button></div>
      </> : <>
        <p>Connect using a one-time email sign-in link. Cloud features remain optional.</p>
        <label className="cloud-email-field">Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label>
        <button className="primary" disabled={busy || !email.trim()} onClick={() => void connect()}>{busy ? "Sending…" : "Send sign-in link"}</button>
      </>}
      {message ? <p className="finance-message" role="status">{message}</p> : null}
    </section>
  );
}
