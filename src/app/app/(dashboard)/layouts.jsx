'use client';

import Navigation from '@/app/components/ui/Navigation';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [storeName, setStoreName] = useState('');
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
    
    // Get user metadata
    if (user) {
      setUserRole(user.user_metadata?.role || 'customer');
      
      // If vendor, fetch store info
      if (user.user_metadata?.role === 'vendor') {
        setStoreName(user.user_metadata?.store_name || 'Your Store');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by the useEffect
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
            <Navigation />
      

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}