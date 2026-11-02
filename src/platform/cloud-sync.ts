import { supabase } from "./supabase";

export type CloudWorkspaceSnapshot = {
  tasks: unknown[];
  notes: unknown[];
  research: unknown[];
  study: unknown[];
  profile: Record<string, unknown>;
  updatedAt: string;
};

export const cloudSyncAvailable = () => Boolean(supabase);

export const sendWorkspaceMagicLink = async (email: string) => {
  if (!supabase) throw new Error("Cloud services are not configured.");
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Enter a valid email address.");
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: typeof window === "undefined" ? undefined : window.location.origin }
  });
  if (error) throw error;
};

export const getCloudUser = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

export const signOutCloud = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const syncWorkspaceSnapshot = async (snapshot: CloudWorkspaceSnapshot) => {
  if (!supabase) throw new Error("Cloud services are not configured.");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sign in before syncing your workspace.");
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", userData.user.id)
    .limit(1)
    .maybeSingle();
  if (workspaceError) throw workspaceError;
  let workspaceId = workspace?.id;
  if (!workspaceId) {
    const { data: created, error: createError } = await supabase
      .from("workspaces")
      .insert({ owner_id: userData.user.id })
      .select("id")
      .single();
    if (createError) throw createError;
    workspaceId = created.id;
  }
  const { error } = await supabase.from("workspace_snapshots").upsert({
    workspace_id: workspaceId,
    owner_id: userData.user.id,
    snapshot,
    updated_at: new Date().toISOString()
  }, { onConflict: "workspace_id" });
  if (error) throw error;
};
