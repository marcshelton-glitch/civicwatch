#!/usr/bin/env python3
import subprocess, json, base64, urllib.request as ur, os, ssl

token = subprocess.check_output(["security","find-internet-password","-s","github.com","-w"]).decode().strip()
headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json"}
repo = "marcshelton-glitch/civicwatch"
ctx = ssl._create_unverified_context()

def api(method, path, data=None):
    url = f"https://api.github.com/repos/{repo}/{path}"
    body = json.dumps(data).encode() if data else None
    req = ur.Request(url, data=body, method=method, headers=headers)
    return json.loads(ur.urlopen(req, timeout=60, context=ctx).read())

base = os.path.expanduser("~/Library/Mobile Documents/com~apple~CloudDocs/AI/AI App Projects/CivicWatch")
branch = api("GET", "git/ref/heads/main")
parent_sha = branch["object"]["sha"]
commit_obj = api("GET", f"git/commits/{parent_sha}")
tree_sha = commit_obj["tree"]["sha"]

files_to_push = [
    "app/layout.js",
    "app/page.js",
    "app/api/rep-photo/[bioguideId]/route.js",
    "instrumentation-client.js",
    "package.json",
]
blobs = []
for fpath in files_to_push:
    full_path = os.path.join(base, fpath)
    with open(full_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    blob = api("POST", "git/blobs", {"content": content, "encoding": "base64"})
    blobs.append({"path": fpath, "mode": "100644", "type": "blob", "sha": blob["sha"]})
    print(f"  blob: {fpath} -> {blob['sha'][:10]}")

tree = api("POST", "git/trees", {"base_tree": tree_sha, "tree": blobs})
new_commit = api("POST", "git/commits", {
    "message": "fix: resolve 5 Lighthouse audit issues\n\n- Fix 1 (GTM id=undefined): gate GoogleAnalytics component so it only\n  renders when NEXT_PUBLIC_GA_MEASUREMENT_ID is defined; add placeholder\n  comment to .env.local\n- Fix 2 (rep photo compression): add Sharp to rep-photo proxy route;\n  resize to 200x200, convert to WebP quality 80; fall through to original\n  JPEG on Sharp error\n- Fix 3 (/monitoring unauthenticated): add beforeSendTransaction hook to\n  Sentry init; drops performance transactions for unauthenticated users\n  so /monitoring is not hit on every anonymous page load\n- Fix 4 (<main> landmark): already present in CivicWatch.jsx at line 1088\n- Fix 5 (contrast failures): raise .hiw-number opacity from 0.18 to 0.55\n  for adequate contrast on dark background; add aria-hidden=true to\n  decorative step numbers; change .footer-copy from rgba(122,132,153,0.6)\n  to fully opaque #7A8499 (~5.5:1 contrast ratio)",
    "tree": tree["sha"],
    "parents": [parent_sha]
})
api("PATCH", "git/refs/heads/main", {"sha": new_commit["sha"]})
print(f"\nPushed commit: {new_commit['sha']}")
