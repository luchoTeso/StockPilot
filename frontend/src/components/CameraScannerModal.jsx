import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Flashlight, FlashlightOff } from 'lucide-react';
import { createPortal } from 'react-dom';

const CameraScannerModal = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [engineName, setEngineName] = useState('Inicializando...');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const trackRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const scanLoopRef = useRef(null);
  const zxingReaderRef = useRef(null);
  const nativeDetectorRef = useRef(null);

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
    let scanHistory = [];

    // Validador matemático de Checksum EAN/UPC (Luhn Mod 10)
    const isValidBarcode = (code) => {
      if (!/^\d+$/.test(code)) return true; // Si tiene letras (ej CODE128), asume válido
      if (![8, 12, 13, 14].includes(code.length)) return true; // No es EAN/UPC estándar
      
      const digits = code.split('').map(Number);
      const checkDigit = digits.pop();
      digits.reverse();
      let sum = 0;
      for (let i = 0; i < digits.length; i++) {
        sum += digits[i] * (i % 2 === 0 ? 3 : 1);
      }
      return checkDigit === ((10 - (sum % 10)) % 10);
    };

    // Procesador de escaneo (Pipeline unificado)
    const handleResult = (decodedText) => {
      if (!isMounted || !decodedText) return;
      
      const cleanText = decodedText.trim();
      
      // 1. Descartar basura corta
      if (cleanText.length < 8) return;

      // 2. Verificación matemática estricta
      if (!isValidBarcode(cleanText)) return;

      // 3. Consenso de fotogramas (Evita que frames corruptos intermedios rompan el flujo)
      const now = Date.now();
      
      // Limpiar el historial de escaneos más antiguos que 1.5 segundos
      scanHistory = scanHistory.filter(scan => now - scan.time < 1500);
      
      // Añadir la lectura actual
      scanHistory.push({ code: cleanText, time: now });
      
      // Verificar si este mismo código se leyó al menos 2 veces en la ventana de tiempo
      const matches = scanHistory.filter(scan => scan.code === cleanText);
      
      if (matches.length >= 2) {
        // ¡Confirmado! Consenso alcanzado
        if (navigator.vibrate) navigator.vibrate(100);
        onScan(cleanText);
        scanHistory = []; // Reiniciar
        stopCamera();
      }
    };

    // Loop de escaneo continuo por frames
    const scanFrame = async () => {
      if (!isMounted || !videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        scanLoopRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Mantener las proporciones, reducimos la resolución para procesamiento
        const maxW = 640;
        let w = video.videoWidth;
        let h = video.videoHeight;
        if (w > maxW) {
          h = Math.round((maxW / w) * h);
          w = maxW;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, w, h);

        if (nativeDetectorRef.current) {
          // MOTOR 1: Aceleración por hardware (API Nativa)
          const barcodes = await nativeDetectorRef.current.detect(canvas);
          if (barcodes.length > 0) {
            handleResult(barcodes[0].rawValue);
          }
        } else if (zxingReaderRef.current) {
          // MOTOR 2: Fallback WebAssembly/JS puro (ZXing)
          try {
            const result = zxingReaderRef.current.decodeFromCanvas(canvas);
            handleResult(result.getText());
          } catch {
            // ZXing tira error (NotFoundException) en cada frame vacío. Se ignora por diseño.
          }
        }
      } catch (err) {
        console.warn("Scan frame error:", err);
      }
      
      // Control térmico: 10 FPS en HW, 5 FPS en SW para evitar calentar la batería
      const delay = nativeDetectorRef.current ? 100 : 200;
      setTimeout(() => {
        if (isMounted) scanLoopRef.current = requestAnimationFrame(scanFrame);
      }, delay);
    };

    const initCamera = async () => {
      try {
        // 1. Feature Detection del motor
        if ('BarcodeDetector' in window) {
          try {
            const formats = await window.BarcodeDetector.getSupportedFormats();
            if (formats.includes('ean_13')) {
              nativeDetectorRef.current = new window.BarcodeDetector({
                formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
              });
              setEngineName('⚡ Acelerado por HW');
            }
          } catch (e) {
             console.warn("BarcodeDetector API presente pero inoperativo", e);
          }
        }

        if (!nativeDetectorRef.current) {
          const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = await import('@zxing/library');
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128
          ]);
          hints.set(DecodeHintType.TRY_HARDER, true);
          zxingReaderRef.current = new BrowserMultiFormatReader(hints);
          setEngineName('📦 ZXing Fallback');
        }

        // 2. Acceso a la cámara
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 }, // Optimizado a 720p para evitar cuello de botella de CPU
            height: { ideal: 720 },
            advanced: [{ focusMode: "continuous" }]
          }
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        trackRef.current = stream.getVideoTracks()[0];
        
        // Detectar si tiene linterna (Flash)
        const capabilities = trackRef.current.getCapabilities?.();
        if (capabilities?.torch) {
          setTorchAvailable(true);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true); // Requerido para iOS
          videoRef.current.play();
          
          videoRef.current.onplaying = () => {
             scanLoopRef.current = requestAnimationFrame(scanFrame);
          };
        }
      } catch (err) {
        console.error("Camera init error:", err);
        if (isMounted) setError("No se pudo acceder a la cámara. Compruebe los permisos o si otro programa la está usando.");
      }
    };

    const stopCamera = () => {
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (isMounted) onClose();
    };

    initCamera();

    return () => {
      isMounted = false;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-tinta/45 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-50">
          <div>
            <h3 className="titular text-lg text-tinta flex items-center gap-2">
              📷 Escanear Código
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">Apunte la cámara al producto</p>
          </div>
          <div className="flex items-center gap-2">
            {torchAvailable && (
              <button 
                onClick={toggleTorch}
                className={`p-3 rounded-lg transition-all ${torchOn 
                  ? 'bg-aviso-suave text-aviso shadow-inner' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                title={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              >
                {torchOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
              </button>
            )}
            <button 
              onClick={onClose}
              aria-label="Cerrar modal de escáner"
              className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-500 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="px-6 py-4 relative">
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 rounded-2xl mx-6">
              <div className="text-peligro text-center font-bold p-4 text-sm bg-rose-50 border border-peligro-suave rounded-2xl shadow-lg">{error}</div>
            </div>
          )}
          <div className="w-full min-h-[300px] rounded-2xl overflow-hidden border-2 border-dashed border-azul/30 bg-menu relative">
            <video 
              ref={videoRef}
              className="w-full h-full object-cover absolute inset-0"
              muted
              playsInline
            />
          </div>
        </div>

        {/* Línea de escaneo animada */}
        <div className="px-6 pb-6 relative -mt-4 z-20 pointer-events-none">
          <div className="h-1 bg-resaltador rounded-full animate-pulse opacity-70"></div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-2xl">
          <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
            {engineName === 'Inicializando...' && (
              <span className="w-2 h-2 border-2 border-slate-300 border-t-azul rounded-full animate-spin"></span>
            )}
            {engineName}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-tinta-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
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
