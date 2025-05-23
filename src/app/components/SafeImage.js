// components/SafeImage.js
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

export default function SafeImage({ 
  src, 
  alt, 
  width, 
  height, 
  fill = false,
  className = '',
  fallbackSrc = null,
  showFallbackIcon = true,
  priority = false,
  sizes,
  ...props 
}) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handle image load error
  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  // Handle image load success
  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  // If there's an error and no fallback src, show placeholder
  if (error && !fallbackSrc) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={fill ? {} : { width, height }}
      >
        {showFallbackIcon && (
          <ImageIcon size={Math.min(width || 48, height || 48, 48)} className="text-gray-400" />
        )}
      </div>
    );
  }

  // Determine which src to use
  const imageSrc = error && fallbackSrc ? fallbackSrc : src;

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {/* Loading placeholder */}
      {loading && (
        <div 
          className={`absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center ${className}`}
        >
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
      
      {/* Actual image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        priority={priority}
        sizes={sizes}
        {...props}
      />
    </div>
  );
}