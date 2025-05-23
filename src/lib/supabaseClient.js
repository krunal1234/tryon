// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// =============================================================================
// AUTHENTICATION METHODS
// =============================================================================

export const authHelpers = {
  // Sign up new user
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Sign in user
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out user
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Update user profile
  updateUserProfile: async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) throw error;
    return data;
  },

  // Change password
  changePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return data;
  }
};

// =============================================================================
// USER ROLES METHODS
// =============================================================================

export const roleHelpers = {
  // Get user roles
  getUserRoles: async (userId) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (name, description)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  // Check if user has specific role
  hasRole: async (userId, roleName) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (name)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.some(ur => ur.roles.name === roleName);
  },

  // Assign role to user
  assignRole: async (userId, roleName) => {
    // First get role ID
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError) throw roleError;

    // Then assign role
    const { error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role_id: role.id }]);

    if (error) throw error;
  },

  // Remove role from user
  removeRole: async (userId, roleName) => {
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError) throw roleError;

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', role.id);

    if (error) throw error;
  }
};

// =============================================================================
// PRODUCTS METHODS
// =============================================================================

export const productHelpers = {
  // Get all products with filters
  getProducts: async (filters = {}) => {
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

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get single product by ID
  getProduct: async (productId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get product with images
  getProductWithImages: async (productId) => {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError) throw productError;
    
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
  },

  // Create new product
  createProduct: async (productData) => {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update product
  updateProduct: async (productId, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete product
  deleteProduct: async (productId) => {
    // First delete product images
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    // Then delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;
  },

  // Get vendor products
  getVendorProducts: async (vendorId, filters = {}) => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', vendorId);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Toggle product stock status
  toggleProductStock: async (productId, currentStatus) => {
    const { data, error } = await supabase
      .from('products')
      .update({ in_stock: !currentStatus })
      .eq('id', productId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get product categories
  getCategories: async (userId = null) => {
    let query = supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Return unique categories
    return [...new Set(data.map(p => p.category))];
  }
};

// =============================================================================
// PRODUCT IMAGES METHODS
// =============================================================================

export const imageHelpers = {
  // Get product images
  getProductImages: async (productId) => {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('is_primary', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Add product image
  addProductImage: async (imageData) => {
    const { data, error } = await supabase
      .from('product_images')
      .insert([imageData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update product image
  updateProductImage: async (imageId, updates) => {
    const { data, error } = await supabase
      .from('product_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete product image
  deleteProductImage: async (imageId) => {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);
    
    if (error) throw error;
  },

  // Get primary image for product
  getPrimaryImage: async (productId) => {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .eq('is_primary', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get try-on image for product
  getTryOnImage: async (productId) => {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .eq('is_try_on', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// =============================================================================
// FAVORITES METHODS
// =============================================================================

export const favoriteHelpers = {
  // Get user favorites
  getFavorites: async (userId) => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*, product_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get favorites with product details
  getFavoritesWithProducts: async (userId) => {
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select('*, product_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (favoritesError) throw favoritesError;
    
    if (favoritesData.length === 0) return [];
    
    const productIds = favoritesData.map(fav => fav.product_id);
    
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);
    
    if (productsError) throw productsError;
    
    const { data: imagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .eq('is_primary', true);
    
    if (imagesError) throw imagesError;
    
    return favoritesData.map(fav => {
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
  },

  // Check if product is favorited
  isFavorited: async (userId, productId) => {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  // Toggle favorite
  toggleFavorite: async (userId, productId) => {
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, product_id: productId }]);
      
      if (error) throw error;
      return true;
    }
  },

  // Add to favorites
  addFavorite: async (userId, productId) => {
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, product_id: productId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remove from favorites
  removeFavorite: async (favoriteId) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);
    
    if (error) throw error;
  },

  // Get favorite count for product
  getFavoriteCount: async (productId) => {
    const { count, error } = await supabase
      .from('favorites')
      .select('id', { count: 'exact' })
      .eq('product_id', productId);
    
    if (error) throw error;
    return count || 0;
  }
};

// =============================================================================
// INQUIRIES METHODS
// =============================================================================

export const inquiryHelpers = {
  // Create inquiry
  createInquiry: async (inquiryData) => {
    const { data, error } = await supabase
      .from('inquiries')
      .insert([inquiryData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get customer inquiries
  getCustomerInquiries: async (customerId) => {
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        products (
          id,
          name,
          price,
          category
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get vendor inquiries
  getVendorInquiries: async (vendorId, filters = {}) => {
    // First get vendor's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('user_id', vendorId);

    if (productsError) throw productsError;

    if (products.length === 0) return [];

    const productIds = products.map(p => p.id);

    let query = supabase
      .from('inquiries')
      .select(`
        *,
        products (
          id,
          name,
          price,
          category
        )
      `)
      .in('product_id', productIds);

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update inquiry status
  updateInquiryStatus: async (inquiryId, status) => {
    const { data, error } = await supabase
      .from('inquiries')
      .update({ status })
      .eq('id', inquiryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get inquiry by ID
  getInquiry: async (inquiryId) => {
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        products (
          id,
          name,
          price,
          category
        )
      `)
      .eq('id', inquiryId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete inquiry
  deleteInquiry: async (inquiryId) => {
    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', inquiryId);
    
    if (error) throw error;
  }
};

// =============================================================================
// STATISTICS METHODS
// =============================================================================

export const statsHelpers = {
  // Get vendor statistics
  getVendorStats: async (vendorId) => {
    const { data: products } = await supabase
      .from('products')
      .select('id, in_stock, try_on_enabled')
      .eq('user_id', vendorId);

    const productIds = products?.map(p => p.id) || [];

    const stats = {
      totalProducts: products?.length || 0,
      inStockProducts: products?.filter(p => p.in_stock).length || 0,
      tryOnEnabledProducts: products?.filter(p => p.try_on_enabled).length || 0
    };

    if (productIds.length > 0) {
      const { count: inquiriesCount } = await supabase
        .from('inquiries')
        .select('id', { count: 'exact' })
        .in('product_id', productIds);

      const { count: newInquiriesCount } = await supabase
        .from('inquiries')
        .select('id', { count: 'exact' })
        .in('product_id', productIds)
        .eq('status', 'new');

      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('id', { count: 'exact' })
        .in('product_id', productIds);

      stats.totalInquiries = inquiriesCount || 0;
      stats.newInquiries = newInquiriesCount || 0;
      stats.totalFavorites = favoritesCount || 0;
    } else {
      stats.totalInquiries = 0;
      stats.newInquiries = 0;
      stats.totalFavorites = 0;
    }

    return stats;
  },

  // Get customer statistics
  getCustomerStats: async (customerId) => {
    const { count: favoritesCount } = await supabase
      .from('favorites')
      .select('id', { count: 'exact' })
      .eq('user_id', customerId);

    const { count: inquiriesCount } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact' })
      .eq('customer_id', customerId);

    return {
      totalFavorites: favoritesCount || 0,
      totalInquiries: inquiriesCount || 0
    };
  },

  // Get admin statistics
  getAdminStats: async () => {
    const { count: usersCount } = await supabase
      .from('user_roles')
      .select('user_id', { count: 'exact' });

    const { count: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact' });

    const { count: inquiriesCount } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact' });

    const { count: vendorsCount } = await supabase
      .from('user_roles')
      .select('user_id', { count: 'exact' })
      .eq('roles.name', 'vendor');

    return {
      totalUsers: usersCount || 0,
      totalProducts: productsCount || 0,
      totalInquiries: inquiriesCount || 0,
      totalVendors: vendorsCount || 0
    };
  }
};

// =============================================================================
// STORAGE METHODS
// =============================================================================

export const storageHelpers = {
  // Upload file
  uploadFile: async (bucket, filePath, file, options = {}) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, options);
    
    if (error) throw error;
    return data;
  },

  // Get public URL
  getPublicUrl: (bucket, filePath) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // Delete file
  deleteFile: async (bucket, filePaths) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths);
    
    if (error) throw error;
  },

  // Upload avatar
  uploadAvatar: async (userId, file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Upload product image
  uploadProductImage: async (userId, file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};

// =============================================================================
// UTILITY METHODS
// =============================================================================

export const utilHelpers = {
  // Format date
  formatDate: (dateString, options = {}) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    });
  },

  // Format currency
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Generate unique filename
  generateFileName: (originalName, userId = null) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop();
    const prefix = userId ? `${userId}-` : '';
    
    return `${prefix}${timestamp}-${random}.${extension}`;
  },

  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone
  isValidPhone: (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  },

  // Compress image
  compressImage: (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
};

// Export main client for backward compatibility
export default supabase;