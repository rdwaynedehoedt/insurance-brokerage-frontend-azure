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
  'manager': '/manager-dashboard'
};

// Public paths that don't require authentication
const publicPaths = [
  '/login', 
  '/forgot-password',
  '/api/health',
  '/favicon.ico',
  '/_next'
];

// Check if a path is public
const isPublicPath = (path: string) => {
  return publicPaths.some(publicPath => path.startsWith(publicPath));
};

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = request.nextUrl.pathname;
  
  // Log middleware execution for debugging
  console.log(`[Middleware] Processing ${path}`);
  
  // Check if there are credentials in the URL parameters and prevent this insecure practice
  const hasCredentialsInUrl = url.searchParams.has('email') || url.searchParams.has('password');
  
  if (hasCredentialsInUrl) {
    console.log('[Middleware] Detected credentials in URL, redirecting');
    // Remove credentials from URL and redirect
    url.searchParams.delete('email');
    url.searchParams.delete('password');
    return NextResponse.redirect(url);
  }

  // Skip middleware for static files and API routes
  if (
    path.startsWith('/_next') || 
    path.startsWith('/static') || 
    path.startsWith('/images') || 
    path.startsWith('/favicon') ||
    path.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  // Handle public paths
  if (isPublicPath(path)) {
    if (token) {
      try {
        // Decode the token to get the user's role
        const decoded = jwtDecode<JWTPayload>(token);
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTime) {
          console.log('[Middleware] Token expired, allowing access to public path');
          return NextResponse.next();
        }
        
        // Redirect to the appropriate dashboard based on role
        const dashboardPath = roleDashboardMap[decoded.role as keyof typeof roleDashboardMap] || '/';
        console.log(`[Middleware] User already authenticated, redirecting to ${dashboardPath}`);
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      } catch (error) {
        console.log('[Middleware] Invalid token on public path, allowing access');
        // If token is invalid, allow access to public paths
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Check if user is authenticated for protected routes
  if (!token) {
    console.log('[Middleware] No token found, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify and decode token
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      console.log('[Middleware] Token expired, redirecting to login');
      // Token expired, redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Role-based route protection
    const roleBasedPaths = {
      '/admin': 'admin',
      '/manager-dashboard': 'manager'
    };

    for (const [pathPrefix, requiredRole] of Object.entries(roleBasedPaths)) {
      if (path.startsWith(pathPrefix)) {
        // Check if user has the required role
        if (decoded.role !== requiredRole) {
          console.log(`[Middleware] Role mismatch: user has ${decoded.role}, but ${requiredRole} is required`);
          // Redirect to appropriate dashboard based on user's role
          const dashboardUrl = roleDashboardMap[decoded.role as keyof typeof roleDashboardMap] || '/';
          return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }
        console.log(`[Middleware] Role check passed for ${path}`);
        break;
      }
    }
  } catch (error) {
    console.log('[Middleware] Token validation failed, redirecting to login');
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  console.log('[Middleware] Access granted');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/|_next/|_static/|public/|favicon.ico).*)',
    '/admin/:path*',
    '/manager-dashboard/:path*',
    '/login',
    '/'
  ],
}; 