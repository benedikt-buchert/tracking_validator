# Tracking Validator

A server to validate data structures against a remote JSON schema.

## Running the application

### Using Docker

This is the recommended way to run the application.

### Pre-built Image

Pre-built images for this application are published to the GitHub Container Registry. You can find the packages here:
[https://github.com/benedikt-buchert/tracking_validator/packages](https://github.com/benedikt-buchert/tracking_validator/packages)

**Prerequisites:**
- Docker is installed and running.

**1. Build the Docker image:**
```bash
docker build -t tracking-validator .
```

**2. Run the Docker container:**
There are two ways to run the container, depending on how you want to provide the `SCHEMA_URL_PATTERN` environment variable.

**Option A: Using the `--env-file` flag (recommended)**
This method uses the `.env` file to pass environment variables.

```bash
docker run -d -p 3000:3000 --env-file ./.env --name tracking-validator-app tracking-validator
```

**Option B: Using the `-e` flag**
This method passes the environment variable directly.

```bash
docker run -d -p 3000:3000 -e "SCHEMA_URL_PATTERN=^https?://geojson\\.org/.*\\.json$" --name tracking-validator-app tracking-validator
```

The application will be available at `http://localhost:3000`.

### Providing Custom Schemas

If you want to provide your own local schemas instead of relying on remote ones, you can mount a local directory containing your schema files to the `/usr/src/app/schemas` directory inside the container.

```bash
docker run -d -p 3000:3000 \
  --env-file ./.env \
  -v ./my-local-schemas:/usr/src/app/schemas \
  --name tracking-validator-app \
  tracking-validator
```

In this example, the contents of the `my-local-schemas` directory on your host machine will be available inside the container at `/usr/src/app/schemas`.

## API Endpoints

### Health Check

- **GET** `/health`

  Returns the health status of the server.

  **Success Response (200 OK):**
  ```json
  {
    "status": "ok"
  }
  ```

### Remote Schema Validation

- **POST** `/v1/validate/remote`

  Validates a JSON payload in the request body against a remote schema. The schema can be provided in two ways:

  1.  **`schema_url` query parameter:** The URL of the JSON schema to validate against.
  2.  **`$schema` key in the request body:** The URL of the JSON schema to validate against.

  If both are provided, the `$schema` key in the body takes precedence. The schema URL must match the `SCHEMA_URL_PATTERN` environment variable.

  **Example Request with `schema_url` query parameter:**
  ```bash
  curl -X POST 'http://localhost:3000/v1/validate/remote?schema_url=https://geojson.org/schema/GeoJSON.json' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "Point",
    "coordinates": [102.0, 0.5]
  }'
  ```

  **Example Request with `$schema` in body:**
  ```bash
  curl -X POST 'http://localhost:3000/v1/validate/remote' \
  -H 'Content-Type: application/json' \
  -d '{
    "$schema": "https://geojson.org/schema/GeoJSON.json",
    "type": "Point",
    "coordinates": [102.0, 0.5]
  }'
  ```

  **Success Response (200 OK):**
  - For a valid payload:
    ```json
    {
      "valid": true,
      "errors": []
    }
    ```
  - For an invalid payload:
    ```json
    {
      "valid":false,
      "errors": [ ... ]
    }
    ```

  **Error Response (400 Bad Request):**
  - If the schema is not reachable or invalid:
    ```json
    {
      "error": "Failed to fetch schema from <schema_url>. Status: 404"
    }
    ```

## Browser Injection

The `inject.js` script can be used to inject the `dataLayer.js` script into a website. This is useful for testing the validator with a live website.

```javascript
// This script can be pasted into a browser's developer console to inject the dataLayer.js script into a website.
// The script assumes that the tracking_validation service is running on http://localhost:3000.
// If the service is running on a different URL, you need to update the script.src accordingly.

(function() {
    console.log('Injecting dataLayer.js script...');
    var script = document.createElement('script');
    script.src = 'http://localhost:3000/static/dataLayer.js?schema_url=https://tracking-docs-demo.buchert.digital/schemas/1.2.0/event-reference.json';
    script.onload = function() {
        console.log('dataLayer.js script injected successfully.');
    };
    script.onerror = function() {
        console.error('Failed to inject dataLayer.js script.');
    };
    document.body.appendChild(script);
})();
```

## Google Tag Manager Template

A Google Tag Manager (GTM) template is available to easily integrate the tracking validator with your GTM setup. You can find the template in this repository: `DataLayerValidator.tpl`.

To use the template, you need to import it into your GTM container:

1.  In your GTM container, go to **Templates**.
2.  Click **New** under **Tag Templates**.
3.  Click the three dots in the top right corner and select **Import**.
4.  Select the `DataLayerValidator.tpl` file from this repository.
5.  Save the template.

### Permissions

When using the GTM template, you need to grant the following permissions:

*   **Injects Scripts:** To inject the `dataLayer.js` script. Update the domain to match the server domain where the tracking validator service is running.
