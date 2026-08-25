import React from "react";
import { STORAGE_KEY } from "../lib/storage.js";

/* A render error used to take the whole page down to white, which on a
   phone at the table is indistinguishable from the app being gone. Worse,
   the character that caused it is still in localStorage, so every reload
   crashes the same way and the only exit is clearing site data — taking
   the character with it.

   So the fallback does two things beyond apologising: it hands over the
   raw save as a file (nothing is lost even if the only way forward is a
   reset), and it offers the reset itself. Two boundaries use it — one at
   the root, one around the wizard body, so a step that throws leaves the
   step rail and the ability strip standing. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    /* The stack is the only diagnostic there is — no server, no logging. */
    console.error("Character creator crashed:", error, info?.componentStack);
  }

  downloadSave = () => {
    let raw = "";
    try {
      raw = localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      /* storage unavailable — the button just produces an empty file,
         which still tells the user there was nothing to rescue */
    }
    const url = URL.createObjectURL(new Blob([raw], { type: "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "character-save.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  startOver = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore — the reload below is still worth trying */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="byo-crash">
        <div className="byo-panel">
          <h3>{this.props.title || "Something broke"}</h3>
          <p className="byo-warn">
            The app hit an error it couldn't recover from. Your character is still saved
            on this device.
          </p>
          <p className="byo-note">
            Save a copy before anything else — starting over wipes it.
          </p>
          <div className="byo-export-alt">
            <button className="byo-btn byo-btn-go" onClick={this.downloadSave}>
              Download my character data
            </button>
            <button className="byo-btn byo-btn-danger" onClick={this.startOver}>
              Start over
            </button>
          </div>
          <p className="byo-crash-msg">{String(this.state.error?.message || this.state.error)}</p>
        </div>
      </div>
    );
  }
}
