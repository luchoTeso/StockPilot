import React, { useState } from 'react';
import { Tag, X, CheckCircle, Percent } from 'lucide-react';
import axios from 'axios';

const PromoManualModal = ({ isOpen, onClose, product, onPromoSuccess }) => {
    const [descuento, setDescuento] = useState('');
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen || !product) return null;

    const precioActual = parseFloat(product.precio);
    const descuentoNum = parseFloat(descuento) || 0;
    const precioNuevo = Math.round(precioActual - (precioActual * (descuentoNum / 100)));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!descuentoNum || descuentoNum <= 0 || descuentoNum >= 100) {
            setError('Por favor, ingresa un descuento válido (1-99%).');
            return;
        }

        if (!motivo.trim()) {
            setError('Por favor, ingresa un motivo para que la IA aprenda de esta decisión.');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('/api/promociones', {
                id_producto: product.id_producto,
                descuento_porcentaje: descuentoNum,
                motivo: motivo.trim()
            });

            if (response.data.success) {
                onPromoSuccess();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al aplicar la promoción');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-tinta/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200 border border-slate-100">
                <div className="px-6 py-5 flex justify-between items-center border-b border-slate-50">
                    <div>
                        <h3 className="titular text-lg text-tinta flex items-center gap-2">
                            <Tag className="text-amber-500 w-5 h-5" /> Promoción Manual
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">Enseñando a la IA</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-peligro p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <X className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-1">Producto</p>
                        <p className="font-bold text-tinta">{product.nombre_producto}</p>
                        
                        <div className="flex items-center gap-4 mt-3">
                            <div>
                                <p className="text-xs font-bold text-slate-400">Precio Actual</p>
                                <p className="font-bold text-slate-600 line-through">${precioActual.toLocaleString('es-CO')}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-500">Nuevo Precio</p>
                                <p className="font-bold text-exito text-lg">${precioNuevo.toLocaleString('es-CO')}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Porcentaje de Descuento (%)</label>
                        <div className="flex items-center gap-2 mb-3">
                            {[10, 20, 30, 50].map(pct => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setDescuento(pct.toString())}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${descuento === pct.toString() ? 'bg-aviso-suave text-aviso border-amber-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                value={descuento}
                                onChange={(e) => setDescuento(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 bg-white border-2 border-slate-100 rounded-lg focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none transition-all font-bold text-tinta-2"
                                placeholder="Otro porcentaje..."
                                min="1"
                                max="99"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Motivo de la promoción</label>
                        <p className="text-xs text-slate-400 mb-2 font-medium">Esta justificación alimentará a la IA para aprender de tus decisiones.</p>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-lg focus:ring-4 focus:ring-azul/10 focus:border-azul outline-none transition-all font-medium text-sm text-tinta-2 resize-none h-24 shadow-inner"
                            placeholder="Ej: Producto próximo a vencer, liquidación de temporada, exceso de stock..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-azul text-white font-bold py-4 rounded-lg hover:bg-azul-hondo active:scale-95 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
                    >
                        {loading ? 'Aplicando...' : (
                            <>
                                <CheckCircle className="w-5 h-5" /> Confirmar Promoción
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PromoManualModal;
