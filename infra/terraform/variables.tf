// yss_orbit\infra\terraform\variables.tf
variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "db_password" {
  description = "Password for RDS Postgres"
  type        = string
  sensitive   = true
}
