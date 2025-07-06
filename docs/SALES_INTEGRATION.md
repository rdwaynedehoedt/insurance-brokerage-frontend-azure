# Sales Microservice Integration

This document outlines the integration of the sales microservice with the frontend application.

## Overview

The sales microservice provides a dedicated API for sales personnel to create and manage clients without overloading the main backend. The frontend integration includes:

1. A dedicated sales dashboard for sales personnel
2. Client creation form
3. Client listing and search functionality
4. Authentication delegation to the main backend

## Files Created

### Frontend Routes

- `src/app/(sales)/layout.tsx` - Layout for sales routes with role-based access control
- `src/app/(sales)/sales-dashboard/page.tsx` - Sales dashboard with recent clients and stats
- `src/app/(sales)/sales-dashboard/add-client/page.tsx` - Client creation form
- `src/app/(sales)/sales-dashboard/my-clients/page.tsx` - List of clients created by the sales rep

### Components

- `src/components/DashboardCard.tsx` - Reusable card component for dashboard metrics

### Utilities

- `src/lib/utils/fetchWithAuth.ts` - Utility for making authenticated API requests
- `src/hooks/useAuth.tsx` - Authentication hook for managing user state
- `src/lib/config.ts` - Configuration file for API endpoints

## Environment Configuration

Create a `.env.local` file with the following variables:

```
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SALES_API_URL=http://localhost:5001
```

## Authentication Flow

1. User logs in through the main authentication system
2. Token is stored in localStorage
3. Token is used for API requests to both main backend and sales microservice
4. Sales microservice validates the token with the main backend

## Sales Dashboard Features

- Overview of client statistics
- Quick access to add new clients
- Recent clients list with key information
- Search and filtering capabilities

## Client Creation Flow

1. Sales rep navigates to the Add Client page
2. Fills out the client form with required information
3. Form is submitted to the sales microservice API
4. On success, user is redirected to the dashboard
5. New client appears in the recent clients list

## Next Steps

1. **Testing**: Test the integration thoroughly with real users
2. **Monitoring**: Add monitoring to track usage and performance
3. **Expanded Features**: Add more sales-specific features as needed
4. **Offline Support**: Consider adding offline support for field sales personnel 