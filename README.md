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

## Checks and artifacts

```bash
npm test
npm run lint
npm run build-openapi
npm run build:prod
```

`npm run build` writes one bundle per Lambda to `.webpack/`. `npm run build:prod` creates one deployment archive per entry in `lambdas.json` under `dist/`. `npm run build-openapi` generates `build/openapi.yaml`.

The repository currently has no black-box integration test files. The CI workflows upload artifacts from feature branches and update Lambda code from the default branch; changing a runtime declaration alone does not update live infrastructure.
