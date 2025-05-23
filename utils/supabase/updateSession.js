//supabase/updateSession.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase URL or Anon Key is missing');
    return NextResponse.redirect(new URL('/error', request.url)); // Redirect to an error page
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
      },
    },
  });

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error fetching session:', error);
      return NextResponse.redirect(new URL('/login', request.url)); // Redirect to login if session fetch fails
    }

    const url = request.nextUrl.clone();

    if (session) {
      // Assuming you want to set JWT manually in cookies
      const jwtToken = session.access_token;
      request.cookies.set('jwt', jwtToken, { httpOnly: true, secure: true, sameSite: 'Strict' });

      if (url.pathname.startsWith('/login') || url.pathname.startsWith('/register')) {
        const redirectUrl = new URL('/app/dashboard', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      if (url.pathname.startsWith('/login') || url.pathname.startsWith('/register')) {
        return NextResponse.next();
      } else {
        if (url.pathname.startsWith('/app')) {
          const redirectUrl = new URL('/login', request.url);
          return NextResponse.redirect(redirectUrl);
        } else {
          return NextResponse.next();
        }
      }
    }
  } catch (err) {
    console.error('Unexpected error during session update:', err);
    return NextResponse.redirect(new URL('/error', request.url)); // Redirect to an error page
  }

  return NextResponse.next();
}