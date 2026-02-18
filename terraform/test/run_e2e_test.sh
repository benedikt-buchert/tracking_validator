#!/bin/bash
set -e

# This script runs a full end-to-end test of the Terraform configuration.
# It is designed to be run from the project root.
# It accepts a Google Cloud project ID as an argument, deploys the infrastructure,
# runs tests, and then tears it down.

if [ -z "$1" ]; then
  echo "Usage: $0 <gcp-project-id>"
  echo "Example: $0 my-gcp-project-123"
  exit 1
fi

PROJECT_ID=$1
TERRAFORM_DIR="./terraform"
TFVARS_FILE="$TERRAFORM_DIR/test.auto.tfvars.json"
SCHEMA_FILE_PATH="$TERRAFORM_DIR/test/test_schema.json"

# Create a temporary .tfvars file
cat <<EOF > $TFVARS_FILE
{
  "project_id": "$PROJECT_ID",
  "schema_url_pattern": ".*",
  "create_schema_bucket": true,
  "force_destroy_bucket": true
}
EOF

# Cleanup function to be called on script exit
cleanup() {
  echo ""
  echo "--- Cleaning up temporary files ---"
  rm -f $TFVARS_FILE
}

# Register the cleanup function to be called on EXIT
trap cleanup EXIT

echo "--- Assuming you are already authenticated with Google Cloud ---"

echo "--- Initializing Terraform ---"
terraform -chdir=$TERRAFORM_DIR init

# Defer the destroy command to ensure it runs even if tests fail
trap 'echo "" && echo "--- Tearing Down Infrastructure ---" && terraform -chdir=$TERRAFORM_DIR destroy -auto-approve' EXIT

echo "--- Deploying Infrastructure ---"
terraform -chdir=$TERRAFORM_DIR apply -auto-approve

# Get outputs from Terraform
SERVICE_URL=$(terraform -chdir=$TERRAFORM_DIR output -raw service_url)
BUCKET_NAME=$(terraform -chdir=$TERRAFORM_DIR output -raw bucket_name)
echo "Service deployed at: $SERVICE_URL"
echo "Schema bucket is: $BUCKET_NAME"

# Upload test schema if the bucket was created
if [ -n "$BUCKET_NAME" ]; then
  echo "--- Uploading test schema to GCS ---"
  gcloud storage cp $SCHEMA_FILE_PATH gs://$BUCKET_NAME/test_schema.json
fi

echo "--- Running Tests ---"
echo "Testing health endpoint..."
curl -s -f "$SERVICE_URL/health" | grep '"status":"ok"'

if [ -n "$BUCKET_NAME" ]; then
  echo "Testing with a valid payload..."
  curl -s -f -X POST \
    "$SERVICE_URL/v1/validate/remote?schema_url=schemas/test_schema.json" \
    -H 'Content-Type: application/json' \
    -d '{
      "name": "John Doe",
      "age": 30
    }' | grep '"valid":true'

  echo "Testing with an invalid payload..."
  curl -s -f -X POST \
    "$SERVICE_URL/v1/validate/remote?schema_url=schemas/test_schema.json" \
    -H 'Content-Type: application/json' \
    -d '{
      "name": "John Doe",
      "age": "thirty"
    }' | grep '"valid":false'
fi

echo "--- Tests Passed! ---"

# The teardown is handled by the trap at the end
echo "--- E2E Test Complete ---"
