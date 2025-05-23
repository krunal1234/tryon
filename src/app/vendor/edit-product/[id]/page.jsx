// app/vendor/edit-product/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Package, ArrowLeft } from 'lucide-react';
import ProductForm from '@/app/components/ui/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const productId = params?.id;
  
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (productId) {
      checkAccessAndLoadProduct();
    }
  }, [productId]);

  const checkAccessAndLoadProduct = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push(`/auth/login?redirect=/vendor/edit-product/${productId}`);
        return;
      }

      setUser(user);

      // Check if user has vendor role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (name)
        `)
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error checking user roles:', rolesError);
        setError('Access denied');
        return;
      }

      const hasVendorRole = userRoles.some(ur => ur.roles.name === 'vendor');
      
      if (!hasVendorRole) {
        setError('Access denied. You need vendor privileges to edit products.');
        return;
      }

      // Load product and verify ownership
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user.id) // Ensure vendor can only edit their own products
        .single();

      if (productError) {
        if (productError.code === 'PGRST116') {
          setError('Product not found or you do not have permission to edit it.');
        } else {
          setError('Failed to load product data.');
        }
        return;
      }

      setProduct(productData);
    } catch (error) {
      console.error('Error in access check:', error);
      setError('An error occurred while loading the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSaved = (updatedProduct) => {
    alert('Product updated successfully!');
    router.push('/vendor/products');
  };

  const handleCancel = () => {
    router.push('/vendor/products');
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block">
            <h3 className="font-medium mb-2">Error</h3>
            <p>{error}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push('/vendor/products')}
              className="text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
          <p className="text-gray-500 mb-4">The product you're looking for doesn't exist or you don't have permission to edit it.</p>
          <button
            onClick={() => router.push('/vendor/products')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/vendor/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Products
        </button>
        
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <Package size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Update your jewelry item details</p>
          </div>
        </div>
      </div>

      {/* Product Form */}
      <div className="max-w-4xl">
        <ProductForm
          productId={productId}
          onSave={handleProductSaved}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
