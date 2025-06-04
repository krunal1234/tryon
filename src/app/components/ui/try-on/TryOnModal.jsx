import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw } from 'lucide-react';

const TryOnModal = ({ product, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [model, setModel] = useState(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [detectionActive, setDetectionActive] = useState(false);
  const animationRef = useRef(null);

  // Initialize camera and load model
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        setIsLoading(true);
        
        // Load TensorFlow.js and face landmarks model
        const tf = window.tf || await import('https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.10.0/tf.min.js');
        
        // For face landmarks detection, we'll simulate the model loading
        // In a real implementation, you'd load @tensorflow-models/face-landmarks-detection
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate model loading
        
        setModel({ loaded: true }); // Mock model object
        
        // Get user media
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to access camera or load model: ' + err.message);
        setIsLoading(false);
      }
    };

    initializeCamera();

    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Mock face detection function
  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current || !model) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Mock face landmarks (in real implementation, this would come from the TensorFlow model)
    const mockLandmarks = {
      // Approximate positions for jewelry placement
      leftEar: { x: canvas.width * 0.15, y: canvas.height * 0.35 },
      rightEar: { x: canvas.width * 0.85, y: canvas.height * 0.35 },
      neckCenter: { x: canvas.width * 0.5, y: canvas.height * 0.85 },
      leftFinger: { x: canvas.width * 0.1, y: canvas.height * 0.9 },
      rightFinger: { x: canvas.width * 0.9, y: canvas.height * 0.9 }
    };

    // Draw jewelry based on type (inferred from product image)
    drawJewelry(ctx, mockLandmarks);

    if (detectionActive) {
      animationRef.current = requestAnimationFrame(detectFace);
    }
  };

  const drawJewelry = (ctx, landmarks) => {
    if (!product || !product[0]) return;

    const jewelryImg = new Image();
    jewelryImg.crossOrigin = 'anonymous';
    
    jewelryImg.onload = () => {
      // Determine jewelry type based on image or product data
      // For demo purposes, we'll cycle through different types
      const jewelryType = getJewelryType();
      
      ctx.save();
      
      switch (jewelryType) {
        case 'earrings':
          drawEarrings(ctx, jewelryImg, landmarks);
          break;
        case 'necklace':
          drawNecklace(ctx, jewelryImg, landmarks);
          break;
        case 'ring':
          drawRing(ctx, jewelryImg, landmarks);
          break;
        default:
          drawEarrings(ctx, jewelryImg, landmarks);
      }
      
      ctx.restore();
    };
    
    jewelryImg.src = product[0].image_url;
  };

  const getJewelryType = () => {
    // In a real app, this would be determined by product category
    // For demo, we'll rotate through types
    const types = ['earrings', 'necklace', 'ring'];
    return types[Math.floor(Date.now() / 3000) % types.length];
  };

  const drawEarrings = (ctx, img, landmarks) => {
    const earringSize = 40;
    
    // Left earring
    ctx.drawImage(
      img,
      landmarks.leftEar.x - earringSize / 2,
      landmarks.leftEar.y,
      earringSize,
      earringSize
    );
    
    // Right earring (flip horizontally)
    ctx.scale(-1, 1);
    ctx.drawImage(
      img,
      -landmarks.rightEar.x - earringSize / 2,
      landmarks.rightEar.y,
      earringSize,
      earringSize
    );
  };

  const drawNecklace = (ctx, img, landmarks) => {
    const necklaceWidth = 120;
    const necklaceHeight = 60;
    
    ctx.drawImage(
      img,
      landmarks.neckCenter.x - necklaceWidth / 2,
      landmarks.neckCenter.y - necklaceHeight / 2,
      necklaceWidth,
      necklaceHeight
    );
  };

  const drawRing = (ctx, landmarks) => {
    const ringSize = 25;
    
    // Draw ring on finger (simplified as circle)
    ctx.beginPath();
    ctx.arc(landmarks.rightFinger.x, landmarks.rightFinger.y, ringSize / 2, 0, 2 * Math.PI);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Add gem effect
    ctx.beginPath();
    ctx.arc(landmarks.rightFinger.x, landmarks.rightFinger.y - 5, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF6B9D';
    ctx.fill();
  };

  const startTryOn = () => {
    setDetectionActive(true);
    detectFace();
  };

  const stopTryOn = () => {
    setDetectionActive(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const toggleTryOn = () => {
    if (detectionActive) {
      stopTryOn();
    } else {
      startTryOn();
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Try On Error</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Virtual Try-On</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading camera and AI model...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Video Section */}
              <div className="flex-1">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto max-h-96 object-cover"
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  
                  {/* Overlay Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    <button
                      onClick={toggleTryOn}
                      className={`px-4 py-2 rounded-full text-white font-medium ${
                        detectionActive 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      <Camera className="inline-block w-4 h-4 mr-2" />
                      {detectionActive ? 'Stop Try-On' : 'Start Try-On'}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Position your face clearly in the camera view</li>
                    <li>• Click "Start Try-On" to begin virtual jewelry placement</li>
                    <li>• Move slowly for best tracking results</li>
                    <li>• The jewelry type changes automatically for demo purposes</li>
                  </ul>
                </div>
              </div>

              {/* Product Info */}
              <div className="lg:w-80">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Product Details</h3>
                  {product && product[0] && (
                    <div className="space-y-3">
                      <img
                        src={product[0].image_url}
                        alt="Product"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="text-sm text-gray-600">
                        <p><span className="font-medium">Product ID:</span> {product[0].product_id}</p>
                        <p><span className="font-medium">Try-On Enabled:</span> {product[0].is_try_on ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Demo Mode:</strong> This uses simulated face landmarks. 
                      In production, integrate with @tensorflow-models/face-landmarks-detection 
                      for accurate real-time tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TryOnModal;
