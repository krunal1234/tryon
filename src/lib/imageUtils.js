// lib/imageUtils.js

/**
 * Generate placeholder image URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Optional text overlay
 * @param {string} bgColor - Background color (hex without #)
 * @param {string} textColor - Text color (hex without #)
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderImage = (
  width = 300, 
  height = 300, 
  text = null,
  bgColor = 'f3f4f6',
  textColor = '6b7280'
) => {
  const displayText = text || `${width}×${height}`;
  return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(displayText)}`;
};

/**
 * Generate jewelry-specific placeholder
 * @param {number} width 
 * @param {number} height 
 * @param {string} category - Jewelry category
 * @returns {string} Placeholder URL
 */
export const getJewelryPlaceholder = (width = 300, height = 300, category = 'Jewelry') => {
  const jewelryEmojis = {
    'necklace': '📿',
    'earrings': '👂',
    'ring': '💍',
    'bracelet': '🔗',
    'watch': '⌚',
    'pendant': '📿',
    'chain': '🔗',
    'brooch': '📌',
    'anklet': '🔗'
  };
  
  const emoji = jewelryEmojis[category.toLowerCase()] || '💎';
  const text = `${emoji} ${category}`;
  
  return getPlaceholderImage(width, height, text, 'faf5ff', '8b5cf6');
};

/**
 * Check if image URL is from Supabase storage
 * @param {string} url 
 * @returns {boolean}
 */
export const isSupabaseImage = (url) => {
  if (!url) return false;
  return url.includes('.supabase.co/storage/');
};

/**
 * Get optimized image URL with transformations
 * @param {string} url - Original image URL
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url || !isSupabaseImage(url)) return url;
  
  const {
    width,
    height,
    quality = 85,
    format = 'webp',
    resize = 'cover'
  } = options;
  
  const params = new URLSearchParams();
  
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality !== 85) params.append('quality', quality.toString());
  if (format !== 'webp') params.append('format', format);
  if (resize !== 'cover') params.append('resize', resize);
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
};

/**
 * Extract filename from Supabase storage URL
 * @param {string} url 
 * @returns {string} Filename
 */
export const getFilenameFromUrl = (url) => {
  if (!url) return '';
  
  try {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  } catch {
    return '';
  }
};

/**
 * Generate responsive image sizes string for Next.js Image component
 * @param {Object} breakpoints - Breakpoint configurations
 * @returns {string} Sizes string
 */
export const generateImageSizes = (breakpoints = {}) => {
  const defaultBreakpoints = {
    mobile: { maxWidth: 640, imageWidth: '100vw' },
    tablet: { maxWidth: 768, imageWidth: '50vw' },
    desktop: { maxWidth: 1024, imageWidth: '33vw' },
    large: { imageWidth: '25vw' }
  };
  
  const bp = { ...defaultBreakpoints, ...breakpoints };
  
  const sizes = [];
  
  if (bp.mobile) sizes.push(`(max-width: ${bp.mobile.maxWidth}px) ${bp.mobile.imageWidth}`);
  if (bp.tablet) sizes.push(`(max-width: ${bp.tablet.maxWidth}px) ${bp.tablet.imageWidth}`);
  if (bp.desktop) sizes.push(`(max-width: ${bp.desktop.maxWidth}px) ${bp.desktop.imageWidth}`);
  if (bp.large) sizes.push(bp.large.imageWidth);
  
  return sizes.join(', ');
};

/**
 * Validate image file before upload
 * @param {File} file 
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    minWidth = 100,
    minHeight = 100,
    maxWidth = 4000,
    maxHeight = 4000
  } = options;
  
  const errors = [];
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024)}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get image dimensions from file
 * @param {File} file 
 * @returns {Promise<Object>} Dimensions object
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Generate srcSet for responsive images
 * @param {string} baseUrl 
 * @param {Array} widths 
 * @returns {string} srcSet string
 */
export const generateSrcSet = (baseUrl, widths = [300, 600, 900, 1200]) => {
  if (!isSupabaseImage(baseUrl)) return '';
  
  return widths
    .map(width => `${getOptimizedImageUrl(baseUrl, { width })} ${width}w`)
    .join(', ');
};

/**
 * Common image configurations for different use cases
 */
export const imageConfigs = {
  productThumbnail: {
    width: 200,
    height: 200,
    quality: 80,
    sizes: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 200px'
  },
  productDetail: {
    width: 600,
    height: 600,
    quality: 90,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px'
  },
  productGallery: {
    width: 1200,
    height: 1200,
    quality: 95,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px'
  },
  avatar: {
    width: 100,
    height: 100,
    quality: 85,
    sizes: '100px'
  },
  tryOn: {
    width: 800,
    height: 800,
    quality: 90,
    sizes: '(max-width: 640px) 100vw, 800px'
  }
};