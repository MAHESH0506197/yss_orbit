// yss_orbit\infra\terraform\environments\staging\main.tf
module "root" {
  source      = "../../"
  aws_region  = "us-east-1"
  environment = "staging"
  vpc_cidr    = "10.1.0.0/16"
  db_password = "dummy-staging-password" # Inject via secrets manager or env in pipeline
}
