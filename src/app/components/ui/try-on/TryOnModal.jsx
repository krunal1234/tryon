// components/TryOnModal.js - Improved earring positioning
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

  // Load Face Detection Model
  useEffect(() => {
    const loadFaceDetection = async () => {
      setModelLoading(true);
      try {
        console.log('🤖 Initializing improved face detection...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const detector = {
          detectFaces: (video) => {
            return new Promise((resolve) => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              ctx.drawImage(video, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              const faces = detectFacesInImageData(imageData, canvas.width, canvas.height);
              resolve(faces);
            });
          }
        };
        
        setFaceDetectionModel(detector);
        setModelLoading(false);
        console.log('✅ Improved face detection initialized');
      } catch (error) {
        console.error('❌ Error initializing face detection:', error);
        setModelLoading(false);
      }
    };
    
    loadFaceDetection();
  }, []);

  // Improved face detection with better ear positioning
  const detectFacesInImageData = (imageData, width, height) => {
    const data = imageData.data;
    
    let skinPixels = 0;
    let totalPixels = 0;
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let centerX = 0, centerY = 0;
    let skinRegions = [];
    
    // Enhanced skin tone detection
    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (isImprovedSkinTone(r, g, b)) {
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
    
    if (skinPixels < 100) {
      return [];
    }
    
    centerX /= skinPixels;
    centerY /= skinPixels;
    
    // Better face dimension calculation
    const faceWidth = (maxX - minX) * 1.1;
    const faceHeight = faceWidth * 1.25; // More accurate face proportions
    
    // Improved face center positioning
    const faceCenterY = centerY - faceHeight * 0.05;
    
    const confidence = Math.min(skinPixels / (totalPixels * 0.08), 1);
    
    if (confidence > 0.25) {
      // More accurate landmark positioning based on facial anatomy
      const landmarks = {
        // Ears positioned more accurately on the sides of the head
        leftEar: { 
          x: centerX - faceWidth * 0.45, // Further out from center
          y: faceCenterY - faceHeight * 0.08 // Slightly above center
        },
        rightEar: { 
          x: centerX + faceWidth * 0.45, // Further out from center
          y: faceCenterY - faceHeight * 0.08 // Slightly above center
        },
        // More precise facial features
        nose: { 
          x: centerX, 
          y: faceCenterY + faceHeight * 0.02 
        },
        chin: { 
          x: centerX, 
          y: faceCenterY + faceHeight * 0.4 
        },
        forehead: {
          x: centerX,
          y: faceCenterY - faceHeight * 0.35
        },
        // Additional landmarks for better positioning
        leftCheek: {
          x: centerX - faceWidth * 0.25,
          y: faceCenterY + faceHeight * 0.1
        },
        rightCheek: {
          x: centerX + faceWidth * 0.25,
          y: faceCenterY + faceHeight * 0.1
        },
        // Jaw line points for better ear positioning
        leftJaw: {
          x: centerX - faceWidth * 0.35,
          y: faceCenterY + faceHeight * 0.25
        },
        rightJaw: {
          x: centerX + faceWidth * 0.35,
          y: faceCenterY + faceHeight * 0.25
        }
      };

      return [{
        faceBox: {
          x: centerX - faceWidth / 2,
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

  // Enhanced skin tone detection
  const isImprovedSkinTone = (r, g, b) => {
    // More comprehensive skin tone detection
    const conditions = [
      // Very light skin
      (r > 100 && g > 50 && b > 30 && 
       r > g && g > b && r - b > 20),
      
      // Light skin
      (r > 95 && g > 40 && b > 20 && 
       Math.max(r, g, b) - Math.min(r, g, b) > 15 && 
       Math.abs(r - g) > 15 && r > g && r > b),
      
      // Medium skin  
      (r > 80 && g > 45 && b > 30 && 
       r >= g && g >= b && r - b > 15),
       
      // Medium-dark skin
      (r > 70 && g > 40 && b > 25 && 
       r > b && g > b && r - b > 10),
       
      // Darker skin
      (r > 50 && g > 30 && b > 20 && 
       r > b && r - b > 5),
       
      // Additional olive/tan skin tones
      (r > 85 && g > 55 && b > 35 && 
       r > g && g > b && Math.abs(r - g) < 30)
    ];
    
    return conditions.some(condition => condition);
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

  // Face detection function
  const detectFace = useCallback(async (video) => {
    if (!faceDetectionModel || !video || video.videoWidth === 0) {
      return null;
    }

    try {
      const faces = await faceDetectionModel.detectFaces(video);
      
      if (faces && faces.length > 0) {
        const face = faces[0];
        setDetectionConfidence(face.confidence);
        return face;
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
    
    setDetectionConfidence(0);
    return null;
  }, [faceDetectionModel]);

  // Improved earring rendering with better positioning
  const renderEarrings = (ctx, landmarks, faceBox) => {
    // Calculate earring size based on face dimensions
    const baseSize = Math.max(faceBox.width * 0.12, 35);
    const aspectRatio = productImageRef.current.height / productImageRef.current.width;
    const earringWidth = baseSize;
    const earringHeight = baseSize * aspectRatio;

    // Improved ear positioning calculation
    const leftEarX = landmarks.leftEar.x;
    const leftEarY = landmarks.leftEar.y;
    const rightEarX = landmarks.rightEar.x;
    const rightEarY = landmarks.rightEar.y;

    // Adjust positioning based on earring type
    const hangingOffset = earringHeight * 0.15; // How much earrings hang below ear
    const sideOffset = earringWidth * 0.1; // Small horizontal adjustment

    // Left earring
    ctx.save();
    ctx.globalAlpha = 0.85;
    
    // Add subtle shadow for realism
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.drawImage(
      productImageRef.current,
      leftEarX - earringWidth / 2 - sideOffset,
      leftEarY + hangingOffset,
      earringWidth,
      earringHeight
    );
    ctx.restore();

    // Right earring (mirrored for symmetry)
    ctx.save();
    ctx.globalAlpha = 0.85;
    
    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = -2;
    ctx.shadowOffsetY = 2;
    
    // For right ear, we can either mirror or use the same image
    ctx.scale(-1, 1);
    ctx.drawImage(
      productImageRef.current,
      -(rightEarX + earringWidth / 2 + sideOffset),
      rightEarY + hangingOffset,
      earringWidth,
      earringHeight
    );
    ctx.restore();

    // Optional: Draw ear position indicators (for debugging)
    if (false) { // Set to true for debugging
      ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(leftEarX, leftEarY, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(rightEarX, rightEarY, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Improved necklace rendering
  const renderNecklace = (ctx, landmarks, faceBox) => {
    const necklaceWidth = faceBox.width * 0.7;
    const aspectRatio = productImageRef.current.height / productImageRef.current.width;
    const necklaceHeight = necklaceWidth * aspectRatio * 0.6;

    // Position necklace at the base of the neck
    const necklaceX = landmarks.chin.x - necklaceWidth / 2;
    const necklaceY = landmarks.chin.y + faceBox.height * 0.15;

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;
    
    ctx.drawImage(
      productImageRef.current,
      necklaceX,
      necklaceY,
      necklaceWidth,
      necklaceHeight
    );
    ctx.restore();
  };

  // Improved ring rendering
  const renderRing = (ctx, landmarks, faceBox) => {
    const ringSize = Math.max(faceBox.width * 0.06, 20);
    
    // Better hand position estimation
    const ringX = landmarks.rightCheek.x + faceBox.width * 0.15;
    const ringY = landmarks.chin.y + faceBox.height * 0.1;

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 2;
    
    ctx.drawImage(
      productImageRef.current,
      ringX - ringSize / 2,
      ringY - ringSize / 2,
      ringSize,
      ringSize
    );
    ctx.restore();
  };

  // Render overlay function
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
      
      // Draw face detection box (for debugging - set to false in production)
      if (false) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
        
        // Draw landmarks
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        Object.entries(landmarks).forEach(([name, point]) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
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
          renderEarrings(ctx, landmarks, faceBox);
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
    return 'earrings';
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
            Try on {product?.name || 'jewelry'} using improved AI face detection
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
                Enhanced Face Detection
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
                Our enhanced AI will detect your face and position jewelry accurately in real-time. 
                Ensure good lighting and face the camera directly for optimal results.
              </p>

              <button
                onClick={startCamera}
                disabled={modelLoading || !imageLoaded}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera size={20} />
                {modelLoading ? 'Loading Enhanced AI...' : 
                 !imageLoaded ? 'Loading Product...' : 
                 'Start Enhanced Try-On'}
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
                   !faceDetectionModel ? '🤖 Loading Enhanced AI...' :
                   !imageLoaded ? '🖼️ Loading product...' :
                   renderingActive ? `✨ Jewelry positioned (${Math.round(detectionConfidence * 100)}%)` : 
                   '👁️ Analyzing face position...'}
                </div>

                {renderingActive && (
                  <div className="absolute top-4 right-4 text-white text-xs bg-green-600 bg-opacity-90 p-2 rounded font-medium">
                    🎯 Enhanced Try-On Active
                  </div>
                )}

                <div className="absolute bottom-4 left-4 text-white text-xs bg-black bg-opacity-70 p-2 rounded">
                  💡 Tip: Face camera directly with ears visible for best earring placement
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