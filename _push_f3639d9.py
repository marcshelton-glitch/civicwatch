import subprocess, json, base64, urllib.request as ur, os

os.chdir("/Users/marcshelton/civicwatch")
token = subprocess.check_output(["security","find-internet-password","-s","github.com","-w"]).decode().strip()
headers = {
    "Authorization": f"token {token}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
}
repo = "marcshelton-glitch/civicwatch"

def api(method, path, data=None):
    url = f"https://api.github.com/repos/{repo}/{path}"
    body = json.dumps(data).encode() if data else None
    req = ur.Request(url, data=body, method=method, headers=headers)
    return json.loads(ur.urlopen(req, timeout=300).read())

# Get current GitHub HEAD
branch = api("GET", "git/ref/heads/main")
current = branch["object"]["sha"]
print(f"GitHub HEAD: {current[:8]}")

files = [
    "app/api/congress/route.js",
    "app/api/networth-wikidata/route.js",
    "app/api/networth/route.js",
    "app/api/public-feed/route.js",
    "app/api/send-alerts/route.js",
    "app/dashboard/page.js",
    "app/globals.css",
    "app/layout.js",
    "app/leaderboard/page.js",
    "app/page.js",
    "components/CivicWatch.jsx",
]

for fpath in files:
    c = api("GET", f"git/commits/{current}")
    with open(fpath, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    blob = api("POST", "git/blobs", {"content": content, "encoding": "base64"})
    tree = api("POST", "git/trees", {
        "base_tree": c["tree"]["sha"],
        "tree": [{"path": fpath, "mode": "100644", "type": "blob", "sha": blob["sha"]}]
    })
    nc = api("POST", "git/commits", {
        "message": f"fix: push {fpath}",
        "tree": tree["sha"],
        "parents": [current]
    })
    api("PATCH", "git/refs/heads/main", {"sha": nc["sha"], "force": True})
    current = nc["sha"]
    print(f"Pushed {fpath} → {nc['sha'][:8]}")

print("DONE. Final SHA:", current[:8])
