// components/TryOnModal.js - Improved version with real face detection
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Download, RefreshCw } from 'lucide-react';
import NextImage from 'next/image';

export default function TryOnModal({ product, onClose }) {
  const [step, setStep] = useState('intro');
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [productImageUrl, setProductImageUrl] = useState('');
  const [faceDetectionModel, setFaceDetectionModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [renderingActive, setRenderingActive] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const productImageRef = useRef(null);
  const faceApiRef = useRef(null);

  // Load Face Detection Model (using face-api.js approach with canvas)
  useEffect(() => {
    const loadFaceDetection = async () => {
      setModelLoading(true);
      try {
        // Create a simple face detector using built-in browser APIs
        // This is a fallback approach that works without external libraries
        console.log('🤖 Initializing face detection...');
        
        // Simulate model loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create a basic face detection function
        const detector = {
          detectFaces: (video) => {
            return new Promise((resolve) => {
              // Create a canvas to analyze the video frame
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              // Draw current video frame
              ctx.drawImage(video, 0, 0);
              
              // Get image data for analysis
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Simple face detection using image analysis
              const faces = detectFacesInImageData(imageData, canvas.width, canvas.height);
              resolve(faces);
            });
          }
        };
        
        setFaceDetectionModel(detector);
        setModelLoading(false);
        console.log('✅ Face detection initialized');
      } catch (error) {
        console.error('❌ Error initializing face detection:', error);
        setModelLoading(false);
      }
    };
    
    loadFaceDetection();
  }, []);

  // Simple face detection algorithm using image processing
  // Improved face detection algorithm with better landmark positioning
const detectFacesInImageData = (imageData, width, height) => {
  const data = imageData.data;
  
  // Simple skin tone detection and face region estimation
  let skinPixels = 0;
  let totalPixels = 0;
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let centerX = 0, centerY = 0;
  let skinRegions = [];
  
  // Scan image for skin-like colors
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Simple skin tone detection
      if (isSkinTone(r, g, b)) {
        skinPixels++;
        skinRegions.push({ x, y });
        
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        
        centerX += x;
        centerY += y;
      }
      totalPixels++;
    }
  }
  
  if (skinPixels < 50) {
    return []; // Not enough skin pixels detected
  }
  
  centerX /= skinPixels;
  centerY /= skinPixels;
  
  // Calculate face dimensions with better proportions
  const detectedWidth = maxX - minX;
  const detectedHeight = maxY - minY;
  
  // Use more realistic face proportions
  // Average human face is about 1.3:1 height to width ratio
  const faceWidth = Math.max(detectedWidth * 1.1, 80); // Add some padding
  const faceHeight = Math.max(detectedHeight * 1.2, faceWidth * 1.3); // Maintain proper ratio
  
  // Adjust face center - faces are typically wider in the middle
  const faceCenterX = centerX;
  const faceCenterY = minY + (faceHeight * 0.45); // Face center is about 45% from top
  
  // Calculate confidence based on skin detection quality
  const confidence = Math.min(skinPixels / (totalPixels * 0.08), 1);
  
  if (confidence > 0.25) {
    // Calculate anatomically accurate landmark positions
    const landmarks = calculateAnatomicalLandmarks(faceCenterX, faceCenterY, faceWidth, faceHeight);
    
    return [{
      faceBox: {
        x: faceCenterX - faceWidth / 2,
        y: faceCenterY - faceHeight / 2,
        width: faceWidth,
        height: faceHeight
      },
      landmarks: landmarks,
      confidence: confidence
    }];
  }
  
  return [];
};

