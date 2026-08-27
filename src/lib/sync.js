/* Account sync — the only file that imports @supabase/supabase-js. Everything
   here is optional: with no Supabase env vars set, every export below is a
   safe no-op and the app behaves exactly as it does today, localStorage-only.
   See plans/user-accounts-auth.md for the shape this follows.

   storage.js keeps owning localStorage — this module only adds a second,
   best-effort destination on top of it. A local save never blocks on the
   network: saveSnapshot() in CharacterCreator.jsx writes localStorage first,
   unconditionally, then fires pushCharacter() here without awaiting it. */

import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/* null when the env vars aren't set — every function below checks this and
   degrades to a no-op rather than throwing, the same "lazy/optional" pattern
   already used for PDF export and fonts (see CLAUDE.md's Export section). */
export const supabase = URL && ANON_KEY ? createClient(URL, ANON_KEY) : null;

export const syncEnabled = !!supabase;

/* --------------------------------------------------------------------
   SESSION
   -------------------------------------------------------------------- */

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/* Fires `callback(session)` immediately with the current session, then again
   on every sign-in/sign-out/token refresh. Returns an unsubscribe function;
   a no-op unsubscribe when sync is disabled, so callers don't need to branch. */
export function onSessionChange(callback) {
  if (!supabase) {
    callback(null);
    return () => {};
  }
  supabase.auth.getSession().then(({ data }) => callback(data.session));
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => sub.subscription.unsubscribe();
}

export async function signInWithGoogle() {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/* --------------------------------------------------------------------
   CHARACTER SYNC
   One row per signed-in user for now — plans/user-accounts-auth.md flags
   "multiple characters per account" as later scope, not bundled in here.
   -------------------------------------------------------------------- */

/* Fire-and-forget: called from saveSnapshot's effect, never awaited there.
   Last-write-wins via `updated_at` — no merge logic, matches the plan's v1. */
export async function pushCharacter(userId, snapshot) {
  if (!supabase || !userId) return;
  await supabase.from("characters").upsert(
    { user_id: userId, data: snapshot, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
}

/* Returns the server row's snapshot (`.data`) plus its timestamp, or null if
   the account has never synced a character. Callers compare `updatedAt`
   against their local snapshot's own to decide which one wins — this module
   doesn't do that comparison itself, storage.js's shape isn't its business. */
export async function pullCharacter(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("characters")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { snapshot: data.data, updatedAt: data.updated_at };
}
