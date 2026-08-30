import { useEffect, useState } from 'react';
// html5-qrcode is loaded dynamically
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const CameraScannerModal = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let html5QrCode = null;

    const onScanSuccess = (decodedText) => {
      if (decodedText && isMounted) {
        onScan(decodedText);
        stopScanner();
      }
    };

    const startScanner = async () => {
      let Html5QrcodeModule;
      try {
        const module = await import('html5-qrcode');
        Html5QrcodeModule = module.Html5Qrcode;
      } catch (err) {
        console.error('Error loading html5-qrcode', err);
        return;
      }
      if (!isMounted) return;
      html5QrCode = new Html5QrcodeModule("reader");

      try {
        // Intento 1: Cámara trasera (environment)
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => {} // ignorar parse errors
        );
      } catch (err) {
        console.warn("No se encontró cámara trasera, intentando cualquier cámara...", err);
        try {
          // Intento 2: Cualquier cámara disponible (por ej. webcam frontal en PC)
          const cameras = await Html5QrcodeModule.getCameras();
          if (cameras && cameras.length > 0 && isMounted) {
            await html5QrCode.start(
              cameras[0].id,
              { fps: 10, qrbox: { width: 250, height: 250 } },
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
      if (html5QrCode.isScanning) {
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
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Escanear Código</h3>
            <p className="text-sm text-gray-500">Apunte la cámara al código de barras</p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Cerrar modal de escáner"
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6 relative">
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/90 rounded-lg">
              <div className="text-red-500 text-center font-medium p-4">{error}</div>
            </div>
          )}
          <div id="reader" className="w-full min-h-[300px] rounded-lg overflow-hidden border border-gray-200"></div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
