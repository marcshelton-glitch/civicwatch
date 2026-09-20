// This file configures the initialization of Sentry on the client.
// It runs before the app becomes interactive, which is exactly why the
// non-essential parts must be held back: there is no consent to read yet.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { effectiveConsent, onConsentChange } from "@/lib/consent";

Sentry.init({
  dsn: "https://1ed5feb1a9b8520ce22d9deae1a1a49b@o4511420226142208.ingest.us.sentry.io/4511420372877312",
  tunnel: '/monitoring',

  // Session Replay records the user's screen, and sendDefaultPii attaches
  // identifying data. Both are non-essential and are added in attachReplay()
  // only once the user opts into analytics. Plain error capture stays on:
  // it is security and stability work, not tracking.
  integrations: [],
  sendDefaultPii: false,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Only send performance transactions to /monitoring for authenticated users
  beforeSendTransaction(event) {
    const user = Sentry.getCurrentScope().getUser();
    if (!user?.id) return null;
    return event;
  },
});

// Replay is added at most once, and only on consent. Sentry has no public
// "remove integration" call, so a later withdrawal takes effect on the next
// page load, when init runs again without it.
let replayAttached = false;

function applyConsent(consent) {
  if (consent.analytics && !replayAttached) {
    replayAttached = true;
    Sentry.addIntegration(Sentry.replayIntegration());
  }
}

applyConsent(effectiveConsent());
onConsentChange(applyConsent);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
