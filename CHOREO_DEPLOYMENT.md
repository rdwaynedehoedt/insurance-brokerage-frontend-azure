# Choreo Deployment Configuration Guide

This document provides instructions for configuring the frontend application to work correctly with Choreo deployments.

## The Problem: Path Prefixes in Choreo

When deploying to Choreo, the API gateway adds a prefix to all your API routes. For example:

```
Local development: http://localhost:5000/api/clients
Choreo deployment: https://xxxxx-dev.e1-us-east-azure.choreoapis.dev/insurance-brokerage/insurance-brokerage-backe/v1.0/api/clients
```

The prefix `/insurance-brokerage/insurance-brokerage-backe/v1.0` is added by Choreo.

## Solution: Set the Complete Base URL

The solution is to set the `NEXT_PUBLIC_API_BASE` environment variable to include this complete path prefix.

### Environment Variables Setup

When deploying to Vercel, set these environment variables:

```
# Replace this with your actual Choreo endpoint including the full path
NEXT_PUBLIC_API_BASE=https://606464b5-77c7-4bb1-a1b9-9d05cefa3519-dev.e1-us-east-azure.choreoapis.dev/insurance-brokerage/insurance-brokerage-backe/v1.0/api

# JWT settings
NEXT_PUBLIC_JWT_EXPIRY=7d

# Feature flags
NEXT_PUBLIC_ENABLE_CSV_IMPORT=true
```

### For Local Development with Choreo Backend

If testing locally but connecting to a Choreo backend, use these settings in your `.env.local` file:

```
NEXT_PUBLIC_API_BASE=https://606464b5-77c7-4bb1-a1b9-9d05cefa3519-dev.e1-us-east-azure.choreoapis.dev/insurance-brokerage/insurance-brokerage-backe/v1.0/api
NEXT_PUBLIC_JWT_EXPIRY=7d
NEXT_PUBLIC_ENABLE_CSV_IMPORT=true
```

### For Local Development with Local Backend

If running both backend and frontend locally:

```
NEXT_PUBLIC_API_BASE=http://localhost:5000/api
NEXT_PUBLIC_JWT_EXPIRY=7d
NEXT_PUBLIC_ENABLE_CSV_IMPORT=true
```

## Testing Your Choreo Deployment

To verify that your API is correctly configured, visit the following endpoint in your browser:

```
https://606464b5-77c7-4bb1-a1b9-9d05cefa3519-dev.e1-us-east-azure.choreoapis.dev/insurance-brokerage/insurance-brokerage-backe/v1.0/path-test
```

This will show you exactly what paths are being received by your backend service.

## CSV Import Troubleshooting

If the CSV import is still failing:

1. Check the browser console for detailed error logs
2. Verify that the correct content type is being sent (`multipart/form-data`)
3. Check that CORS is properly configured to allow your frontend domain
4. Ensure the file size is within limits (default is 5MB)

### CORS Configuration

Make sure your Choreo backend has CORS configured to allow requests from your frontend domain:

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',  // Set this to your frontend domain in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Type', 'Content-Disposition'],
  maxAge: 86400
};
```

## Backend Logs

If you're still having issues, check the backend logs in Choreo for more details. Look for:

1. Any errors related to file uploads or CSV processing
2. CORS errors
3. Authentication errors
4. Path resolution issues

## Manual Testing

You can also test the CSV import endpoint directly using a tool like Postman:

1. Set the URL to: `https://606464b5-77c7-4bb1-a1b9-9d05cefa3519-dev.e1-us-east-azure.choreoapis.dev/insurance-brokerage/insurance-brokerage-backe/v1.0/api/clients/import-csv`
2. Set the method to POST
3. Add your JWT token in the Authorization header
4. Set the body type to form-data
5. Add a file field named 'file' and upload your CSV file
6. Send the request and check the response 