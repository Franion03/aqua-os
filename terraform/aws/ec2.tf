# ── VPC (minimal, free-tier safe) ───────────────────────────────────────

resource "aws_vpc" "aquaos" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_internet_gateway" "aquaos" {
  vpc_id = aws_vpc.aquaos.id

  tags = { Name = "${var.project_name}-igw" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.aquaos.id
  cidr_block              = var.subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-public-subnet" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.aquaos.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.aquaos.id
  }

  tags = { Name = "${var.project_name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ── Security Group ──────────────────────────────────────────────────────

resource "aws_security_group" "aquaos" {
  name        = "${var.project_name}-sg"
  description = "AquaOS PoC security group"
  vpc_id      = aws_vpc.aquaos.id

  # SSH — restrict to your IP in .tfvars
  ingress {
    description = "SSH from operator"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # HTTP from anywhere (Nginx reverse proxy, public PoC dashboard)
  ingress {
    description = "HTTP public"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS from anywhere
  ingress {
    description = "HTTPS public"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound (needed for Gemini API, pip installs, etc.)
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-sg" }
}

# ── EC2 Instance ────────────────────────────────────────────────────────

resource "aws_instance" "aquaos" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.aquaos.id]
  key_name               = aws_key_pair.aquaos.key_name

  root_block_device {
    volume_type = "gp3"
    volume_size = var.root_volume_size
    encrypted   = true
  }

  # Bootstrap script — installs everything
  user_data = templatefile("${path.module}/user-data.sh", {
    gemini_api_key = var.gemini_api_key
    project_name   = var.project_name
  })

  # IAM role: allow SSM (optional, for console access without SSH)
  # iam_instance_profile = aws_iam_instance_profile.aquaos.name

  tags = { Name = "${var.project_name}-instance" }
}

# ── Elastic IP (free when attached to running instance) ─────────────────

resource "aws_eip" "aquaos" {
  instance = aws_instance.aquaos.id
  domain   = "vpc"

  tags = { Name = "${var.project_name}-eip" }
}
