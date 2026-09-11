import { useEffect, useState, useRef, useCallback } from 'react';
// html5-qrcode is loaded dynamically
import { X, Flashlight, FlashlightOff } from 'lucide-react';
import { createPortal } from 'react-dom';

const CameraScannerModal = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const scannerRef = useRef(null);
  const trackRef = useRef(null);

  // Toggle linterna (como en un PDA)
  const toggleTorch = useCallback(async () => {
    if (!trackRef.current) return;
    try {
      const newState = !torchOn;
      await trackRef.current.applyConstraints({ advanced: [{ torch: newState }] });
      setTorchOn(newState);
    } catch (err) {
      console.warn('Error al cambiar linterna:', err.message);
    }
  }, [torchOn]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let html5QrCode = null;

    const onScanSuccess = (decodedText) => {
      if (decodedText && isMounted) {
        // Vibración háptica al escanear (como un PDA)
        if (navigator.vibrate) navigator.vibrate(100);
        onScan(decodedText);
        stopScanner();
      }
    };

    const startScanner = async () => {
      let Html5QrcodeModule;
      let Html5QrcodeSupportedFormats;
      try {
        const module = await import('html5-qrcode');
        Html5QrcodeModule = module.Html5Qrcode || module.default?.Html5Qrcode || module;
        Html5QrcodeSupportedFormats = module.Html5QrcodeSupportedFormats || module.default?.Html5QrcodeSupportedFormats;
      } catch (err) {
        console.error('Error loading html5-qrcode', err);
        if (isMounted) setError("Error al cargar la librería de escáner.");
        return;
      }
      if (!isMounted) return;

      try {
        // Formatos de código de barras comerciales (retail, logística, distribución)
        const formatsToSupport = [
          Html5QrcodeSupportedFormats?.EAN_13 || 9,
          Html5QrcodeSupportedFormats?.EAN_8 || 10,
          Html5QrcodeSupportedFormats?.UPC_A || 14,
          Html5QrcodeSupportedFormats?.UPC_E || 15,
          Html5QrcodeSupportedFormats?.CODE_128 || 5,
          Html5QrcodeSupportedFormats?.CODE_39 || 3,
          Html5QrcodeSupportedFormats?.ITF || 8,
          Html5QrcodeSupportedFormats?.QR_CODE || 0
        ];

        html5QrCode = new Html5QrcodeModule("reader", {
          formatsToSupport,
          // Usar BarcodeDetector nativo del navegador si está disponible
          // Esto usa decodificación por HARDWARE (como un PDA) en vez de JavaScript
          useBarCodeDetectorIfSupported: true
        });
        scannerRef.current = html5QrCode;
      } catch (err) {
        console.error("Error al inicializar Html5Qrcode:", err);
        if (isMounted) setError("Error al preparar la cámara: " + err.message);
        return;
      }

      const scanConfig = {
        fps: 20,                         // 20 FPS para escaneo agresivo
        qrbox: { width: 280, height: 140 }, // Rectangular como el láser de un PDA
        aspectRatio: 1.7778,             // 16:9
        disableFlip: false,
        // Solicitar resolución alta para mejor decodificación
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }]
        }
      };

      try {
        // Intento 1: Cámara trasera con autoenfoque
        await html5QrCode.start(
          { facingMode: "environment" },
          scanConfig,
          onScanSuccess,
          () => {} // ignorar errores de frames sin código
        );

        // Post-inicio: activar autoenfoque continuo + detectar linterna
        try {
          const videoElement = document.querySelector('#reader video');
          if (videoElement && videoElement.srcObject) {
            const track = videoElement.srcObject.getVideoTracks()[0];
            trackRef.current = track;
            const capabilities = track.getCapabilities?.();

            // Activar autoenfoque continuo
            if (capabilities?.focusMode?.includes('continuous')) {
              await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
              console.log('✅ Autoenfoque continuo activado');
            }

            // Detectar si la linterna está disponible
            if (capabilities?.torch) {
              if (isMounted) setTorchAvailable(true);
              console.log('🔦 Linterna disponible');
            }
          }
        } catch (focusErr) {
          console.warn('Autoenfoque/linterna no soportado:', focusErr.message);
        }

      } catch (err) {
        console.warn("No se encontró cámara trasera, intentando cualquier cámara...", err);
        try {
          const cameras = await Html5QrcodeModule.getCameras();
          if (cameras && cameras.length > 0 && isMounted) {
            await html5QrCode.start(
              cameras[0].id,
              scanConfig,
              onScanSuccess,
              () => {}
            );
          } else if (isMounted) {
            throw new Error("No hay cámaras conectadas.");
          }
        } catch (fallbackErr) {
          console.error("Error al iniciar cualquier cámara", fallbackErr);
          if (isMounted) {
            setError("No se pudo acceder a la cámara. Verifique permisos o conecte una cámara.");
          }
        }
      }
    };

    const stopScanner = () => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
          if (isMounted) onClose();
        }).catch(err => {
          console.error("Error deteniendo el escáner", err);
          if (isMounted) onClose();
        });
      } else {
        if (isMounted) onClose();
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      trackRef.current = null;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              📷 Escanear Código
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Apunte la cámara al código de barras</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón de Linterna */}
            {torchAvailable && (
              <button 
                onClick={toggleTorch}
                className={`p-2.5 rounded-xl transition-all ${torchOn 
                  ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/30' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                title={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              >
                {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
              </button>
            )}
            <button 
              onClick={onClose}
              aria-label="Cerrar modal de escáner"
              className="p-2.5 bg-slate-700 hover:bg-red-500/80 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="px-4 pb-2 relative">
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/90 rounded-lg mx-4">
              <div className="text-red-400 text-center font-medium p-4 text-sm">{error}</div>
            </div>
          )}
          <div id="reader" className="w-full min-h-[280px] rounded-xl overflow-hidden border border-slate-700"></div>
        </div>

        {/* Línea de escaneo animada (visual tipo PDA) */}
        <div className="px-4 pb-4">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full animate-pulse"></div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-800/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            {typeof BarcodeDetector !== 'undefined' ? '⚡ Modo acelerado' : '🔍 Modo estándar'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CameraScannerModal;
