# Choreo Deployment Configuration Guide

This document provides instructions for configuring the frontend application to work correctly with Choreo deployments.

## Environment Variables Setup

When deploying to Choreo or Vercel, you need to set the following environment variables to ensure the frontend communicates correctly with your Choreo API backend.

### For Vercel Deployment

Set these environment variables in your Vercel project settings:

```
# The full Choreo API endpoint including all path segments
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

## How the CSV Import Works

The CSV import feature has been made resilient to different deployment environments by:

1. Trying multiple endpoint variations to account for path differences in Choreo vs local development
2. Providing better error logging for troubleshooting
3. Adding path normalization in the API client

If you encounter any CSV import issues:

1. Check the browser console logs for detailed error information
2. Verify that the `NEXT_PUBLIC_API_BASE` environment variable is set correctly
3. Ensure the backend is properly deployed with both the `/api/clients/import-csv` and `/api/import-csv` endpoints available

## Troubleshooting Common Issues

### 404 Errors on API Endpoints

This typically indicates a mismatch between the frontend's base URL configuration and the actual API paths. Ensure your `NEXT_PUBLIC_API_BASE` includes the complete path to the API including any Choreo-specific path segments.

Example of correct setting:
```
NEXT_PUBLIC_API_BASE=https://606464b5-77c7-4bb1-a1b9-9d05cefa3519-dev.e1-us-east-azure.choreoapis.dev/insurance-brokerage/insurance-brokerage-backe/v1.0/api
```

### CORS Errors

If you see CORS errors in the console, make sure your Choreo API has CORS configured to allow requests from your frontend domain. Check the backend CORS settings in `server.ts` and ensure they're correctly deployed. 