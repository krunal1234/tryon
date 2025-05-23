// lib/supabase/client.js
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createServerClient } from '@supabase/supabase-js';

// For client components (browser)
export const createClient = () => {
  return createClientComponentClient();
};

// For server components/actions
export const createServerComponentClient = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Server client should not be used in browser');
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createServerClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
};

// Helper functions for common product operations
export const productHelpers = {
  async getProducts(supabase, filters = {}) {
    let query = supabase
      .from('products')
      .select('*')
      .eq('in_stock', true);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  async getProductWithImages(supabase, productId) {
    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError) throw productError;
    
    // Get product images
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('is_primary', { ascending: false });
    
    if (imagesError) throw imagesError;
    
    return {
      ...product,
      images: images || []
    };
  }
};

// Helper functions for favorites
export const favoriteHelpers = {
  async getFavorites(supabase, userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async toggleFavorite(supabase, userId, productId) {
    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      return false; // Not favorited anymore
    } else {
      // Add favorite
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, product_id: productId }]);
      
      if (error) throw error;
      return true; // Now favorited
    }
  }
};

// Helper functions for inquiries
export const inquiryHelpers = {
  async createInquiry(supabase, inquiryData) {
    const { data, error } = await supabase
      .from('inquiries')
      .insert([inquiryData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getCustomerInquiries(supabase, customerId) {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, product_id')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getVendorInquiries(supabase, vendorId) {
    // First get all products for this vendor
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', vendorId);
    
    if (productsError) throw productsError;
    
    const productIds = products.map(p => p.id);
    
    // Then get all inquiries for those products
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .in('product_id', productIds)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};