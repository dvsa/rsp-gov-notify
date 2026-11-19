# Integration baseline guide

Inventory (`inventory.js`): 2 handlers = 2 HTTP routes, 0 Lambda-only functions.

| Function | Route | Auth | Downstream |
| --- | --- | --- | --- |
| notifyEmail | POST /dev/notifyEmail | aws_iam (bypassed by `--noAuth` locally) | Notify sendEmail |
| notifySms | POST /dev/notifySms | aws_iam (bypassed locally) | Notify sendSms |

Files: `run.js` (runner), `scenarios.js` (35 scenarios), `fixtures.js` (synthetic data + independent contract), `notify-stub.js` (local Notify model), `preload-guard.js` (network guard), `serverless-config.js` (derived config without dotenv plugin), `report.js` (HTML/JSON, redaction), `safety.js` (CI/loopback/lock), `tooling-tests/` (offline self-tests, `npm run test-i:tooling`).

Replacing the harness for the Serverless Starter rewrite: only `service.js`/`serverless-config.js` know how the service is started; HTTP contracts live in `scenarios.js` and fixtures in `fixtures.js`.

## Known behaviour captured (baseline, not endorsed)

- Notify 429 is returned as HTTP 400 (OpenAPI documents 429).
- Missing/unsupported `Language` is not validated: Notify is called with no template and a `?clang=undefined` link.
- Missing recipient is not validated locally.
- Missing/malformed body throws; serverless-offline returns 502 empty (deployed API Gateway mapping unverified).

## Limitations

Notify behaviour is modelled, not captured; `aws_iam`, Secrets Manager config path and deployed API Gateway behaviour are unverified; log output is not asserted.
