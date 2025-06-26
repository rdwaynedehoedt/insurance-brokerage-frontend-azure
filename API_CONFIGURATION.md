# API Configuration Guide

## Login Issue Fix

If you're experiencing a 404 Not Found error when trying to log in on the production environment, the issue is likely related to the API base URL configuration.

### The Problem

The error occurs because the login request is being sent to:
```
https://606464b5-77c7-4bb1-a1b9-9d05cefa3519-dev.e1-us-east-azure.choreoapis.dev/insurance-brokerage/insurance-brokerage-backe/v1.0/auth/login
```

But the correct endpoint should be:
```
https://606464b5-77c7-4bb1-a1b9-9d05cefa3519-dev.e1-us-east-azure.choreoapis.dev/insurance-brokerage/insurance-brokerage-backe/v1.0/api/auth/login
```

Notice the missing `/api/` in the URL path.

### How to Fix

1. **Update Environment Variables**:
   Create or modify the `.env.local` file in the frontend project root with:

   ```
   # API Base URL - Make sure it includes /api at the end
   NEXT_PUBLIC_API_BASE=https://606464b5-77c7-4bb1-a1b9-9d05cefa3519-dev.e1-us-east-azure.choreoapis.dev/insurance-brokerage/insurance-brokerage-backe/v1.0/api
   ```

2. **For Vercel Deployment**:
   If you're deploying to Vercel, add the environment variable in the Vercel project settings:
   - Go to your project in the Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add `NEXT_PUBLIC_API_BASE` with the value above

3. **Rebuild and Deploy**:
   After updating the environment variables, rebuild and redeploy the frontend application.

### Temporary Debug Solution

We've added a debug feature to the login page that can help diagnose API URL issues:
1. Click the "Show debug info" link below the login button
2. Check if the `baseURL` in the displayed information ends with `/api`
3. If it doesn't, follow the steps above to fix the environment variable

### Code Changes Made

We've updated the code to handle this issue more gracefully:

1. Added a utility function in `api.ts` to ensure the API base URL is correctly formatted
2. Updated the auth service to check if the base URL includes `/api` and add it if necessary
3. Added better error handling for 404 errors
4. Added debugging information to help diagnose the issue

These changes should make the application more robust against API configuration issues. 