// app/favorites/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Heart, Trash2, ExternalLink } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthAndFetchFavorites();
  }, []);

  const checkAuthAndFetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/auth/login?redirect=/favorites');
        return;
      }
      
      setUser(user);
      await fetchFavorites(user.id);
    } catch (error) {
      console.error('Error in auth check:', error);
      setLoading(false);
    }
  };

  const fetchFavorites = async (userId) => {
    try {
      setLoading(true);
      
      // Fetch favorites with product details
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('*, product_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (favoritesError) throw favoritesError;
      
      // Fetch product details for each favorite
      const productIds = favoritesData.map(fav => fav.product_id);
      
      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
        
        if (productsError) throw productsError;
        
        // Fetch primary images for products
        const { data: imagesData, error: imagesError } = await supabase
          .from('product_images')
          .select('*')
          .in('product_id', productIds)
          .eq('is_primary', true);
        
        if (imagesError) throw imagesError;
        
        // Combine data
        const favoritesWithProducts = favoritesData.map(fav => {
          const product = productsData.find(p => p.id === fav.product_id);
          const primaryImage = imagesData.find(img => img.product_id === fav.product_id);
          
          return {
            ...fav,
            product: product ? {
              ...product,
              primary_image: primaryImage?.image_url
            } : null
          };
        });
        
        setFavorites(favoritesWithProducts);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);
      
      if (error) throw error;
      
      // Update state to remove the favorite
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove favorite. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Favorites</h1>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Favorites</h1>
      
      {favorites.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <Heart size={48} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-medium mb-2">No favorites yet</h2>
          <p className="text-gray-600 mb-4">
            Start saving your favorite jewelry pieces to revisit later.
          </p>
          <Link 
            href="/products" 
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => {
            const product = favorite.product;
            if (!product) return null;
            
            return (
              <div 
                key={favorite.id} 
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={product.primary_image || '/api/placeholder/300/300'}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                  />
                  <button
                    onClick={() => removeFavorite(favorite.id)}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition"
                    title="Remove from favorites"
                  >
                    <Trash2 size={18} className="text-gray-600" />
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-lg mb-1">
                    {product.name}
                  </h3>
                  
                  {product.category && (
                    <p className="text-sm text-gray-500 mb-2">
                      {product.category}
                    </p>
                  )}
                  
                  <p className="font-semibold mb-3">
                    ${product.price?.toFixed(2)}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.in_stock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {product.try_on_enabled && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Try-On Available
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/product/${product.id}`}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded font-medium flex items-center justify-center gap-1 transition"
                    >
                      <ExternalLink size={16} />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}