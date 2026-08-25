import React from "react";
import { createRoot } from "react-dom/client";
import CharacterCreator from "./CharacterCreator.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { STYLES } from "./styles.js";

/* The outer boundary catches what the wizard's own can't: a throw during
   state setup, in the sheet context, or in the boundary-less chrome around
   the steps. Its fallback needs the stylesheet, which the app itself would
   normally mount — so it goes in here, above the thing that might fail. */
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <style>{STYLES}</style>
    <ErrorBoundary title="The character creator crashed">
      <CharacterCreator />
    </ErrorBoundary>
  </React.StrictMode>
);
