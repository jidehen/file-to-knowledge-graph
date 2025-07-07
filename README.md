# Knowledge Graph Uploader

A React TypeScript application for uploading files to AWS S3 to build a knowledge graph with OpenLink Software.

## Features

- **Drag and Drop Upload**: Intuitive file upload interface with drag and drop support
- **Multiple File Types**: Supports documents, images, videos, and audio files
- **Progress Tracking**: Real-time upload progress and status indicators
- **AWS S3 Integration**: Direct upload to your AWS S3 bucket
- **Responsive Design**: Modern UI built with TailwindCSS
- **TypeScript**: Full type safety and better developer experience

## Prerequisites

- Node.js (v14 or higher)
- AWS Account with S3 bucket configured
- AWS credentials with S3 write permissions

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your AWS credentials and S3 bucket information:

```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_ACCESS_KEY_ID=your-access-key-id
REACT_APP_AWS_SECRET_ACCESS_KEY=your-secret-access-key
REACT_APP_S3_BUCKET_NAME=your-bucket-name
```

## Usage

1. Start the development server:
```bash
npm start
```

2. Open your browser to `http://localhost:3000`

3. Upload files by:
   - Dragging and dropping files onto the upload area
   - Clicking "Select Files" to browse and select files
   - Clicking "Upload Files" to start the upload process

## AWS Configuration

### S3 Bucket Setup
1. Create an S3 bucket in your AWS account
2. Configure bucket permissions to allow uploads from your application
3. Note the bucket name and region

### IAM Permissions
Your AWS credentials need the following S3 permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

## Deployment

### AWS Deployment
For production deployment in AWS:

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` folder to:
   - **S3 Static Website**: Host the React app on S3 with CloudFront
   - **AWS Amplify**: Use Amplify for automatic deployment from Git
   - **EC2/ECS**: Deploy on compute instances for more control

### Environment Variables in Production
For security, use AWS services to manage environment variables:
- **AWS Systems Manager Parameter Store**
- **AWS Secrets Manager**
- **AWS Lambda Environment Variables** (if using serverless)

## Security Considerations

- Never commit AWS credentials to version control
- Use IAM roles when possible instead of access keys
- Implement proper CORS settings on your S3 bucket
- Consider using S3 pre-signed URLs for enhanced security
- Use HTTPS in production

## File Structure

```
src/
├── components/
│   └── FileUpload.tsx          # Main file upload component
├── services/
│   └── s3Service.ts           # AWS S3 service wrapper
├── App.tsx                    # Main application component
├── index.tsx                  # Application entry point
└── index.css                  # Global styles with TailwindCSS
```

## Integration with OpenLink Software

This application is designed to work with OpenLink Software AMI for knowledge graph processing. Uploaded files will be:

1. Stored in your S3 bucket with metadata
2. Processed by OpenLink Software for knowledge extraction
3. Integrated into your knowledge graph for querying

## Available Scripts

### `npm start`
Runs the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`
Launches the test runner in the interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## Troubleshooting

### Common Issues

1. **AWS Credentials Error**: Check your `.env.local` file and ensure all variables are set correctly
2. **CORS Issues**: Configure CORS settings on your S3 bucket
3. **Upload Failures**: Verify S3 bucket permissions and IAM policy
4. **Build Errors**: Ensure all dependencies are installed with `npm install`

## Deployment

This application can be deployed as a static website on AWS S3 with automatic deployment from GitHub.

### Quick Deploy to S3
For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

1. **Create S3 bucket** for static website hosting
2. **Set up IAM user** for GitHub Actions
3. **Configure GitHub secrets** with AWS credentials
4. **Push to main branch** - automatic deployment via GitHub Actions!

### Live Demo
Once deployed, you'll have:
- 🌐 **Public URL**: Your S3 website endpoint or CloudFront domain
- 🔄 **Auto-updates**: Push to main branch = instant deployment
- 🚀 **Fast loading**: Optimized build served via CDN
- 🔒 **Secure**: Separate buckets for website and file uploads

## License

This project is licensed under the MIT License.