// app/product/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Share2, MessageCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TryOnModal from '@/app/components/ui/try-on/TryOnModal';
import InquiryForm from '../../inquiries/page';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const id = params?.id;
  
  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [user, setUser] = useState(null);
  const [vendorInfo, setVendorInfo] = useState(null);

  useEffect(() => {
    // Check authentication status
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user && id) {
          // Check if product is in user's favorites
          const { data } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', id)
            .single();
          
          setIsFavorite(!!data);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    
    getUser();
  }, [id, supabase]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      debugger;
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, user_id')
        .eq('id', id)
        .single();

      if (productError) throw productError;
      
      setProduct(productData);

      // Fetch vendor information
      if (productData?.user_id) {
        const { data: userData } = await supabase.auth.admin.getUserById(productData.user_id);
        setVendorInfo(userData?.user?.user_metadata || {});
      }

      // Fetch product images
      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('is_primary', { ascending: false });

      if (imagesError) throw imagesError;
      
      setProductImages(imagesData || []);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      const currentPath = `/product/${id}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, product_id: id }
          ]);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const shareProduct = async () => {
    const shareData = {
      title: product?.name || 'Check out this product',
      text: `Check out this ${product?.name}!`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Product not found</h1>
      </div>
    );
  }

  const primaryImage = productImages.find(img => img.is_primary);
  const tryOnImage = productImages.find(img => img.is_try_on);
  const allImages = productImages.filter(img => !img.is_try_on);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          <div className="relative h-96 w-full">
            <Image 
              src={primaryImage?.image_url || allImages[0]?.image_url || '/api/placeholder/400/400'} 
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>
          
          {/* Additional Images */}
          {allImages.length > 1 && (
            <div className="flex mt-4 overflow-x-auto gap-2 p-2">
              {allImages.map((img) => (
                <div key={img.id} className="shrink-0 w-16 h-16 relative bg-white rounded border">
                  <Image 
                    src={img.image_url || '/api/placeholder/64/64'} 
                    alt={`${product.name} view`}
                    fill
                    className="object-contain p-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          {vendorInfo?.store_name && (
            <p className="text-sm text-gray-600 mb-2">by {vendorInfo.store_name}</p>
          )}
          <p className="text-xl font-semibold text-gray-700 mb-4">
            ${product.price?.toFixed(2)}
          </p>
          
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={toggleFavorite}
              className={`flex items-center gap-2 p-2 rounded-full transition ${
                isFavorite ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Heart className={isFavorite ? 'fill-current' : ''} size={20} />
              <span>{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
            
            <button 
              onClick={shareProduct}
              className="flex items-center gap-2 p-2 text-gray-500 hover:text-gray-700 rounded-full transition"
            >
              <Share2 size={20} />
              <span>Share</span>
            </button>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-600">{product.description || 'No description available.'}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Details</h2>
            <ul className="text-gray-600 space-y-1">
              {product.material && <li><span className="font-medium">Material:</span> {product.material}</li>}
              {product.category && <li><span className="font-medium">Category:</span> {product.category}</li>}
              <li><span className="font-medium">In Stock:</span> {product.in_stock ? 'Yes' : 'No'}</li>
              {product.try_on_enabled && <li><span className="font-medium">Virtual Try-On:</span> Available</li>}
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {product.try_on_enabled && tryOnImage && (
              <button 
                onClick={() => setShowTryOnModal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition"
              >
                Virtual Try-On
              </button>
            )}
            
            <button 
              onClick={() => setShowInquiryForm(true)}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 py-3 rounded-lg font-medium transition"
            >
              <MessageCircle size={20} />
              Send Inquiry
            </button>
          </div>
        </div>
      </div>

      {/* Virtual Try-On Modal */}
      {showTryOnModal && (
        <TryOnModal
          product={product}
          tryOnImage={tryOnImage}
          onClose={() => setShowTryOnModal(false)} 
        />
      )}

      {/* Inquiry Form Modal */}
      {showInquiryForm && (
        <InquiryForm
          product={product}
          vendorId={product.user_id}
          onClose={() => setShowInquiryForm(false)} 
        />
      )}
    </div>
  );
}