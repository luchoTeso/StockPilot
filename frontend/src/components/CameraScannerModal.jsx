import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const CameraScannerModal = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const html5QrCode = new Html5Qrcode("reader");

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Prefer back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText, decodedResult) => {
            // Handle on success
            if (decodedText) {
              onScan(decodedText);
              stopScanner();
            }
          },
          (errorMessage) => {
            // parse error, ignore it.
          }
        );
      } catch (err) {
        console.error("Error al iniciar el escáner de cámara", err);
        setError("No se pudo acceder a la cámara. Verifique los permisos.");
      }
    };

    const stopScanner = () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
          onClose();
        }).catch(err => {
          console.error("Error deteniendo el escáner", err);
          onClose();
        });
      } else {
        onClose();
      }
    };

    startScanner();

    return () => {
      if (html5QrCode.isScanning) {
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
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          {error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <div id="reader" className="w-full h-full rounded-lg overflow-hidden border border-gray-200"></div>
          )}
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
