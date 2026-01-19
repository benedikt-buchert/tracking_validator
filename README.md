# Tracking Validator

A server to validate data structures against a remote JSON schema.

## Running the application

### Using Docker

This is the recommended way to run the application.

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

- **POST** `/v1/validate/remote?schema_url=<schema_url>`

  Validates a JSON payload in the request body against a remote schema specified in the `schema_url` query parameter.

  **Query Parameters:**
  - `schema_url` (string, required): The URL of the JSON schema to validate against. The URL must match the `SCHEMA_URL_PATTERN` environment variable.

  **Request Body:**
  - The JSON payload to validate.

  **Example Request:**
  ```bash
  curl -X POST 'http://localhost:3000/v1/validate/remote?schema_url=https://geojson.org/schema/GeoJSON.json' \
  -H 'Content-Type: application/json' \
  -d '{
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
    ```bash
    url -X POST 'http://localhost:3000/v1/validate/remote?schema_url=https://geojson.org/schema/GeoJSON.json' \
    -H 'Content-Type: application/json' \
    -d '{
      "type": "Point"
    }'
  ```
    ```json
    {
      "valid":false,
      "errors":[
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/0/required",
            "keyword":"required",
            "params":{
                "missingProperty":"coordinates"
            },
            "message":"must have required property 'coordinates'"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/1/required",
            "keyword":"required",
            "params":{
                "missingProperty":"coordinates"
            },
            "message":"must have required property 'coordinates'"
          },
          {
            "instancePath":"/type",
            "schemaPath":"#/oneOf/1/properties/type/enum",
            "keyword":"enum",
            "params":{
                "allowedValues":[
                  "LineString"
                ]
            },
            "message":"must be equal to one of the allowed values"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/2/required",
            "keyword":"required",
            "params":{
                "missingProperty":"coordinates"
            },
            "message":"must have required property 'coordinates'"
          },
          {
            "instancePath":"/type",
            "schemaPath":"#/oneOf/2/properties/type/enum",
            "keyword":"enum",
            "params":{
                "allowedValues":[
                  "Polygon"
                ]
            },
            "message":"must be equal to one of the allowed values"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/3/required",
            "keyword":"required",
            "params":{
                "missingProperty":"coordinates"
            },
            "message":"must have required property 'coordinates'"
          },
          {
            "instancePath":"/type",
            "schemaPath":"#/oneOf/3/properties/type/enum",
            "keyword":"enum",
            "params":{
                "allowedValues":[
                  "MultiPoint"
                ]
            },
            "message":"must be equal to one of the allowed values"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/4/required",
            "keyword":"required",
            "params":{
                "missingProperty":"coordinates"
            },
            "message":"must have required property 'coordinates'"
          },
          {
            "instancePath":"/type",
            "schemaPath":"#/oneOf/4/properties/type/enum",
            "keyword":"enum",
            "params":{
                "allowedValues":[
                  "MultiLineString"
                ]
            },
            "message":"must be equal to one of the allowed values"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/5/required",
            "keyword":"required",
            "params":{
                "missingProperty":"coordinates"
            },
            "message":"must have required property 'coordinates'"
          },
          {
            "instancePath":"/type",
            "schemaPath":"#/oneOf/5/properties/type/enum",
            "keyword":"enum",
            "params":{
                "allowedValues":[
                  "MultiPolygon"
                ]
            },
            "message":"must be equal to one of the allowed values"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/6/required",
            "keyword":"required",
            "params":{
                "missingProperty":"geometries"
            },
            "message":"must have required property 'geometries'"
          },
          {
            "instancePath":"/type",
            "schemaPath":"#/oneOf/6/properties/type/enum",
            "keyword":"enum",
            "params":{
                "allowedValues":[
                  "GeometryCollection"
                ]
            },
            "message":"must be equal to one of the allowed values"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/7/required",
            "keyword":"required",
            "params":{
                "missingProperty":"properties"
            },
            "message":"must have required property 'properties'"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/7/required",
            "keyword":"required",
            "params":{
                "missingProperty":"geometry"
            },
            "message":"must have required property 'geometry'"
          },
          {
            "instancePath":"/type",
            "schemaPath":"#/oneOf/7/properties/type/enum",
            "keyword":"enum",
            "params":{
                "allowedValues":[
                  "Feature"
                ]
            },
            "message":"must be equal to one of the allowed values"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf/8/required",
            "keyword":"required",
            "params":{
                "missingProperty":"features"
            },
            "message":"must have required property 'features'"
          },
          {
            "instancePath":"/type",
            "schemaPath":"#/oneOf/8/properties/type/enum",
            "keyword":"enum",
            "params":{
                "allowedValues":[
                  "FeatureCollection"
                ]
            },
            "message":"must be equal to one of the allowed values"
          },
          {
            "instancePath":"",
            "schemaPath":"#/oneOf",
            "keyword":"oneOf",
            "params":{
                "passingSchemas":null
            },
            "message":"must match exactly one schema in oneOf"
          }
      ]
    }
    ```

  **Error Response (400 Bad Request):**
  - If the `schema_url` is not reachable or invalid:
    ```json
    {
      "error": "Failed to fetch schema from <schema_url>. Status: 404"
    }
    ```
