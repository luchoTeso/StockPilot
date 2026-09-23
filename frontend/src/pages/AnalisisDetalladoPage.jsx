import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Rocket, BarChart2, Clock, ShoppingCart, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const chipRiesgo = (r) => (r === 'CRÍTICO' ? 'bg-rose-500' : r === 'MEDIO' ? 'bg-ambar' : 'bg-exito');
const chipUrgencia = (u) => (u === 'Pide hoy' ? 'bg-peligro-suave text-peligro border-peligro/30' : u === 'En esta compra' ? 'bg-aviso-suave text-aviso border-aviso/30' : 'bg-slate-100 text-slate-600 border-slate-200');
// Sin ventas que medir, el backend manda Infinity, que JSON convierte en null: no es que "sea
// estable", es que no hay con qué calcular cuánto durará (por eso el texto lo aclara).
const esEstable = (d) => d === null || d === Infinity;
const formatDias = (d) => (esEstable(d) ? 'Sin ventas recientes' : `${d} días`);

const AnalisisDetalladoPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.rol === 'Administrador';
  const productoId = Number(searchParams.get('producto')) || null;

  // React Router no sube el scroll al top al navegar; sin esto, si venías desplazado en Catálogo,
  // llegabas aquí en la misma posición y la tarjeta (arriba del todo) quedaba fuera de vista.
  useEffect(() => {
    if (productoId) window.scrollTo({ top: 0 });
  }, [productoId]);

  // Estado del pedido, solo para la tarjeta destacada (mismo flujo que el Consejero del Dashboard)
  const [borradores, setBorradores] = useState({});
  const [pedidoEnCurso, setPedidoEnCurso] = useState(false);
  const [solicitado, setSolicitado] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSnapshot = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/ia/snapshot', { signal: controller.signal });
        if (controller.signal.aborted) return;
        // El controlador ahora devuelve response.data.data según mi actualización previa
        setData(response.data.data || []);
      } catch (err) {
        if (!axios.isCancel(err) && !controller.signal.aborted) {
          console.error('Error fetching snapshot:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchSnapshot();
    if (isAdmin) {
      axios.get('/api/ordenes/borradores/resumen', { signal: controller.signal })
        .then((r) => { if (!controller.signal.aborted) setBorradores(r.data.data || {}); })
        .catch(() => {});
    }
    return () => controller.abort();
  }, [isAdmin]);

  const itemDestacado = useMemo(() => data.find((d) => d.id_producto === productoId) || null, [data, productoId]);

  const quitarFiltro = () => { const next = new URLSearchParams(searchParams); next.delete('producto'); setSearchParams(next); };

  const agregarAlPedido = async () => {
    if (!itemDestacado) return;
    setPedidoEnCurso(true);
    try {
      const { data: res } = await axios.post('/api/ordenes/borrador/desde-consejero', {
        items: [{ id_producto: itemDestacado.id_producto, cantidad: itemDestacado.cantidad_recomendada, urgencia: itemDestacado.urgencia }],
      });
      if (res.borradores?.length) {
        setBorradores((prev) => ({ ...prev, [itemDestacado.id_producto]: { id_orden: res.borradores[0].id_orden, proveedor: res.borradores[0].proveedor } }));
        toast.success(`Agregado al pedido #${res.borradores[0].id_orden} (borrador).`);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'No se pudo armar el pedido.');
    } finally {
      setPedidoEnCurso(false);
    }
  };

  const solicitarAlAdmin = async () => {
    if (!itemDestacado) return;
    setPedidoEnCurso(true);
    try {
      await axios.post('/api/ordenes/borrador/solicitar', { id_producto: itemDestacado.id_producto, cantidad: itemDestacado.cantidad_recomendada, urgencia: itemDestacado.urgencia });
      setSolicitado(true);
      toast.success('Se avisó al administrador. Lo verá en Proveedores.');
    } catch (e) {
      if (e.response?.status === 409) { setSolicitado(true); toast.info('Ya estaba pedido; el administrador lo revisará en Proveedores.'); }
      else toast.error(e.response?.data?.error || 'No se pudo enviar la solicitud.');
    } finally {
      setPedidoEnCurso(false);
    }
  };

  return (
    <div className="animate-fade-in p-2 md:p-6 pb-20 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} aria-label="Volver al dashboard" className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors transition-shadow active:scale-95 shadow-sm">
             <ArrowLeft size={20} className="text-tinta" />
          </button>
          <div>
            <h2 className="titular text-3xl text-tinta">Detalle de Productos</h2>
            <p className="text-slate-500 font-bold text-xs mt-1">Revisión de rotación y salud del inventario</p>
          </div>
        </div>
        <div className="bg-azul px-4 py-2 rounded-2xl text-white font-bold text-xs shadow-lg flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Motor IA Activo
        </div>
      </div>

      {/* Tarjeta destacada: se llega aquí desde el aviso "Por agotarse"/"Pedir Más" de un producto en concreto */}
      {productoId && (
        itemDestacado ? (
          <div className="bg-white rounded-2xl border-4 border-azul shadow-lg p-8 animate-scale-in">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold text-azul uppercase tracking-wide mb-1">Producto seleccionado</p>
                <h3 className="titular text-2xl text-tinta">{itemDestacado.nombre}</h3>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${chipRiesgo(itemDestacado.risk)}`}>{itemDestacado.risk}</span>
                {itemDestacado.urgencia && <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${chipUrgencia(itemDestacado.urgencia)}`}>{itemDestacado.urgencia}</span>}
                <button onClick={quitarFiltro} aria-label="Ver la lista completa" title="Ver la lista completa" className="text-slate-400 hover:text-tinta transition-colors shrink-0">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Stock actual</p>
                <p className="text-xl font-bold text-tinta mt-1">{itemDestacado.stock_actual} u</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Mínimo de seguridad</p>
                <p className="text-xl font-bold text-tinta mt-1">{itemDestacado.stock_seguridad} u</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Ventas por día</p>
                <p className="text-xl font-bold text-tinta mt-1">{(Number(itemDestacado.velocity) || 0).toFixed(2)} u/d</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Stock para</p>
                <p className="text-xl font-bold text-tinta mt-1">{formatDias(itemDestacado.days_to_exhaust)}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <p className="text-xs font-bold text-slate-500 mb-3">Qué se recomienda hacer</p>
              {itemDestacado.cantidad_recomendada <= 0 ? (
                <p className="text-sm font-bold text-exito bg-exito-suave border border-exito/20 rounded-2xl px-4 py-3">✓ El stock alcanza por ahora: no hace falta pedir más.</p>
              ) : !itemDestacado.id_proveedor ? (
                <p className="text-sm font-bold text-aviso bg-aviso-suave border border-aviso/20 rounded-2xl px-4 py-3">Sin proveedor asignado: asígnalo en Productos para poder pedirlo.</p>
              ) : isAdmin ? (
                borradores[itemDestacado.id_producto] ? (
                  <Link to={`/proveedores?orden=${borradores[itemDestacado.id_producto].id_orden}`} className="inline-flex items-center gap-2 text-sm font-bold text-exito bg-exito-suave border border-exito/20 rounded-2xl px-4 py-3 hover:bg-exito hover:text-white transition-colors">
                    <Check size={16} /> En borrador · Pedido #{borradores[itemDestacado.id_producto].id_orden}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={pedidoEnCurso}
                    onClick={agregarAlPedido}
                    className="inline-flex items-center gap-2 text-sm font-bold text-white bg-azul hover:bg-azul-hondo disabled:opacity-50 rounded-2xl px-4 py-3 transition-colors"
                  >
                    <ShoppingCart size={16} /> Pedir {itemDestacado.cantidad_recomendada} u. a {itemDestacado.proveedor}
                  </button>
                )
              ) : solicitado ? (
                <p className="inline-flex items-center gap-2 text-sm font-bold text-exito bg-exito-suave border border-exito/20 rounded-2xl px-4 py-3">
                  <Check size={16} /> Solicitado: el administrador lo verá en Proveedores
                </p>
              ) : (
                <button
                  type="button"
                  disabled={pedidoEnCurso}
                  onClick={solicitarAlAdmin}
                  className="inline-flex items-center gap-2 text-sm font-bold text-white bg-azul hover:bg-azul-hondo disabled:opacity-50 rounded-2xl px-4 py-3 transition-colors"
                >
                  <ShoppingCart size={16} /> Solicitar al Administrador
                </button>
              )}
            </div>
          </div>
        ) : !loading && (
          <div className="bg-amber-50 border border-aviso-suave rounded-2xl p-6 text-sm font-bold text-aviso">
            No encontramos ese producto (puede que ya no esté disponible). <button onClick={quitarFiltro} className="underline underline-offset-2 hover:text-tinta">Ver la lista completa</button>.
          </div>
        )
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-menu text-xs font-bold text-white">
                <th className="p-6">Producto</th>
                <th className="p-6">Tipo</th>
                <th className="p-6 text-center">Estado</th>
                <th className="p-6 text-center">Ventas / Día</th>
                <th className="p-6 text-center text-xs">Stock / Mínimo</th>
                <th className="p-6 text-center">Stock para</th>
                <th className="p-6 text-right px-10">Ingresos (30d)</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="p-24 text-center text-slate-500 font-bold animate-pulse">Analizando trazas de inventario...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" className="p-24 text-center text-slate-500 font-bold">No hay datos de rotación disponibles</td></tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-slate-50 transition-colors group ${item.id_producto === productoId ? 'bg-azul/5 ring-1 ring-inset ring-azul/30' : ''}`}>
                    <td className="p-6 font-bold text-tinta">
                       <button onClick={() => setSearchParams({ producto: String(item.id_producto) })} className="text-left hover:text-azul transition-colors">
                         <p className="text-sm">{item.nombre}</p>
                         <p className="text-xs text-slate-500 font-medium">#{item.id_producto}</p>
                       </button>
                    </td>
                    <td className="p-6">
                       <span className={`px-2 py-0.5 rounded text-xs font-bold border ${item.category === 'A' ? 'bg-azul/10 text-azul border-azul/30' : item.category === 'B' ? 'bg-aviso-suave text-aviso border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{item.category === 'A' ? 'A (Alta)' : item.category === 'B' ? 'B (Media)' : 'C (Baja)'}</span>
                    </td>
                    <td className="p-6 text-center">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${chipRiesgo(item.risk)} ${item.risk === 'CRÍTICO' ? 'animate-pulse' : ''}`}>
                          {item.risk}
                       </span>
                    </td>
                    <td className="p-6 text-center font-bold text-azul">{(Number(item.velocity) || 0).toFixed(2)} <span className="text-xs opacity-50 not-italic">u/d</span></td>
                    <td className="p-6 text-center">
                       <p className="font-bold text-tinta text-base">{item.stock_actual}</p>
                       <p className="text-xs text-slate-500 font-bold mt-1">Sugerido: {item.stock_seguridad}u</p>
                    </td>
                    <td className="p-6 text-center">
                       <span className={`text-base font-bold ${esEstable(item.days_to_exhaust) ? 'text-slate-500' : item.days_to_exhaust > 90 ? 'text-exito' : (item.days_to_exhaust < 5 ? 'text-peligro' : 'text-aviso')}`}>
                          {formatDias(item.days_to_exhaust)}
                       </span>
                    </td>
                    <td className="p-6 text-right px-10 font-bold text-tinta text-base">${(Number(item.revenue) || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-lg group transition-transform transition-shadow">
            <div className="w-12 h-12 bg-azul/10 text-azul rounded-2xl flex items-center justify-center mb-4 group-hover:bg-azul-hondo group-hover:text-white transition-colors"><Rocket size={20} /></div>
            <h4 className="font-bold text-xs text-azul mb-3">Ritmo de Ventas</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Cuánto se está vendiendo al día (en promedio), adaptándose automáticamente a cambios rápidos para que nunca quedes sin producto.</p>
         </div>
         <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-lg group transition-transform transition-shadow">
            <div className="w-12 h-12 bg-amber-50 text-aviso rounded-2xl flex items-center justify-center mb-4 group-hover:bg-ambar group-hover:text-white transition-colors"><BarChart2 size={20} /></div>
            <h4 className="font-bold text-xs text-aviso mb-3">Ganancia Principal</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Clasificamos tus productos para mostrarte cuáles te dejan la mayor rentabilidad (Tus estrellas Tipo A).</p>
         </div>
         <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-lg group transition-transform transition-shadow">
            <div className="w-12 h-12 bg-rose-50 text-peligro rounded-2xl flex items-center justify-center mb-4 group-hover:bg-rose-500 group-hover:text-white transition-colors"><Clock size={20} /></div>
            <h4 className="font-bold text-xs text-peligro mb-3">Alertas de Agotamiento</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Te avisamos cuando tu stock está tan bajo que no te alcanzará mientras esperas al camión del proveedor.</p>
         </div>
      </div>
    </div>
  );
};

export default AnalisisDetalladoPage;
