#!/usr/bin/env python3
"""Delete app/opengraph-image.js from GitHub main via Git Data API."""
import subprocess, json, base64, urllib.request as ur, sys

token = subprocess.check_output(["security","find-internet-password","-s","github.com","-w"]).decode().strip()
headers = {
    "Authorization": f"token {token}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
}
repo = "marcshelton-glitch/civicwatch"

def api(method, path, data=None, timeout=30):
    url = f"https://api.github.com/repos/{repo}/{path}"
    body = json.dumps(data).encode() if data else None
    req = ur.Request(url, data=body, method=method, headers=headers)
    try:
        resp = ur.urlopen(req, timeout=timeout)
        return json.loads(resp.read())
    except ur.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP {e.code}: {body[:200]}", file=sys.stderr)
        raise

def file_exists_on_remote(path):
    url = f"https://api.github.com/repos/{repo}/contents/{path}"
    req = ur.Request(url, method="GET", headers=headers)
    try:
        ur.urlopen(req, timeout=15)
        return True
    except ur.HTTPError as e:
        return e.code != 404

og_path = "app/opengraph-image.js"

print(f"Checking if {og_path} exists on remote...")
if not file_exists_on_remote(og_path):
    print("File already gone from remote — nothing to do.")
    sys.exit(0)

print("File found on remote. Deleting via Git Data API...")

# Get current main branch
branch = api("GET", "git/ref/heads/main")
parent_sha = branch["object"]["sha"]
print(f"  current main SHA: {parent_sha[:10]}")

commit_obj = api("GET", f"git/commits/{parent_sha}")
tree_sha = commit_obj["tree"]["sha"]
print(f"  current tree SHA: {tree_sha[:10]}")

# Create new tree with the file deleted (sha=null)
tree = api("POST", "git/trees", {
    "base_tree": tree_sha,
    "tree": [{"path": og_path, "mode": "100644", "type": "blob", "sha": None}]
})
print(f"  new tree SHA: {tree['sha'][:10]}")

# Create commit
new_commit = api("POST", "git/commits", {
    "message": "fix: delete app/opengraph-image.js — removes file-based OG route that overrides layout.js metadata",
    "tree": tree["sha"],
    "parents": [parent_sha]
})
print(f"  new commit SHA: {new_commit['sha'][:10]}")

# Update main branch ref
api("PATCH", "git/refs/heads/main", {"sha": new_commit["sha"]})
print(f"\nSUCCESS: Pushed commit {new_commit['sha']}")
print(f"Vercel will now deploy with opengraph-image.js removed.")
