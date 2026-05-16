import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({ total: 0, critico: 0 });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const prevCountRef = useRef(null);
    const audioContextRef = useRef(null);
    useEffect(() => {
        const unlockAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                console.log('[Notificación] Audio desbloqueado por interacción');
            } else if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            // Una vez desbloqueado, podemos quitar el listener
            window.removeEventListener('click', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        return () => window.removeEventListener('click', unlockAudio);
    }, []);

    const playNotificationSound = (isCritical = false) => {
        if (!audioContextRef.current) return;

        const SOUND_URLS = {
            normal: '/sounds/normal.wav',
            critical: '/sounds/critica.wav'
        };

        const tryPlayFile = () => {
            const audio = new Audio(isCritical ? SOUND_URLS.critical : SOUND_URLS.normal);
            audio.volume = 1.0; // VOLUMEN AL MÁXIMO

            audio.play().catch(err => {
                console.warn('[Notificación] No se pudo reproducir el archivo MP3, usando sintetizador de respaldo:', err);
                playSynthesizedFallback(isCritical);
            });
        };

        // Sintetizador de respaldo (por si falla el internet o el archivo)
        const playSynthesizedFallback = (isCrit) => {
            try {
                const ctx = audioContextRef.current;
                if (ctx.state === 'suspended') ctx.resume();
                const now = ctx.currentTime;
                const masterGain = ctx.createGain();
                masterGain.gain.setValueAtTime(1.0, now);
                masterGain.connect(ctx.destination);

                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(isCrit ? 440 : 880, now);
                osc.frequency.exponentialRampToValueAtTime(isCrit ? 110 : 220, now + 0.5);

                const g = ctx.createGain();
                g.gain.setValueAtTime(0.5, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                osc.connect(g);
                g.connect(masterGain);
                osc.start(now);
                osc.stop(now + 0.5);
            } catch (e) { console.error(e); }
        };

        tryPlayFile();
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const [statsRes, alertsRes] = await Promise.all([
                axios.get('/api/alertas/stats'),
                axios.get('/api/alertas?limit=5')
            ]);

            if (statsRes.data.success) {
                const newTotal = statsRes.data.stats.total;
                const newCritico = statsRes.data.stats.critico;

                if (prevCountRef.current !== null && newTotal > prevCountRef.current) {
                    playNotificationSound(newCritico > 0);
                }
                prevCountRef.current = newTotal;
                setStats(statsRes.data.stats);
            }
            if (alertsRes.data.success) setAlerts(alertsRes.data.alerts.slice(0, 5));
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getSeverityStyles = (severity) => {
        switch (severity) {
            case 'critico': return 'bg-rose-100 text-rose-600 border-rose-200';
            case 'advertencia': return 'bg-amber-100 text-amber-600 border-amber-200';
            default: return 'bg-indigo-100 text-indigo-600 border-indigo-200';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => {
                    const newOpen = !isOpen;
                    setIsOpen(newOpen);
                    if (newOpen) fetchNotifications();
                }}
                className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 shadow-lg border-2 ${isOpen ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 shadow-slate-200/50'}`}
                title="Centro de Alertas"
            >
                <span className={`text-xl ${isOpen ? 'brightness-200' : 'drop-shadow-sm'}`}>🔔</span>
                {stats.total > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 flex items-center justify-center text-[10px] font-black text-white rounded-full border-2 shadow-md ${isOpen ? 'border-indigo-600' : 'border-white'} ${stats.critico > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}>
                        {stats.total > 9 ? '+9' : stats.total}
                    </span>
                )}
            </button>

            {/* Dropdown Panel - RENDERED AS PORTAL TO AVOID Z-INDEX ISSUES */}
            {isOpen && createPortal(
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="fixed top-16 right-4 sm:top-20 sm:right-12 w-[calc(100vw-2rem)] sm:w-96 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.3)] border border-indigo-100/50 overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right flex flex-col max-h-[calc(100vh-5rem)]"
                >
                    <div className="p-5 border-b border-indigo-50 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
                        <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] italic">Notificaciones Activas</h3>
                        <span className="bg-indigo-600 px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-md shadow-indigo-100">
                            {stats.total} Alertas
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-premium min-h-0">
                        {loading && alerts.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando IA...</p>
                            </div>
                        ) : alerts.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {alerts.map((alert) => {
                                    // Lógica de resolución inteligente
                                    const isStockAlert = alert.tipo.includes('stock') || alert.tipo.includes('rop');
                                    const targetPath = isStockAlert ? '/analisis-detallado' : '/alertas';

                                    return (
                                        <div
                                            key={alert.id_alerta}
                                            onClick={() => {
                                                setIsOpen(false);
                                                // Pequeño delay para asegurar que el navegador procese el cambio de estado antes de la transición de ruta
                                                setTimeout(() => navigate(targetPath), 10);
                                            }}
                                            className="p-5 hover:bg-white hover:shadow-inner transition-all cursor-pointer group border-l-4 border-transparent hover:border-indigo-500"
                                        >
                                            <div className="flex gap-4">
                                                <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center text-lg shadow-sm ${getSeverityStyles(alert.severidad)}`}>
                                                    {alert.tipo.includes('vencimiento') ? '📅' : '📦'}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-[12px] font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                                            {alert.nombre_producto || 'Producto Desconocido'}
                                                        </p>
                                                        <span className="text-[9px] font-black text-indigo-400 group-hover:translate-x-1 transition-transform">→</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-500 leading-snug lowercase first-letter:uppercase">
                                                        {alert.mensaje}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            Resolución Sugerida: <span className="text-indigo-500">{isStockAlert ? 'Reabastecer' : 'Promocionar'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-16 text-center">
                                <div className="text-5xl mb-4 grayscale opacity-50">🛡️</div>
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Stock Blindado</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">IA en vigilancia constante</p>
                            </div>
                        )}
                    </div>

                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsOpen(false);
                            setTimeout(() => navigate('/alertas'), 10);
                        }}
                        className="w-full p-5 bg-indigo-600 text-[10px] font-black text-white uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-inner relative z-50 cursor-pointer"
                    >
                        Ingresar al Centro de Control de Alertas ⚡
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default NotificationCenter;
