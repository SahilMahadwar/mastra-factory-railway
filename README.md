# mastra-factory-railway

Container image for the [Mastra Factory](https://mastra.ai/factory) Railway template.

`app/` is the Factory server, vendored from upstream [mastra-ai/softwarefactory-template](https://github.com/mastra-ai/softwarefactory-template) at `364d704` (`@mastra/factory` 0.25.0) and owned here so flows and connectors can be customized. On top of upstream:

- A sign-in allowlist (`app/src/mastra/workos-access.ts`, wired in `app/src/mastra/index.ts`): only verified WorkOS emails listed in `FACTORY_ALLOWED_EMAILS` get in, and the server refuses to boot without it.
- The image adds `git`, `gh` and common build tools, so the local sandbox can clone, test and open pull requests.

## Customizing

Everything is configured in `app/src/mastra/index.ts`, which builds the `MastraFactory`:

- **Flows**: define boards with `defineBoard()` from `@mastra/factory` (see [Boards and rules](https://factory.mastra.ai/configure/boards-and-rules)).
- **Connectors**: add your own entries to the `integrations` array, next to GitHub, Linear, Jira, Slack and the rest (see the [MastraFactory API](https://factory.mastra.ai/reference/mastra-factory-api)).

Develop locally from `app/`: `npm install`, `npm run check`, `npm run dev` (UI on http://localhost:4111; copy `.env.example` to `.env` first).

## Updating upstream

Diff upstream between the base commit above and the new one, apply it to `app/`, update the commit in this README, run `npm install` to refresh `package-lock.json`, and bump the image tag in `.github/workflows/build.yml`.

## Build and test

`test/contract.sh` is the image contract, run in CI before every push to `ghcr.io/<owner>/mastra-factory-railway`. Railway builds this repo from source (root directory `/`), so the GHCR image is optional. Locally: `test/contract.sh` (needs Docker).

## Troubleshooting

- [GitHub org repos not showing in Factory](docs/github-org-repos-missing.md)
