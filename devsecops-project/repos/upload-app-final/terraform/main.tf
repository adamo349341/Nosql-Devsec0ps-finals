terraform {
  required_version = ">= 1.5.0"
}

############################
# Variables
############################
variable "app_name" {
  type    = string
  default = "upload-app"
}

variable "container_port" {
  type    = number
  default = 3000
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "image_tag" {
  type    = string
  default = "latest"
}

############################
# Outputs
############################
output "app_name" {
  value = var.app_name
}

output "container_port" {
  value = var.container_port
}