output "staging_public_ip" {
  value       = aws_instance.staging.public_ip
  description = "IP publique de l instance (test: http://IP/health)"
}