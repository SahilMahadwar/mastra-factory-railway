# GitHub org repos not showing in Factory

## Symptom

- The GitHub App (`mastra-factory-5aeff334`) is installed on an organization, and GitHub shows the
  repos as **installed** / the installation as **configured**.
- Factory's repo picker doesn't list any of that org's repos.
- The person who installed the app (often an org owner/manager) was redirected back to Factory and
  saw **unauthorized** (HTTP 401).

## Cause

After an install, GitHub redirects to Factory's callback, `/auth/github/callback`. That route only
saves installations for someone **signed in to Factory**, and this deploy only allows emails listed
in `FACTORY_ALLOWED_EMAILS`.

If the installer isn't signed in (or isn't on the allowlist), the callback returns 401 and nothing is
saved. GitHub still finishes the install on its side, so GitHub says "configured" while Factory has
no record of it.

The callback doesn't only save the installation that triggered it. It exchanges an OAuth code for the
**signed-in user's** GitHub token, calls *list installations for authenticated user*, and saves
**every** installation that GitHub account can access
(`@mastra/factory/dist/integrations/github/routes.js`, `/auth/github/callback`). So any allowed
Factory user who belongs to the org can register the installation afterwards. The original installer
doesn't need to do anything else.

## Fix

1. Sign in to Factory with an allowed account whose GitHub user is a member of the org and can
   access at least one of the installed repos.
2. In the same browser, open:

   ```
   https://factory-production-5aeff334.up.railway.app/auth/github/connect
   ```

   It goes to GitHub and comes straight back if you've authorized the app before. Otherwise, approve
   the GitHub prompt.
3. Back in Factory, the org's repos should now show up in the repo picker. If they don't, refresh the
   picker or reload the page.

## Verify

Run this in the browser devtools console on the Factory site (while signed in):

```js
const s = await (await fetch('/web/github/status', { credentials: 'include' })).json();
const j = await (await fetch('/web/github/repos?refresh=1', { credentials: 'include' })).json();
const owners = {};
for (const r of j.repos) owners[r.owner] = (owners[r.owner] || 0) + 1;
({ installations: s.installations, reposByOwner: owners });
```

`installations` should include the org (`accountType: "Organization"`), and `reposByOwner` should
list its repos.

## Still missing?

| What you see | Why | What to do |
| --- | --- | --- |
| Org isn't in `installations` after the connect flow | Your GitHub user can't access any repo in that installation | Ask an org owner to add you to the org or to one of the selected repos, then rerun `/auth/github/connect` |
| Org is listed, but a specific repo is missing | The repo isn't selected in the installation, or it's marked **request** (waiting on an org owner) | An org owner adds/approves the repo under GitHub → org Settings → GitHub Apps → Configure, then refresh the picker |
| Redirect ends at `/?github=error` | State/session mismatch (for example, you started the flow in one browser or account and finished in another) | Start `/auth/github/connect` again in a single signed-in browser session. Check Railway logs for `[GitHub] Install callback` |
| 401 / unauthorized on the callback | Not signed in to Factory, or email not in `FACTORY_ALLOWED_EMAILS` | Sign in first, or add the email to `FACTORY_ALLOWED_EMAILS` on the Railway service |

## Avoiding it next time

- Ask the installer to **sign in to Factory first** and start from Factory's *Connect GitHub* button,
  rather than installing from GitHub directly. Or:
- Let them install from GitHub, then any allowed Factory user who is in the org reruns
  `/auth/github/connect` (the fix above).
