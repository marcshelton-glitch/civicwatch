import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | CivicWatch",
  description:
    "How CivicWatch collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "April 24, 2026";
const CONTACT_EMAIL = "support@civicwatch.app";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-200">
      <header className="mb-10">
        <Link
          href="/"
          className="text-sm text-amber-400 hover:text-amber-300"
        >
          &larr; Back to CivicWatch
        </Link>
        <h1 className="mt-4 text-4xl font-bold text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Last updated: {LAST_UPDATED}
        </p>
      </header>

      <section className="space-y-8 leading-relaxed">
        <p>
          CivicWatch (&quot;CivicWatch,&quot; &quot;we,&quot; &quot;us,&quot;
          or &quot;our&quot;) is a civic information service that helps users
          track elected representatives, follow legislation, and stay
          informed about issues affecting their communities. This Privacy
          Policy explains what information we collect, how we use it, and
          the choices you have. By using CivicWatch, you agree to this
          policy.
        </p>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            1. Information We Collect
          </h2>
          <p className="mb-3">
            We collect the following categories of information:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account information.</strong> When you create an
              account, we collect your name, email address, and profile
              image. If you sign in through a third-party provider such as
              Google, Facebook, or Apple, we receive these details from
              that provider based on the permissions you grant.
            </li>
            <li>
              <strong>Authentication data.</strong> Account creation and
              session management are handled by our authentication
              provider, Clerk. Clerk stores credentials, session tokens,
              and related security metadata on our behalf.
            </li>
            <li>
              <strong>Usage data.</strong> We collect information about
              how you interact with CivicWatch, including representatives
              you track, polls you participate in, pages you view, and
              features you use.
            </li>
            <li>
              <strong>Billing information.</strong> If you subscribe to a
              paid plan, payment is processed by Stripe. We do not store
              full payment card numbers on our servers; Stripe stores them
              securely and provides us with a customer reference, plan
              status, and the last four digits of your card.
            </li>
            <li>
              <strong>Device and log data.</strong> We automatically
              collect information your browser or device sends when you
              use CivicWatch, including IP address, browser type,
              operating system, referring pages, and timestamps.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            2. How We Use Your Information
          </h2>
          <p className="mb-3">We use the information we collect to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Create and manage your account.</li>
            <li>
              Provide and improve CivicWatch features, including tracked
              representatives, poll results, and personalized civic
              alerts.
            </li>
            <li>Process subscription payments and send billing receipts.</li>
            <li>
              Send service-related emails, including account
              notifications, security alerts, and (if you opt in) civic
              updates.
            </li>
            <li>Detect, investigate, and prevent fraud and abuse.</li>
            <li>Comply with legal obligations.</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            3. How We Share Your Information
          </h2>
          <p className="mb-3">
            We do not sell your personal information. We share information
            only with:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Service providers</strong> who help us operate
              CivicWatch, including Clerk (authentication), Supabase
              (database hosting), Stripe (payments), Vercel (web hosting),
              and Google (Gemini) (AI features). These providers are bound by
              contracts that restrict how they can use your data.
            </li>
            <li>
              <strong>Legal authorities</strong> when required by valid
              legal process, or to protect the rights, property, or safety
              of CivicWatch, our users, or the public.
            </li>
            <li>
              <strong>Successors</strong> in connection with a merger,
              acquisition, or sale of assets, with notice to you when
              required by law.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            4. Data from Facebook, Google, and Apple Sign-In
          </h2>
          <p>
            When you sign in using Facebook, Google, or Apple, we receive
            your name, email address, and profile picture from that
            provider. We use this information solely to create and
            authenticate your CivicWatch account. We do not post to your
            social accounts, access your contacts, or share data back to
            those providers beyond what is required for authentication.
            You can disconnect a third-party login at any time from your
            account settings, and you can revoke our access from your
            provider&apos;s app settings (for example, Facebook &rarr;
            Settings &rarr; Apps and Websites).
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            5. Cookies and Similar Technologies
          </h2>
          <p>
            CivicWatch uses cookies and similar technologies to keep you
            signed in, remember preferences, and measure how the service
            is used. You can control cookies through your browser
            settings, but disabling them may affect functionality such as
            staying signed in.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            6. Data Retention
          </h2>
          <p>
            We retain your account information for as long as your
            account is active. If you delete your account, we delete or
            anonymize your personal information within 30 days, except
            where we are required to retain it for legal, tax, or fraud
            prevention purposes. See our{" "}
            <Link
              href="/data-deletion"
              className="text-amber-400 hover:text-amber-300 underline"
            >
              Data Deletion Instructions
            </Link>{" "}
            for details on how to request deletion.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            7. Your Rights
          </h2>
          <p className="mb-3">
            Depending on where you live, you may have the right to:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Access the personal information we hold about you.</li>
            <li>Correct inaccurate information.</li>
            <li>Delete your account and associated data.</li>
            <li>Export your data in a portable format.</li>
            <li>
              Opt out of marketing communications at any time by clicking
              the unsubscribe link in any email we send.
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-amber-400 hover:text-amber-300 underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            8. Security
          </h2>
          <p>
            We use industry-standard technical and organizational measures
            to protect your information, including TLS encryption in
            transit, encryption at rest for sensitive data, and strict
            access controls. No system is 100% secure, however, and we
            cannot guarantee the absolute security of your data.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            9. Children&apos;s Privacy
          </h2>
          <p>
            CivicWatch is not directed to children under 13. We do not
            knowingly collect personal information from children under 13.
            If you believe a child has provided us with personal
            information, please contact us and we will delete it.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. When we
            do, we will revise the &quot;Last updated&quot; date at the
            top of this page. If the changes are material, we will notify
            you by email or through a notice in the app.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            11. Contact Us
          </h2>
          <p>
            If you have questions about this Privacy Policy or our data
            practices, contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-amber-400 hover:text-amber-300 underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>

      <footer className="mt-16 border-t border-slate-800 pt-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-amber-400">
          CivicWatch
        </Link>
        {" · "}
        <Link href="/terms" className="hover:text-amber-400">
          Terms of Service
        </Link>
        {" · "}
        <Link href="/data-deletion" className="hover:text-amber-400">
          Data Deletion
        </Link>
      </footer>
    </main>
  );
}