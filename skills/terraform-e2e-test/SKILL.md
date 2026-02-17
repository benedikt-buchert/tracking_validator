---
name: terraform-e2e-test
description: Runs a full end-to-end test for the Terraform Cloud Run deployment. It deploys the infrastructure to a specified GCP project, runs tests, and tears it down.
---

# Terraform End-to-End Test

This skill executes a full end-to-end test of the Terraform configuration for the Cloud Run service.

## Instructions

1.  **Ask for Project ID:** The test script requires a Google Cloud Project ID to deploy the resources to. Ask the user for the `project_id`.

2.  **Execute the Test Script:** Run the `run_e2e_test.sh` script located in the `terraform/test` directory. Pass the user-provided `project_id` as the first argument to the script.

    **Example command:**
    ```bash
    ./terraform/test/run_e2e_test.sh your-gcp-project-id
    ```

3.  **Monitor the Output:** The script will provide real-time output of the deployment, testing, and teardown process. The script is designed to be self-sufficient and will clean up all resources automatically.