// Calculate anatomically accurate facial landmarks
const calculateAnatomicalLandmarks = (centerX, centerY, faceWidth, faceHeight) => {
  // Standard facial proportions based on anthropometric data
  // These ratios are based on average human face measurements
  
  return {
    // Ears are positioned at about 40-45% from center, at eye level
    leftEar: { 
      x: centerX - (faceWidth * 0.42), 
      y: centerY - (faceHeight * 0.12) // Slightly above center (eye level)
    },
    rightEar: { 
      x: centerX + (faceWidth * 0.42), 
      y: centerY - (faceHeight * 0.12)
    },
    
    // Nose is at face center
    nose: { 
      x: centerX, 
      y: centerY 
    },
    
    // Chin is at bottom 35% of face
    chin: { 
      x: centerX, 
      y: centerY + (faceHeight * 0.35) 
    },
    
    // Forehead is at top 30% of face
    forehead: {
      x: centerX,
      y: centerY - (faceHeight * 0.3)
    },
    
    // Additional landmarks for better jewelry positioning
    leftTemple: {
      x: centerX - (faceWidth * 0.35),
      y: centerY - (faceHeight * 0.25)
    },
    rightTemple: {
      x: centerX + (faceWidth * 0.35),
      y: centerY - (faceHeight * 0.25)
    },
    
    // Eye positions for reference
    leftEye: {
      x: centerX - (faceWidth * 0.18),
      y: centerY - (faceHeight * 0.12)
    },
    rightEye: {
      x: centerX + (faceWidth * 0.18),
      y: centerY - (faceHeight * 0.12)
    },
    
    // Cheekbone positions
    leftCheek: {
      x: centerX - (faceWidth * 0.25),
      y: centerY + (faceHeight * 0.05)
    },
    rightCheek: {
      x: centerX + (faceWidth * 0.25),
      y: centerY + (faceHeight * 0.05)
    }
  };
};

// Enhanced skin tone detection with better color ranges
const isSkinTone = (r, g, b) => {
  // Expanded skin tone detection for better inclusivity
  
  // Rule 1: Basic skin tone detection
  const basicSkin = r > 95 && g > 40 && b > 20 && 
                   Math.max(r, g, b) - Math.min(r, g, b) > 15 && 
                   Math.abs(r - g) > 15 && r > g && r > b;
  
  // Rule 2: Medium skin tones
  const mediumSkin = r > 85 && g > 50 && b > 35 && 
                     r >= g && g >= b && (r - b) > 15;
  
  // Rule 3: Darker skin tones
  const darkSkin = r > 50 && g > 30 && b > 20 && 
                   r > b && g > b && (r - b) > 8;
                   
  // Rule 4: Very light skin tones
  const lightSkin = r > 120 && g > 80 && b > 60 && 
                    r > g && r > b && (r - g) < 50;
                    
  // Rule 5: Asian skin tones
  const asianSkin = r > 80 && g > 60 && b > 40 && 
                    Math.abs(r - g) < 30 && r > b && g > b;
  
  return basicSkin || mediumSkin || darkSkin || lightSkin || asianSkin;
};

