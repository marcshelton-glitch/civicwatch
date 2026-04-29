import Link from "next/link";

export const metadata = {
  title: "Data Deletion Instructions | CivicWatch",
  description:
    "How to delete your CivicWatch account and request removal of your personal data.",
};

const LAST_UPDATED = "April 24, 2026";
const CONTACT_EMAIL = "support@civicwatch.app";

export default function DataDeletionPage() {
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
          Data Deletion Instructions
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Last updated: {LAST_UPDATED}
        </p>
      </header>

      <section className="space-y-8 leading-relaxed">
        <p>
          You have the right to delete your CivicWatch account and the
          personal information associated with it at any time. This page
          explains the two ways to do that and what happens to your data
          afterward.
        </p>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            Option 1: Delete Your Account In-App
          </h2>
          <p className="mb-3">
            The fastest way to delete your account is from your account
            settings:
          </p>
          <ol className="list-decimal space-y-2 pl-6">
            <li>
              Sign in to{" "}
              <Link
                href="/sign-in"
                className="text-amber-400 hover:text-amber-300 underline"
              >
                CivicWatch
              </Link>
              .
            </li>
            <li>
              Go to your <strong>Account Settings</strong> page.
            </li>
            <li>
              Scroll to the <strong>Danger Zone</strong> section.
            </li>
            <li>
              Click <strong>Delete Account</strong> and confirm when
              prompted.
            </li>
          </ol>
          <p className="mt-3">
            Your account will be deactivated immediately and your personal
            data will be permanently deleted within 30 days.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            Option 2: Request Deletion by Email
          </h2>
          <p className="mb-3">
            If you cannot access your account, or if you signed up using
            Facebook, Google, or Apple and need help removing your data,
            send an email to{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=CivicWatch%20Data%20Deletion%20Request`}
              className="text-amber-400 hover:text-amber-300 underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            with the following information:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>The subject line: <em>CivicWatch Data Deletion Request</em></li>
            <li>The email address associated with your CivicWatch account</li>
            <li>
              The sign-in method you used (email + password, Google,
              Facebook, or Apple)
            </li>
          </ul>
          <p className="mt-3">
            We will verify your request and complete deletion within 30
            days. We will email you when the deletion is complete.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            Revoking Access from Facebook
          </h2>
          <p className="mb-3">
            If you signed in to CivicWatch using Facebook and want to
            revoke our access to your Facebook account in addition to
            deleting your CivicWatch data, follow these steps:
          </p>
          <ol className="list-decimal space-y-2 pl-6">
            <li>
              Go to your Facebook{" "}
              <a
                href="https://www.facebook.com/settings?tab=applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline"
              >
                Apps and Websites settings
              </a>
              .
            </li>
            <li>Find <strong>CivicWatch</strong> in the list of active apps.</li>
            <li>
              Click <strong>Remove</strong> to revoke access. You can
              optionally check the box to delete posts, photos, and videos
              that the app may have created on Facebook (CivicWatch does
              not create any).
            </li>
          </ol>
          <p className="mt-3">
            Revoking access from Facebook stops Facebook from sharing
            future data with CivicWatch, but it does not delete the data
            we have already received. To delete that data, use Option 1 or
            Option 2 above.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            What Gets Deleted
          </h2>
          <p className="mb-3">When we process your deletion request, we remove:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Your name, email address, and profile image</li>
            <li>Your authentication credentials and sign-in history</li>
            <li>Your tracked representatives and saved preferences</li>
            <li>Your poll votes and activity history</li>
            <li>
              Any other personal information stored in your CivicWatch
              account
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            What We May Retain
          </h2>
          <p className="mb-3">
            We may retain a limited amount of information after deletion
            for legal, security, or fraud-prevention reasons, including:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Billing and transaction records, which are retained by
              Stripe and CivicWatch as required by tax and accounting
              laws.
            </li>
            <li>
              Anonymized usage analytics that no longer identify you
              personally.
            </li>
            <li>
              Records of past abuse or fraud, where required to protect
              CivicWatch and other users.
            </li>
          </ul>
          <p className="mt-3">
            These limited records are retained only for as long as
            necessary to meet the legal or operational purpose, and they
            are not used for marketing or any other purpose.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-semibold text-white">
            Questions?
          </h2>
          <p>
            If you have any questions about deleting your data or this
            process, contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-amber-400 hover:text-amber-300 underline"
            >
              {CONTACT_EMAIL}
            </a>
            . You can also review our{" "}
            <Link
              href="/privacy"
              className="text-amber-400 hover:text-amber-300 underline"
            >
              Privacy Policy
            </Link>{" "}
            for more information about how we handle your data.
          </p>
        </div>
      </section>

      <footer className="mt-16 border-t border-slate-800 pt-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-amber-400">
          CivicWatch
        </Link>
        {" · "}
        <Link href="/privacy" className="hover:text-amber-400">
          Privacy Policy
        </Link>
        {" · "}
        <Link href="/terms" className="hover:text-amber-400">
          Terms of Service
        </Link>
      </footer>
    </main>
  );
}