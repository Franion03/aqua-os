# ── EC2 ──────────────────────────────────────────────────────────────────

output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_eip.aquaos.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_eip.aquaos.public_dns
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i aquaos-poc.pem ec2-user@${aws_eip.aquaos.public_ip}"
}

# ── CloudFront ───────────────────────────────────────────────────────────

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_url" {
  description = "AquaOS frontend URL (via CloudFront)"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

# ── Backend ──────────────────────────────────────────────────────────────

output "api_url" {
  description = "AquaOS backend API URL (via CloudFront)"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}/api"
}

output "health_check_url" {
  description = "Health check endpoint"
  value       = "http://${aws_eip.aquaos.public_ip}/api/health"
}

# ── S3 ───────────────────────────────────────────────────────────────────

output "s3_bucket_name" {
  description = "S3 bucket for frontend assets"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_deploy_command" {
  description = "Command to deploy the React build to S3"
  value       = "aws s3 sync dist/ s3://${aws_s3_bucket.frontend.id}/ --delete"
}
