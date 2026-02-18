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

locals {
  # Centralized naming convention
  service_account_id = "${var.prefix}-sa-server"
  cloud_run_name     = "${var.prefix}-cr-server"
  artifact_repo_id   = "${var.prefix}-gar-ghcr-remote"
  bucket_name        = "${var.prefix}-gcs-schemas"

  # Merged environment variables
  merged_environment_variables = merge(
    var.environment_variables,
    {
      "SCHEMA_URL_PATTERN" = var.schema_url_pattern
    }
  )
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
  repository_id = local.artifact_repo_id
  description   = "Remote repository for ghcr.io"
  format        = "DOCKER"
  mode          = "REMOTE_REPOSITORY"

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
  account_id   = local.service_account_id
  display_name = "Service Account for ${local.cloud_run_name}"
}

# The Cloud Run service
resource "google_cloud_run_v2_service" "service" {
  name                = local.cloud_run_name
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.service_account.email

    dynamic "volumes" {
      for_each = var.create_schema_bucket ? [1] : []
      content {
        name = "schema-volume"
        gcs {
          bucket    = google_storage_bucket.schema_bucket[0].name
          read_only = true
        }
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.ghcr_remote.repository_id}/${replace(var.docker_image, "ghcr.io/", "")}"

      dynamic "volume_mounts" {
        for_each = var.create_schema_bucket ? [1] : []
        content {
          name       = "schema-volume"
          mount_path = "/usr/src/app/schemas"
        }
      }

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

  name          = local.bucket_name
  location      = var.region
  force_destroy = var.force_destroy_bucket

  uniform_bucket_level_access = true
}
