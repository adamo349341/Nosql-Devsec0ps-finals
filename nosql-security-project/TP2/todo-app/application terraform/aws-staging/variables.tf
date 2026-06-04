variable "aws_region" {
  type        = string
  default     = "eu-west-1"
  description = "Region AWS"
}

variable "instance_type" {
  type        = string
  default     = "t3.micro"  # Changé de t2.micro à t3.micro
  description = "Type d'instance EC2 (t3.micro recommandé si pas de free tier)"
}

variable "docker_image" {
  type        = string
  description = "URL complete de l image Docker"
}

variable "docker_tag" {
  type    = string
  default = "latest"
}

variable "registry_url" {
  type        = string
  description = "URL du registry GitLab"
}

variable "registry_user" {
  type        = string
  description = "Utilisateur pour docker login"
  sensitive   = true
}

variable "registry_password" {
  type        = string
  description = "Mot de passe pour docker login"
  sensitive   = true
}