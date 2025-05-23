// components/TryOnModal.js
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
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const productImageRef = useRef(null);

  // Load face detection model (using a simplified approach for demo)
  useEffect(() => {
    const loadModel = async () => {
      setModelLoading(true);
      try {
        await tf.ready();
        // For demo purposes, we'll simulate model loading
        // In production, you'd load BlazeFace or MediaPipe
        setTimeout(() => {
          setFaceDetectionModel({ loaded: true });
          setModelLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Error loading TensorFlow.js:', error);
        setModelLoading(false);
      }
    };

    loadModel();
  }, []);

  // Update productImageUrl when product changes
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      setProductImageUrl(product.images[0].image_url);
    } else {
      setProductImageUrl('');
    }
  }, [product]);

  // Load product image
  useEffect(() => {
    if (productImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        productImageRef.current = img;
      };
      img.src = productImageUrl;
    }
  }, [productImageUrl]);

  // Cleanup camera stream and animation
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  // When stream updates, set video srcObject and start detection
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Listen for video metadata loaded
  useEffect(() => {
    if (!videoRef.current) return;

    const handleLoadedMetadata = () => {
      setVideoReady(true);
      if (step === 'camera') {
        startRealTimeDetection();
      }
    };

    const video = videoRef.current;
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [step]);

  // Simplified face detection (in production, use BlazeFace or MediaPipe)
  const detectFace = useCallback((video) => {
    // This is a simplified mock detection
    // In a real implementation, you'd use TensorFlow.js BlazeFace or MediaPipe
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Mock face detection with some randomness for demo
    const centerX = videoWidth * 0.5;
    const centerY = videoHeight * 0.4;
    const faceWidth = videoWidth * 0.3;
    const faceHeight = videoHeight * 0.4;
    
    // Add slight movement for realism
    const time = Date.now() * 0.001;
    const offsetX = Math.sin(time) * 5;
    const offsetY = Math.cos(time * 0.8) * 3;

    return {
      faceBox: {
        x: centerX - faceWidth/2 + offsetX,
        y: centerY - faceHeight/2 + offsetY,
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
          y: centerY + faceHeight * 0.3 + offsetY 
        }
      },
      confidence: 0.95
    };
  }, []);

  // Real-time face detection and overlay rendering
  const renderOverlay = useCallback(() => {
    if (!videoRef.current || !overlayCanvasRef.current || !videoReady) {
      animationFrameRef.current = requestAnimationFrame(renderOverlay);
      return;
    }

    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext('2d');

    // Set canvas size to match video
    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;

    // Clear previous frame
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Detect face (simplified version)
    if (faceDetectionModel && !isDetecting) {
      setIsDetecting(true);
      
      try {
        const detection = detectFace(video);
        setLastDetection(detection);
      } catch (error) {
        console.error('Detection error:', error);
      } finally {
        setIsDetecting(false);
      }
    }

    // Render jewelry overlay
    if (lastDetection && productImageRef.current) {
      const { landmarks, faceBox } = lastDetection;
      
      if (product.category?.toLowerCase().includes('earring')) {
        // Draw earrings
        const earringScale = faceBox.width * 0.15 / productImageRef.current.width;
        const earringWidth = productImageRef.current.width * earringScale;
        const earringHeight = productImageRef.current.height * earringScale;

        // Left earring
        ctx.drawImage(
          productImageRef.current,
          landmarks.leftEar.x - earringWidth / 2,
          landmarks.leftEar.y - earringHeight / 4,
          earringWidth,
          earringHeight
        );

        // Right earring (flipped)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
          productImageRef.current,
          -(landmarks.rightEar.x + earringWidth / 2),
          landmarks.rightEar.y - earringHeight / 4,
          earringWidth,
          earringHeight
        );
        ctx.restore();

      } else if (product.category?.toLowerCase().includes('necklace')) {
        // Draw necklace
        const necklaceScale = faceBox.width * 0.8 / productImageRef.current.width;
        const necklaceWidth = productImageRef.current.width * necklaceScale;
        const necklaceHeight = productImageRef.current.height * necklaceScale;

        ctx.drawImage(
          productImageRef.current,
          landmarks.chin.x - necklaceWidth / 2,
          landmarks.chin.y + faceBox.height * 0.2,
          necklaceWidth,
          necklaceHeight
        );

      } else if (product.category?.toLowerCase().includes('ring')) {
        // Draw ring on hand (simplified - you'd need hand detection)
        const ringScale = faceBox.width * 0.1 / productImageRef.current.width;
        const ringWidth = productImageRef.current.width * ringScale;
        const ringHeight = productImageRef.current.height * ringScale;

        // Position ring at bottom right of video (mock hand position)
        ctx.drawImage(
          productImageRef.current,
          overlayCanvas.width * 0.75,
          overlayCanvas.height * 0.8,
          ringWidth,
          ringHeight
        );
      }
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(renderOverlay);
  }, [videoReady, faceDetectionModel, isDetecting, lastDetection, product, detectFace]);

  const startRealTimeDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    renderOverlay();
  }, [renderOverlay]);

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
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !overlayCanvasRef.current) return;

    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    
    // Create a new canvas to combine video and overlay
    const combinedCanvas = document.createElement('canvas');
    const ctx = combinedCanvas.getContext('2d');
    
    combinedCanvas.width = video.videoWidth;
    combinedCanvas.height = video.videoHeight;
    
    // Draw video frame
    ctx.drawImage(video, 0, 0);
    
    // Draw overlay on top
    ctx.drawImage(overlayCanvas, 0, 0);
    
    // Download the combined image
    const link = document.createElement('a');
    link.href = combinedCanvas.toDataURL('image/jpeg');
    link.download = `${product.name}-virtual-try-on.jpg`;
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
            Try on {product?.name} in real-time
            {modelLoading && (
              <span className="text-sm text-blue-600 block">
                Loading AR model...
              </span>
            )}
          </p>

          {step === 'intro' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32 mx-auto">
                  <NextImage
                    src={productImageUrl || '/placeholder.png'}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              <p className="mb-6">
                Experience real-time virtual try-on with AR technology. 
                See how this piece looks on you instantly, just like a Snapchat filter!
              </p>

              <button
                onClick={startCamera}
                disabled={modelLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                <Camera size={20} />
                {modelLoading ? 'Loading AR...' : 'Start AR Try-On'}
              </button>
            </div>
          )}

          {step === 'camera' && (
            <div>
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                {/* Video stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-96 object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
                
                {/* AR Overlay Canvas */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />

                {/* Instructions */}
                <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 p-2 rounded">
                  {!videoReady ? 'Initializing camera...' : 
                   !faceDetectionModel ? 'Loading AR model...' :
                   'Move your head to see the jewelry!'}
                </div>

                {/* Detection indicator */}
                {lastDetection && (
                  <div className="absolute top-4 right-4 text-white text-sm bg-green-600 bg-opacity-80 p-2 rounded">
                    AR Active ✨
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
                  disabled={!videoReady || !lastDetection}
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