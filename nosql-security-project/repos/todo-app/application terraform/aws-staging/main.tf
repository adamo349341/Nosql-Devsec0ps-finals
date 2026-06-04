terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
    tls = { source = "hashicorp/tls", version = "~> 4.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

# Création d'un VPC personnalisé
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "tp-devsecops-vpc"
  }
}

# Création de sous-réseaux publics
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "tp-devsecops-subnet-${count.index}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "tp-devsecops-igw"
  }
}

# Table de routage
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "tp-devsecops-rt"
  }
}

# Association des sous-réseaux à la table de routage
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Data source pour les zones de disponibilité
data "aws_availability_zones" "available" {
  state = "available"
}

# Security Group : HTTP 80 + SSH 22
resource "aws_security_group" "staging_sg" {
  name        = "tp-devsecops-staging-sg"
  description = "HTTP 80, SSH 22 pour TP staging"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Cle SSH
resource "tls_private_key" "staging" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "aws_key_pair" "staging" {
  key_name   = "tp-staging-key"
  public_key = tls_private_key.staging.public_key_openssh
}

# AMI Amazon Linux 2
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Instance EC2
resource "aws_instance" "staging" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.staging.key_name
  vpc_security_group_ids = [aws_security_group.staging_sg.id]
  subnet_id              = aws_subnet.public[0].id

  user_data = <<-EOT
#!/bin/bash
set -e
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
echo "${var.registry_password}" | docker login -u "${var.registry_user}" --password-stdin ${var.registry_url}
docker pull ${var.docker_image}:${var.docker_tag}
docker stop app 2>/dev/null || true
docker rm app 2>/dev/null || true
docker run -d --name app --restart unless-stopped -p 80:3000 ${var.docker_image}:${var.docker_tag}
EOT

  tags = {
    Name = "tp-devsecops-staging"
  }
}