#!/bin/bash
set -e

# Change to the directory where the script is located to ensure terraform finds the .tf files.
cd "$(dirname "$0")"

# A simple script to validate and plan the Terraform configuration locally.
# This gives you a quick way to catch errors and see what infrastructure
# would be created, without actually creating any resources.
#
# Prerequisites:
# 1. A `terraform.tfvars` file must exist in this directory.
# 2. You must be authenticated with Google Cloud (run `gcloud auth application-default login`).

echo "--- Initializing Terraform ---"
terraform init

echo "--- Checking formatting ---"
terraform fmt -check -recursive

echo "--- Validating configuration ---"
terraform validate

echo "--- Generating execution plan (dry run) ---"
terraform plan

echo "--- Terraform plan successful! Configuration is ready to apply. ---"
