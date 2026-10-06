---
name: push-site
description: Commit a client site built by /new-site and push it to its own private GitHub repo (created on first run). Use when the user runs /push-site or asks to put a client site on GitHub.
argument-hint: "[site-folder] [owner/repo]"
disable-model-invocation: true
---

# /push-site

Arguments: $ARGUMENTS -- optional site folder (default: the current folder) and
`owner/repo` (default: `setup.githubRepo` from `site.config.yaml`).

Running this command is the go-ahead to commit and push. Nothing else is.

## 1. Check before anything leaves the machine

In the site folder:
- `site.config.yaml` and `content/pages/` exist; otherwise this isn't a site
  from `/new-site`, so stop.
- `git check-ignore -q .env.local` must succeed. If `.env.local` would be committed, stop:
  it holds tokens.
- `node --env-file=.env.local scripts/build-site.mjs` (dry run) is clean, so the
  content in git is valid.

## 2. Pick the repo

Use the argument, else `setup.githubRepo`. If both are empty, ask the user
(suggest `smartsynclink/<setup.slug>-site`, private). Write the answer into
`setup.githubRepo` in `site.config.yaml`.

## 3. Commit

```bash
git add -A
git diff --cached --name-only | grep -iE '(^|/)\.env|secret|token|\.pem$'   # must print nothing
git status --short   # show the user what goes in
git commit -m "feat: <business.name> website"    # later runs: a Conventional Commit describing the change
```

If the secret check prints anything, `git reset -q`, stop and tell the user.
Conventional Commits. No AI co-author or "generated with" trailer.

## 4. Push

```bash
gh repo view <owner/repo> >/dev/null 2>&1 || gh repo create <owner/repo> --private --source . --remote origin
git remote get-url origin >/dev/null 2>&1 || git remote add origin git@github.com:<owner/repo>.git
git push -u origin main
```

If the push fails over HTTPS, switch to SSH and retry once:
`git remote set-url origin git@github.com:<owner/repo>.git && git push -u origin main`.
If `gh repo create` is refused (no rights in that organisation), stop and tell the
user. Never create the repo somewhere else instead, and never make it public.

## 5. Report

The repo URL and the commit. Next step: `/deploy-site`.
