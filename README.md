# Tracking Validator

Tracking Validator validates JSON payloads against JSON Schemas through an HTTP API.

## For End Users (Use the API)

If you already have a running instance, you only need its base URL.

Set:

```bash
export BASE_URL="https://your-tracking-validator-url"
```

### 1. Health check

```bash
curl "$BASE_URL/health"
```

Expected:

```json
{ "status": "ok" }
```

### 2. Validate payloads

Endpoint: `POST /v1/validate/remote`

You can pass the schema in either:

1. Query param `schema_url`
2. Body field `$schema` (takes precedence over query param)

Example (schema in query):

```bash
curl -X POST "$BASE_URL/v1/validate/remote?schema_url=https://tracking-docs-demo.buchert.digital/schemas/1.2.0/event-reference.json" \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "purchase",
    "ecommerce": {
      "currency": "EUR"
    }
  }'
```

Example response patterns:

- Valid payload:

```json
{
  "valid": true,
  "errors": []
}
```

- Invalid payload:

```json
{
  "valid": false,
  "errors": [
    { "instancePath": "...", "message": "..." }
  ]
}
```

- Schema loading/processing error:

```json
{
  "error": "..."
}
```

### 3. Browser injection / GTM usage

- Browser helper script: `inject.js`
- Injected runtime script: `source/static/dataLayer.js`
- GTM templates:
  - `gtm_tempaltes/client_validation.tpl`
  - `gtm_tempaltes/server_validation.tpl`

## Deployment

### Docker (quick self-host)

Prerequisite: Docker.

```bash
docker build -t tracking-validator .
docker run -d -p 3000:3000 --env-file ./.env --name tracking-validator-app tracking-validator
```

Then verify:

```bash
curl http://localhost:3000/health
```

Optional: mount your own local schemas:

```bash
docker run -d -p 3000:3000 \
  --env-file ./.env \
  -v ./my-local-schemas:/usr/src/app/schemas \
  --name tracking-validator-app \
  tracking-validator
```

### Terraform (Google Cloud Run)

- Full guide: [`terraform/README.md`](terraform/README.md)
- Includes prerequisites, `terraform.tfvars`, `terraform init/plan/apply`, and cleanup (`terraform destroy`).

## Configuration

Environment variables:

- `PORT`: server port (default `3000`)
- `SCHEMA_URL_PATTERN`: regex used to validate `schema_url` and body `$schema`
- `CORS_ORIGIN_REGEX`: regex for allowed CORS origins

Default example values (`.env.example`):

```dotenv
CORS_ORIGIN_REGEX='.*'
SCHEMA_URL_PATTERN='^https?:\/\/tracking-docs-demo\.buchert\.digital.*\.json$'
```

For local schema testing (development only), you can relax this to:

```dotenv
SCHEMA_URL_PATTERN='.*'
```

## Troubleshooting

If `POST /v1/validate/remote` returns `400`:

- Check that your schema URL/path matches `SCHEMA_URL_PATTERN`.
- For local files, use a `schemas/...` path.
- Ensure the schema file exists and is valid JSON.

## Developer Setup (Local)

This section is for contributors and local development.

### Prerequisites

- Node.js 20+
- npm

### Install, run, test

```bash
npm install
cp .env.example .env
npm start
npm test
npm run lint
```
