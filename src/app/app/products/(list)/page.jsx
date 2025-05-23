// app/products/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, Filter, Heart } from 'lucide-react';

export default function ProductsPage() {
  const supabase = createClientComponentClient();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchUserFavorites(user.id);
      }
    };
    getUser();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      // Get unique categories
      const uniqueCategories = [...new Set(data.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUserFavorites = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;
      setFavorites(data.map(f => f.product_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      let query = supabase
        .from('products')
        .select('*')
        .eq('in_stock', true);

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (priceRange.min > 0) {
        query = query.gte('price', priceRange.min);
      }

      if (priceRange.max < 10000) {
        query = query.lte('price', priceRange.max);
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) throw productsError;

      // Fetch primary images for all products
      const productIds = productsData.map(p => p.id);
      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds)
        .eq('is_primary', true);

      if (imagesError) throw imagesError;

      // Combine products with their primary images
      const productsWithImages = productsData.map(product => {
        const primaryImage = imagesData.find(img => img.product_id === product.id);
        return {
          ...product,
          primary_image: primaryImage?.image_url
        };
      });

      setProducts(productsWithImages || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productId) => {
    if (!user) {
      alert('Please login to save favorites');
      return;
    }

    try {
      if (favorites.includes(productId)) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        
        setFavorites(favorites.filter(id => id !== productId));
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert([{ user_id: user.id, product_id: productId }]);
        
        setFavorites([...favorites, productId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, selectedCategory, priceRange]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">All Products</h1>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>
      
      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
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
          
          {/* Category Filter */}
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
        
        {/* Price Range Filter */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Price Range:</span>
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
            className="w-24 px-3 py-1 border border-gray-300 rounded"
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
            className="w-24 px-3 py-1 border border-gray-300 rounded"
          />
        </div>
      </div>
      
      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <Link
                href={`/product/${product.id}`}
                className="block border rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={product.primary_image || '/api/placeholder/300/300'}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                  />
                  {product.try_on_enabled && (
                    <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                      Try-On Available
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1">{product.name}</h3>
                  <p className="text-gray-600">${product.price?.toFixed(2)}</p>
                  {product.category && (
                    <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                  )}
                </div>
              </Link>
              
              {/* Favorite Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite(product.id);
                }}
                className={`absolute top-2 right-2 p-2 rounded-full bg-white shadow-md transition ${
                  favorites.includes(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Heart size={20} className={favorites.includes(product.id) ? 'fill-current' : ''} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}