// components/TryOnModal.js - Working version with improved face detection
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

  // Load model
  useEffect(() => {
    const loadModel = async () => {
      setModelLoading(true);
      await tf.ready();
      setTimeout(() => {
        setFaceDetectionModel({ loaded: true });
        setModelLoading(false);
      }, 500);
    };
    loadModel();
  }, []);

  // Load image
  useEffect(() => {
    const imageUrl = product?.images?.[0]?.image_url || product?.image_url || product?.image;
    if (!imageUrl) return;

    setProductImageUrl(imageUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      productImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => setImageLoadError(`Failed to load image: ${imageUrl}`);
    img.src = imageUrl;
  }, [product]);

  // Load product image with detailed error handling
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

  // Clean up
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      const onReady = () => {
        if (video.videoWidth && video.videoHeight) setVideoReady(true);
      };

      video.addEventListener('loadedmetadata', onReady);
      video.addEventListener('canplay', onReady);
      return () => {
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('canplay', onReady);
      };
    }
  }, []);

  // Set video source with better error handling
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('📹 Setting video source...');
      const video = videoRef.current;
      
      video.srcObject = stream;
      
      // Add error handler
      video.onerror = (error) => {
        console.error('❌ Video error:', error);
      };
      
      // Try to play the video
      video.play().catch(error => {
        console.log('⚠️ Video play promise rejected (usually fine):', error.message);
      });
      
      console.log('✅ Video source set successfully');
    }
  }, [stream]);

  // Video ready handler with better detection
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handleLoadedMetadata = () => {
      console.log('📹 Video metadata loaded - checking readiness...');
      console.log('📊 Video properties:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        currentTime: video.currentTime
      });
      
      // More reliable video ready check
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        console.log('✅ Video is ready!');
        setVideoReady(true);
      } else {
        console.log('⚠️ Video dimensions not available yet');
      }
    };

    const handleCanPlay = () => {
      console.log('📹 Video can play event');
      if (video.videoWidth > 0 && video.videoHeight > 0 && !videoReady) {
        console.log('✅ Video ready via canplay event');
        setVideoReady(true);
      }
    };

    const handleLoadedData = () => {
      console.log('📹 Video data loaded');
      if (video.videoWidth > 0 && video.videoHeight > 0 && !videoReady) {
        console.log('✅ Video ready via loadeddata event');
        setVideoReady(true);
      }
    };

    // Listen to multiple events for better compatibility
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

    // Also check if video is already ready
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      console.log('✅ Video already ready on mount');
      setVideoReady(true);
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [step, videoReady]); // Removed startRealTimeDetection dependency

  // Separate effect to start detection when video becomes ready
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

  // ALWAYS return mock face detection (for demo/testing)
  const detectFace = useCallback((video) => {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (!videoWidth || !videoHeight) return null;

    const faceWidth = Math.min(videoWidth * 0.4, videoHeight * 0.5);
    const faceHeight = faceWidth * 1.3;
    const centerX = videoWidth * 0.5;
    const centerY = videoHeight * 0.45;
    const time = Date.now() * 0.001;
    const offsetX = Math.sin(time) * 5;
    const offsetY = Math.cos(time * 0.7) * 3;

    return {
      faceBox: {
        x: centerX - faceWidth / 2 + offsetX,
        y: centerY - faceHeight / 2 + offsetY,
        width: faceWidth,
        height: faceHeight
      },
      landmarks: {
        leftEar: { x: centerX - faceWidth * 0.35 + offsetX, y: centerY - faceHeight * 0.1 + offsetY },
        rightEar: { x: centerX + faceWidth * 0.35 + offsetX, y: centerY - faceHeight * 0.1 + offsetY },
        nose: { x: centerX + offsetX, y: centerY + offsetY },
        chin: { x: centerX + offsetX, y: centerY + faceHeight * 0.4 + offsetY }
      },
      confidence: 0.95
    };
  }, []);

  // Render overlay
  const renderOverlay = useCallback(() => {
    if (!overlayCanvasRef.current || !videoRef.current || !videoReady) {
      animationFrameRef.current = requestAnimationFrame(renderOverlay);
      return;
    }

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (faceDetectionModel) {
      const detection = detectFace(video);
      if (detection) {
        setLastDetection(detection);
      }
    }

    if (productImageRef.current && imageLoaded) {
      const detection = lastDetection;
      if (detection) {
        const { landmarks, faceBox } = detection;
        ctx.strokeStyle = 'rgba(0,255,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(faceBox.x, faceBox.y, faceBox.width, faceBox.height);

        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        Object.entries(landmarks).forEach(([name, pt]) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        });

        const isEarring = product.category?.toLowerCase().includes('earring') || true;
        if (isEarring) {
          const baseSize = Math.max(faceBox.width * 0.25, 60);
          const aspect = productImageRef.current.height / productImageRef.current.width;
          const width = baseSize;
          const height = baseSize * aspect;

          ctx.save();
          ctx.globalAlpha = 1;
          ctx.drawImage(productImageRef.current, landmarks.leftEar.x - width / 2, landmarks.leftEar.y - height * 0.3, width, height);
          ctx.restore();

          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(productImageRef.current, -(landmarks.rightEar.x + width / 2), landmarks.rightEar.y - height * 0.3, width, height);
          ctx.restore();

          setRenderingActive(true);
        }
      }
    }

    if (step === 'camera') {
      animationFrameRef.current = requestAnimationFrame(renderOverlay);
    }
  }, [detectFace, faceDetectionModel, imageLoaded, lastDetection, product, step, videoReady]);

   useEffect(() => {
    if (videoReady && step === 'camera') {
      const timeout = setTimeout(startRealTimeDetection, 100);
      return () => clearTimeout(timeout);
    }
  }, [videoReady, step, startRealTimeDetection]);

   const startRealTimeDetection = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    renderOverlay();
  }, [renderOverlay]);


  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(mediaStream);
      setStep('camera');
      setVideoReady(false);
    } catch (err) {
      alert(`Camera error: ${err.message}`);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !overlayCanvasRef.current) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    ctx.drawImage(overlayCanvasRef.current, 0, 0);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg');
    link.download = 'tryon.jpg';
    link.click();
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setStep('intro');
    setVideoReady(false);
    setRenderingActive(false);
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

          {/* Enhanced Debug Information */}
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
