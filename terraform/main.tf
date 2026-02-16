terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.50.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 4.50.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}


# Enable necessary Google Cloud APIs
resource "google_project_service" "cloudrun_api" {
  service = "run.googleapis.com"
}

resource "google_project_service" "storage_api" {
  service = "storage.googleapis.com"
}

resource "google_project_service" "iam_api" {
  service = "iam.googleapis.com"
}

resource "google_project_service" "artifactregistry_api" {
  service = "artifactregistry.googleapis.com"
}

# Create an Artifact Registry remote repository for ghcr.io
resource "google_artifact_registry_repository" "ghcr_remote" {
  provider = google-beta

  location      = var.region
  repository_id = "${var.service_name}-ghcr-remote"
  description   = "Remote repository for ghcr.io"
  format        = "DOCKER"

  mode = "REMOTE_REPOSITORY"

  remote_repository_config {
    description = "ghcr.io remote"
    docker_repository {
      custom_repository {
        uri = "https://ghcr.io"
      }
    }
  }

  depends_on = [google_project_service.artifactregistry_api]
}


# Create a dedicated service account for the Cloud Run service
resource "google_service_account" "service_account" {
  account_id   = "${var.service_name}-sa"
  display_name = "Service Account for ${var.service_name}"
}

locals {
  merged_environment_variables = merge(
    var.environment_variables,
    {
      "SCHEMA_URL_PATTERN" = var.schema_url_pattern
    }
  )
}

# The Cloud Run service
resource "google_cloud_run_v2_service" "service" {
  name                = var.service_name
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.service_account.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.ghcr_remote.repository_id}/${replace(var.docker_image, "ghcr.io/", "")}"
      ports {
        container_port = 3000
      }

      startup_probe {
        initial_delay_seconds = 5
        timeout_seconds       = 2
        period_seconds        = 10
        failure_threshold     = 3
        http_get {
          path = "/health"
        }
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
      }

      dynamic "env" {
        for_each = local.merged_environment_variables
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  depends_on = [
    google_project_service.cloudrun_api,
    google_artifact_registry_repository.ghcr_remote,
  ]
}

# Optional: Create a Google Cloud Storage bucket for schemas
resource "google_storage_bucket" "schema_bucket" {
  count = var.create_schema_bucket ? 1 : 0

  name          = var.schema_bucket_name
  location      = var.region
  force_destroy = false # Set to true to allow destroying a non-empty bucket

  uniform_bucket_level_access = true
}
