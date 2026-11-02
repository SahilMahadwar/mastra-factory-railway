// Real WorkOS sign-in without the hosted page (AuthKit's emailed code is unreadable to an
// agent): mint a Magic Auth code via the API, exchange it for the user's actual tokens, and
// seal them exactly as @mastra/auth-workos handleCallback does. Prints the cookie value.
// Run inside the image: docker run --rm -e WORKOS_API_KEY -e WORKOS_CLIENT_ID
//   -e WORKOS_COOKIE_PASSWORD -e EMAIL -v "$PWD/test:/t" --entrypoint node <img> /t/login.mjs
import { createRequire } from 'node:module';
const require = createRequire('/app/.mastra/output/node_modules/@mastra/auth-workos/dist/index.js');
const { WorkOS } = await import(require.resolve('@workos-inc/node'));
const { sessionEncryption } = await import(require.resolve('@workos/authkit-session'));

const { WORKOS_API_KEY, WORKOS_CLIENT_ID, WORKOS_COOKIE_PASSWORD, EMAIL } = process.env;
const workos = new WorkOS(WORKOS_API_KEY, { clientId: WORKOS_CLIENT_ID });
const { code } = await workos.userManagement.createMagicAuth({ email: EMAIL });
const r = await workos.userManagement.authenticateWithMagicAuth({ clientId: WORKOS_CLIENT_ID, code, email: EMAIL });
const sealed = await sessionEncryption.sealData(
  { accessToken: r.accessToken, refreshToken: r.refreshToken, user: r.user, organizationId: r.organizationId, impersonator: r.impersonator },
  { password: WORKOS_COOKIE_PASSWORD },
);
process.stdout.write(sealed);
