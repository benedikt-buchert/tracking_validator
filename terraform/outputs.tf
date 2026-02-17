output "service_url" {
  description = "The URL of the deployed Cloud Run service."
  value       = google_cloud_run_v2_service.service.uri
}

output "bucket_name" {
  description = "The name of the GCS bucket for schemas (if created)."
  value       = var.create_schema_bucket ? google_storage_bucket.schema_bucket[0].name : null
}
