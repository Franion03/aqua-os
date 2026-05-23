# ── AquaOS Infrastructure ───────────────────────────────────────────────
# GitOps-managed via GitHub Actions + AWS CloudFormation.
# See .github/workflows/deploy.yml for the full pipeline.

.PHONY: help validate deploy update delete status outputs drift clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── AWS CLI helpers ────────────────────────────────────────────────────

STACK_NAME  := aquaos-poc
TEMPLATE    := cloudformation/template.yaml
PARAMS      := cloudformation/parameters-poc.json
REGION      := eu-west-1

validate: ## Validate CloudFormation template
	aws cloudformation validate-template \
		--template-body "file://$(TEMPLATE)" \
		--region $(REGION)
	@echo "✅ Template is valid"

deploy: ## Create or update the stack
	@if aws cloudformation describe-stacks --stack-name $(STACK_NAME) --region $(REGION) 2>/dev/null; then \
		echo "Stack exists — running update..."; \
		$(MAKE) update; \
	else \
		echo "Creating new stack..."; \
		aws cloudformation create-stack \
			--stack-name $(STACK_NAME) \
			--template-body "file://$(TEMPLATE)" \
			--parameters "file://$(PARAMS)" \
			--capabilities CAPABILITY_IAM \
			--region $(REGION) \
			--tags Key=Project,Value=aquaos Key=Environment,Value=poc; \
		aws cloudformation wait stack-create-complete \
			--stack-name $(STACK_NAME) --region $(REGION); \
		echo "✅ Stack created"; \
		$(MAKE) outputs; \
	fi

update: ## Update existing stack via change set
	@CS_NAME="deploy-$$(date +%s)"; \
	aws cloudformation create-change-set \
		--stack-name $(STACK_NAME) \
		--change-set-name "$$CS_NAME" \
		--template-body "file://$(TEMPLATE)" \
		--parameters "file://$(PARAMS)" \
		--capabilities CAPABILITY_IAM \
		--region $(REGION); \
	echo "📋 Change set $$CS_NAME created — reviewing..."; \
	aws cloudformation wait change-set-create-complete \
		--change-set-name "$$CS_NAME" \
		--stack-name $(STACK_NAME) \
		--region $(REGION); \
	aws cloudformation describe-change-set \
		--change-set-name "$$CS_NAME" \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Changes[*].ResourceChange.{Action:Action,LogicalId:LogicalResourceId,Type:ResourceType,Replacement:Replacement}' \
		--output table; \
	read -p "Execute this change set? (y/N) " REPLY; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		aws cloudformation execute-change-set \
			--change-set-name "$$CS_NAME" \
			--stack-name $(STACK_NAME) \
			--region $(REGION); \
		aws cloudformation wait stack-update-complete \
			--stack-name $(STACK_NAME) --region $(REGION); \
		echo "✅ Stack updated"; \
	else \
		aws cloudformation delete-change-set \
			--change-set-name "$$CS_NAME" \
			--stack-name $(STACK_NAME) \
			--region $(REGION); \
		echo "❌ Change set discarded"; \
	fi

delete: ## Delete the entire stack
	@read -p "Delete stack $(STACK_NAME)? This cannot be undone. (y/N) " REPLY; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		aws cloudformation delete-stack --stack-name $(STACK_NAME) --region $(REGION); \
		aws cloudformation wait stack-delete-complete --stack-name $(STACK_NAME) --region $(REGION); \
		echo "✅ Stack deleted"; \
	else \
		echo "Cancelled"; \
	fi

status: ## Show stack status and resources
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].{Status:StackStatus,Created:CreationTime,Updated:LastUpdatedTime}' \
		--output table
	@echo ""
	@aws cloudformation describe-stack-resources \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'StackResources[*].{LogicalId:LogicalResourceId,Type:ResourceType,Status:ResourceStatus}' \
		--output table

outputs: ## Show stack outputs
	@aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs' \
		--output table

drift: ## Detect configuration drift
	@aws cloudformation detect-stack-drift --stack-name $(STACK_NAME) --region $(REGION)
	@echo "⏳ Waiting for drift detection..."
	@aws cloudformation wait stack-drift-detection-complete \
		--stack-name $(STACK_NAME) --region $(REGION)
	@DRIFT=$$(aws cloudformation describe-stack-drift-detection-status \
		--stack-drift-detection-id $$(aws cloudformation describe-stack-drift-detection-status \
			--stack-name $(STACK_NAME) --region $(REGION) \
			--query 'StackDriftDetectionId' --output text) \
		--region $(REGION) \
		--query 'StackDriftStatus' --output text); \
	if [ "$$DRIFT" = "IN_SYNC" ]; then \
		echo "✅ Stack is IN_SYNC"; \
	else \
		echo "🚨 Stack has DRIFTED: $$DRIFT"; \
		aws cloudformation describe-stack-resource-drifts \
			--stack-name $(STACK_NAME) \
			--region $(REGION) \
			--query 'StackResourceDrifts[?StackResourceDriftStatus!=`IN_SYNC`]' \
			--output table; \
	fi

# ── Application ────────────────────────────────────────────────────────

backend-dev: ## Run backend locally
	cd backend && GEMINI_API_KEY=$${GEMINI_API_KEY:?set GEMINI_API_KEY} python3 main.py

backend-install: ## Install backend dependencies
	cd backend && pip install -r requirements.txt

frontend-build: ## Build React frontend
	cd . && npm install && npm run build

frontend-deploy: ## Deploy frontend to S3 (requires stack outputs)
	@BUCKET=$$(aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) --region $(REGION) \
		--query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
		--output text); \
	aws s3 sync dist/ "s3://$$BUCKET/" --delete; \
	echo "✅ Frontend deployed to s3://$$BUCKET/"

ssh: ## SSH into the EC2 instance
	@IP=$$(aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) --region $(REGION) \
		--query 'Stacks[0].Outputs[?OutputKey==`InstancePublicIp`].OutputValue' \
		--output text); \
	ssh -i aquaos-poc.pem ec2-user@$$IP

# ── GitOps ──────────────────────────────────────────────────────────────

gitops-status: ## Show GitOps pipeline status
	@echo "📦 Stack: $(STACK_NAME)"
	@echo "🌍 Region: $(REGION)"
	@echo ""
	@echo "🔗 GitHub Actions: https://github.com/franion03/aqua-os/actions"
	@echo "📋 CloudFormation: https://$(REGION).console.aws.amazon.com/cloudformation/home?region=$(REGION)#/stacks"
	@echo ""
	@$(MAKE) status

clean: ## Clean local artifacts
	rm -rf dist/ node_modules/ backend/__pycache__/ backend/crews/__pycache__/ backend/tools/__pycache__/
