// app/vendor/products/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Plus, Edit, Trash2, Eye, Package, Search, Filter } from 'lucide-react';
import Image from 'next/image';

export default function VendorProductsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    checkVendorAccess();
  }, []);

  useEffect(() => {
    if (user) {
      fetchVendorProducts();
      fetchCategories();
    }
  }, [user, searchTerm, selectedCategory]);

  const checkVendorAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login?redirect=/vendor/products');
        return;
      }

      // Check if user has vendor role
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (name)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error checking user roles:', error);
        router.push('/');
        return;
      }

      const hasVendorRole = userRoles.some(ur => ur.roles.name === 'vendor');
      
      if (!hasVendorRole) {
        alert('Access denied. You need vendor privileges to manage products.');
        router.push('/');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Error in vendor access check:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('user_id', user.id)
        .not('category', 'is', null);

      if (error) throw error;

      const uniqueCategories = [...new Set(data.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchVendorProducts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data: productsData, error: productsError } = await query
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch primary images for all products
      const productIds = productsData.map(p => p.id);
      let imagesData = [];
      
      if (productIds.length > 0) {
        const { data, error: imagesError } = await supabase
          .from('product_images')
          .select('*')
          .in('product_id', productIds)
          .eq('is_primary', true);

        if (imagesError) throw imagesError;
        imagesData = data || [];
      }

      // Combine products with their primary images
      const productsWithImages = productsData.map(product => {
        const primaryImage = imagesData.find(img => img.product_id === product.id);
        return {
          ...product,
          primary_image: primaryImage?.image_url
        };
      });

      setProducts(productsWithImages);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete product images first (due to foreign key constraint)
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      // Then delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id); // Ensure vendor can only delete their own products

      if (error) throw error;

      // Remove from local state
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ in_stock: !currentStatus })
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, in_stock: !currentStatus } : p
      ));
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Failed to update product status.');
    }
  };

  if (loading) {
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
            <Package size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
            <p className="text-gray-600">Manage your jewelry inventory</p>
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

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first jewelry item</p>
          <Link
            href="/vendor/create-product"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={product.primary_image || '/api/placeholder/300/300'}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                />
                
                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  
                  {product.try_on_enabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Try-On
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1 truncate">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                <p className="font-semibold text-lg mb-3">${product.price?.toFixed(2)}</p>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/product/${product.id}`}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-center flex items-center justify-center gap-1 transition"
                  >
                    <Eye size={16} />
                    View
                  </Link>
                  
                  <Link
                    href={`/vendor/edit-product/${product.id}`}
                    className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 px-3 rounded text-center flex items-center justify-center gap-1 transition"
                  >
                    <Edit size={16} />
                    Edit
                  </Link>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => toggleProductStatus(product.id, product.in_stock)}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                      product.in_stock 
                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' 
                        : 'bg-green-100 hover:bg-green-200 text-green-800'
                    }`}
                  >
                    {product.in_stock ? 'Mark Out of Stock' : 'Mark In Stock'}
                  </button>
                  
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded flex items-center justify-center transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Stats */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.in_stock).length}
            </div>
            <div className="text-sm text-gray-600">In Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => !p.in_stock).length}
            </div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {products.filter(p => p.try_on_enabled).length}
            </div>
            <div className="text-sm text-gray-600">Try-On Enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
}