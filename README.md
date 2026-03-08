# Tracking Validator

A Fastify service that validates JSON payloads against JSON Schemas loaded from a URL (or a local `schemas/` path).

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

The default `.env.example` only allows schema URLs from `tracking-docs-demo.buchert.digital`.
If you want to test local schemas in this repository (`schemas/...`), relax the pattern for local development:

```dotenv
SCHEMA_URL_PATTERN='.*'
```

Use this only for local development. In shared or production environments, keep a strict allowlist regex.

### 3. Start the server

```bash
npm start
```

Server listens on `http://localhost:3000` by default.

### 4. Verify it is running

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok" }
```

## Quick Start (Docker)

### 1. Build image

```bash
docker build -t tracking-validator .
```

### 2. Run container

```bash
docker run -d -p 3000:3000 --env-file ./.env --name tracking-validator-app tracking-validator
```

### 3. Verify

```bash
curl http://localhost:3000/health
```

### Optional: mount custom local schemas

```bash
docker run -d -p 3000:3000 \
  --env-file ./.env \
  -v ./my-local-schemas:/usr/src/app/schemas \
  --name tracking-validator-app \
  tracking-validator
```

## Configuration

Environment variables:

- `PORT`: server port (default: `3000`)
- `SCHEMA_URL_PATTERN`: regex used to validate `schema_url` and body `$schema`
- `CORS_ORIGIN_REGEX`: regex for allowed CORS origins

Default example values:

```dotenv
CORS_ORIGIN_REGEX='.*'
SCHEMA_URL_PATTERN='^https?:\/\/tracking-docs-demo\.buchert\.digital.*\.json$'
```

## API

### `GET /health`

Returns service status.

Response:

```json
{ "status": "ok" }
```

### `POST /v1/validate/remote`

Validate a JSON payload against a schema provided in one of two ways:

1. Query param: `schema_url`
2. Body field: `$schema` (takes precedence over query param)

If validation succeeds:

```json
{
  "valid": true,
  "errors": []
}
```

If validation fails:

```json
{
  "valid": false,
  "errors": [
    { "instancePath": "...", "message": "..." }
  ]
}
```

If schema loading/processing fails:

```json
{
  "error": "..."
}
```

### Example request (schema in query)

```bash
curl -X POST 'http://localhost:3000/v1/validate/remote?schema_url=https://tracking-docs-demo.buchert.digital/schemas/1.2.0/event-reference.json' \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "purchase",
    "ecommerce": {
      "currency": "EUR"
    }
  }'
```

### Example request (schema in body)

```bash
curl -X POST 'http://localhost:3000/v1/validate/remote' \
  -H 'Content-Type: application/json' \
  -d '{
    "$schema": "https://tracking-docs-demo.buchert.digital/schemas/1.2.0/event-reference.json",
    "event": "purchase",
    "ecommerce": {
      "currency": "EUR"
    }
  }'
```

## Troubleshooting

If you get a `400` response with an error related to schema loading:

- Check that your schema URL/path matches `SCHEMA_URL_PATTERN`.
- If using local schemas, ensure the value starts with `schemas/` (for example `schemas/1.2.0/event-reference.json`).
- Confirm the referenced schema file exists and contains valid JSON.

## Development Commands

```bash
npm test
npm run lint
```

## Browser Injection Script

`inject.js` can be pasted into a browser console to inject `dataLayer.js` from this service:

- Script file: `source/static/dataLayer.js`
- Example helper: `inject.js`

## Google Tag Manager Templates

GTM templates are in `gtm_tempaltes/`:

- `gtm_tempaltes/client_validation.tpl`
- `gtm_tempaltes/server_validation.tpl`

To import into GTM:

1. Go to **Templates** in your GTM container.
2. Click **New** under **Tag Templates**.
3. Use the three-dot menu and click **Import**.
4. Select one of the `.tpl` files above.
5. Save.
