
import React, { useRef, useEffect, useState } from 'react';
import { TrackingConfig } from '../types';

interface VisionTrackerProps {
  onHandUpdate: (x: number, detected: boolean) => void;
  config: TrackingConfig;
}

const VisionTracker: React.FC<VisionTrackerProps> = ({ onHandUpdate, config }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const procCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const [error, setError] = useState<string | null>(null);
  const [trackingQuality, setTrackingQuality] = useState(0);

  // Kalman Filter: Optimized for low latency (higher Q, lower R)
  const kalmanX = useRef({
    x: 0.5,    
    p: 1.0,    
    q: 0.08,  // Faster process noise: allows quick hand snaps
    r: 0.04    // Low measurement noise: trusts the camera more for instant response
  });

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 480 }, 
            height: { ideal: 360 }, 
            frameRate: { ideal: 60 } // Request high frame rate hardware support
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setError("SENSOR OFFLINE");
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const procCanvas = procCanvasRef.current;
    procCanvas.width = 80; // Slightly higher res for better centroid accuracy
    procCanvas.height = 60;
    const procCtx = procCanvas.getContext('2d', { willReadFrequently: true });

    const processFrame = () => {
      const video = videoRef.current;
      const displayCanvas = canvasRef.current;
      
      if (!video || !displayCanvas || video.readyState !== 4 || !procCtx) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      const displayCtx = displayCanvas.getContext('2d');
      if (!displayCtx) return;

      // Draw mirrored mini-feed to screen
      displayCtx.save();
      displayCtx.scale(-1, 1);
      displayCtx.translate(-displayCanvas.width, 0);
      displayCtx.drawImage(video, 0, 0, displayCanvas.width, displayCanvas.height);
      displayCtx.restore();

      // Faster processing pass
      procCtx.save();
      procCtx.scale(-1, 1);
      procCtx.translate(-procCanvas.width, 0);
      procCtx.drawImage(video, 0, 0, procCanvas.width, procCanvas.height);
      procCtx.restore();

      const imageData = procCtx.getImageData(0, 0, procCanvas.width, procCanvas.height);
      const data = new Uint32Array(imageData.data.buffer); // Use 32-bit view for 4x speedup
      
      let sumX = 0;
      let count = 0;

      // Single-pass luminance check
      for (let i = 0; i < data.length; i++) {
        const pixel = data[i];
        // RGBA in little-endian is ABGR. Extract R, G, B efficiently
        const r = pixel & 0xFF;
        const g = (pixel >> 8) & 0xFF;
        const b = (pixel >> 16) & 0xFF;
        
        // Perceptual brightness is more accurate than average
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

        if (brightness > 180) { 
          const x = i % procCanvas.width;
          sumX += x;
          count++;
        }
      }

      setTrackingQuality(Math.min(100, count));

      if (count > 8) { 
        const rawMeasurement = (sumX / count) / procCanvas.width;
        
        // Ergonomic mapping (Deadzone 10% on edges)
        let z = (rawMeasurement - 0.1) / 0.8;
        z = Math.max(0, Math.min(1, z));

        // --- Optimized Kalman Update ---
        const k = kalmanX.current;
        k.p = k.p + k.q;
        const gain = k.p / (k.p + k.r);
        k.x = k.x + gain * (z - k.x);
        k.p = (1 - gain) * k.p;

        // Immediate callback execution (Avoids frame-stalling)
        onHandUpdate(k.x, true);
        
        // HUD Feedback
        const dx = k.x * displayCanvas.width;
        displayCtx.strokeStyle = '#4ade80';
        displayCtx.lineWidth = 4;
        displayCtx.beginPath();
        displayCtx.arc(dx, displayCanvas.height/2, 25, 0, Math.PI * 2);
        displayCtx.stroke();
      } else {
        onHandUpdate(kalmanX.current.x, false);
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [onHandUpdate]);

  return (
    <div className="relative w-full h-48 rounded-[2rem] overflow-hidden border border-white/10 bg-black shadow-2xl">
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} width={320} height={240} className="w-full h-full object-cover opacity-90 brightness-110" />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none p-4 flex flex-col justify-end">
        <div className="flex justify-between items-center">
          <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">
            {trackingQuality > 8 ? 'SIGNAL LOCKED' : 'CALIBRATING...'}
          </p>
          <div className="flex gap-1">
             {[0, 1, 2].map(i => (
               <div key={i} className={`w-1.5 h-1.5 rounded-full ${trackingQuality > (i*20) ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-zinc-800'}`} />
             ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Camera Initialization Failed</p>
        </div>
      )}
    </div>
  );
};

export default VisionTracker;
