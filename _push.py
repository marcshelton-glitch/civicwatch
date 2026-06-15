#!/usr/bin/env python3
import subprocess, json, base64, urllib.request as ur, os, time

token = subprocess.check_output(["security","find-internet-password","-s","github.com","-w"]).decode().strip()
headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json"}
repo = "marcshelton-glitch/civicwatch"

def api(method, path, data=None, retries=3, delay=5):
    url = f"https://api.github.com/repos/{repo}/{path}"
    body = json.dumps(data).encode() if data else None
    for attempt in range(retries):
        req = ur.Request(url, data=body, method=method, headers=headers)
        try:
            return json.loads(ur.urlopen(req, timeout=60).read())
        except ur.HTTPError as e:
            detail = e.read().decode()
            if attempt < retries - 1 and e.code in (422, 500, 502, 503):
                print(f"  [{attempt+1}/{retries}] HTTP {e.code}, retrying in {delay}s…")
                time.sleep(delay)
                delay *= 2
                continue
            raise RuntimeError(f"HTTP {e.code} {e.reason}: {detail}") from None

base = os.path.expanduser("~/civicwatch")

# Get remote HEAD
branch = api("GET", "git/ref/heads/main")
parent_sha = branch["object"]["sha"]
commit_obj = api("GET", f"git/commits/{parent_sha}")
tree_sha = commit_obj["tree"]["sha"]
print(f"Remote HEAD: {parent_sha[:10]}  tree: {tree_sha[:10]}")

# Get deleted files (null-terminated to handle special chars/spaces)
deleted_raw = subprocess.check_output(
    ["git", "diff", "--diff-filter=D", "--name-only", "-z", "HEAD~1", "HEAD"],
    cwd=base
).decode()
deleted = [f for f in deleted_raw.split("\0") if f]

# Get added/modified files
changed_raw = subprocess.check_output(
    ["git", "diff", "--diff-filter=ACMRT", "--name-only", "-z", "HEAD~1", "HEAD"],
    cwd=base
).decode()
changed = [f for f in changed_raw.split("\0") if f]

print(f"Files to push: {len(changed)} added/modified, {len(deleted)} deleted")

blobs = []

# Handle deletions — only if the file actually exists on remote
def remote_file_sha(fpath):
    url = f"https://api.github.com/repos/{repo}/contents/{fpath}"
    req = ur.Request(url, method="GET", headers=headers)
    try:
        info = json.loads(ur.urlopen(req, timeout=30).read())
        return info.get("sha")
    except ur.HTTPError:
        return None

for fpath in deleted:
    rsha = remote_file_sha(fpath)
    if rsha:
        blobs.append({"path": fpath, "mode": "100644", "type": "blob", "sha": None})
        print(f"  delete: {fpath}")
    else:
        print(f"  skip delete (not on remote): {fpath}")

# Handle added/modified
for fpath in changed:
    full_path = os.path.join(base, fpath)
    if not os.path.exists(full_path):
        print(f"  skip (missing): {fpath}")
        continue
    mode = "100755" if os.access(full_path, os.X_OK) and not os.path.isdir(full_path) else "100644"
    with open(full_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    try:
        blob = api("POST", "git/blobs", {"content": content, "encoding": "base64"})
        blobs.append({"path": fpath, "mode": mode, "type": "blob", "sha": blob["sha"]})
        print(f"  blob: {fpath} -> {blob['sha'][:10]}")
    except Exception as e:
        print(f"  ERROR {fpath}: {e}", flush=True)

print(f"\nCreating tree with {len(blobs)} entries...")
tree = api("POST", "git/trees", {"base_tree": tree_sha, "tree": blobs})

commit_msg = "P0/P1 launch fixes: health endpoint, rate limiting, caching, auth hardening, push notifications, dedup constraints"
new_commit = api("POST", "git/commits", {
    "message": commit_msg,
    "tree": tree["sha"],
    "parents": [parent_sha]
})
api("PATCH", "git/refs/heads/main", {"sha": new_commit["sha"]})
print(f"\nPushed commit: {new_commit['sha']}")
