# CloudFormation Deployment Guide

This guide walks you through deploying the Knowledge Graph Uploader using AWS CloudFormation for Infrastructure as Code (IaC).

## 🏗️ **What CloudFormation Will Create**

- **S3 Bucket** - Static website hosting with proper CORS configuration
- **CloudFront Distribution** - Global CDN with HTTPS, custom error pages, and caching
- **IAM User & Policies** - Dedicated permissions for GitHub Actions deployment
- **Access Keys** - Automatically generated for CI/CD pipeline

## 📋 **Prerequisites**

- AWS CLI installed and configured
- Administrative access to your AWS account
- GitHub repository already created

## 🚀 **Option 1: Quick Deploy (Recommended)**

### Step 1: Deploy Infrastructure
```bash
cd infrastructure
./deploy.sh prod us-east-1
```

### Step 2: Get Credentials
The deployment will output GitHub Actions credentials:
```
GitHubActionsAccessKeyId     | AKIA...
GitHubActionsSecretAccessKey | xyz123...
```

### Step 3: Configure GitHub Secrets
Go to your repository settings and add these secrets:

| Secret Name | Source |
|-------------|--------|
| `AWS_ACCESS_KEY_ID` | From CloudFormation output |
| `AWS_SECRET_ACCESS_KEY` | From CloudFormation output |
| `AWS_REGION` | `us-east-1` (or your chosen region) |
| `REACT_APP_AWS_REGION` | Your app region |
| `REACT_APP_AWS_ACCESS_KEY_ID` | Your existing app user key |
| `REACT_APP_AWS_SECRET_ACCESS_KEY` | Your existing app user secret |
| `REACT_APP_S3_BUCKET_NAME` | `jordan-opal-demo` |

### Step 4: Deploy!
Push to main branch and watch your site deploy automatically.

## 🔧 **Option 2: Manual CloudFormation**

### Step 1: Deploy via AWS Console
1. Go to **CloudFormation Console**
2. Click **"Create stack"** → **"With new resources"**
3. **Template source**: Upload `infrastructure/deployment-infrastructure.yaml`
4. **Stack name**: `file-to-knowledge-graph-prod`
5. **Parameters**:
   - ProjectName: `file-to-knowledge-graph`
   - Environment: `prod`
   - DomainName: (leave empty for now)
   - CertificateArn: (leave empty for now)
6. **Capabilities**: Check **"I acknowledge that AWS CloudFormation might create IAM resources"**
7. Click **"Create stack"**

### Step 2: Wait for Completion
Monitor the stack creation in the CloudFormation console (~5-10 minutes).

### Step 3: Get Outputs
Go to **Outputs** tab and copy the GitHub Actions credentials.

## 🌐 **Custom Domain Setup (Optional)**

### Step 1: Get SSL Certificate
1. Go to **Certificate Manager** (must be in us-east-1 for CloudFront)
2. Click **"Request a certificate"**
3. Enter your domain name (e.g., `myapp.example.com`)
4. Choose **DNS validation**
5. Add the CNAME record to your DNS provider
6. Wait for validation to complete

### Step 2: Update CloudFormation
Edit `infrastructure/parameters-prod.json`:
```json
[
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "myapp.example.com"
  },
  {
    "ParameterKey": "CertificateArn",
    "ParameterValue": "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
  }
]
```

### Step 3: Update Stack
```bash
./deploy.sh prod us-east-1
```

### Step 4: Update DNS
Create a CNAME record pointing your domain to the CloudFront distribution.

## 📊 **What You Get**

### **URLs:**
- **CloudFront (HTTPS)**: `https://d1234567890123.cloudfront.net`
- **S3 Website (HTTP)**: `http://your-bucket.s3-website-us-east-1.amazonaws.com`
- **Custom Domain**: `https://your-domain.com` (if configured)

### **Features:**
- ✅ **HTTPS everywhere** via CloudFront
- ✅ **Global CDN** for fast loading worldwide
- ✅ **Automatic deployments** via GitHub Actions
- ✅ **React SPA routing** support (404 → index.html)
- ✅ **Optimized caching** (1 year for static assets, 0 for HTML)
- ✅ **Security headers** via CloudFront managed policies
- ✅ **CORS configured** for API calls

## 🔄 **CI/CD Pipeline**

After CloudFormation deployment:

```
GitHub Push → GitHub Actions → Build React App → Deploy to S3 → Invalidate CloudFront → Live Website
```

**Automatic features:**
- Builds on every push to main
- Optimized cache headers
- CloudFront cache invalidation
- Deployment status in GitHub Actions

## 🛠️ **Managing the Infrastructure**

### **Update Infrastructure**
```bash
# Modify the CloudFormation template
# Then redeploy
./deploy.sh prod us-east-1
```

### **Delete Everything**
```bash
aws cloudformation delete-stack --stack-name file-to-knowledge-graph-prod --region us-east-1
```

### **Monitor Costs**
- S3: ~$0.01-0.10/month for static hosting
- CloudFront: ~$0.10-1.00/month depending on traffic
- Total: Usually under $5/month for small to medium traffic

## 🔒 **Security Features**

### **Implemented:**
- ✅ **IAM least privilege** - GitHub Actions can only deploy, not access file uploads
- ✅ **Separate credentials** - Website deployment vs app functionality
- ✅ **HTTPS enforcement** - All traffic redirected to HTTPS
- ✅ **Security headers** - HSTS, CSP, X-Frame-Options via CloudFront
- ✅ **No secrets in code** - All credentials in GitHub Secrets

### **Additional Recommendations:**
- Enable **CloudTrail** for audit logging
- Set up **AWS Config** for compliance monitoring
- Use **AWS WAF** if you expect high traffic or attacks
- Enable **VPC Flow Logs** if using VPC resources

## 🚨 **Troubleshooting**

### **Common Issues:**

**CloudFormation fails:**
```bash
# Check the events tab in CloudFormation console
aws cloudformation describe-stack-events --stack-name file-to-knowledge-graph-prod
```

**GitHub Actions fails:**
- Verify all GitHub secrets are set correctly
- Check that CloudFormation stack exists and outputs are available
- Ensure IAM permissions are correct

**Website shows 404:**
- Wait 5-10 minutes for CloudFront deployment
- Check S3 bucket has files
- Verify CloudFront distribution is deployed

**React routing doesn't work:**
- CloudFormation automatically configures 404 → index.html
- Check CloudFront error pages configuration

### **Useful Commands:**

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name file-to-knowledge-graph-prod

# Get stack outputs
aws cloudformation describe-stacks --stack-name file-to-knowledge-graph-prod --query 'Stacks[0].Outputs'

# Check S3 bucket contents
aws s3 ls s3://file-to-knowledge-graph-prod-website/

# Check CloudFront distribution
aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`CloudFront distribution for file-to-knowledge-graph prod`]'
```

## ✨ **Benefits of This Approach**

- **🔄 Reproducible** - Same infrastructure every time
- **📝 Documented** - Infrastructure defined in code
- **🔒 Secure** - Follows AWS best practices
- **💰 Cost-effective** - Only pay for what you use
- **⚡ Fast** - Global CDN for optimal performance
- **🛠️ Maintainable** - Easy to update and manage
- **🎯 Professional** - Production-ready setup

This CloudFormation approach gives you enterprise-grade infrastructure with minimal manual setup!