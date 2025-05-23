// app/(auth)/vendor/login/page.jsx - Fixed with Suspense boundary
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

// Separate component that uses useSearchParams
function VendorLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const registered = searchParams.get('registered');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password, true); // true = vendor login
      // Login hook handles navigation to vendor dashboard
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Vendor Sign In
        </h1>
        <p className="mt-2 text-gray-600">
          Access your jewelry store dashboard
        </p>
      </div>
      
      {registered && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="text-sm text-green-700">
            <p>Vendor registration successful! Please sign in with your new account.</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Login Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="vendor-email" className="sr-only">
              Email address
            </label>
            <input
              id="vendor-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="vendor-password" className="sr-only">
              Password
            </label>
            <input
              id="vendor-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="vendor-remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="vendor-remember-me"
              className="ml-2 block text-sm text-gray-900"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              href="/vendor/forgot-password"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            {loading ? 'Signing in...' : 'Sign in to Dashboard'}
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have a vendor account?{' '}
            <Link
              href="/vendor/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Register your store
            </Link>
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Are you a customer?{' '}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Customer Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

// Loading fallback component for vendor login
function VendorLoginPageFallback() {
  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Vendor Sign In
        </h1>
        <p className="mt-2 text-gray-600">
          Loading...
        </p>
      </div>
      
      <div className="mt-8 space-y-6">
        <div className="rounded-md shadow-sm -space-y-px">
          <div className="h-10 bg-gray-200 rounded-t-md animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-b-md animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      
      <div className="text-center space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-2/3"></div>
      </div>
    </div>
  );
}

// Main vendor login page component with Suspense wrapper
export default function VendorLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<VendorLoginPageFallback />}>
        <VendorLoginForm />
      </Suspense>
    </div>
  );
}
