'use client';

import { useAuth } from '@/lib/useAuth';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalInquiries: 0,
    newInquiries: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user) {
      setUserRole(user.user_metadata?.role || 'customer');
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);

    try {
      if (!user) return;

      const isVendor = user.user_metadata?.role === 'vendor';

      if (isVendor) {
        // Vendor stats
        // Get products count
        const { count: totalProducts } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get active products count
        const { count: activeProducts } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('in_stock', true);

        // Get inquiries count
        const { count: totalInquiries } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get new inquiries count
        const { count: newInquiries } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'new');

        setStats({
          totalProducts: totalProducts || 0,
          activeProducts: activeProducts || 0,
          totalInquiries: totalInquiries || 0,
          newInquiries: newInquiries || 0,
        });
      } else {
        // Customer stats
        // Get favorite products count
        const { count: totalFavorites } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get inquiries count
        const { count: totalInquiries } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', user.id);

        // Get pending inquiries count
        const { count: pendingInquiries } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .eq('status', 'new');

        setStats({
          totalFavorites: totalFavorites || 0,
          totalInquiries: totalInquiries || 0,
          pendingInquiries: pendingInquiries || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderVendorDashboard = () => {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-primary-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-primary-700">Total Products</h2>
            <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-green-700">Active Products</h2>
            <p className="text-3xl font-bold mt-2">{stats.activeProducts}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-blue-700">Total Inquiries</h2>
            <p className="text-3xl font-bold mt-2">{stats.totalInquiries}</p>
          </div>
          <div className="bg-amber-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-amber-700">New Inquiries</h2>
            <p className="text-3xl font-bold mt-2">{stats.newInquiries}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/app/dashboard/products/new"
                className="block w-full py-2 px-4 bg-primary-600 text-center text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Add New Product
              </Link>
              <Link
                href="/app/dashboard/inquiries"
                className="block w-full py-2 px-4 bg-white border border-gray-300 text-center text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                View Inquiries
              </Link>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Store Info</h2>
            <div className="prose">
              <p>
                Welcome to your Jewelry Try-On dashboard. From here, you can:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Manage your jewelry products</li>
                <li>Enable virtual try-on for specific items</li>
                <li>Respond to customer inquiries</li>
                <li>Track your store's performance</li>
              </ul>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderCustomerDashboard = () => {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-primary-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-primary-700">Favorite Items</h2>
            <p className="text-3xl font-bold mt-2">{stats.totalFavorites || 0}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-blue-700">Total Inquiries</h2>
            <p className="text-3xl font-bold mt-2">{stats.totalInquiries || 0}</p>
          </div>
          <div className="bg-amber-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-amber-700">Pending Responses</h2>
            <p className="text-3xl font-bold mt-2">{stats.pendingInquiries || 0}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/products"
                className="block w-full py-2 px-4 bg-primary-600 text-center text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Browse Jewelry
              </Link>
              <Link
                href="/app/dashboard/inquiries"
                className="block w-full py-2 px-4 bg-white border border-gray-300 text-center text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                My Inquiries
              </Link>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Try-On Experience</h2>
            <div className="prose">
              <p>
                Welcome to your Jewelry Try-On dashboard. From here, you can:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Browse and favorite jewelry items</li>
                <li>Try on jewelry virtually</li>
                <li>Ask questions to vendors</li>
                <li>Track your inquiries</li>
              </ul>
              <div className="mt-4">
                <Link
                  href="/try-on"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Try On Jewelry Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {userRole === 'vendor' ? renderVendorDashboard() : renderCustomerDashboard()}
        </>
      )}
    </div>
  );
}