// yss_orbit\infra\terraform\main.tf
provider "aws" {
  region = var.aws_region
}

module "network" {
  source      = "./modules/network"
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

module "database" {
  source              = "./modules/database"
  environment         = var.environment
  vpc_id              = module.network.vpc_id
  private_subnet_ids  = module.network.private_subnet_ids
  db_password         = var.db_password
}

module "compute" {
  source              = "./modules/compute"
  environment         = var.environment
  vpc_id              = module.network.vpc_id
  private_subnet_ids  = module.network.private_subnet_ids
}
