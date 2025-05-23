// app/(storefront)/products/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  Share2, 
  MessageCircle, 
  ArrowLeft, 
  Star,
  Shield,
  Truck,
  RefreshCw,
  Eye,
  Sparkles,
  Store,
  Calendar,
  AlertCircle,
  CheckCircle,
  Camera
} from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import TryOnModal from '@/app/components/ui/try-on/TryOnModal';
import { useAuth } from '@/lib/useAuth';
import { productHelpers, 
  favoriteHelpers, 
  imageHelpers,
  utilHelpers,
  roleHelpers 
 } from '@/lib/supabaseClient';
import { getJewelryPlaceholder, imageConfigs } from '@/lib/imageUtils';
import InquiryForm from '@/app/app/inquiries/page';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = params?.id;
  
  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    if (user && productId) {
      checkFavoriteStatus();
    }
  }, [user, productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch product with images
      const productWithImages = await productHelpers.getProductWithImages(productId);
      debugger;
      setProduct(productWithImages);
      setProductImages(productWithImages.images || []);
      
      // Set initial selected image (primary first, then first available)
      const primaryIndex = productWithImages.images?.findIndex(img => img.is_primary) || 0;
      setSelectedImageIndex(Math.max(0, primaryIndex));

      // Fetch vendor information
      if (productWithImages.user_id) {
        await fetchVendorInfo(productWithImages.user_id);
      }

      // Fetch related products
      if (productWithImages.category) {
        await fetchRelatedProducts(productWithImages.category, productId);
      }

      // Fetch favorite count
      const count = await favoriteHelpers.getFavoriteCount(productId);
      setFavoriteCount(count);

    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Product not found or failed to load. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorInfo = async (vendorId) => {
    try {
      const roles = await roleHelpers.getUserRoles(vendorId);
      const hasVendorRole = roles.some(ur => ur.roles.name === 'vendor');
      
      if (hasVendorRole) {
        // In a real app, you'd fetch vendor profile data
        // For now, we'll use basic info
        setVendorInfo({
          id: vendorId,
          isVendor: true,
          // You can extend this with actual vendor profile data
        });
      }
    } catch (error) {
      console.error('Error fetching vendor info:', error);
    }
  };

  const fetchRelatedProducts = async (category, currentProductId) => {
    try {
      const products = await productHelpers.getProducts({
        category,
        limit: 4
      });
      
      // Filter out current product and get images
      const filteredProducts = products.filter(p => p.id !== currentProductId);
      
      const productsWithImages = await Promise.all(
        filteredProducts.slice(0, 4).map(async (product) => {
          const primaryImage = await imageHelpers.getPrimaryImage(product.id);
          return {
            ...product,
            primary_image: primaryImage?.image_url
          };
        })
      );
      
      setRelatedProducts(productsWithImages);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const favorited = await favoriteHelpers.isFavorited(user.id, productId);
      setIsFavorite(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Please login to save favorites');
      return;
    }

    try {
      const nowFavorited = await favoriteHelpers.toggleFavorite(user.id, productId);
      setIsFavorite(nowFavorited);
      
      // Update favorite count
      const count = await favoriteHelpers.getFavoriteCount(productId);
      setFavoriteCount(count);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites. Please try again.');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name || 'Check out this jewelry',
      text: `Beautiful ${product?.category?.toLowerCase()} - ${product?.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString) => {
    return utilHelpers.formatDate(dateString, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-16 h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={20} />
              <h3 className="font-medium">Product Not Found</h3>
            </div>
            <p>{error}</p>
          </div>
          <div className="mt-6 space-x-4">
            <button
              onClick={() => fetchProductDetails()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
            >
              Try Again
            </button>
            <Link
              href="/products/items"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const selectedImage = productImages[selectedImageIndex];
  const tryOnImage = productImages.find(img => img.is_try_on);
  const placeholderUrl = getJewelryPlaceholder(600, 600, product.category);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link href="/products/items" className="hover:text-indigo-600">Products</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link 
              href={`/products/items?category=${encodeURIComponent(product.category)}`}
              className="hover:text-indigo-600"
            >
              {product.category}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group">
            <SafeImage
              src={selectedImage?.image_url}
              alt={product.name}
              fill
              className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
              fallbackSrc={placeholderUrl}
              priority
              {...imageConfigs.productDetail}
            />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.try_on_enabled && (
                <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Eye size={12} />
                  Virtual Try-On
                </span>
              )}
              {!product.in_stock && (
                <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Zoom Icon */}
            <div className="absolute top-4 right-4">
              <button className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition">
                <Camera size={16} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* Thumbnail Images */}
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {productImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                    selectedImageIndex === index 
                      ? 'border-indigo-500 ring-2 ring-indigo-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <SafeImage
                    src={image.image_url}
                    alt={`${product.name} view ${index + 1}`}
                    fill
                    className="object-contain p-2"
                    fallbackSrc={placeholderUrl}
                  />
                  {image.is_try_on && (
                    <span className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
                      AR
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {vendorInfo && (
                <div className="flex items-center gap-1">
                  <Store size={14} />
                  <span>by Vendor Store</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Added {formatDate(product.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {utilHelpers.formatCurrency(product.price || 0)}
                </p>
                {favoriteCount > 0 && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Heart size={14} className="text-red-500" />
                    {favoriteCount} {favoriteCount === 1 ? 'person likes' : 'people like'} this
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-3 rounded-full border-2 transition-all ${
                    isFavorite 
                      ? 'bg-red-50 border-red-200 text-red-600' 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full border-2 border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50 transition"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {product.try_on_enabled && tryOnImage && (
                <button
                  onClick={() => setShowTryOnModal(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Try On Virtually
                </button>
              )}
              
              <button
                onClick={() => setShowInquiryForm(true)}
                className="w-full bg-white border-2 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 text-gray-900 py-4 px-6 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Contact Seller
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Product Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.category && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Category</span>
                  <p className="text-gray-900">{product.category}</p>
                </div>
              )}
              {product.material && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Material</span>
                  <p className="text-gray-900">{product.material}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-500">Availability</span>
                <p className={`flex items-center gap-1 ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                  {product.in_stock ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {product.in_stock ? 'In Stock' : 'Out of Stock'}
                </p>
              </div>
              {product.try_on_enabled && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Virtual Try-On</span>
                  <p className="text-purple-600 flex items-center gap-1">
                    <Eye size={16} />
                    Available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Trust Badges */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-green-100 p-3 rounded-full">
                  <Shield size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure</p>
                  <p className="text-xs text-gray-600">Safe & Protected</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Truck size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Fast Delivery</p>
                  <p className="text-xs text-gray-600">Quick Shipping</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-purple-100 p-3 rounded-full">
                  <RefreshCw size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Easy Returns</p>
                  <p className="text-xs text-gray-600">Hassle-free</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">You Might Also Like</h2>
            <Link
              href={`/products/items?category=${encodeURIComponent(product.category)}`}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View All {product.category} →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/products/${relatedProduct.id}`}
                className="group block"
              >
                <div className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <div className="relative aspect-square bg-gray-100">
                    <SafeImage
                      src={relatedProduct.primary_image}
                      alt={relatedProduct.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      fallbackSrc={getJewelryPlaceholder(200, 200, relatedProduct.category)}
                      {...imageConfigs.productThumbnail}
                    />
                    {relatedProduct.try_on_enabled && (
                      <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                        AR
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition line-clamp-2 mb-1">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-gray-900 font-semibold">
                      {utilHelpers.formatCurrency(relatedProduct.price || 0)}
                    </p>
                    {relatedProduct.category && (
                      <p className="text-sm text-gray-500 mt-1">{relatedProduct.category}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showTryOnModal && (
        <TryOnModal
          product={product}
          tryOnImage={tryOnImage}
          onClose={() => setShowTryOnModal(false)}
        />
      )}

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
