# Deployment Guide: S3 Static Website with Auto-Deploy

This guide will help you deploy the Knowledge Graph Uploader to AWS S3 as a static website with automatic deployment from GitHub.

## Prerequisites

- AWS Account with administrative access
- GitHub repository (already created)
- AWS CLI installed (optional but helpful)

## Step 1: Create S3 Bucket for Website Hosting

### 1.1 Create the S3 Bucket
1. Go to **S3 Console**: https://s3.console.aws.amazon.com
2. Click **"Create bucket"**
3. **Bucket name**: `file-to-knowledge-graph-app` (must be globally unique)
4. **Region**: Choose your preferred region (e.g., `us-east-1`)
5. **Uncheck** "Block all public access" (we need public access for website hosting)
6. **Acknowledge** the warning about public access
7. Click **"Create bucket"**

### 1.2 Configure Static Website Hosting
1. Click on your newly created bucket
2. Go to **"Properties"** tab
3. Scroll to **"Static website hosting"**
4. Click **"Edit"**
5. Select **"Enable"**
6. **Index document**: `index.html`
7. **Error document**: `index.html` (for React SPA routing)
8. Click **"Save changes"**
9. **Note the website URL** (e.g., `http://your-bucket.s3-website-us-east-1.amazonaws.com`)

### 1.3 Set Bucket Policy for Public Access
1. Go to **"Permissions"** tab
2. Scroll to **"Bucket policy"**
3. Click **"Edit"** and paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

4. Click **"Save changes"**

## Step 2: Create IAM User for GitHub Actions

### 2.1 Create IAM User
1. Go to **IAM Console**: https://console.aws.amazon.com/iam
2. Click **"Users"** → **"Create user"**
3. **Username**: `github-actions-s3-deploy`
4. **Don't** provide console access
5. Click **"Next"**

### 2.2 Attach Permissions
1. Select **"Attach policies directly"**
2. Click **"Create policy"** (opens new tab)
3. Switch to **"JSON"** tab and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR-BUCKET-NAME",
                "arn:aws:s3:::YOUR-BUCKET-NAME/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateInvalidation"
            ],
            "Resource": "*"
        }
    ]
}
```

4. **Name**: `S3DeploymentPolicy`
5. Click **"Create policy"**
6. Go back to user creation tab, refresh policies
7. Search and select `S3DeploymentPolicy`
8. Click **"Next"** → **"Create user"**

### 2.3 Create Access Keys
1. Click on the created user
2. Go to **"Security credentials"** tab
3. Click **"Create access key"**
4. Select **"Application running outside AWS"**
5. Click **"Next"** → **"Create access key"**
6. **Copy both Access Key ID and Secret Access Key** (you'll need these for GitHub)

## Step 3: Configure GitHub Repository Secrets

1. Go to your GitHub repository: https://github.com/jidehen/file-to-knowledge-graph
2. Click **"Settings"** tab
3. Click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"** for each of these:

### Required Secrets:
| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | Your IAM user access key | For GitHub Actions AWS access |
| `AWS_SECRET_ACCESS_KEY` | Your IAM user secret key | For GitHub Actions AWS access |
| `AWS_REGION` | `us-east-1` (or your region) | AWS region for deployment |
| `S3_BUCKET_NAME` | `file-to-knowledge-graph-app` | Your S3 bucket name |
| `REACT_APP_AWS_REGION` | `us-east-1` | For the React app |
| `REACT_APP_AWS_ACCESS_KEY_ID` | Your app user access key | For the React app S3 uploads |
| `REACT_APP_AWS_SECRET_ACCESS_KEY` | Your app user secret key | For the React app S3 uploads |
| `REACT_APP_S3_BUCKET_NAME` | `jordan-opal-demo` | Your file upload bucket |

### Optional (for CloudFront):
| Secret Name | Value | Description |
|-------------|-------|-------------|
| `CLOUDFRONT_DISTRIBUTION_ID` | Your CloudFront distribution ID | For cache invalidation |

## Step 4: Optional - Set Up CloudFront (Recommended)

CloudFront provides HTTPS, better performance, and custom domains.

### 4.1 Create CloudFront Distribution
1. Go to **CloudFront Console**: https://console.aws.amazon.com/cloudfront
2. Click **"Create distribution"**
3. **Origin domain**: Select your S3 website endpoint (not the bucket!)
4. **Protocol**: HTTP only (since S3 website endpoints don't support HTTPS)
5. **Viewer protocol policy**: Redirect HTTP to HTTPS
6. **Default root object**: `index.html`
7. **Error pages**: Add custom error response:
   - **HTTP error code**: 403, 404
   - **Response page path**: `/index.html`
   - **HTTP response code**: 200
8. Click **"Create distribution"**
9. **Note the Distribution ID** for GitHub secrets

### 4.2 Add CloudFront Secret
Add the `CLOUDFRONT_DISTRIBUTION_ID` secret to your GitHub repository.

## Step 5: Deploy!

1. **Commit the workflow file**:
```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push
```

2. **Watch the deployment**:
   - Go to your GitHub repository
   - Click **"Actions"** tab
   - You should see the deployment running

3. **Access your website**:
   - **S3 URL**: `http://your-bucket.s3-website-us-east-1.amazonaws.com`
   - **CloudFront URL**: `https://your-distribution-id.cloudfront.net`

## Step 6: Custom Domain (Optional)

To use a custom domain:

1. **Purchase/configure domain** in Route 53 or your DNS provider
2. **Create SSL certificate** in AWS Certificate Manager
3. **Add alternate domain** to CloudFront distribution
4. **Update DNS** to point to CloudFront

## Troubleshooting

### Common Issues:

1. **Build fails**: Check GitHub Actions logs for specific errors
2. **Access denied**: Verify IAM permissions and bucket policy
3. **404 errors**: Ensure error document is set to `index.html`
4. **Environment variables**: Make sure all GitHub secrets are set correctly

### Security Notes:

- The website will be publicly accessible
- Your file upload bucket (`jordan-opal-demo`) remains separate and secure
- GitHub secrets are encrypted and only accessible to your repository
- Consider enabling CloudTrail for audit logging

## Automatic Updates

Now whenever you push to the `main` branch:
1. GitHub Actions will automatically build the app
2. Deploy the latest version to S3
3. Invalidate CloudFront cache (if configured)
4. Your website will be updated within minutes!

## Monitoring

- **CloudWatch**: Monitor S3 and CloudFront metrics
- **GitHub Actions**: Monitor deployment success/failures
- **AWS Costs**: Monitor S3 and CloudFront costs in AWS Billing