#!/bin/bash

# Setup script for S3 static website deployment
# This script helps automate the AWS setup process

set -e

echo "🚀 Knowledge Graph Uploader - Deployment Setup"
echo "=============================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is installed and configured"

# Get bucket name from user
read -p "Enter your S3 bucket name for the website (e.g., file-to-knowledge-graph-app): " BUCKET_NAME

if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Bucket name cannot be empty"
    exit 1
fi

# Get AWS region
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "🏗️  Creating S3 bucket: $BUCKET_NAME"

# Create S3 bucket
if aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION; then
    echo "✅ S3 bucket created successfully"
else
    echo "⚠️  Bucket might already exist or there was an error"
fi

echo ""
echo "🔧 Configuring static website hosting..."

# Configure static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

echo "✅ Static website hosting configured"

echo ""
echo "🔓 Setting up bucket policy for public access..."

# Create bucket policy
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

# Remove temporary policy file
rm bucket-policy.json

echo "✅ Bucket policy applied"

# Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"

echo ""
echo "🎉 Setup complete!"
echo "==================="
echo "Website URL: $WEBSITE_URL"
echo ""
echo "📝 Next steps:"
echo "1. Create IAM user for GitHub Actions (see DEPLOYMENT.md)"
echo "2. Set up GitHub repository secrets"
echo "3. Push your code to trigger deployment"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"