# RSP Gov.Notify Serverless API
#### The below environment variables should be acquired and set locally for the API to run correctly:
NOTIFY_API_KEY - Api key taken from Gov.Notify service
SMS_TEMPLATE_KEY - Template key for SMS message from Gov.Notify Service
EMAIL_TEMPLATE_KEY - Template key for Email message from Gov.Notify Service
PAYMENT_PORTAL_URL - URL to be included in notification message.

#### Pre-requisites
Although Serverless Framework is being used solely for local development purposes, you still need a `[default]` AWS profile in `~/.aws/credentials` in order for for you to run the app locally.

#### Description
This API orchestrates sending notification messages via the Gov.Notify service.

## Run Locally
- `nvm use`
- `npm i`
- `npm run start`

## Package for development
- `npm run build`

## Package for production
- `npm run build:prod`

## To run unit tests

- `npm run test`

## To Lint

- `npm run lint`

## To auto fix linting errors

- `npm run lint:fix`

## To Note

SAM is a new addition and is being used for building for running locally and for packaging for production - using the `template.yaml` file.

Serverless is being used for running locally from the built files. Ideally SAM will be used for packaging and running locally going forward and the serverless config can be removed.
