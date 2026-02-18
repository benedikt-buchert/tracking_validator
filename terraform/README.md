# Terraform Setup for Tracking Validator on Google Cloud Run

This Terraform setup deploys the Tracking Validator application as a public-facing service on Google Cloud Run.

## Prerequisites

1.  **Google Cloud Project:** You need a Google Cloud project with billing enabled.
2.  **Permissions:** Ensure you have the `Owner` or `Editor` role on the project, or at least the necessary permissions to create the resources defined in this configuration.
3.  **[Google Cloud SDK](https://cloud.google.com/sdk/docs/install):** The `gcloud` CLI must be installed and configured.
4.  **[Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli):** Terraform must be installed on your local machine.

## How to Use

1.  **Authenticate with Google Cloud:**
    Log in with your user account.
    ```bash
    gcloud auth application-default login
    ```

2.  **Create a `terraform.tfvars` file:**
    Create a file named `terraform.tfvars` in this directory and fill it with the required variables. At a minimum, you must provide your `project_id` and the `docker_image` URL.

    **Example `terraform.tfvars`:**
    ```hcl
    project_id         = "your-gcp-project-id"
    schema_url_pattern = ".*" # Be more specific in production

    # Optional: Override the default resource prefix
    # prefix = "my-app"

    # Optional: Override the default docker image
    # docker_image = "ghcr.io/benedikt-buchert/tracking_validator:v1.0.0"

    # Optional: Set additional environment variables
    # environment_variables = {
    #   "LOG_LEVEL" = "debug"
    # }

    # Optional: Create and use a GCS bucket for schemas
    # create_schema_bucket = true
    ```

3.  **Initialize Terraform:**
    Run this command inside the `terraform` directory to initialize the providers.
    ```bash
    terraform init
    ```

4.  **Plan and Apply:**
    Review the plan and then apply the configuration.
    ```bash
    terraform plan
    terraform apply
    ```
    Terraform will prompt you to confirm the changes before it creates any resources.

5.  **Access Your Service:**
    After the apply is complete, Terraform will output the URL of your service.

## Cleanup

To destroy all the resources created by this configuration, run:
```bash
terraform destroy
```
