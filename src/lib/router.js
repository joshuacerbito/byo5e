/* Minimal client-side router — no react-router dependency, consistent
   with this app's hand-rolled-over-library ethos (sync.js wraps
   @supabase/supabase-js directly, no state-management/UI-kit anywhere
   else either). Just enough to give each screen a real, bookmarkable,
   browser-back/forward-able URL instead of a local boolean flag:
   read location.pathname, listen for popstate, navigate() pushes or
   replaces history. Cloudflare Pages needs public/_redirects'
   `/* /index.html 200` rule for a direct/refreshed load of a
   non-root path to resolve to this app at all — see that file. */
import { useState, useEffect } from "react";

export function navigate(path, { replace = false } = {}) {
  if (window.location.pathname === path) return;
  if (replace) window.history.replaceState({}, "", path);
  else window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* Real browser Back — not a hardcoded navigate("/") — so a screen
   reached from Splash returns to Splash and the same screen reached
   from the wizard returns to the wizard, one history entry either
   way. Falls back to "/" only when there's nowhere to go back to (a
   fresh tab deep-linked straight to the screen). */
export function goBack() {
  if (window.history.length > 1) window.history.back();
  else navigate("/", { replace: true });
}

export function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}