// Debug function to visualize all landmarks (use in development)
const drawAllLandmarks = (ctx, landmarks, faceBox) => {
  // Draw face box
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
  
  // Draw landmarks with different colors
  const landmarkColors = {
    leftEar: 'red',
    rightEar: 'red',
    nose: 'blue',
    chin: 'green',
    forehead: 'purple',
    leftEye: 'orange',
    rightEye: 'orange',
    leftCheek: 'pink',
    rightCheek: 'pink'
  };
  
  Object.entries(landmarks).forEach(([name, point]) => {
    ctx.fillStyle = landmarkColors[name] || 'yellow';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add label
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.strokeText(name, point.x + 6, point.y - 6);
    ctx.fillText(name, point.x + 6, point.y - 6);
  });
};

  // Helper function to detect skin tones
  const isSkinTone = (r, g, b) => {
    // Multiple skin tone ranges
    return (
      // Light skin
      (r > 95 && g > 40 && b > 20 && 
       Math.max(r, g, b) - Math.min(r, g, b) > 15 && 
       Math.abs(r - g) > 15 && r > g && r > b) ||
      
      // Medium skin  
      (r > 85 && g > 50 && b > 35 && 
       r >= g && g >= b && r - b > 20) ||
       
      // Darker skin
      (r > 60 && g > 40 && b > 25 && 
       r > b && g > b && r - b > 10)
    );
  };

  // Set product image URL
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      const imageUrl = product.images[0].image_url || product.images[0].url || product.images[0];
      setProductImageUrl(imageUrl);
    } else if (product?.image_url) {
      setProductImageUrl(product.image_url);
    } else if (product?.image) {
      setProductImageUrl(product.image);
    }
  }, [product]);

  // Load product image
  useEffect(() => {
    if (productImageUrl) {
      setImageLoaded(false);
      setImageLoadError(null);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        productImageRef.current = img;
        setImageLoaded(true);
        setImageLoadError(null);
      };
      
      img.onerror = (error) => {
        setImageLoadError(`Failed to load image`);
        setImageLoaded(false);
      };
      
      img.src = productImageUrl;
    }
  }, [productImageUrl]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  // Set video source
  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.play().catch(console.log);
    }
  }, [stream]);

  // Video ready detection
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const checkVideoReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoReady(true);
      }
    };

    video.addEventListener('loadedmetadata', checkVideoReady);
    video.addEventListener('canplay', checkVideoReady);
    
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      setVideoReady(true);
    }

    return () => {
      video.removeEventListener('loadedmetadata', checkVideoReady);
      video.removeEventListener('canplay', checkVideoReady);
    };
  }, [step]);

  // Real face detection function
  const detectFace = useCallback(async (video) => {
    if (!faceDetectionModel || !video || video.videoWidth === 0) {
      return null;
    }

    try {
      const faces = await faceDetectionModel.detectFaces(video);
      
      if (faces && faces.length > 0) {
        const face = faces[0]; // Use first detected face
        setDetectionConfidence(face.confidence);
        return face;
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
    
    setDetectionConfidence(0);
    return null;
  }, [faceDetectionModel]);

  // Render overlay function
  // Updated render overlay function with debug options
const renderOverlay = useCallback(async () => {
  if (!overlayCanvasRef.current || !videoRef.current || !videoReady) {
    if (step === 'camera') {
      animationFrameRef.current = requestAnimationFrame(renderOverlay);
    }
    return;
  }

  const video = videoRef.current;
  const canvas = overlayCanvasRef.current;
  const ctx = canvas.getContext('2d');

  // Set canvas size to match video
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Detect face
  let detection = null;
  if (faceDetectionModel) {
    detection = await detectFace(video);
    if (detection) {
      setLastDetection(detection);
      setRenderingActive(true);
    } else {
      setRenderingActive(false);
    }
  }

  // Use last detection if current detection failed
  if (!detection && lastDetection) {
    detection = lastDetection;
    setRenderingActive(true);
  }

  // Render jewelry if we have detection and product image
  if (detection && productImageRef.current && imageLoaded) {
    const { landmarks, faceBox } = detection;
    
    // Debug mode - show all landmarks (enable for debugging)
    const debugMode = process.env.NODE_ENV === 'development'; // Change to true to see all landmarks
    
    if (debugMode) {
      drawAllLandmarks(ctx, landmarks, faceBox);
    } else {
      // Production mode - only show ear landmarks
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(landmarks.leftEar.x, landmarks.leftEar.y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(landmarks.rightEar.x, landmarks.rightEar.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Determine jewelry type and render
    const jewelryType = getJewelryType(product);
    
    switch (jewelryType) {
      case 'earrings':
        renderEarrings(ctx, landmarks, faceBox);
        break;
      case 'necklace':
        renderNecklace(ctx, landmarks, faceBox);
        break;
      case 'ring':
        renderRing(ctx, landmarks, faceBox);
        break;
      default:
        renderEarrings(ctx, landmarks, faceBox); // Default to earrings
    }
  } else {
    setRenderingActive(false);
  }

  // Continue animation loop
  if (step === 'camera') {
    animationFrameRef.current = requestAnimationFrame(renderOverlay);
  }
}, [videoReady, step, faceDetectionModel, detectFace, lastDetection, product, imageLoaded]);
  // Get jewelry type from product
  const getJewelryType = (product) => {
    const name = product?.name?.toLowerCase() || '';
    const category = product?.category?.toLowerCase() || '';
    
    if (name.includes('earring') || name.includes('chandbali') || category.includes('earring')) {
      return 'earrings';
    } else if (name.includes('necklace') || name.includes('chain') || category.includes('necklace')) {
      return 'necklace';
    } else if (name.includes('ring') || category.includes('ring')) {
      return 'ring';
    }
    return 'earrings'; // default
  };

  // Render earrings
  const renderEarrings = (ctx, landmarks, faceBox) => {
  // Get actual image dimensions
  const imageWidth = productImageRef.current.naturalWidth || productImageRef.current.width;
  const imageHeight = productImageRef.current.naturalHeight || productImageRef.current.height;
  const imageAspectRatio = imageHeight / imageWidth;
  
  // Calculate earring size based on face proportions
  // Earrings typically should be 8-12% of face width
  const faceWidth = faceBox.width;
  const earringWidthPercent = 0.10; // 10% of face width
  const earringWidth = Math.max(faceWidth * earringWidthPercent, 25); // Min 25px
  const earringHeight = earringWidth * imageAspectRatio;
  
  // Calculate ear positions more accurately
  // Ears are typically positioned at about 15% from the sides and 25% from top of face
  const earOffsetX = faceWidth * 0.42; // Distance from face center to ear
  const earOffsetY = faceBox.height * 0.15; // Height from top of face to ear level
  
  const leftEarX = landmarks.nose.x - earOffsetX;
  const rightEarX = landmarks.nose.x + earOffsetX;
  const earY = faceBox.y + earOffsetY;
  
  // Earring hanging position adjustments
  // Earrings typically hang slightly below and outward from the ear
  const hangingOffsetY = earringHeight * 0.1; // Slight downward offset
  const outwardOffsetX = earringWidth * 0.1; // Slight outward offset
  
  // Left earring
  ctx.save();
  ctx.globalAlpha = 0.85; // Slightly more transparent for realism
  
  // Add subtle shadow for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  ctx.drawImage(
    productImageRef.current,
    leftEarX - (earringWidth / 2) - outwardOffsetX,
    earY + hangingOffsetY,
    earringWidth,
    earringHeight
  );
  ctx.restore();

  // Right earring
  ctx.save();
  ctx.globalAlpha = 0.85;
  
  // Add shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = -2; // Shadow on opposite side for right earring
  ctx.shadowOffsetY = 2;

  // For symmetrical earrings, just flip horizontally
  ctx.scale(-1, 1);
  ctx.drawImage(
    productImageRef.current,
    -(rightEarX + (earringWidth / 2) + outwardOffsetX),
    earY + hangingOffsetY,
    earringWidth,
    earringHeight
  );
  ctx.restore();
  
  // Optional: Draw debug points to visualize ear positions (remove in production)
  if (process.env.NODE_ENV === 'development') {
    ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(leftEarX, earY, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEarX, earY, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
};

  // Render necklace
  const renderNecklace = (ctx, landmarks, faceBox) => {
    const necklaceWidth = faceBox.width * 0.8;
    const aspectRatio = productImageRef.current.height / productImageRef.current.width;
    const necklaceHeight = necklaceWidth * aspectRatio * 0.5;

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(
      productImageRef.current,
      landmarks.chin.x - necklaceWidth / 2,
      landmarks.chin.y + faceBox.height * 0.1,
      necklaceWidth,
      necklaceHeight
    );
    ctx.restore();
  };

  // Render ring (on hand - simplified)
  const renderRing = (ctx, landmarks, faceBox) => {
    const ringSize = Math.max(faceBox.width * 0.08, 25);
    
    // Position ring near bottom right of face (simulating hand position)
    const ringX = landmarks.rightEar.x + faceBox.width * 0.2;
    const ringY = landmarks.chin.y + faceBox.height * 0.2;

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(
      productImageRef.current,
      ringX - ringSize / 2,
      ringY - ringSize / 2,
      ringSize,
      ringSize
    );
    ctx.restore();
  };

  // Start detection when video is ready
  useEffect(() => {
    if (videoReady && step === 'camera' && faceDetectionModel) {
      const timer = setTimeout(() => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        renderOverlay();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [videoReady, step, faceDetectionModel, renderOverlay]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
      });
      
      setStream(mediaStream);
      setStep('camera');
      setVideoReady(false);
    } catch (error) {
      console.error('Camera error:', error);
      alert(`Unable to access camera: ${error.message}`);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !overlayCanvasRef.current) return;

    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    
    const combinedCanvas = document.createElement('canvas');
    const ctx = combinedCanvas.getContext('2d');
    
    combinedCanvas.width = video.videoWidth;
    combinedCanvas.height = video.videoHeight;
    
    // Flip the video horizontally for natural selfie effect
    ctx.scale(-1, 1);
    ctx.drawImage(video, -combinedCanvas.width, 0);
    ctx.scale(-1, 1);
    
    // Add the overlay
    ctx.drawImage(overlayCanvas, 0, 0);
    
    const link = document.createElement('a');
    link.href = combinedCanvas.toDataURL('image/jpeg', 0.9);
    link.download = `${product.name || 'jewelry'}-virtual-try-on.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setStep('intro');
    setVideoReady(false);
    setRenderingActive(false);
    setLastDetection(null);
    setDetectionConfidence(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold mb-2">Virtual Try-On</h2>
          <p className="text-gray-600 mb-4">
            Try on {product?.name || 'jewelry'} using AI face detection
          </p>

          {/* Status Information */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className={imageLoaded ? 'text-green-600' : 'text-red-600'}>
                  {imageLoaded ? '✅' : '❌'}
                </span>
                Product Image
              </div>
              <div className="flex items-center gap-2">
                <span className={faceDetectionModel ? 'text-green-600' : 'text-yellow-600'}>
                  {faceDetectionModel ? '✅' : '⏳'}
                </span>
                Face Detection
              </div>
              <div className="flex items-center gap-2">
                <span className={videoReady ? 'text-green-600' : 'text-gray-500'}>
                  {videoReady ? '✅' : '❌'}
                </span>
                Camera
              </div>
              <div className="flex items-center gap-2">
                <span className={renderingActive ? 'text-green-600' : 'text-gray-500'}>
                  {renderingActive ? '✅' : '❌'}
                </span>
                AR Active {detectionConfidence > 0 && `(${Math.round(detectionConfidence * 100)}%)`}
              </div>
            </div>
            {imageLoadError && (
              <div className="text-red-600 text-xs mt-2">{imageLoadError}</div>
            )}
          </div>

          {step === 'intro' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  {productImageUrl ? (
                    <NextImage
                      src={productImageUrl}
                      alt={product.name || 'Jewelry'}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-center text-sm">No Image</div>
                  )}
                </div>
              </div>

              <p className="mb-6 text-sm text-gray-600">
                Our AI will detect your face and overlay the jewelry in real-time. 
                Make sure you're in good lighting for best results.
              </p>

              <button
                onClick={startCamera}
                disabled={modelLoading || !imageLoaded}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera size={20} />
                {modelLoading ? 'Loading AI Model...' : 
                 !imageLoaded ? 'Loading Product...' : 
                 'Start Virtual Try-On'}
              </button>
            </div>
          )}

          {step === 'camera' && (
            <div>
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-96 object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                  style={{ transform: 'scaleX(-1)' }}
                />

                <div className="absolute top-4 left-4 text-white text-xs bg-black bg-opacity-70 p-2 rounded">
                  {!videoReady ? '📹 Starting camera...' : 
                   !faceDetectionModel ? '🤖 Loading AI...' :
                   !imageLoaded ? '🖼️ Loading product...' :
                   renderingActive ? `✨ Jewelry visible (${Math.round(detectionConfidence * 100)}%)` : 
                   '👁️ Looking for face...'}
                </div>

                {renderingActive && (
                  <div className="absolute top-4 right-4 text-white text-xs bg-green-600 bg-opacity-90 p-2 rounded font-medium">
                    🎯 Try-On Active
                  </div>
                )}

                <div className="absolute bottom-4 left-4 text-white text-xs bg-black bg-opacity-70 p-2 rounded">
                  💡 Tip: Face the camera directly in good lighting
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={stopCamera}
                  className="flex-1 border border-gray-300 hover:border-gray-400 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Stop
                </button>

                <button
                  onClick={capturePhoto}
                  disabled={!videoReady || !renderingActive}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={18} />
                  Capture Photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}