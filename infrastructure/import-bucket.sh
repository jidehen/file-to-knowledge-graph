#!/bin/bash

# Import existing S3 bucket into CloudFormation
# This adds your existing bucket to CloudFormation management without modifying it

set -e

BUCKET_NAME="jordan-opal-demo"
STACK_NAME="file-to-knowledge-graph-bucket-import"
AWS_REGION="us-east-1"

echo "🔄 Importing existing S3 bucket into CloudFormation..."
echo "Bucket: $BUCKET_NAME"
echo "Stack: $STACK_NAME"
echo ""

# Check if bucket exists
if ! aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "❌ Bucket $BUCKET_NAME does not exist or is not accessible"
    exit 1
fi

echo "✅ Bucket $BUCKET_NAME exists and is accessible"

# Create import file
cat > bucket-import.json << EOF
[
  {
    "ResourceType": "AWS::S3::Bucket",
    "LogicalResourceId": "ExistingFileUploadBucket",
    "ResourceIdentifier": {
      "BucketName": "$BUCKET_NAME"
    }
  }
]
EOF

echo "📋 Creating CloudFormation stack with import..."

# Create stack with import
aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body file://import-existing-bucket.yaml \
    --parameters \
        ParameterKey=ExistingBucketName,ParameterValue="$BUCKET_NAME" \
        ParameterKey=ProjectName,ParameterValue="file-to-knowledge-graph" \
        ParameterKey=Environment,ParameterValue="prod" \
    --resources-to-import file://bucket-import.json \
    --region "$AWS_REGION"

echo "⏳ Waiting for import to complete..."

# Wait for completion
aws cloudformation wait stack-create-complete \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Bucket import completed successfully!"
    echo ""
    echo "📋 Your existing bucket is now managed by CloudFormation"
    echo "Stack Name: $STACK_NAME"
    echo "Bucket: $BUCKET_NAME"
    echo ""
    echo "🎯 Next: Update your main deployment template to reference this stack"
else
    echo "❌ Import failed. Check CloudFormation console for details."
    exit 1
fi

# Cleanup
rm -f bucket-import.json

echo "✨ Done!"