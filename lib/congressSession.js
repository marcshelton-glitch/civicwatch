/**
 * Congress numbering helpers.
 *
 * Shared by app/api/conflict-score, app/api/congress (?type=committees) and
 * scripts/ingest-committees.mjs. These three must agree exactly: the ingest
 * script stamps rows with a Congress number and both routes query by it, so a
 * drifting copy of this arithmetic would silently return zero committees —
 * the same class of invisible, 200-with-empty-array failure that made the
 * conflict scorer report "None flagged" for all of Congress.
 */

/** The Nth Congress convenes on Jan 3 of this year. */
export const congressToStartYear = (n) => 1789 + (n - 1) * 2

/**
 * The Congress in session on a given date.
 *
 * Inverse of congressToStartYear: N = floor((year - 1789) / 2) + 1, backing off
 * a year for the first two days of January, before the new Congress convenes on
 * the 3rd. UTC throughout so the answer doesn't depend on server timezone.
 *
 * @param {Date} [date] defaults to now
 * @returns {number} e.g. 119 for any date in 2025 or 2026
 */
export function currentCongress(date = new Date()) {
  const y = date.getUTCFullYear()
  const beforeJan3 = date.getUTCMonth() === 0 && date.getUTCDate() < 3
  return Math.floor(((beforeJan3 ? y - 1 : y) - 1789) / 2) + 1
}

/**
 * The calendar years a Congress spans, inclusive — e.g. 119 → [2025, 2026].
 * Used as the scoring window for conflict-score.
 */
export function congressYearRange(n) {
  const start = congressToStartYear(n)
  return [start, start + 1]
}
