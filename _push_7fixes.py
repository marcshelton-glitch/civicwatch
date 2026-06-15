#!/usr/bin/env python3
"""Push 7 separate fix commits to GitHub via the Git Data API."""
import subprocess, requests, sys

token = subprocess.check_output(['security','find-internet-password','-s','github.com','-w']).decode().strip()
headers = {'Authorization': f'token {token}', 'Accept': 'application/vnd.github+json'}
base = 'https://api.github.com/repos/marcshelton-glitch/civicwatch'

def push_file(sha, file_path, content, message):
    commit_data = requests.get(f'{base}/git/commits/{sha}', headers=headers).json()
    tree_sha = commit_data['tree']['sha']
    blob = requests.post(f'{base}/git/blobs', headers=headers,
                         json={'content': content, 'encoding': 'utf-8'}).json()
    if 'sha' not in blob:
        print('Blob error:', blob); sys.exit(1)
    tree = requests.post(f'{base}/git/trees', headers=headers,
                         json={'base_tree': tree_sha,
                               'tree': [{'path': file_path, 'mode': '100644',
                                         'type': 'blob', 'sha': blob['sha']}]}).json()
    new_commit = requests.post(f'{base}/git/commits', headers=headers,
                               json={'message': message, 'tree': tree['sha'],
                                     'parents': [sha]}).json()
    if 'sha' not in new_commit:
        print('Commit error:', new_commit); sys.exit(1)
    requests.patch(f'{base}/git/refs/heads/main', headers=headers,
                   json={'sha': new_commit['sha']})
    print(f'  ✓ {new_commit["sha"][:12]}  {message}')
    return new_commit['sha']

def replace_once(content, old, new, label):
    if old not in content:
        print(f'ERROR: pattern not found for [{label}]')
        print(f'First 120 chars of pattern: {repr(old[:120])}')
        sys.exit(1)
    result = content.replace(old, new, 1)
    assert result != content, f'Replacement was a no-op for [{label}]'
    return result

# ── Get current HEAD SHA ───────────────────────────────────────────────────────
ref = requests.get(f'{base}/git/ref/heads/main', headers=headers).json()
sha = ref['object']['sha']
print(f'Starting from {sha[:12]}')

# ── Read current local files ───────────────────────────────────────────────────
with open('/Users/marcshelton/civicwatch/components/CivicWatch.jsx', 'r') as f:
    cw = f.read()
with open('/Users/marcshelton/civicwatch/app/privacy/page.js', 'r') as f:
    privacy = f.read()
with open('/Users/marcshelton/civicwatch/app/about/page.js', 'r') as f:
    about = f.read()

print(f'Read CivicWatch.jsx ({len(cw):,} chars), privacy ({len(privacy):,}), about ({len(about):,})')


# ═══════════════════════════════════════════════════════════════════════════════
# FIX 1: AI Analysis "Unauthorized" error → friendly Go Pro CTA
# ═══════════════════════════════════════════════════════════════════════════════
FIX1_OLD = """  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="slide-in" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 14, color: S.gray, marginBottom: 16 }}>{errorMsg || 'Analysis failed. Please try again.'}</div>
        <button onClick={() => setStatus('idle')} style={{ padding: '9px 20px', background: S.navyLight, border: `1px solid ${S.border}`, borderRadius: 8, color: S.white, cursor: 'pointer', fontFamily: 'inherit' }}>
          Try Again
        </button>
      </div>
    )
  }"""

