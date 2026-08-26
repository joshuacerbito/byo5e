import React from "react";

/* Standalone screen — NOT one of the 9 wizard steps (see src/lib/steps.js).
   Reached from a footer link; CharacterCreator swaps its whole body for this
   component while open, then swaps back. Same pattern as AddRuleset.jsx.

   FIRST-PASS DRAFT. Not reviewed by an attorney. See plans/legal-aspects.md
   Section 3 and 7: the user-content indemnification clause below is flagged
   there as needing a real legal pass before it's load-bearing. This exists
   so the accounts/upload feature (plans/user-accounts-auth.md,
   plans/hosting-infrastructure.md) has something real to point users at
   while it lands — not a placeholder stub. */

const LAST_UPDATED = "2026-08-26";

export default function Terms({ onBack }) {
  return (
    <div className="byo-root">
      <div className="byo-wrap">
        <button className="byo-linkbtn" onClick={onBack} style={{ marginBottom: 14 }}>← Back</button>
        <h1 className="byo-h1">Terms of Service</h1>
        <p className="byo-h2">Bring Your Own 5e</p>

        <div className="byo-panel byo-legal-draftnote">
          <p className="byo-warn" style={{ margin: 0 }}>
            <strong>Draft — pending attorney review.</strong> This is a good-faith first draft,
            not placeholder text — but it has not been reviewed by a lawyer. The user-content
            indemnification clause (Section 3) in particular is flagged internally as needing
            that review before it's treated as load-bearing. Last updated {LAST_UPDATED}.
          </p>
        </div>

        <div className="byo-panel">
          <h3>1. What this is</h3>
          <p className="byo-note">
            Bring Your Own 5e ("the Service", "we", "us") is a web-based character builder for
            the 5th Edition tabletop role-playing game rules. These Terms of Service ("Terms")
            govern your use of the Service, including any account you create, any content you
            upload, and any content the Service generates or stores on your behalf. By creating
            an account, uploading content, or otherwise using the Service, you agree to these
            Terms. If you don't agree, don't use the Service.
          </p>
          <p className="byo-note" style={{ marginTop: 10 }}>
            <strong>Not affiliated with Wizards of the Coast.</strong> Bring Your Own 5e is an
            unofficial, fan-made tool. It is not affiliated with, endorsed, sponsored, or
            specifically approved by Wizards of the Coast LLC. The Service ships content only
            from the System Reference Document (SRD 5.1 and SRD 5.2.1), licensed by Wizards of
            the Coast LLC under the Creative Commons Attribution 4.0 International License
            (CC-BY-4.0). See <code>NOTICE.md</code> in the project source, or the attribution
            notice shown on the Ruleset step, for the exact license text.
          </p>
        </div>

        <div className="byo-panel">
          <h3>2. Your content — license and ownership</h3>
          <p className="byo-note">
            "User Content" means any ruleset, homebrew data, character, or other material you
            upload to or create through the Service. You own your User Content. Nothing in
            these Terms transfers ownership of it to us.
          </p>
          <p className="byo-note" style={{ marginTop: 10 }}>
            By uploading or creating User Content, you grant us a worldwide, non-exclusive,
            royalty-free license to host, store, reproduce, and display that User Content back
            to you, and to process it as needed to operate the Service (for example: parsing it
            to build a character sheet, converting it for export, or caching it for performance).
            This license exists solely to let us run the Service for you.
          </p>
          <p className="byo-note" style={{ marginTop: 10 }}>
            <strong>Sharing.</strong> If and when the Service adds a feature that lets you share
            a ruleset or character with other users (a "Sharing Feature"), the license above
            extends — only for content you affirmatively mark as shared, and only for as long as
            you keep it shared — to also display that content to the other users you choose, or
            to all users if you choose public sharing. You control this: content you never mark
            as shared is never shown to anyone but you. As of {LAST_UPDATED}, no Sharing Feature
            has shipped; this paragraph describes how the license will work once one does.
          </p>
          <p className="byo-note" style={{ marginTop: 10 }}>
            This license ends when you delete the User Content or your account, except for
            copies briefly kept in backups, or copies another user already has if you had
            shared the content before deleting it.
          </p>
        </div>

        <div className="byo-panel">
          <h3>3. Your warranty of rights, and indemnification</h3>
          <p className="byo-note">
            <strong>You represent and warrant</strong> that you own, or have all necessary
            rights and permissions for, any User Content you upload — including that uploading
            it, and having the Service store, process, and (where you choose to share it)
            display it, does not infringe any third party's copyright, trademark, or other
            rights. This is the same representation the "I confirm I own the rights to this
            content, or it's my own homebrew" checkbox on the ruleset-upload screen
            (<code>src/components/AddRuleset.jsx</code>) asks you to make — that checkbox is
            where this warranty becomes something you actively affirm, not just fine print.
            Don't upload a publisher's copyrighted rules text you don't have rights to; homebrew
            content you wrote yourself, or content you have an actual license to use, is fine.
          </p>
          <p className="byo-note" style={{ marginTop: 10 }}>
            <strong>Indemnification.</strong> To the extent permitted by law, you agree to
            defend, indemnify, and hold harmless Bring Your Own 5e and its operator from any
            claim, demand, loss, liability, or expense (including reasonable legal fees) arising
            out of or related to: (a) User Content you upload, to the extent it infringes or
            misappropriates a third party's rights; (b) your breach of the warranty in this
            Section; or (c) your violation of these Terms. We reserve the right, at our own
            expense, to assume the exclusive defense of any matter otherwise subject to
            indemnification by you, in which case you agree to cooperate with that defense.
          </p>
          <p className="byo-warn" style={{ marginTop: 10 }}>
            This clause is exactly what <code>plans/legal-aspects.md</code> flags as needing an
            attorney pass before it's relied on for real — its scope and enforceability,
            especially once a Sharing Feature is live, should be reviewed before this document
            is treated as final.
          </p>
        </div>

        <div className="byo-panel">
          <h3>4. Acceptable use</h3>
          <p className="byo-note">You agree not to, and not to attempt to:</p>
          <ul className="byo-note byo-legal-list">
            <li>Upload malware, executable code, or any file crafted to exploit the Service, its
              upload endpoint, or its schema validator, rather than to represent a legitimate
              ruleset or character.</li>
            <li>Probe, fuzz, or abuse the upload endpoint or schema validator beyond normal use —
              including attempts to bypass size, rate, or format limits.</li>
            <li>Scrape, bulk-download, or redistribute other users' shared rulesets or characters
              outside the app, or otherwise access the Service by means other than its own
              interface and any API we publish for that purpose.</li>
            <li>Impersonate another user, or upload content that infringes another person's
              rights, is unlawful, or violates the warranty in Section 3.</li>
            <li>Interfere with or disrupt the Service, its infrastructure, or other users'
              access to it.</li>
          </ul>
        </div>

        <div className="byo-panel">
          <h3>5. Disclaimer of warranties</h3>
          <p className="byo-note">
            The Service is provided <strong>"as is" and "as available"</strong>, without
            warranties of any kind, whether express, implied, or statutory, including implied
            warranties of merchantability, fitness for a particular purpose, and
            non-infringement. We don't warrant that the Service will be uninterrupted,
            error-free, or that any character sheet, calculation, or export it produces is
            accurate or fit for any particular game table's rules. You use it at your own risk.
          </p>
        </div>

        <div className="byo-panel">
          <h3>6. Limitation of liability</h3>
          <p className="byo-note">
            To the maximum extent permitted by law, in no event will Bring Your Own 5e or its
            operator be liable for any indirect, incidental, special, consequential, or punitive
            damages, or any loss of data, arising out of or related to your use of the Service,
            even if advised of the possibility of such damages. Our total liability for any
            claim arising out of these Terms or the Service will not exceed the amount you paid
            us, if any, in the twelve months before the claim arose — which for a free service
            is typically zero.
          </p>
        </div>

        <div className="byo-panel">
          <h3>7. Termination</h3>
          <p className="byo-note">
            We may suspend or terminate your account, or remove specific User Content, at any
            time if we reasonably believe you've violated these Terms — including the acceptable
            use rules in Section 4, the rights warranty in Section 3, or in response to a
            credible copyright complaint (see Section 8). Where practical we'll try to notify
            you of the reason. You may stop using the Service and delete your account at any
            time; see the Privacy Policy for how to request deletion of your data.
          </p>
        </div>

        <div className="byo-panel">
          <h3>8. Copyright complaints / reporting</h3>
          <p className="byo-note">
            If you believe content on the Service infringes your copyright or other rights,
            contact us at <strong>legal@bringyourown5e.example</strong> (placeholder — TBD, no
            real mailbox exists yet; replace before this policy is relied on) with a description
            of the content, its location in the Service, and your contact information. We'll
            review and, where warranted, remove or disable access to the reported content. A
            fuller DMCA-style takedown process — including a designated agent registered with
            the U.S. Copyright Office — is planned before any sharing/marketplace feature ships;
            today's upload flow is single-user and inert server-side, so this is a good-faith
            placeholder rather than a mature process yet.
          </p>
        </div>

        <div className="byo-panel">
          <h3>9. Changes to these Terms</h3>
          <p className="byo-note">
            We may update these Terms as the Service changes — for example, when accounts,
            uploads, or sharing move from planned to shipped. We'll update the "last updated"
            date above when we do. Continuing to use the Service after a change means you accept
            the updated Terms.
          </p>
        </div>

        <div className="byo-panel">
          <h3>10. Contact</h3>
          <p className="byo-note">
            Questions about these Terms: <strong>legal@bringyourown5e.example</strong>
            {" "}(placeholder — TBD).
          </p>
        </div>
      </div>
    </div>
  );
}
