# Allow unauthenticated access to the Cloud Run service
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  name     = local.cloud_run_name
  location = google_cloud_run_v2_service.service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Grant the Cloud Run service account permission to read from the GCS bucket
resource "google_storage_bucket_iam_member" "bucket_reader" {
  count = var.create_schema_bucket ? 1 : 0

  bucket = google_storage_bucket.schema_bucket[0].name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.service_account.email}"
}

# Grant the Cloud Run service account permission to read from Artifact Registry
resource "google_project_iam_member" "artifact_registry_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.service_account.email}"
}
