import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Loader2, DollarSign } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import CustomSelect from './CustomSelect';
import axios from 'axios';

const ExpenseModal = ({ isOpen, onClose, onExpenseRegistered, user }) => {
    const toast = useToast();
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('Proveedor menor');
    const [motivo, setMotivo] = useState('');
    const [fotoBase64, setFotoBase64] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const fileInputRef = useRef(null);
    
    // Tope para tenderos configurable
    const TOP_TENDERO = user?.limiteEgresoTendero || 150000;
    const isTendero = user?.rol === 'Tendero';

    if (!isOpen) return null;

    const categorias = [
        'Proveedor menor',
        'Insumos / Bolsas',
        'Transporte',
        'Limpieza',
        'Servicios',
        'Otro'
    ];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo (JPEG o PNG)
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            toast.error('Solo se permiten imágenes JPG o PNG.');
            return;
        }

        // Validar tamaño (< 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('La imagen supera el límite de 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFotoBase64(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setFotoBase64(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            toast.error('Ingresa un monto válido.');
            return;
        }

        if (isTendero && montoNum > TOP_TENDERO) {
            toast.error(`Por seguridad, tu rol no permite registrar gastos mayores a $${TOP_TENDERO.toLocaleString()}.`);
            return;
        }

        if (motivo.trim().length < 5) {
            toast.error('El motivo debe tener al menos 5 caracteres.');
            return;
        }

        try {
            setIsLoading(true);
            const res = await axios.post('/api/caja/egreso', {
                monto: montoNum,
                categoria,
                motivo: motivo.trim(),
                foto_soporte: fotoBase64
            });

            if (res.data.success) {
                toast.success('Egreso registrado exitosamente.');
                onExpenseRegistered(); // refrescar
                resetForm();
                onClose();
            } else {
                toast.error(res.data.error || 'Error al registrar egreso.');
            }
        } catch (error) {
            console.error('Error registrando egreso:', error);
            toast.error(error.response?.data?.error || 'Error de conexión al servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setMonto('');
        setCategoria('Proveedor menor');
        setMotivo('');
        setFotoBase64(null);
    };

    return (
        <div className="fixed inset-0 bg-tinta/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h2 className="titular text-2xl text-tinta flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-rose-500" />
                        Registrar Egreso
                    </h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-rose-50 text-slate-500 hover:text-rose-500 transition-colors shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Monto */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Monto del Egreso <span className="text-peligro">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-500">$</span>
                                <input 
                                    type="number" 
                                    min="1"
                                    step="1"
                                    required
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 text-2xl font-bold text-tinta bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                    placeholder="Ej. 15000"
                                />
                            </div>
                            {isTendero && (
                                <p className="text-xs font-bold text-slate-500 mt-2">Límite permitido: ${TOP_TENDERO.toLocaleString('es-CO')}</p>
                            )}
                        </div>

                        {/* Categoría */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Categoría <span className="text-peligro">*</span>
                            </label>
                            <CustomSelect 
                                value={categoria}
                                onChange={(val) => setCategoria(val)}
                                options={categorias.map(c => ({ value: c, label: c }))}
                                placeholder="Selecciona una categoría"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-tinta-2 font-bold focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/20 transition-all"
                            />
                        </div>

                        {/* Motivo */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Motivo / Justificación <span className="text-peligro">*</span>
                            </label>
                            <textarea 
                                required
                                rows="3"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-tinta-2 font-medium focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all resize-none"
                                placeholder="Ej. Pago a proveedor de agua..."
                            />
                        </div>

                        {/* Foto de evidencia */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Foto de Evidencia <span className="text-slate-500 normal-case tracking-normal">- Opcional (Max 2MB)</span>
                            </label>

                            {!fotoBase64 ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 hover:border-azul bg-slate-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-azul/10 group-hover:bg-azul/10 flex items-center justify-center mb-3 transition-colors">
                                        <ImageIcon className="w-6 h-6 text-azul group-hover:text-azul" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 group-hover:text-azul">Haz clic para adjuntar foto</span>
                                </div>
                            ) : (
                                <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center group shadow-inner">
                                    <img src={fotoBase64} alt="Evidencia" className="max-h-full object-contain" />
                                    <div className="absolute inset-0 bg-tinta/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            type="button"
                                            onClick={removePhoto}
                                            className="bg-white text-peligro hover:bg-rose-500 hover:text-white p-3 rounded-full shadow-lg transition-all"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <input 
                                type="file" 
                                accept="image/jpeg, image/png"
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-tinta bg-white hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="expense-form"
                        disabled={isLoading || !monto || !motivo}
                        className="px-8 py-3 text-xs font-bold text-white bg-rose-500 hover:bg-peligro rounded-lg transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Gasto'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpenseModal;
