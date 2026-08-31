---
doc: runbook
project: civicwatch
status: draft
owner: Marc Shelton
last_reviewed: 2026-08-06
review_cadence: 90d
---

# Runbook — civicwatch

Operational procedures. Written so someone who is not you — including an
agent — can execute them. Exact commands, not descriptions.

## Environments

| Env | URL | Branch | Deploys how |
|---|---|---|---|
| Local | | | |
| Staging | | | |
| Production | | | |

## Deploy
```bash
```
**Verify after deploy:**
- [ ]

## Rollback
```bash
```
**Last tested:** ← untested rollback is a plan, not a capability

## Rotate a secret
```bash
```

## Restore from backup
```bash
```
**Last tested:**

## Run a migration
```bash
```
Rules: dry-run first, back up before, verify after, never run one at 5pm Friday.

## Incident response
1. **Assess** — what's broken, who's affected
2. **Communicate** — status page / support
3. **Mitigate** — rollback beats fixing forward under pressure
4. **Resolve**
5. **Post-mortem** — blameless, into `00-governance/decision-log.md`

**Escalation:** <who, how>

## Routine maintenance

| Task | Frequency | Last done |
|---|---|---|
| Dependency updates | monthly | |
| Backup restore test | quarterly | |
| Access review | quarterly | |
| Cert/domain renewal check | quarterly | |
