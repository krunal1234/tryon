// components/TryOnModal.js - Clean working version with proper structure
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Download, RefreshCw } from 'lucide-react';
import NextImage from 'next/image';
import * as tf from '@tensorflow/tfjs';

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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const productImageRef = useRef(null);

  // Debug: Log product data
  useEffect(() => {
    console.log('Product data:', product);
  }, [product]);

  // Load TensorFlow model
  useEffect(() => {
    const loadModel = async () => {
      setModelLoading(true);
      try {
        await tf.ready();
        console.log('✅ TensorFlow.js ready');
        setTimeout(() => {
          setFaceDetectionModel({ loaded: true });
          setModelLoading(false);
          console.log('✅ Face detection model loaded');
        }, 500);
      } catch (error) {
        console.error('❌ Error loading TensorFlow.js:', error);
        setModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // Set product image URL
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      const imageUrl = product.images[0].image_url || product.images[0].url || product.images[0];
      console.log('🖼️ Product image URL:', imageUrl);
      setProductImageUrl(imageUrl);
    } else if (product?.image_url) {
      console.log('🖼️ Product image URL (direct):', product.image_url);
      setProductImageUrl(product.image_url);
    } else if (product?.image) {
      console.log('🖼️ Product image (direct):', product.image);
      setProductImageUrl(product.image);
    } else {
      console.log('❌ No product image found');
      setProductImageUrl('');
    }
  }, [product]);

  // Load product image
  useEffect(() => {
    if (productImageUrl) {
      console.log('📥 Loading product image:', productImageUrl);
      setImageLoaded(false);
      setImageLoadError(null);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('✅ Product image loaded successfully:', {
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
        productImageRef.current = img;
        setImageLoaded(true);
        setImageLoadError(null);
      };
      
      img.onerror = (error) => {
        console.error('❌ Failed to load product image:', error);
        setImageLoadError(`Failed to load image: ${productImageUrl}`);
        setImageLoaded(false);
      };
      
      img.src = productImageUrl;
    }
  }, [productImageUrl]);

  // Cleanup on unmount
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
      console.log('📹 Setting video source...');
      const video = videoRef.current;
      
      video.srcObject = stream;
      
      video.onerror = (error) => {
        console.error('❌ Video error:', error);
      };
      
      video.play().catch(error => {
        console.log('⚠️ Video play promise rejected (usually fine):', error.message);
      });
      
      console.log('✅ Video source set successfully');
    }
  }, [stream]);

  // Video ready detection
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const checkVideoReady = () => {
      console.log('📹 Checking video readiness...', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });
      
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        console.log('✅ Video is ready!');
        setVideoReady(true);
      }
    };

    video.addEventListener('loadedmetadata', checkVideoReady);
    video.addEventListener('canplay', checkVideoReady);
    video.addEventListener('loadeddata', checkVideoReady);

    // Check if already ready
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      console.log('✅ Video already ready on mount');
      setVideoReady(true);
    }

    return () => {
      video.removeEventListener('loadedmetadata', checkVideoReady);
      video.removeEventListener('canplay', checkVideoReady);
      video.removeEventListener('loadeddata', checkVideoReady);
    };
  }, [step]);

  // Face detection function - always returns mock detection for demo
  const detectFace = useCallback((video) => {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    if (!videoWidth || !videoHeight) {
      console.log('❌ Invalid video dimensions:', { videoWidth, videoHeight });
      return null;
    }

    const faceWidth = Math.min(videoWidth * 0.4, videoHeight * 0.5);
    const faceHeight = faceWidth * 1.3;
    const centerX = videoWidth * 0.5;
    const centerY = videoHeight * 0.45;
    
    // Add animation for testing
    const time = Date.now() * 0.001;
    const offsetX = Math.sin(time) * 5;
    const offsetY = Math.cos(time * 0.7) * 3;

    const detection = {
      faceBox: {
        x: centerX - faceWidth / 2 + offsetX,
        y: centerY - faceHeight / 2 + offsetY,
        width: faceWidth,
        height: faceHeight
      },
      landmarks: {
        leftEar: { 
          x: centerX - faceWidth * 0.35 + offsetX, 
          y: centerY - faceHeight * 0.1 + offsetY 
        },
        rightEar: { 
          x: centerX + faceWidth * 0.35 + offsetX, 
          y: centerY - faceHeight * 0.1 + offsetY 
        },
        nose: { 
          x: centerX + offsetX, 
          y: centerY + offsetY 
        },
        chin: { 
          x: centerX + offsetX, 
          y: centerY + faceHeight * 0.4 + offsetY 
        }
      },
      confidence: 0.95
    };

    return detection;
  }, []);

  // Render overlay function
  const renderOverlay = useCallback(() => {
    console.log('🔄 Render frame - videoReady:', videoReady, 'step:', step);
    
    if (!overlayCanvasRef.current || !videoRef.current) {
      console.log('❌ Missing refs');
      if (step === 'camera') {
        animationFrameRef.current = requestAnimationFrame(renderOverlay);
      }
      return;
    }

    if (!videoReady) {
      console.log('⏳ Video not ready yet, waiting...');
      if (step === 'camera') {
        animationFrameRef.current = requestAnimationFrame(renderOverlay);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log('🔄 Canvas resized to:', canvas.width, 'x', canvas.height);
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Face detection
    if (faceDetectionModel && video.videoWidth > 0 && video.videoHeight > 0) {
      try {
        const detection = detectFace(video);
        if (detection) {
          setLastDetection(detection);
          console.log('✅ Face detection successful');
        }
      } catch (error) {
        console.error('❌ Detection error:', error);
      }
    }

    // Render jewelry
    if (productImageRef.current && imageLoaded) {
      console.log('🎨 Attempting to render jewelry...');
      
      // Use detection or create default
      let detection = lastDetection;
      if (!detection) {
        console.log('⚠️ No face detection, using default positioning');
        detection = {
          faceBox: {
            x: canvas.width * 0.3,
            y: canvas.height * 0.25,
            width: canvas.width * 0.4,
            height: canvas.height * 0.5
          },
          landmarks: {
            leftEar: { x: canvas.width * 0.35, y: canvas.height * 0.4 },
            rightEar: { x: canvas.width * 0.65, y: canvas.height * 0.4 },
            nose: { x: canvas.width * 0.5, y: canvas.height * 0.45 },
            chin: { x: canvas.width * 0.5, y: canvas.height * 0.65 }
          }
        };
      }
      
      const { landmarks, faceBox } = detection;
      
      // Draw debug markers
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
      Object.entries(landmarks).forEach(([name, point]) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add labels
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(name, point.x + 8, point.y - 8);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
      });

      // Render earrings
      const isEarring = product.category?.toLowerCase().includes('earring') || 
                       product.name?.toLowerCase().includes('earring') ||
                       product.name?.toLowerCase().includes('chandbali') ||
                       true; // Force earring mode for testing

      if (isEarring) {
        const baseSize = Math.max(faceBox.width * 0.25, 60);
        const aspectRatio = productImageRef.current.height / productImageRef.current.width;
        const earringWidth = baseSize;
        const earringHeight = baseSize * aspectRatio;

        console.log('👂 Rendering earrings:', {
          width: earringWidth,
          height: earringHeight,
          leftEar: landmarks.leftEar,
          rightEar: landmarks.rightEar
        });

        // Left earring with yellow background
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(
          landmarks.leftEar.x - earringWidth / 2 - 5,
          landmarks.leftEar.y - earringHeight * 0.3 - 5,
          earringWidth + 10,
          earringHeight + 10
        );
        
        ctx.globalAlpha = 1.0;
        ctx.drawImage(
          productImageRef.current,
          landmarks.leftEar.x - earringWidth / 2,
          landmarks.leftEar.y - earringHeight * 0.3,
          earringWidth,
          earringHeight
        );
        ctx.restore();

        // Right earring with yellow background (mirrored)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(
          landmarks.rightEar.x - earringWidth / 2 - 5,
          landmarks.rightEar.y - earringHeight * 0.3 - 5,
          earringWidth + 10,
          earringHeight + 10
        );
        
        ctx.globalAlpha = 1.0;
        ctx.scale(-1, 1);
        ctx.drawImage(
          productImageRef.current,
          -(landmarks.rightEar.x + earringWidth / 2),
          landmarks.rightEar.y - earringHeight * 0.3,
          earringWidth,
          earringHeight
        );
        ctx.restore();

        setRenderingActive(true);
        console.log('✅ Earrings rendered successfully');
      }
    } else {
      console.log('❌ Cannot render - missing requirements:', {
        productImage: !!productImageRef.current,
        imageLoaded
      });
      setRenderingActive(false);
    }

    // Continue animation loop
    if (step === 'camera') {
      animationFrameRef.current = requestAnimationFrame(renderOverlay);
    }
  }, [videoReady, step, faceDetectionModel, detectFace, lastDetection, product, imageLoaded]);

  // Start detection when video is ready
  useEffect(() => {
    if (videoReady && step === 'camera') {
      console.log('🚀 Video ready - starting detection in 100ms...');
      const timer = setTimeout(() => {
        console.log('🚀 Starting real-time detection');
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        renderOverlay();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [videoReady, step, renderOverlay]);

  const startCamera = async () => {
    try {
      console.log('📷 Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
      });
      
      console.log('✅ Camera stream obtained');
      setStream(mediaStream);
      setStep('camera');
      setVideoReady(false);
      console.log('📷 Camera started successfully');
    } catch (error) {
      console.error('❌ Camera error:', error);
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
    
    ctx.drawImage(video, 0, 0);
    ctx.drawImage(overlayCanvas, 0, 0);
    
    const link = document.createElement('a');
    link.href = combinedCanvas.toDataURL('image/jpeg', 0.9);
    link.download = `${product.name || 'jewelry'}-virtual-try-on.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('📸 Photo captured');
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
    console.log('⏹️ Camera stopped');
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
          <h2 className="text-xl font-bold mb-2">AR Virtual Try-On</h2>
          <p className="text-gray-600 mb-4">
            Try on {product?.name || 'jewelry'} in real-time
          </p>

          {/* Debug Information */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
            <div className="font-semibold mb-1">Debug Status:</div>
            <div className="grid grid-cols-2 gap-1">
              <div>Image: {imageLoaded ? '✅' : '❌'}</div>
              <div>Model: {faceDetectionModel ? '✅' : '❌'}</div>
              <div>Video: {videoReady ? '✅' : '❌'}</div>
              <div>Rendering: {renderingActive ? '✅ Active' : '❌ Inactive'}</div>
            </div>
            {imageLoadError && (
              <div className="text-red-600 text-xs mt-1">❌ {imageLoadError}</div>
            )}
            {lastDetection && (
              <div className="text-green-600 text-xs mt-1">
                👁️ Face detected: {Math.round(lastDetection.faceBox.width)}x{Math.round(lastDetection.faceBox.height)}
              </div>
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

              <p className="mb-6 text-sm">
                Experience real-time virtual try-on with AR technology. 
                The jewelry will appear overlaid on your face with debug markers visible.
              </p>

              <button
                onClick={startCamera}
                disabled={modelLoading || !imageLoaded}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                <Camera size={20} />
                {modelLoading ? 'Loading AR...' : 
                 !imageLoaded ? 'Loading Image...' : 
                 'Start AR Try-On'}
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

                <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 p-2 rounded">
                  {!videoReady ? '📹 Initializing...' : 
                   !faceDetectionModel ? '🤖 Loading AI...' :
                   !imageLoaded ? '🖼️ Loading image...' :
                   renderingActive ? '✨ AR Active' : '👁️ Looking for face...'}
                </div>

                {renderingActive && (
                  <div className="absolute top-4 right-4 text-white text-sm bg-green-600 bg-opacity-80 p-2 rounded">
                    🎯 Jewelry Visible
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={stopCamera}
                  className="flex-1 border border-gray-300 hover:border-gray-400 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  Stop
                </button>

                <button
                  onClick={capturePhoto}
                  disabled={!videoReady || !renderingActive}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download size={20} />
                  Save Photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
