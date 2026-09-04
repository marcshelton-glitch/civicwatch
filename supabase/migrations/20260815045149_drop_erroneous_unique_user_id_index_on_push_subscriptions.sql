-- push_subscriptions ended up with two conflicting migration histories.
-- One added a UNIQUE index on user_id alone (push_subscriptions_user_id_idx),
-- which wrongly limits each user to exactly one push subscription and breaks
-- multi-device/multi-browser push (e.g. Chrome + Safari for the same account).
-- The app's upsert relies on the unique constraint on `endpoint`
-- (push_subscriptions_endpoint_key), which is what should govern conflicts.
-- Drop the bad unique index; keep the plain (non-unique) user_id index for lookups.
DROP INDEX IF EXISTS push_subscriptions_user_id_idx;
-- Also drop the redundant duplicate non-unique index on endpoint left by the
-- other migration file, since push_subscriptions_endpoint_key already covers it.
DROP INDEX IF EXISTS push_subscriptions_endpoint_idx;