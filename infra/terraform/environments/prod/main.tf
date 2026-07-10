// yss_orbit\infra\terraform\environments\prod\main.tf
module "root" {
  source      = "../../"
  aws_region  = "us-east-1"
  environment = "prod"
  vpc_cidr    = "10.2.0.0/16"
  db_password = "dummy-prod-password" # Inject via secrets manager or env in pipeline
}