FIX1_NEW = """  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (status === 'error') {
    if (errorMsg === 'Unauthorized' || errorMsg === '__unauthorized__') {
      return (
        <div className="slide-in" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: S.offWhite, marginBottom: 8 }}>AI Analysis is a Pro Feature</h3>
          <p style={{ color: S.gray, marginBottom: 24, lineHeight: 1.6 }}>
            Upgrade to CivicWatch Pro to unlock AI-powered analysis of your representative&apos;s voting patterns, trading behavior, and legislative priorities.
          </p>
          <a href="/pro"
            style={{ background: '#4f6ef7', color: '#fff', borderRadius: 8,
              padding: '12px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              textDecoration: 'none', display: 'inline-block' }}>
            Go Pro →
          </a>
        </div>
      )
    }
    return (
      <div className="slide-in" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 14, color: S.gray, marginBottom: 16 }}>{errorMsg || 'Analysis failed. Please try again.'}</div>
        <button onClick={() => setStatus('idle')} style={{ padding: '9px 20px', background: S.navyLight, border: `1px solid ${S.border}`, borderRadius: 8, color: S.white, cursor: 'pointer', fontFamily: 'inherit' }}>
          Try Again
        </button>
      </div>
    )
  }"""

cw = replace_once(cw, FIX1_OLD, FIX1_NEW, 'FIX1 - Unauthorized→GoPro')
sha = push_file(sha, 'components/CivicWatch.jsx', cw,
                'fix: AI analysis "Unauthorized" error shows Go Pro CTA instead of raw error')


# ═══════════════════════════════════════════════════════════════════════════════
# FIX 2: Rep cards — colored top border via partyColor helper + borderTop
# ═══════════════════════════════════════════════════════════════════════════════

# 2a: Add partyColor helper function before the REPS/ALERT_LOG constants
FIX2A_OLD = """// ─── REMOVED: mock REPS data. Live data comes from Congress API. ──────────────
const REPS = []"""

FIX2A_NEW = """const partyColor = (party) => {
  if (!party) return '#999'
  const p = party.toLowerCase()
  if (p.includes('democrat')) return '#1a6fc4'
  if (p.includes('republican')) return '#c0392b'
  if (p.includes('independent')) return '#f5a623'
  if (p.includes('green')) return '#27ae60'
  return '#999'
}

// ─── REMOVED: mock REPS data. Live data comes from Congress API. ──────────────
const REPS = []"""

cw = replace_once(cw, FIX2A_OLD, FIX2A_NEW, 'FIX2a - partyColor function')

# 2b: Main federal rep card — replace absolute inner div with borderTop on container
FIX2B_OLD = """                  <div key={rep.id} className="rep-card glass-card-strong"
                    style={{ borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: rep.party === "Democrat" ? "#1565C0" : rep.party === "Republican" ? "#CC2020" : rep.party === "Independent" ? "#D4B800" : rep.party === "Green" ? "#22A05A" : "#334466" }} />"""

FIX2B_NEW = """                  <div key={rep.id} className="rep-card glass-card-strong"
                    style={{ borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden", borderTop: `4px solid ${partyColor(rep.party)}` }}>"""

cw = replace_once(cw, FIX2B_OLD, FIX2B_NEW, 'FIX2b - federal rep card borderTop')

# 2c: Local/municipal rep card — same approach
FIX2C_OLD = """                        <div key={rep.id} className="rep-card glass-card-strong"
                          style={{ borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: rep.party === 'Democrat' ? '#1565C0' : rep.party === 'Republican' ? '#CC2020' : rep.party === 'Independent' ? '#D4B800' : rep.party === 'Green' ? '#22A05A' : '#334466' }} />"""

FIX2C_NEW = """                        <div key={rep.id} className="rep-card glass-card-strong"
                          style={{ borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden', borderTop: `4px solid ${partyColor(rep.party)}` }}>"""

cw = replace_once(cw, FIX2C_OLD, FIX2C_NEW, 'FIX2c - local gov rep card borderTop')

sha = push_file(sha, 'components/CivicWatch.jsx', cw,
                'feat: rep cards — colored top border by party via partyColor helper')


# ═══════════════════════════════════════════════════════════════════════════════
# FIX 3: Remove "Federal" label from filter — replace with "Congress"
# ═══════════════════════════════════════════════════════════════════════════════
FIX3_OLD = '<option value="federal">Federal</option>'
FIX3_NEW = '<option value="federal">Congress</option>'

cw = replace_once(cw, FIX3_OLD, FIX3_NEW, 'FIX3 - Federal→Congress filter label')
sha = push_file(sha, 'components/CivicWatch.jsx', cw,
                'fix: rename "Federal" filter label to "Congress"')


