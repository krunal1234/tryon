// components/ProductForm.js
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Upload, X, Camera, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function ProductForm({ productId = null, onSave, onCancel }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    material: '',
    in_stock: true,
    try_on_enabled: false,
    try_on_type: '',
    try_on_position: {}
  });

  // Image handling
  const [images, setImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [tryOnImageIndex, setTryOnImageIndex] = useState(-1);

  // Categories and try-on types
  const categories = [
    'Necklace', 'Earrings', 'Ring', 'Bracelet', 'Anklet', 
    'Pendant', 'Chain', 'Watch', 'Brooch', 'Cufflinks'
  ];

  const tryOnTypes = [
    'necklace', 'earring', 'ring', 'bracelet', 'anklet'
  ];

  const materials = [
    '14k Gold', '18k Gold', '22k Gold', 'White Gold', 'Rose Gold',
    'Sterling Silver', 'Platinum', 'Titanium', 'Stainless Steel',
    'Pearl', 'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Other'
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to create products');
      }
      setUser(user);
    };
    
    getUser();
    
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      
      // Load product data
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        material: product.material || '',
        in_stock: product.in_stock,
        try_on_enabled: product.try_on_enabled,
        try_on_type: product.try_on_type || '',
        try_on_position: product.try_on_position || {}
      });

      // Load product images
      const { data: productImages, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false });

      if (imagesError) throw imagesError;

      if (productImages) {
        setImages(productImages.map(img => ({
          id: img.id,
          url: img.image_url,
          file: null,
          isExisting: true,
          isPrimary: img.is_primary,
          isTryOn: img.is_try_on
        })));

        // Set primary and try-on image indices
        const primaryIndex = productImages.findIndex(img => img.is_primary);
        const tryOnIndex = productImages.findIndex(img => img.is_try_on);
        
        setPrimaryImageIndex(primaryIndex !== -1 ? primaryIndex : 0);
        setTryOnImageIndex(tryOnIndex);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setErrors({ general: 'Failed to load product data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, {
            id: Date.now() + Math.random(),
            url: e.target.result,
            file: file,
            isExisting: false,
            isPrimary: false,
            isTryOn: false
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index) => {
    const imageToRemove = images[index];
    
    if (imageToRemove.isExisting) {
      setImagesToDelete(prev => [...prev, imageToRemove.id]);
    }
    
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Adjust primary and try-on indices
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(prev => prev - 1);
    }
    
    if (tryOnImageIndex === index) {
      setTryOnImageIndex(-1);
    } else if (tryOnImageIndex > index) {
      setTryOnImageIndex(prev => prev - 1);
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (images.length === 0) newErrors.images = 'At least one image is required';
    if (formData.try_on_enabled && !formData.try_on_type) {
      newErrors.try_on_type = 'Try-on type is required when try-on is enabled';
    }
    if (formData.try_on_enabled && tryOnImageIndex === -1) {
      newErrors.try_on_image = 'Try-on image is required when try-on is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    setErrors({});

    try {
      // Upload new images first
      const uploadedImages = await Promise.all(
        images.map(async (img, index) => {
          if (img.isExisting) {
            return {
              id: img.id,
              url: img.url,
              isPrimary: index === primaryImageIndex,
              isTryOn: index === tryOnImageIndex
            };
          } else {
            const url = await uploadImage(img.file);
            return {
              url,
              isPrimary: index === primaryImageIndex,
              isTryOn: index === tryOnImageIndex
            };
          }
        })
      );

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        material: formData.material,
        in_stock: formData.in_stock,
        try_on_enabled: formData.try_on_enabled,
        try_on_type: formData.try_on_enabled ? formData.try_on_type : null,
        try_on_position: formData.try_on_enabled ? formData.try_on_position : null,
        user_id: user.id
      };

      let savedProduct;

      if (productId) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .select()
          .single();

        if (error) throw error;
        savedProduct = data;

        // Delete removed images
        if (imagesToDelete.length > 0) {
          await supabase
            .from('product_images')
            .delete()
            .in('id', imagesToDelete);
        }

        // Update existing images
        for (const img of uploadedImages.filter(img => img.id)) {
          await supabase
            .from('product_images')
            .update({
              is_primary: img.isPrimary,
              is_try_on: img.isTryOn
            })
            .eq('id', img.id);
        }
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;
        savedProduct = data;
      }

      // Insert new images
      const newImages = uploadedImages.filter(img => !img.id);
      if (newImages.length > 0) {
        const imageInserts = newImages.map(img => ({
          product_id: savedProduct.id,
          image_url: img.url,
          is_primary: img.isPrimary,
          is_try_on: img.isTryOn
        }));

        const { error: imageError } = await supabase
          .from('product_images')
          .insert(imageInserts);

        if (imageError) throw imageError;
      }

      onSave?.(savedProduct);
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ general: 'Failed to save product. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle size={20} />
          {errors.general}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full p-2 border rounded-md ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material
            </label>
            <select
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select material</option>
              {materials.map(material => (
                <option key={material} value={material}>{material}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Describe your product..."
          />
        </div>

        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            name="in_stock"
            checked={formData.in_stock}
            onChange={handleInputChange}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            In Stock
          </label>
        </div>
      </div>

      {/* Virtual Try-On Settings */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium mb-4">Virtual Try-On Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="try_on_enabled"
              checked={formData.try_on_enabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Enable Virtual Try-On
            </label>
          </div>

          {formData.try_on_enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Try-On Type *
              </label>
              <select
                name="try_on_type"
                value={formData.try_on_type}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${errors.try_on_type ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select try-on type</option>
                {tryOnTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
              {errors.try_on_type && <p className="text-red-500 text-sm mt-1">{errors.try_on_type}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Product Images */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-medium mb-4">Product Images</h3>
        
        {errors.images && <p className="text-red-500 text-sm mb-2">{errors.images}</p>}
        {errors.try_on_image && <p className="text-red-500 text-sm mb-2">{errors.try_on_image}</p>}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={img.url}
                  alt="Product"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <X size={14} />
              </button>
              
              <div className="mt-2 space-y-1">
                <label className="flex items-center text-xs">
                  <input
                    type="radio"
                    name="primaryImage"
                    checked={primaryImageIndex === index}
                    onChange={() => setPrimaryImageIndex(index)}
                    className="mr-1"
                  />
                  Primary
                </label>
                
                {formData.try_on_enabled && (
                  <label className="flex items-center text-xs">
                    <input
                      type="radio"
                      name="tryOnImage"
                      checked={tryOnImageIndex === index}
                      onChange={() => setTryOnImageIndex(index)}
                      className="mr-1"
                    />
                    Try-On
                  </label>
                )}
              </div>
            </div>
          ))}
          
          {/* Upload Button */}
          <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition">
            <Upload size={24} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Add Images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
        
        <p className="text-sm text-gray-500">
          Upload multiple images. Select one as primary (main display) and optionally one for virtual try-on.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-70 flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Saving...' : (productId ? 'Update Product' : 'Create Product')}
        </button>
      </div>
    </form>
  );
}