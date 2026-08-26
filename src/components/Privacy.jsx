import React from "react";

/* Standalone screen — NOT one of the 9 wizard steps (see src/lib/steps.js).
   Reached from a footer link; CharacterCreator swaps its whole body for this
   component while open, then swaps back. Same pattern as AddRuleset.jsx.

   FIRST-PASS DRAFT. Not reviewed by an attorney/compliance professional. See
   plans/legal-aspects.md Section 4 and 7: this is written as good-faith
   disclosure appropriate at small scale, not full GDPR/CCPA compliance
   machinery — that threshold call is flagged there for review as the user
   base grows, especially if a meaningful EU/CA audience is expected. */

const LAST_UPDATED = "2026-08-26";

export default function Privacy({ onBack }) {
  return (
    <div className="byo-root">
      <div className="byo-wrap">
        <button className="byo-linkbtn" onClick={onBack} style={{ marginBottom: 14 }}>← Back</button>
        <h1 className="byo-h1">Privacy Policy</h1>
        <p className="byo-h2">Bring Your Own 5e</p>

        <div className="byo-panel byo-legal-draftnote">
          <p className="byo-warn" style={{ margin: 0 }}>
            <strong>Draft — pending attorney review.</strong> This is a good-faith first draft,
            written to disclose what's actually collected and why — not full GDPR/CCPA
            compliance machinery. Whether that lighter approach is still appropriate should be
            revisited as the user base grows, particularly for EU/California users at meaningful
            scale (see <code>plans/legal-aspects.md</code>). Last updated {LAST_UPDATED}.
          </p>
        </div>

        <div className="byo-panel">
          <h3>1. What this covers</h3>
          <p className="byo-note">
            This Privacy Policy explains what information Bring Your Own 5e ("the Service",
            "we", "us") collects when you use it, why, and what you can do about it. Using the
            Service without an account collects nothing on our servers — everything stays in
            your browser (see Section 4). Creating an account, uploading a ruleset, or saving a
            character to your account is what triggers the collection described below.
          </p>
        </div>

        <div className="byo-panel">
          <h3>2. What we collect</h3>
          <p className="byo-note"><strong>Account information.</strong> If you create an
            account, our authentication provider (Supabase Auth, see Section 3) collects your
            email address and manages your sign-in credentials. We don't see or store your
            password ourselves — Supabase handles that.
          </p>
          <p className="byo-note" style={{ marginTop: 10 }}><strong>Content you create or
            upload.</strong> Characters you build and, once server-side ruleset upload lands,
            ruleset JSON files you upload — stored today via Supabase (Postgres + Storage), and
            planned to move to Cloudflare (D1 + R2) as the service scales, per{" "}
            <code>plans/hosting-infrastructure.md</code>. This is content you actively created or
            chose to upload; we don't infer or generate anything about you from it.
          </p>
          <p className="byo-note" style={{ marginTop: 10 }}><strong>What we don't collect.</strong>
            No analytics or tracking scripts run in the app as of {LAST_UPDATED}. We don't
            collect payment information (the Service is free), and we don't sell or rent your
            information to anyone.
          </p>
        </div>

        <div className="byo-panel">
          <h3>3. Third parties who process your data</h3>
          <p className="byo-note">
            We use a small number of infrastructure providers ("sub-processors") to run the
            Service. We don't hand your data to anyone beyond what's needed to operate it:
          </p>
          <ul className="byo-note byo-legal-list">
            <li><strong>Supabase</strong> — authentication (email + credentials), Postgres
              database (characters, ruleset metadata), and file storage (uploaded ruleset JSON).
              See Supabase's privacy policy at{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer noopener">
                supabase.com/privacy
              </a>.</li>
            <li><strong>Cloudflare</strong> — hosts the Service itself (Cloudflare Pages), and
              is planned to run server-side upload validation and storage (Workers, D1, R2, KV)
              as that infrastructure lands, per <code>plans/hosting-infrastructure.md</code>. See
              Cloudflare's privacy policy at{" "}
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer noopener">
                cloudflare.com/privacypolicy
              </a>.</li>
          </ul>
          <p className="byo-note" style={{ marginTop: 10 }}>
            Both providers may process data outside your country of residence. Neither is
            authorized to use your data for anything beyond providing their service to us.
          </p>
        </div>

        <div className="byo-panel">
          <h3>4. Local storage and cookies</h3>
          <p className="byo-note">
            The Service stores data directly in your browser, separate from anything on our
            servers:
          </p>
          <ul className="byo-note byo-legal-list">
            <li>Your in-progress character is written to your browser's <code>localStorage</code>
              {" "}(<code>src/lib/storage.js</code>) so it survives a page reload without needing
              an account. This never leaves your browser unless you're signed in and syncing, or
              you export/save the file yourself.</li>
            <li>If you sign in, Supabase's client library stores your session token (a JWT) in
              <code>localStorage</code> as well, so you stay signed in between visits.</li>
          </ul>
          <p className="byo-note" style={{ marginTop: 10 }}>
            We don't use tracking cookies or third-party advertising cookies. This storage is
            functionally necessary for the app to work, not used for tracking across other
            sites.
          </p>
        </div>

        <div className="byo-panel">
          <h3>5. Why we collect it</h3>
          <p className="byo-note">
            Strictly to operate the Service: authenticating you, saving your characters and
            rulesets so they're available across devices and sessions, and (once sharing lands)
            showing content to the other users you choose to share it with. We don't use your
            data for advertising, and we don't build behavioral profiles.
          </p>
        </div>

        <div className="byo-panel">
          <h3>6. Retention and deletion</h3>
          <p className="byo-note">
            We keep your account and content for as long as your account is active. You can
            request deletion of your account and all associated data (characters, uploaded
            rulesets, and account information) at any time by contacting us at the address in
            Section 8. We'll delete it within a reasonable time, except where we're legally
            required to retain something (uncommon for this kind of data) or where a brief
            backup copy persists until it naturally rotates out.
          </p>
        </div>

        <div className="byo-panel">
          <h3>7. Your rights (GDPR/CCPA-style disclosure)</h3>
          <p className="byo-note">
            Regardless of where you're located, you can ask us to: tell you what data we hold
            about you, correct it, delete it, or export a copy of it (your character data is
            already exportable as a <code>.json</code> file from within the app at any time,
            without needing to ask). Contact us at the address in Section 8 to make any of these
            requests.
          </p>
          <p className="byo-note" style={{ marginTop: 10 }}>
            This is a good-faith disclosure appropriate for a small service, not a formal GDPR
            Data Subject Request process or CCPA "Do Not Sell" mechanism with dedicated tooling
            — we don't sell data, and per-user deletion is straightforward given how Supabase's
            row-level security scopes data to your account. If the Service grows to a scale
            where formal compliance machinery (data processing agreements with our
            sub-processors, a cookie consent banner, structured request handling) is warranted,
            we'll build it and update this policy.
          </p>
        </div>

        <div className="byo-panel">
          <h3>8. Contact</h3>
          <p className="byo-note">
            Questions about this policy, or a data access/deletion request:{" "}
            <strong>privacy@bringyourown5e.example</strong> (placeholder — TBD, no real mailbox
            exists yet; replace before this policy is relied on).
          </p>
        </div>

        <div className="byo-panel">
          <h3>9. Changes to this policy</h3>
          <p className="byo-note">
            We may update this policy as the Service's data practices change — for example, as
            accounts, uploads, and the Cloudflare D1/R2/KV infrastructure in{" "}
            <code>plans/hosting-infrastructure.md</code> land. We'll update the "last updated"
            date above when we do.
          </p>
        </div>
      </div>
    </div>
  );
}