# ═══════════════════════════════════════════════════════════════════════════════
# FIX 4: Contact button — use rep.contactForm instead of contactUrl (opens in new tab)
# ═══════════════════════════════════════════════════════════════════════════════
FIX4_OLD = '<a href={contactUrl || rep.website} target="_blank" rel="noreferrer"'
FIX4_NEW = '<a href={rep.contactForm || rep.website || \'#\'} target="_blank" rel="noreferrer"'

cw = replace_once(cw, FIX4_OLD, FIX4_NEW, 'FIX4 - contact form href')
sha = push_file(sha, 'components/CivicWatch.jsx', cw,
                'fix: Contact Form button uses rep.contactForm URL (opens in new tab)')


# ═══════════════════════════════════════════════════════════════════════════════
# FIX 5: Privacy policy — make Google/Gemini AI disclosure explicit in section 2
# ═══════════════════════════════════════════════════════════════════════════════
FIX5_OLD = '              <li style={LI}>Provide and improve CivicWatch features, including tracked representatives, poll results, and personalized civic alerts.</li>'
FIX5_NEW = '              <li style={LI}>Provide and improve CivicWatch features, including tracked representatives, poll results, personalized civic alerts, and AI-powered accountability analysis powered by Google Gemini.</li>'

privacy = replace_once(privacy, FIX5_OLD, FIX5_NEW, 'FIX5 - Google Gemini AI disclosure')
sha = push_file(sha, 'app/privacy/page.js', privacy,
                'fix: privacy policy — clarify AI analysis uses Google Gemini (not Anthropic/Claude)')


# ═══════════════════════════════════════════════════════════════════════════════
# FIX 6: Alerts hierarchy — confirm correct tier order, update label to title case
# ═══════════════════════════════════════════════════════════════════════════════
FIX6_OLD = "                    { key: 'alert_trades',      label: 'New trade disclosures (PTR filings)', tier: 'Free',    tierColor: '#2a9d4c', tierBg: 'rgba(42,157,76,0.12)' },"
FIX6_NEW = "                    { key: 'alert_trades',      label: 'New Trade Disclosures',              tier: 'Free',    tierColor: '#2a9d4c', tierBg: 'rgba(42,157,76,0.12)' },"

cw = replace_once(cw, FIX6_OLD, FIX6_NEW, 'FIX6 - alerts label title case')
sha = push_file(sha, 'components/CivicWatch.jsx', cw,
                'fix: alerts hierarchy — Free→SignIn→Pro order confirmed, label updated to title case')


# ═══════════════════════════════════════════════════════════════════════════════
# FIX 7: About page — replace opening paragraph with Marc's story
# ═══════════════════════════════════════════════════════════════════════════════
FIX7_OLD = """            CivicWatch started with a simple question: if financial disclosure filings are
            public record, why does finding them require a law degree and two hours of
            government website navigation? We built this so anyone — not just journalists
            or lobbyists — can see what their representatives are buying and selling in
            seconds."""

FIX7_NEW = """            CivicWatch was built by a retired Marine Captain with 21 years of service and six combat tours — someone who has seen firsthand the cost of the decisions made in Washington. After returning home, the question that wouldn&apos;t leave was simple: who do our elected representatives actually work for?
          </p>
          <p
            style={{
              fontSize: 18,
              color: S.gray,
              lineHeight: 1.8,
              fontWeight: 300,
              maxWidth: 600,
              marginTop: 16,
            }}
          >
            The answer, it turned out, was hiding in plain sight — in financial disclosure filings, voting records, and campaign finance data that were technically public but practically inaccessible to ordinary Americans. CivicWatch was built to change that."""

about = replace_once(about, FIX7_OLD, FIX7_NEW, "FIX7 - about page Marc's story")
sha = push_file(sha, 'app/about/page.js', about,
                "fix: about page — opening paragraph tells Marc's story as founder")

print(f'\nAll 7 fixes pushed. Final SHA: {sha}')
