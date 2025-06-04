import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw, Loader } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const TryOnModal = ({ product, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [model, setModel] = useState(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [detectionActive, setDetectionActive] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const animationRef = useRef(null);

  // Initialize camera and load model
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        setIsLoading(true);
        setLoadingStatus('Setting up TensorFlow...');
        
        // Initialize TensorFlow.js backend
        await tf.ready();
        setLoadingStatus('Loading face detection model...');
        
        // Load BlazeFace model
        const blazefaceModel = await blazeface.load();
        setModel(blazefaceModel);
        setLoadingStatus('Accessing camera...');
        
        // Get user media
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user', 
            width: { ideal: 640 }, 
            height: { ideal: 480 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            setLoadingStatus('Ready!');
            setIsLoading(false);
          };
        }
        
      } catch (err) {
        console.error('Initialization error:', err);
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

  // Real face detection function using BlazeFace
  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current || !model || !detectionActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Clear canvas and draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get face predictions from BlazeFace
      const predictions = await model.estimateFaces(video, false);
      
      if (predictions.length > 0) {
        const face = predictions[0];
        
        // Calculate face landmarks for jewelry placement
        const landmarks = calculateJewelryPositions(face, canvas.width, canvas.height);
        
        // Draw jewelry based on calculated positions
        await drawJewelry(ctx, landmarks);
        
        // Optional: Draw face detection box for debugging
        // drawFaceBox(ctx, face);
      }
    } catch (err) {
      console.error('Detection error:', err);
    }

    if (detectionActive) {
      animationRef.current = requestAnimationFrame(detectFace);
    }
  };

  const calculateJewelryPositions = (face, canvasWidth, canvasHeight) => {
    // BlazeFace returns topLeft, bottomRight, and landmarks
    const [x1, y1] = face.topLeft;
    const [x2, y2] = face.bottomRight;
    
    const faceWidth = x2 - x1;
    const faceHeight = y2 - y1;
    const centerX = x1 + faceWidth / 2;
    const centerY = y1 + faceHeight / 2;

    // Calculate jewelry positions based on face detection
    return {
      leftEar: { 
        x: x1 - faceWidth * 0.1, 
        y: centerY - faceHeight * 0.1 
      },
      rightEar: { 
        x: x2 + faceWidth * 0.1, 
        y: centerY - faceHeight * 0.1 
      },
      neckCenter: { 
        x: centerX, 
        y: y2 + faceHeight * 0.3 
      },
      chin: {
        x: centerX,
        y: y2
      },
      forehead: {
        x: centerX,
        y: y1
      }
    };
  };

  const drawFaceBox = (ctx, face) => {
    const [x1, y1] = face.topLeft;
    const [x2, y2] = face.bottomRight;
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  };

  const drawJewelry = async (ctx, landmarks) => {
    if (!product || !product[0]) return;

    const jewelryType = getJewelryType();
    
    try {
      const jewelryImg = await loadImage(product[0].image_url);
      
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
        case 'bracelet':
          drawBracelet(ctx, jewelryImg, landmarks);
          break;
        default:
          drawEarrings(ctx, jewelryImg, landmarks);
      }
      
      ctx.restore();
    } catch (err) {
      console.error('Error drawing jewelry:', err);
    }
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const getJewelryType = () => {
    // Determine jewelry type based on product or cycle for demo
    const types = ['earrings', 'necklace', 'ring', 'bracelet'];
    return types[Math.floor(Date.now() / 4000) % types.length];
  };

  const drawEarrings = (ctx, img, landmarks) => {
    const earringSize = 50;
    
    // Left earring
    ctx.drawImage(
      img,
      landmarks.leftEar.x - earringSize / 2,
      landmarks.leftEar.y - earringSize / 2,
      earringSize,
      earringSize
    );
    
    // Right earring
    ctx.drawImage(
      img,
      landmarks.rightEar.x - earringSize / 2,
      landmarks.rightEar.y - earringSize / 2,
      earringSize,
      earringSize
    );
  };

  const drawNecklace = (ctx, img, landmarks) => {
    const necklaceWidth = 120;
    const necklaceHeight = 40;
    
    // Draw necklace as a curved shape around neck
    ctx.save();
    ctx.translate(landmarks.neckCenter.x, landmarks.neckCenter.y);
    
    // Create a slight curve effect
    ctx.transform(1, 0, 0.1, 1, 0, 0);
    
    ctx.drawImage(
      img,
      -necklaceWidth / 2,
      -necklaceHeight / 2,
      necklaceWidth,
      necklaceHeight
    );
    
    ctx.restore();
  };

  const drawRing = (ctx, img, landmarks) => {
    // Position ring on right side of screen (hand position)
    const ringX = ctx.canvas.width * 0.85;
    const ringY = ctx.canvas.height * 0.75;
    const ringSize = 30;
    
    ctx.drawImage(
      img,
      ringX - ringSize / 2,
      ringY - ringSize / 2,
      ringSize,
      ringSize
    );
  };

  const drawBracelet = (ctx, img, landmarks) => {
    // Position bracelet on left side of screen (wrist position)
    const braceletX = ctx.canvas.width * 0.15;
    const braceletY = ctx.canvas.height * 0.8;
    const braceletWidth = 80;
    const braceletHeight = 25;
    
    ctx.drawImage(
      img,
      braceletX - braceletWidth / 2,
      braceletY - braceletHeight / 2,
      braceletWidth,
      braceletHeight
    );
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
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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
            <h2 className="text-xl font-semibold text-red-600">Try On Error</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-gray-600 mb-4">
            <p>Common solutions:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Allow camera permissions</li>
              <li>Ensure you're using HTTPS</li>
              <li>Try refreshing the page</li>
              <li>Check if another app is using the camera</li>
            </ul>
          </div>
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
      <div className="bg-white rounded-lg max-w-5xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <h2 className="text-xl font-semibold">✨ Virtual Jewelry Try-On</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-gray-700 mt-4 font-medium">{loadingStatus}</p>
              <p className="text-sm text-gray-500 mt-2">AI-powered jewelry try-on experience</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Video Section */}
              <div className="flex-1">
                <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto max-h-[500px] object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  
                  {/* Status Indicator */}
                  <div className="absolute top-4 left-4">
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      detectionActive 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-800 text-gray-300'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        detectionActive ? 'bg-white animate-pulse' : 'bg-gray-500'
                      }`} />
                      {detectionActive ? 'Try-On Active' : 'Try-On Paused'}
                    </div>
                  </div>

                  {/* Current Jewelry Type Indicator */}
                  {detectionActive && (
                    <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      Trying: {getJewelryType().charAt(0).toUpperCase() + getJewelryType().slice(1)}
                    </div>
                  )}
                  
                  {/* Control Buttons */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
                    <button
                      onClick={toggleTryOn}
                      className={`px-6 py-3 rounded-full text-white font-medium transition-all duration-200 shadow-lg ${
                        detectionActive 
                          ? 'bg-red-500 hover:bg-red-600 hover:scale-105' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105'
                      }`}
                    >
                      <Camera className="inline-block w-5 h-5 mr-2" />
                      {detectionActive ? 'Stop Try-On' : 'Start Try-On'}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    How to Get the Best Experience:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
                    <div className="flex items-start">
                      <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                      <span>Position your face clearly in the center of the camera view</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                      <span>Ensure good lighting for better face detection</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                      <span>Move slowly and keep your head steady</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                      <span>Watch as different jewelry types rotate automatically</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Info Sidebar */}
              <div className="lg:w-80">
                <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-6 shadow-lg">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">Product Preview</h3>
                  {product && product[0] && (
                    <div className="space-y-4">
                      <div className="relative group">
                        <img
                          src={product[0].image_url}
                          alt="Jewelry Product"
                          className="w-full h-48 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200" />
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Product ID:</span>
                          <span className="text-gray-800 font-mono text-xs">{product[0].product_id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Try-On Ready:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product[0].is_try_on 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product[0].is_try_on ? '✓ Yes' : '✗ No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Primary Image:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product[0].is_primary 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product[0].is_primary ? '✓ Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">🤖 AI Technology</h4>
                    <p className="text-sm text-purple-700">
                      Powered by TensorFlow.js BlazeFace model for real-time face detection 
                      and precise jewelry positioning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryOnModal;
