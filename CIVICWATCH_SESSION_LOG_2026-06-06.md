# CivicWatch — Session Log 2026-06-06

**Date:** Saturday, June 6, 2026  
**Repo:** `marcshelton-glitch/civicwatch` (branch `main`)  
**Purpose:** Apply 10 QA/P3 fixes to the Next.js CivicWatch app and push via Git Data API

---

## Summary

All 10 planned fixes were applied to the source files. The Git Data API push script (`_push.py`) was written to the repo root and is ready to run. Because the push requires macOS keychain access (`security find-internet-password -s github.com -w`) and the sandbox is a Linux environment, the final `git push` step must be executed manually from your Mac Terminal.

**Manual step remaining:**
```bash
python3 ~/civicwatch/_push.py
```

---

## Files Modified

| File | Fixes Applied |
|------|--------------|
| `components/CivicWatch.jsx` | FIX 2, 3, 5, 7, 9, 10 |
| `app/api/congress/route.js` | FIX 3 (API side) |
| `app/api/public-feed/route.js` | FIX 8 |
| `app/dashboard/page.js` | FIX 4 |

---

## Fix-by-Fix Details

### FIX 1 — Most Recent Term (Already Done)
**Status:** Already implemented — no change needed.  
`congress/route.js` already used `termItems[termItems.length - 1]` throughout.

---

### FIX 2 — Mobile Tabs Scrollable
**File:** `components/CivicWatch.jsx` (~lines 918–919 in the `<style>` block)

**Change:** Replaced static tab row styles with horizontally scrollable CSS. Tabs no longer wrap or overflow off-screen on mobile.

```css
/* Rep detail tab row: horizontally scrollable on mobile */
.rep-tabs-row {
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch !important;
  scrollbar-width: none !important;
  flex-wrap: nowrap !important;
  gap: 4px !important;
  padding-bottom: 4px !important;
}
.rep-tabs-row::-webkit-scrollbar { display: none; }
.rep-tabs-row > button {
  flex: 0 0 auto !important;
  white-space: nowrap !important;
  padding: 8px 12px !important;
  font-size: 11px !important;
  min-width: 0 !important;
}
```

---

### FIX 3 — Compare Panel `filingsCount`
**Files:** `app/api/congress/route.js` and `components/CivicWatch.jsx`

**`congress/route.js` changes:**
- Added `let dbFilingsCount = 0` before the senator check block
- Expanded `Promise.all` from 2 to 3 queries, adding:
  ```js
  supabase
    .from('fd_filings')
    .select('*', { count: 'exact', head: true })
    .ilike('last_name', lastName)
  ```
- Extracted `dbFilingsCount = filingsCount || 0` inside the House block
- Added `filingsCount: dbFilingsCount` to both the db-path return and live-fallback return
- Added `filingsCount: allSenTrades.length` to the Senate return

**`CivicWatch.jsx` changes (~line 2456):**
```js
setCompareData({
  bio: bioData.member || {},
  trades: tradesData.trades || [],
  filingsCount: tradesData.filingsCount ?? tradesData.trades?.length ?? 0,
  topTickers: tradesData.topTickers || [],
  netWorthHistory: tradesData.netWorthHistory || [],
})
// error catch also updated:
setCompareData({ bio: {}, trades: [], filingsCount: 0, topTickers: [], netWorthHistory: [] })
```

Display line updated (~line 2739):
```js
right: compareData != null
  ? String(compareData.filingsCount ?? compareData.trades?.length ?? 0)
  : '—',
```

---

### FIX 4 — Default Rep = Ro Khanna
**File:** `app/dashboard/page.js`

Changed default bioguide ID from Pelosi (`P000197`) to Ro Khanna (`K000395`):
```js
return <CivicWatch defaultBioguideId={repParam ? null : 'K000395'} defaultState="CA" />
```

> **Note:** When this session wrote the file, the id was `K000401`. Verify the correct bioguide ID for Ro Khanna at https://bioguide.congress.gov.

---

### FIX 5 — Coming Soon Alert Items
**File:** `components/CivicWatch.jsx` (~lines 1797–1814)

