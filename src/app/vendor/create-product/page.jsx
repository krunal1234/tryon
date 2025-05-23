// app/vendor/create-product/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { roleHelpers } from '@/lib/supabaseClient';
import ProductForm from '@/app/components/ui/ProductForm';

export default function CreateProductPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      checkVendorAccess();
    }
  }, [authLoading, user]);

  const checkVendorAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user) {
        router.push('/auth/login?redirect=/vendor/create-product');
        return;
      }

      // Check user roles
      const roles = await roleHelpers.getUserRoles(user.id);
      const hasVendorRole = roles.some(ur => ur.roles.name === 'vendor');
      const hasAdminRole = roles.some(ur => ur.roles.name === 'admin');

      if (hasAdminRole) {
        setUserRole('admin');
      } else if (hasVendorRole) {
        setUserRole('vendor');
      } else {
        setError('Access denied. You need vendor privileges to create products.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

    } catch (error) {
      console.error('Error checking vendor access:', error);
      setError('Failed to verify access permissions. Please try again.');
      setTimeout(() => router.push('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSaved = (product) => {
    // Show success message and redirect
    const message = `Product "${product.name}" created successfully!`;
    
    // You can replace this with a toast notification
    alert(message);
    
    // Redirect to products management page
    router.push('/vendor/products');
  };

  const handleCancel = () => {
    // Confirm if user wants to leave without saving
    const hasUnsavedChanges = confirm(
      'Are you sure you want to leave? Any unsaved changes will be lost.'
    );
    
    if (hasUnsavedChanges) {
      router.push('/vendor/products');
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600">Verifying access permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} />
                <h3 className="font-medium">Access Denied</h3>
              </div>
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have proper role
  if (!user || (!userRole || (userRole !== 'vendor' && userRole !== 'admin'))) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/vendor/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Products
        </button>
        
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <Package size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
            <p className="text-gray-600">
              Add a new jewelry item to your store
              {userRole === 'admin' && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                  Admin Mode
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Before you start:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Have high-quality product images ready (recommended: 1000x1000px or larger)</li>
          <li>• Prepare detailed product descriptions and specifications</li>
          <li>• For virtual try-on, upload a transparent PNG image of the jewelry</li>
          <li>• Set competitive pricing based on material and craftsmanship</li>
        </ul>
      </div>

      {/* Product Form */}
      <div className="max-w-4xl">
        <ProductForm
          onSave={handleProductSaved}
          onCancel={handleCancel}
        />
      </div>

      {/* Help Section */}
      <div className="max-w-4xl mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Product Images</h4>
            <ul className="space-y-1">
              <li>• Use well-lit, high-resolution photos</li>
              <li>• Show multiple angles of the jewelry</li>
              <li>• Include close-ups of details and craftsmanship</li>
              <li>• Use a clean, neutral background</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Virtual Try-On</h4>
            <ul className="space-y-1">
              <li>• Upload a PNG with transparent background</li>
              <li>• Ensure the jewelry is properly positioned</li>
              <li>• Test the try-on feature after creation</li>
              <li>• Adjust positioning if needed in edit mode</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}