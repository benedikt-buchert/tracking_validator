variable "project_id" {
  description = "The Google Cloud project ID to deploy the resources in."
  type        = string
}

variable "prefix" {
  description = "The prefix to use for all resource names."
  type        = string
  default     = "tracking-validator"
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


variable "force_destroy_bucket" {
  description = "A flag to control whether to force destroy the Google Cloud Storage bucket."
  type        = bool
  default     = false
}
