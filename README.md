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
