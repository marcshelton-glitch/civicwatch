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

base = os.path.expanduser("~/civicwatch")
branch = api("GET", "git/ref/heads/main")
parent_sha = branch["object"]["sha"]
commit_obj = api("GET", f"git/commits/{parent_sha}")
tree_sha = commit_obj["tree"]["sha"]

files_to_push = [
    "app/about/page.js",
    "app/page.js",
    "app/privacy/page.js",
    "app/refund-policy/page.js",
    "components/CivicWatch.jsx",
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
    "message": "fix: pre-launch fixes — h1 dedupe, refund policy, Do Not Sell links\n\n- Remove duplicate 'transparency is the foundation of democracy' phrase from About page Mission section (h1 already has it)\n- Update refund policy to simple 7-day full refund window; no partial-month refunds after that; cancellations at end of billing period\n- Add Refund Policy and Do Not Sell My Personal Information links to marketing footer (app/page.js)\n- Add Do Not Sell My Personal Information link to in-app footer (CivicWatch.jsx)\n- Add id=\"do-not-sell\" anchor section to privacy policy page",
    "tree": tree["sha"],
    "parents": [parent_sha]
})
api("PATCH", "git/refs/heads/main", {"sha": new_commit["sha"]})
print(f"\nPushed commit: {new_commit['sha']}")
