// yss_orbit\infra\terraform\environments\dev\main.tf
module "root" {
  source      = "../../"
  aws_region  = "us-east-1"
  environment = "dev"
  vpc_cidr    = "10.0.0.0/16"
  db_password = "dummy-dev-password" # Inject via secrets manager or env in pipeline
}
