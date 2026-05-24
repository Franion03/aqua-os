# ── AWS Region ───────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

# ── Instance Sizing ─────────────────────────────────────────────────────

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro" # Free tier: 1 vCPU, 1 GB RAM
}

variable "root_volume_size" {
  description = "Root EBS volume size (GB)"
  type        = number
  default     = 20 # Free tier: up to 30 GB
}

# ── Networking ──────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "Public subnet CIDR block"
  type        = string
  default     = "10.0.1.0/24"
}

# ── SSH Access ──────────────────────────────────────────────────────────

variable "ssh_public_key" {
  description = "Public SSH key for EC2 access"
  type        = string
  sensitive   = true
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the instance"
  type        = string
  default     = "0.0.0.0/0" # Restrict to your IP in .tfvars
}

# ── Gemini API Key ──────────────────────────────────────────────────────

variable "gemini_api_key" {
  description = "Google Gemini API key (injected into the instance)"
  type        = string
  sensitive   = true
}

# ── OpenRouter API Key ──────────────────────────────────────────────────

variable "openrouter_api_key" {
  description = "OpenRouter API key for multi-model LLM (DeepSeek, Claude, Gemini)"
  type        = string
  sensitive   = true
  default     = ""
}

# ── Domain / Naming ─────────────────────────────────────────────────────

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "aquaos"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "poc"
}