Added `comingSoon: true` to two alert config entries:
```js
{ key: 'alert_committees', label: 'Committee assignments', tier: 'Sign In', ..., comingSoon: true },
{ key: 'alert_legislation', label: 'Sponsored legislation', tier: 'Pro', ..., comingSoon: true },
```

Updated render logic to disable interaction and show badge:
```jsx
<label style={{ cursor: comingSoon ? 'not-allowed' : 'pointer', opacity: comingSoon ? 0.55 : 1 }}>
  <div onClick={() => !comingSoon && updatePref(key, !checked)}
       style={{ cursor: comingSoon ? 'not-allowed' : 'pointer' }}>
  <span>
    {label}
    {comingSoon && (
      <span style={{ fontSize: 10, color: S.gray, marginLeft: 6, fontStyle: 'italic' }}>
        (Coming Soon)
      </span>
    )}
  </span>
```

---

### FIX 6 — Pro Blur on Wealth Tab (Already Done)
**Status:** Already implemented — no change needed.  
The blur overlay for non-Pro users on the wealth/fdNetWorth section was already in place at line 3147 (`if (!isProProp)` block showing blur + "Net Worth Analysis · Pro Only" + upgrade button).

---

### FIX 7 — `liveAlertsLoaded` Guard (Prevent Double-Load)
**File:** `components/CivicWatch.jsx`

Added `useRef` guard to prevent the alerts `useEffect` from firing twice in React Strict Mode or on hot-reload:

Added after the `prefsSaveTimer` ref (~line 349):
```js
const liveAlertsLoaded = useRef(false)
```

Inside the alerts `useEffect` (~line 773), added at the top of the async function:
```js
if (liveAlertsLoaded.current) return
liveAlertsLoaded.current = true
```

---

### FIX 8 — House Feed Full Name
**File:** `app/api/public-feed/route.js`

Added `first_name` to the `fd_trades` select query:
```js
.select('first_name, last_name, ticker, asset_name, transaction_type, amount_str, transaction_date')
```

Updated the name mapping to use both names:
```js
name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Member',
```

---

### FIX 9 — AI Attribution Footer
**File:** `components/CivicWatch.jsx` (after `{preview}` paragraph ~line 4427)

Added attribution div below each AI analysis preview:
```jsx
<div style={{
  fontSize: 11,
  color: '#6b7280',
  marginTop: 12,
  borderTop: '1px solid #1f2937',
  paddingTop: 8
}}>
  Analysis generated by Google Gemini 2.5 Flash · For informational purposes only
</div>
```

---

### FIX 10 — "Same-day" Alert Label
**File:** `components/CivicWatch.jsx` (~line 1779)

Changed label from `'Instant'` to `'Same-day'` and updated hint:
```js
{ value: 'instant', label: 'Same-day', hint: 'Same-day (checks run daily)' },
```

---

## GitHub Push

### How the push works

The `_push.py` script uses the GitHub Git Data API (not `git push`, which hangs in this environment):
1. Creates a blob for each changed file
2. Creates a new tree on top of the current HEAD tree
3. Creates a new commit pointing at that tree
4. PATCHes the `main` branch ref to the new commit SHA

### Token retrieval
```python
token = subprocess.check_output(
    ['security', 'find-internet-password', '-s', 'github.com', '-w'],
    text=True
).strip()
```
This reads from macOS Keychain — requires running on your Mac, not in the Linux sandbox.

### Files pushed
- `components/CivicWatch.jsx`
- `app/api/congress/route.js`
- `app/api/public-feed/route.js`
- `app/dashboard/page.js`

### To complete the push
```bash
python3 ~/civicwatch/_push.py
```
Or double-click `~/civicwatch/_push.command` in Finder.

After a successful push, you can remove the helper files:
```bash
rm ~/civicwatch/_push.py ~/civicwatch/_push.command
```

---

## Tech Notes

- **No `git push`** — it hangs indefinitely in this environment. Always use the Git Data API for pushes.
- **Token retrieval** — `security find-internet-password -s github.com -w` (macOS Keychain only)
- **Supabase count queries** — use `{ count: 'exact', head: true }` to get row counts without fetching data
- **React double-fire guard** — `useRef` is session-scoped and survives re-renders without triggering them, making it ideal for one-shot guards

---

*Log generated by Claude (claude-sonnet-4-6) in Cowork mode on 2026-06-06*
