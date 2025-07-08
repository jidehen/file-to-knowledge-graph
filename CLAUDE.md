# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm start` - Start development server on localhost:3000
- `npm run build` - Build for production 
- `npm test` - Run tests in watch mode
- `npm ci` - Install dependencies (use in CI/production)

### Testing
- Individual test files can be run with: `npm test -- --testNamePattern="specific test name"`
- The project uses React Testing Library with Jest

## Project Architecture

### Overview
A React TypeScript application for uploading files to AWS S3 to build knowledge graphs with OpenLink Software. The app features drag-and-drop file upload, conflict resolution, and real-time progress tracking.

### Key Components Structure

**Main App Flow** (`src/App.tsx`):
- Manages S3Service initialization from environment variables
- Handles file upload orchestration and conflict resolution workflow
- Uses global window object for conflict resolution callbacks (`window.conflictResolver`)

**Upload Component** (`src/components/FileUpload.tsx`):
- Drag-and-drop file selection with visual feedback
- Real-time upload progress and status tracking
- File type detection and icon display
- File size formatting and validation

**Conflict Resolution** (`src/components/ConflictResolution.tsx`):
- Modal dialog for handling file conflicts when files already exist in S3
- Bulk select/deselect functionality
- Visual indication of S3 versioning behavior

**S3 Service** (`src/services/s3Service.ts`):
- AWS S3 client wrapper using @aws-sdk/client-s3 and @aws-sdk/lib-storage
- Handles single and batch file uploads with progress tracking
- Conflict detection using HeadObjectCommand
- Supports concurrent uploads with Promise.all

### Environment Configuration

Required environment variables (set in `.env.local` for development):
```
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_ACCESS_KEY_ID=your-access-key
REACT_APP_AWS_SECRET_ACCESS_KEY=your-secret-key
REACT_APP_S3_BUCKET_NAME=your-bucket-name
```

### AWS Integration

The application uses two separate S3 buckets:
1. **Website hosting bucket** - For serving the React app (configured in GitHub Actions)
2. **File upload bucket** - For storing uploaded files (configured in React app env vars)

### Deployment

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
- Triggers on push to main branch
- Builds React app with environment variables injected
- Deploys to S3 static website hosting
- Supports optional CloudFront cache invalidation
- Uses separate AWS credentials for deployment vs. file uploads

### State Management

Uses React's built-in state management:
- `uploading` - Boolean for upload in progress
- `uploadProgress` - Record mapping filenames to progress percentages
- `uploadStatus` - Record mapping filenames to status ('pending' | 'uploading' | 'success' | 'error' | 'skipped')
- `conflictingFiles` - Array of filenames that already exist in S3

### Conflict Resolution Flow

1. Check existing files in S3 using `checkMultipleFilesExist`
2. If conflicts exist, show modal with `ConflictResolution` component
3. User selects which files to overwrite
4. Use Promise-based callback system via `window.conflictResolver`
5. Upload only selected files, mark others as 'skipped'

### Styling

Uses TailwindCSS for styling with responsive design patterns and consistent component styling.