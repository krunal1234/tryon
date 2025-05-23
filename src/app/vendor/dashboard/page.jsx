// app/vendor/dashboard/page.js - Updated with simplified auth check
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/lib/useAuth';
import { 
  BarChart3, 
  Package, 
  MessageSquare, 
  Heart,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  Calendar,
  DollarSign,
  Users,
  ArrowRight
} from 'lucide-react';

export default function VendorDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, userRole, loading: authLoading, isVendor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStockProducts: 0,
    totalInquiries: 0,
    newInquiries: 0,
    totalFavorites: 0,
    tryOnEnabledProducts: 0
  });
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    if (!authLoading) {
      debugger;
      if (!user) {
        router.push('/vendor/login?redirect=/vendor/dashboard');
        return;
      }
      
      if (!isVendor) {
        alert('Access denied. You need vendor privileges to access this dashboard.');
        router.push('/');
        return;
      }

      fetchDashboardData();
    }
  }, [user, userRole, authLoading, isVendor, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch products stats
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, in_stock, try_on_enabled')
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      const productStats = {
        totalProducts: products.length,
        inStockProducts: products.filter(p => p.in_stock).length,
        tryOnEnabledProducts: products.filter(p => p.try_on_enabled).length
      };

      // Fetch inquiries stats
      const productIds = products.map(p => p.id);
      let inquiriesData = [];
      
      if (productIds.length > 0) {
        const { data, error: inquiriesError } = await supabase
          .from('inquiries')
          .select('id, status, created_at, customer_name, products(name)')
          .in('product_id', productIds);

        if (inquiriesError) throw inquiriesError;
        inquiriesData = data || [];
      }

      const inquiriesStats = {
        totalInquiries: inquiriesData.length,
        newInquiries: inquiriesData.filter(i => i.status === 'new').length
      };

      // Fetch favorites count
      let favoritesCount = 0;
      if (productIds.length > 0) {
        const { count, error: favoritesError } = await supabase
          .from('favorites')
          .select('id', { count: 'exact' })
          .in('product_id', productIds);

        if (favoritesError) throw favoritesError;
        favoritesCount = count || 0;
      }

      // Get recent inquiries
      const recentInquiriesData = inquiriesData
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      // Get products with most favorites (top products)
      let topProductsData = [];
      if (productIds.length > 0) {
        const { data: productsWithFavorites, error: topProductsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            category,
            favorites(count)
          `)
          .eq('user_id', user.id)
          .limit(5);

        if (!topProductsError && productsWithFavorites) {
          // Get favorite counts and primary images
          const productsWithCounts = await Promise.all(
            productsWithFavorites.map(async (product) => {
              const { count } = await supabase
                .from('favorites')
                .select('id', { count: 'exact' })
                .eq('product_id', product.id);

              const { data: image } = await supabase
                .from('product_images')
                .select('image_url')
                .eq('product_id', product.id)
                .eq('is_primary', true)
                .single();

              return {
                ...product,
                favoritesCount: count || 0,
                primaryImage: image?.image_url
              };
            })
          );

          topProductsData = productsWithCounts
            .sort((a, b) => b.favoritesCount - a.favoritesCount)
            .slice(0, 5);
        }
      }

      setStats({
        ...productStats,
        ...inquiriesStats,
        totalFavorites: favoritesCount
      });

      setRecentInquiries(recentInquiriesData);
      setTopProducts(topProductsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <BarChart3 size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="text-gray-600">Overview of your jewelry business</p>
          </div>
        </div>
        
        <Link
          href="/vendor/create-product"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <span>{stats.inStockProducts} in stock</span>
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
              <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
                <span>{stats.newInquiries} new</span>
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <MessageSquare size={24} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Favorites</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFavorites}</p>
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <Heart size={14} />
                <span>Customer saves</span>
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Heart size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Try-On Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tryOnEnabledProducts}</p>
              <p className="text-sm text-purple-600 flex items-center gap-1 mt-1">
                <span>AR enabled</span>
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Eye size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProducts > 0 ? Math.round((stats.inStockProducts / stats.totalProducts) * 100) : 0}%
              </p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp size={14} />
                <span>Products available</span>
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalInquiries > 0 ? Math.round(((stats.totalInquiries - stats.newInquiries) / stats.totalInquiries) * 100) : 0}%
              </p>
              <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                <span>Inquiries handled</span>
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inquiries */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recent Inquiries</h3>
              <Link
                href="/vendor/inquiries"
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm"
              >
                View all
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentInquiries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No inquiries yet</p>
            ) : (
              <div className="space-y-4">
                {recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(inquiry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Popular Products</h3>
              <Link
                href="/vendor/products"
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm"
              >
                View all
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="p-6">
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No products yet</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {product.primaryImage && (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={product.primaryImage}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">${product.price?.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <Heart size={14} />
                        <span>{product.favoritesCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/vendor/create-product"
            className="bg-white p-4 rounded-lg border hover:shadow-md transition flex items-center gap-3"
          >
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Plus size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-medium">Add New Product</p>
              <p className="text-sm text-gray-600">Create a new jewelry listing</p>
            </div>
          </Link>
          
          <Link
            href="/vendor/inquiries"
            className="bg-white p-4 rounded-lg border hover:shadow-md transition flex items-center gap-3"
          >
            <div className="bg-orange-100 p-2 rounded-lg">
              <MessageSquare size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="font-medium">View Inquiries</p>
              <p className="text-sm text-gray-600">Respond to customer questions</p>
            </div>
          </Link>
          
          <Link
            href="/vendor/products"
            className="bg-white p-4 rounded-lg border hover:shadow-md transition flex items-center gap-3"
          >
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Manage Products</p>
              <p className="text-sm text-gray-600">Edit your inventory</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}