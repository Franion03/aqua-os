#!/usr/bin/env bash
# ── AquaOS CloudFormation Deploy ─────────────────────────────────────────
# Deploys the full PoC stack: VPC, EC2, S3, CloudFront.
#
# Usage:
#   1. Create an EC2 key pair: aws ec2 create-key-pair --key-name aquaos-poc --query 'KeyMaterial' --output text > aquaos-poc.pem
#   2. Copy parameters.example.json → parameters.json and fill in GeminiApiKey
#   3. ./deploy.sh create   # Deploy
#      ./deploy.sh update   # Update existing stack
#      ./deploy.sh delete   # Tear down
#      ./deploy.sh status   # Check stack status
#      ./deploy.sh outputs  # Show stack outputs

set -euo pipefail

STACK_NAME="aquaos-poc"
TEMPLATE="template.yaml"
PARAMS_FILE="${PARAMS_FILE:-parameters.json}"
REGION="${AWS_REGION:-eu-west-1}"
ACTION="${1:-create}"

cd "$(dirname "$0")"

case "$ACTION" in
  create)
    echo "🚀 Creating stack '$STACK_NAME' in $REGION..."
    aws cloudformation create-stack \
      --stack-name "$STACK_NAME" \
      --template-body "file://$TEMPLATE" \
      --parameters "file://$PARAMS_FILE" \
      --capabilities CAPABILITY_IAM \
      --region "$REGION" \
      --tags Key=Project,Value=aquaos Key=Environment,Value=poc

    echo ""
    echo "⏳ Waiting for stack creation to complete... (this takes ~6-8 minutes)"
    echo "   The EC2 bootstrap script runs on first boot and installs Python + CrewAI."
    echo ""
    aws cloudformation wait stack-create-complete \
      --stack-name "$STACK_NAME" \
      --region "$REGION"

    echo ""
    echo "✅ Stack created. Outputs:"
    aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query 'Stacks[0].Outputs' \
      --output table
    ;;

  update)
    echo "🔄 Updating stack '$STACK_NAME'..."

    # Create change set first so you can review
    CHANGE_SET_NAME="aquaos-update-$(date +%Y%m%d-%H%M%S)"
    aws cloudformation create-change-set \
      --stack-name "$STACK_NAME" \
      --change-set-name "$CHANGE_SET_NAME" \
      --template-body "file://$TEMPLATE" \
      --parameters "file://$PARAMS_FILE" \
      --capabilities CAPABILITY_IAM \
      --region "$REGION"

    echo ""
    echo "📋 Change set '$CHANGE_SET_NAME' created. Review changes:"
    aws cloudformation describe-change-set \
      --change-set-name "$CHANGE_SET_NAME" \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query 'Changes[*].ResourceChange.{Action:Action,LogicalId:LogicalResourceId,Type:ResourceType,Replacement:Replacement}' \
      --output table

    echo ""
    read -p "Execute this change set? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      aws cloudformation execute-change-set \
        --change-set-name "$CHANGE_SET_NAME" \
        --stack-name "$STACK_NAME" \
        --region "$REGION"

      aws cloudformation wait stack-update-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION"
      echo "✅ Stack updated."
    else
      aws cloudformation delete-change-set \
        --change-set-name "$CHANGE_SET_NAME" \
        --stack-name "$STACK_NAME" \
        --region "$REGION"
      echo "❌ Change set discarded."
    fi
    ;;

  delete)
    echo "🗑️  Deleting stack '$STACK_NAME'..."
    aws cloudformation delete-stack \
      --stack-name "$STACK_NAME" \
      --region "$REGION"

    echo "⏳ Waiting for deletion..."
    aws cloudformation wait stack-delete-complete \
      --stack-name "$STACK_NAME" \
      --region "$REGION"
    echo "✅ Stack deleted."
    ;;

  status)
    aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query 'Stacks[0].{Status:StackStatus,Created:CreationTime,Updated:LastUpdatedTime}' \
      --output table

    echo ""
    echo "📊 Resources:"
    aws cloudformation describe-stack-resources \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query 'StackResources[*].{LogicalId:LogicalResourceId,Type:ResourceType,Status:ResourceStatus}' \
      --output table
    ;;

  outputs)
    aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query 'Stacks[0].Outputs' \
      --output table
    ;;

  validate)
    echo "🔍 Validating template..."
    aws cloudformation validate-template \
      --template-body "file://$TEMPLATE" \
      --region "$REGION"
    echo "✅ Template is valid."
    ;;

  *)
    echo "Usage: $0 {create|update|delete|status|outputs|validate}"
    exit 1
    ;;
esac
