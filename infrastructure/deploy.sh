#!/bin/bash

# CloudFormation Deployment Script for Knowledge Graph Uploader
# Usage: ./deploy.sh [environment] [region]

set -e

# Default values
ENVIRONMENT=${1:-prod}
AWS_REGION=${2:-us-east-1}
PROJECT_NAME="file-to-knowledge-graph"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Knowledge Graph Uploader Infrastructure${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Project: ${PROJECT_NAME}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Region: ${AWS_REGION}"
echo -e "  Stack Name: ${STACK_NAME}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Set AWS region
export AWS_DEFAULT_REGION=$AWS_REGION

echo -e "${GREEN}✅ AWS CLI is configured${NC}"
echo ""

# Check if parameter file exists
PARAM_FILE="parameters-${ENVIRONMENT}.json"
if [ ! -f "$PARAM_FILE" ]; then
    echo -e "${RED}❌ Parameter file ${PARAM_FILE} not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Using parameter file: ${PARAM_FILE}${NC}"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
    echo -e "${YELLOW}📦 Stack ${STACK_NAME} exists. Updating...${NC}"
    OPERATION="update-stack"
else
    echo -e "${YELLOW}📦 Stack ${STACK_NAME} does not exist. Creating...${NC}"
    OPERATION="create-stack"
fi

echo ""
echo -e "${BLUE}🏗️  Deploying CloudFormation stack...${NC}"

# Deploy the stack
aws cloudformation $OPERATION \
    --stack-name "$STACK_NAME" \
    --template-body file://deployment-infrastructure.yaml \
    --parameters file://"$PARAM_FILE" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$AWS_REGION" \
    --tags \
        Key=Project,Value="$PROJECT_NAME" \
        Key=Environment,Value="$ENVIRONMENT" \
        Key=ManagedBy,Value="CloudFormation"

echo -e "${YELLOW}⏳ Waiting for stack operation to complete...${NC}"

# Wait for stack operation to complete
if [ "$OPERATION" = "create-stack" ]; then
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
else
    aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
fi

# Check the result
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Stack deployment completed successfully!${NC}"
    echo ""
    
    # Get stack outputs
    echo -e "${BLUE}📋 Stack Outputs:${NC}"
    echo -e "${BLUE}=================${NC}"
    
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
    
    echo ""
    echo -e "${GREEN}🎉 Infrastructure deployment complete!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo -e "1. Copy the GitHub Actions credentials from the outputs above"
    echo -e "2. Add them to your GitHub repository secrets"
    echo -e "3. Update your GitHub Actions workflow to use the new bucket and CloudFront distribution"
    echo -e "4. Push your code to trigger deployment"
    echo ""
    echo -e "${BLUE}🌐 Your website will be available at:${NC}"
    
    # Get specific outputs
    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
        --output text)
    
    if [ "$CLOUDFRONT_URL" != "None" ] && [ -n "$CLOUDFRONT_URL" ]; then
        echo -e "   ${GREEN}CloudFront: ${CLOUDFRONT_URL}${NC}"
    fi
    
    WEBSITE_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
        --output text)
    
    if [ "$WEBSITE_URL" != "None" ] && [ -n "$WEBSITE_URL" ]; then
        echo -e "   ${BLUE}S3 Website: ${WEBSITE_URL}${NC}"
    fi
    
else
    echo ""
    echo -e "${RED}❌ Stack deployment failed!${NC}"
    echo -e "${RED}Please check the CloudFormation console for details.${NC}"
    exit 1
fi