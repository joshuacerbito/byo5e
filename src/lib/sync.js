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
   PROFILE (plan / character limit)
   -------------------------------------------------------------------- */

/* `character_limit` defaults to 3 in the database (free tier) — see
   plans/user-accounts-auth.md. A profile row is created automatically by
   a trigger on sign-up, so this should always resolve to a row; the
   fallback below only covers a brand-new account whose trigger hasn't
   caught up yet, not a real source of truth for the number. */
export async function getProfile(userId) {
  if (!supabase || !userId) return { characterLimit: 3 };
  const { data } = await supabase
    .from("profiles")
    .select("character_limit")
    .eq("user_id", userId)
    .maybeSingle();
  return { characterLimit: data?.character_limit ?? 3 };
}

/* --------------------------------------------------------------------
   CHARACTER SYNC
   One row per saved character, several per account (up to the account's
   character_limit — enforced in the database by the "insert own
   characters within limit" RLS policy, not just checked here; a client
   that skipped this call entirely would still be turned away at insert).
   -------------------------------------------------------------------- */

/* id, name, and timestamps only — enough for a list view. Full `data` is
   fetched separately (getCharacter) only once something is actually being
   opened, not for every row in the list. */
export async function listCharacters(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from("characters")
    .select("id, name, updated_at, created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return error ? [] : data;
}

export async function getCharacter(characterId) {
  if (!supabase || !characterId) return null;
  const { data, error } = await supabase
    .from("characters")
    .select("id, name, data, updated_at")
    .eq("id", characterId)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, name: data.name, snapshot: data.data, updatedAt: data.updated_at };
}

/* Saves the wizard's current state as a NEW account character. This is the
   one-directional "back up what I'm looking at right now" action — it does
   not load anything back into the wizard, so it doesn't need the "apply a
   snapshot to every field" machinery that restoring a saved character
   would (see the CharacterCreator.jsx note on AUTH_UI_ENABLED history).

   Returns { character } on success, or { error: "limit_reached" } if the
   account is already at its character_limit — the RLS insert policy
   rejects the row and this turns that into something callers can show a
   real message for instead of a raw Postgres error. */
export async function createCharacter(userId, name, snapshot) {
  if (!supabase || !userId) return { error: "sync_disabled" };
  const { data, error } = await supabase
    .from("characters")
    .insert({ user_id: userId, name: name || "Unnamed", data: snapshot, updated_at: new Date().toISOString() })
    .select("id, name, updated_at")
    .single();
  if (error) return { error: error.code === "42501" ? "limit_reached" : "unknown" };
  return { character: data };
}

export async function updateCharacter(characterId, snapshot, name) {
  if (!supabase || !characterId) return false;
  const patch = { data: snapshot, updated_at: new Date().toISOString() };
  if (name != null) patch.name = name;
  const { error } = await supabase.from("characters").update(patch).eq("id", characterId);
  return !error;
}

export async function deleteCharacter(characterId) {
  if (!supabase || !characterId) return false;
  const { error } = await supabase.from("characters").delete().eq("id", characterId);
  return !error;
}
