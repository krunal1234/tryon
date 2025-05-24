// middleware.js - Fixed middleware with proper role checking
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedRoutes = ['/app/dashboard', '/vendor/dashboard', '/vendor/products', '/vendor/create-product', '/vendor/inquiries', '/profile', '/favorites'];
  const vendorRoutes = ['/vendor/dashboard', '/vendor/products', '/vendor/create-product', '/vendor/inquiries'];
  const authRoutes = ['/login', '/register', '/vendor/login', '/vendor/register'];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isVendorRoute = vendorRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.some(route => path === route);

  // Redirect unauthenticated users from protected routes
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL(isVendorRoute ? '/vendor/login' : '/login', req.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle vendor route access
  if (session && isVendorRoute) {
    try {
      // Check if user has vendor role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (name)
        `)
        .eq('user_id', session.user.id);

      const hasVendorRole = userRoles?.some(ur => ur.roles.name === 'vendor' || ur.roles.name === 'admin');
      
      if (!hasVendorRole) {
        return NextResponse.redirect(new URL('/app/dashboard', req.url));
      }
    } catch (error) {
      console.error('Error checking vendor role in middleware:', error);
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (session && isAuthRoute) {
    try {
      // Get user role to determine redirect destination
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (name)
        `)
        .eq('user_id', session.user.id);

      const hasVendorRole = userRoles?.some(ur => ur.roles.name === 'vendor');
      const redirectUrl = hasVendorRole ? '/vendor/dashboard' : '/app/dashboard';
      
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    } catch (error) {
      console.error('Error in auth redirect:', error);
      return NextResponse.redirect(new URL('/app/dashboard', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    '/app/dashboard/:path*',
    '/vendor/:path*', 
    '/login', 
    '/register', 
    '/profile',
    '/favorites'
  ],
};
