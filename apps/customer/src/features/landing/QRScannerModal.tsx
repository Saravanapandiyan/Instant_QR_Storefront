import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  useBodyScrollLock(isOpen);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualSlug, setManualSlug] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // If native BarcodeDetector API is supported in modern Chrome/Android
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const intervalId = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              clearInterval(intervalId);
              handleScannedValue(rawValue);
            }
          } catch {
            // Ignore scan frame error
          }
        }, 400);

        return () => clearInterval(intervalId);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions.');
    } finally {
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleScannedValue = (value: string) => {
    stopCamera();
    onClose();

    // Check if it's a full URL containing /r/:slug or /s/:token
    try {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        const url = new URL(value);
        if (url.pathname.startsWith('/r/') || url.pathname.startsWith('/s/')) {
          navigate(url.pathname + url.search);
          return;
        }
      }
    } catch {
      // not a url
    }

    const trimmed = value.trim();
    if (trimmed.startsWith('/s/') || trimmed.startsWith('/r/')) {
      navigate(trimmed);
      return;
    }

    // Otherwise treat raw text as slug or path
    const cleanSlug = trimmed.replace('/r/', '');
    navigate(`/r/${cleanSlug}`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSlug.trim()) return;
    handleScannedValue(manualSlug.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Scan Storefront QR</h2>
              <p className="text-xs text-zinc-400">Point your camera at a restaurant QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center max-w-xs">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-200 mb-1">Camera Permission Required</p>
              <p className="text-xs text-zinc-400 mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* QR Scanner Frame overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-56 h-56 border-2 border-orange-500/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  {/* Corner accents */}
                  <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                  <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />

                  {/* Animated laser scan line */}
                  {isScanning && (
                    <div className="absolute inset-x-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-bounce" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Manual Slug or demo entry */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <p className="text-xs text-zinc-400 mb-2">Or enter branch link / slug directly:</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualSlug}
              onChange={(e) => setManualSlug(e.target.value)}
              placeholder="e.g. ananda-non-veg-theppakulam"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-medium text-white transition-colors flex items-center gap-1"
            >
              Open <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

