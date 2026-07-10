// yss_orbit\infra\terraform\outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = module.network.vpc_id
}

output "eks_cluster_endpoint" {
  description = "EKS Cluster Endpoint"
  value       = module.compute.cluster_endpoint
}

output "db_endpoint" {
  description = "RDS Postgres Endpoint"
  value       = module.database.rds_endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis Endpoint"
  value       = module.database.redis_endpoint
}
