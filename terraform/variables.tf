variable "project_id" {
  description = "The Google Cloud project ID to deploy the resources in."
  type        = string
}

variable "docker_image" {
  description = "The full URL of the Docker image to deploy (e.g., ghcr.io/user/repo:tag)."
  type        = string
  default     = "ghcr.io/benedikt-buchert/tracking_validator:latest"
}

variable "schema_url_pattern" {
  description = "The regex pattern to validate schema URLs against. This is a mandatory environment variable for the application."
  type        = string
}

variable "region" {
  description = "The Google Cloud region to deploy the resources in."
  type        = string
  default     = "europe-west3"
}

variable "service_name" {
  description = "The name of the Cloud Run service."
  type        = string
  default     = "tracking-validator"
}

variable "min_instances" {
  description = "The minimum number of container instances for the service."
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "The maximum number of container instances for the service."
  type        = number
  default     = 10
}

variable "environment_variables" {
  description = "A map of optional, additional environment variables to set on the Cloud Run service."
  type        = map(string)
  default     = {}
}

variable "create_schema_bucket" {
  description = "A flag to control whether to create a Google Cloud Storage bucket for schemas."
  type        = bool
  default     = false
}

variable "schema_bucket_name" {
  description = "The name for the Google Cloud Storage bucket for schemas. Must be globally unique."
  type        = string
  default     = ""
}
