#!/usr/bin/env python3
import subprocess, json, base64, urllib.request as ur, os

token = subprocess.check_output(["security","find-internet-password","-s","github.com","-w"]).decode().strip()
headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json"}
repo = "marcshelton-glitch/civicwatch"

def api(method, path, data=None):
    url = f"https://api.github.com/repos/{repo}/{path}"
    body = json.dumps(data).encode() if data else None
    req = ur.Request(url, data=body, method=method, headers=headers)
    return json.loads(ur.urlopen(req, timeout=60).read())

base = os.path.expanduser("~/civicwatch")
branch = api("GET", "git/ref/heads/main")
parent_sha = branch["object"]["sha"]
commit_obj = api("GET", f"git/commits/{parent_sha}")
tree_sha = commit_obj["tree"]["sha"]

files_to_push = [
    "load-tests/load.js",
    "load-tests/stress.js",
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
    "message": "fix: re-apply K6 expectedStatuses fix for 401/403 Pro-only routes (reverted by worktree push)",
    "tree": tree["sha"],
    "parents": [parent_sha]
})
api("PATCH", "git/refs/heads/main", {"sha": new_commit["sha"]})
print(f"\nPushed commit: {new_commit['sha']}")
