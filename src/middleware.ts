import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  userId: number;
  role: string;
  exp: number;
}

// Map roles to their dashboard paths
const roleDashboardMap = {
  'admin': '/admin/dashboard',
  'manager': '/manager-dashboard',
  'sales': '/sales-dashboard',
  'employee': '/manager-dashboard'
};

export function middleware(request: NextRequest) {
  // Check if there are credentials in the URL parameters and prevent this insecure practice
  const url = new URL(request.url);
  const hasCredentialsInUrl = url.searchParams.has('email') || url.searchParams.has('password');
  
  if (hasCredentialsInUrl) {
    // Remove credentials from URL and redirect
    url.searchParams.delete('email');
    url.searchParams.delete('password');
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/(auth)/login', '/forgot-password'];
  const isPublicPath = publicPaths.some(publicPath => 
    publicPath.includes('(') 
      ? path.match(new RegExp(publicPath.replace('(', '\\(').replace(')', '\\)')))
      : path === publicPath
  );
  
  if (isPublicPath) {
    if (token) {
      try {
        // Decode the token to get the user's role
        const decoded = jwtDecode<JWTPayload>(token);
        
        // Verify token is not expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTime) {
          // Clear the token cookie if expired
          const response = NextResponse.next();
          response.cookies.delete('token');
          return response;
        }
        
        // Redirect to the appropriate dashboard based on role
        const dashboardPath = roleDashboardMap[decoded.role as keyof typeof roleDashboardMap] || '/';
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      } catch (error) {
        // If token is invalid, clear it and allow access to public paths
        const response = NextResponse.next();
        response.cookies.delete('token');
        return response;
      }
    }
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // Removed the 'from' parameter to avoid showing the login message
    return NextResponse.redirect(loginUrl);
  }

  // Verify and decode token
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      // Token expired, redirect to login and clear the token
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
    
    // Role-based route protection
    const roleBasedPaths = {
      '/admin': 'admin',
      '/manager-dashboard': ['manager', 'employee'],
      '/sales-dashboard': 'sales'
    };

    for (const [pathPrefix, requiredRole] of Object.entries(roleBasedPaths)) {
      if (path.startsWith(pathPrefix)) {
        // Check if user has the required role
        const hasAccess = Array.isArray(requiredRole) 
          ? requiredRole.includes(decoded.role)
          : decoded.role === requiredRole;
        
        if (!hasAccess) {
          // Redirect to appropriate dashboard based on user's role
          const dashboardUrl = roleDashboardMap[decoded.role as keyof typeof roleDashboardMap] || '/';
          return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }
        break;
      }
    }
  } catch (error) {
    // Invalid token, redirect to login and clear the token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/manager-dashboard/:path*',
    '/sales-dashboard/:path*',
    '/(auth)/login',
    '/login',
    '/'
  ],
}; 