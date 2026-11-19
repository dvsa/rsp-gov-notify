# RSP Gov.Notify Serverless API

This service sends email and SMS notifications through Gov.Notify.

## Requirements

- Node.js 24 and npm 11 (`nvm use` reads `.nvmrc`)
- Gov.Notify API key, notification template keys, and payment portal URL
- AWS credentials from the standard SDK credential chain only when loading configuration from Secrets Manager

## Run locally

Create a local `.env` file with the service configuration. The file is ignored by git.

```dotenv
NOTIFY_API_KEY=
PAYMENT_PORTAL_URL=
USE_SECRETS_MANAGER=false
```

Set `TEMPLATE_KEY_EMAIL_<LANGUAGE>` and `TEMPLATE_KEY_SMS_<LANGUAGE>` for each configured language. The complete key list is in `src/utils/config.js`.

When `USE_SECRETS_MANAGER=true`, also set `SECRETS_MANAGER_SECRET_NAME` and `REGION`. The AWS SDK uses its normal credential provider chain; set `AWS_PROFILE` in `.env` if needed. For an SSO profile, authenticate before startup with `aws sso login --profile <profile>`. Do not place AWS credentials in `.env`.

```bash
nvm use
npm ci
npm start
```

The local server uses Serverless Offline without request authentication. Its routes are `POST http://localhost:3000/dev/notifyEmail` and `POST http://localhost:3000/dev/notifySms`. Requests send real messages through Gov.Notify, so use appropriate non-production credentials and data.

## Integration baseline (manual, local, stubbed Notify)

`integration/` holds a black-box regression baseline for both HTTP routes (`POST /dev/notifyEmail`, `POST /dev/notifySms`). It is manual-only: it is not part of `npm test`, lint, source coverage (`src/` only) or CI, and it refuses to run when a CI variable is set.

**Safety model.** The runner starts its own `serverless-offline` on random loopback ports (an existing `npm start` service is never touched or stopped). A preload guard redirects the Notify host to a local stub and blocks every other non-loopback request, so **real GOV.UK Notify sends are impossible**. Real-send verification is intentionally not implemented. The runner does not load `.env` (it runs from a generated config without `serverless-dotenv-plugin`, deleted afterwards), uses synthetic template keys/API key/portal URL, and needs no AWS login. There is no database, so nothing is seeded or restored.

First run:

```bash
nvm use && npm ci            # Node 24 / npm 11
npm run test-i:tooling       # optional offline self-tests of the harness (no service)
npm run test-i               # builds .webpack, starts service + stub, runs 35 scenarios
npm run test-i:report        # opens integration-reports/latest.html
```

Reports (`report.html`, `report.json`, plus `latest.*`) are written to the git-ignored `integration-reports/` even when setup fails. Carry nothing between checkouts except the checked-in `integration/` directory; compare `report.json` between pre-upgrade and post-rewrite runs. If a run is hard-killed, delete `integration-reports/.lock` (stale locks with a dead PID are reclaimed automatically) and `serverless.integration.generated.yml`; stop any orphaned `sls offline` you started. Credential refresh is not applicable (no AWS/Notify credentials are used). See `integration/README.md`.

## Checks and artifacts

```bash
npm test
npm run lint
npm run build-openapi
npm run build:prod
```

`npm run build` writes one bundle per Lambda to `.webpack/`. `npm run build:prod` creates one deployment archive per entry in `lambdas.json` under `dist/`. `npm run build-openapi` generates `build/openapi.yaml`.

Black-box integration tests live in `integration/` (see above); they are not unit tests and are not run in CI. The CI workflows upload artifacts from feature branches and update Lambda code from the default branch; changing a runtime declaration alone does not update live infrastructure.
