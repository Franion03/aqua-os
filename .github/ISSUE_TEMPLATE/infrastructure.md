---
name: Infrastructure Change
about: Propose a change to the AquaOS AWS infrastructure
title: '[infra] '
labels: ['infrastructure']
assignees: []
---

## What infrastructure change is needed?

<!-- e.g. "Scale EC2 from t3.micro to t3.small" or "Add a new CloudFront behavior" -->

## Why is this needed?

<!-- Context: what problem does this solve? -->

## Affected resources

<!-- Check all that apply -->
- [ ] EC2 instance (type/size/AMI)
- [ ] VPC / networking / security groups
- [ ] S3 bucket / CloudFront
- [ ] CloudFormation template
- [ ] CI/CD pipeline (`.github/workflows/`)
- [ ] Parameters / environment config

## Cost impact

<!-- Will this change monthly AWS costs? By how much? -->

## Validation checklist

<!-- The CI pipeline will auto-validate. Check these before pushing: -->
- [ ] `make validate` passes locally
- [ ] Change Set reviewed in CloudFormation console
- [ ] Free tier limits respected (if PoC)
- [ ] No hardcoded secrets in template files
