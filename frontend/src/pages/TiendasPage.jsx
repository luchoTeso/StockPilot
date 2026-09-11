import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Store, Pencil, ClipboardList, Phone, Calendar, Mail, Smartphone, MapPin, Save, Plus, Power, ArrowRight, Users, Building2 } from 'lucide-react';

const TiendasPage = () => {
  const { user, switchStore } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  // State for Active Store Detail & Staff
  const [tienda, setTienda] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  
  // State for Admin View
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id_tienda: '', // Para saber cuál estamos editando
    nombre_establecimiento: '',
    direccion: '',
    documento: '',
    razon_social: '',
    celular: '',
    ciudad: ''
  });

  const cargarDatos = useCallback(async (signal = null) => {
    setLoading(true);
    try {
      if (user?.rol === 'Administrador') {
        const [resTiendas, resTienda] = await Promise.all([
          axios.get('/api/tiendas', { ...(signal && { signal }) }),
          axios.get('/api/tienda', { ...(signal && { signal }) }).catch(() => ({ data: {} }))
        ]);
        if (signal && signal.aborted) return;
        if (resTiendas.data?.success) {
          setTiendas(resTiendas.data.tiendas || []);
        }
        if (resTienda.data?.tienda) {
          setTienda(resTienda.data.tienda);
          setUsuarios(resTienda.data.usuarios || []);
        }
      } else {
        const { data } = await axios.get('/api/tienda', { ...(signal && { signal }) });
        if (signal && signal.aborted) return;
        if (data.tienda) {
          setTienda(data.tienda);
          setUsuarios(data.usuarios || []);
        }
      }
    } catch (err) {
      if (axios.isCancel(err) || (signal && signal.aborted)) return;
      console.error('Error al cargar datos', err);
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, [user?.rol]);

  useEffect(() => {
    const controller = new AbortController();
    cargarDatos(controller.signal);
    return () => controller.abort();
  }, [cargarDatos, user?.tiendaId]); // Recargar si cambia tiendaId

  const abrirModalEdit = (tiendaData) => {
    setFormData({
      id_tienda: tiendaData.id_tienda,
      nombre_establecimiento: tiendaData.nombre_establecimiento || '',
      direccion: tiendaData.direccion || '',
      documento: tiendaData.documento || '',
      razon_social: tiendaData.razon_social || '',
      celular: tiendaData.celular || '',
      ciudad: tiendaData.ciudad || ''
    });
    setEditModalOpen(true);
  };

  const abrirModalCreate = () => {
    setFormData({
      id_tienda: '',
      nombre_establecimiento: '',
      direccion: '',
      documento: '',
      razon_social: '',
      celular: '',
      ciudad: ''
    });
    setCreateModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitTienda = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      if (createModalOpen) {
        // Crear
        const { data } = await axios.post(`/api/tiendas`, formData);
        if (data.success) {
          toast.success(data.message || 'Sucursal creada correctamente');
          setCreateModalOpen(false);
          cargarDatos(); // Recargar la lista
        }
      } else {
        // Editar
        const { data } = await axios.put(`/api/tienda/update/${formData.id_tienda}`, formData);
        if (data.success) {
          toast.success(data.message || 'Tienda actualizada correctamente');
          setEditModalOpen(false);
          cargarDatos(); // Recargar la lista
        }
      }
    } catch (err) {
      console.error('Error guardando tienda:', err);
      toast.error(err.response?.data?.error || 'Error al guardar la tienda');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleStatus = async (id_tienda) => {
    try {
      const { data } = await axios.put(`/api/tienda/estado/${id_tienda}`);
      if (data.success) {
        toast.success(data.message);
        cargarDatos();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleSwitchStore = async (id_tienda) => {
    try {
      await switchStore(id_tienda);
      toast.success("Has cambiado de sucursal");
    } catch (err) {
      toast.error(err.message || 'Error al cambiar de sucursal');
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '---';
    if (typeof fechaStr === 'number' || (typeof fechaStr === 'string' && fechaStr.length === 4 && !isNaN(fechaStr))) {
      return `Año ${fechaStr}`;
    }
    return new Date(fechaStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // --------------------------------------------------------
  // ADMIN VIEW
  // --------------------------------------------------------
  const renderAdminView = () => {
    return (
      <div className="space-y-10 animate-fade-in">
        {/* Header con indicador de plan */}
        <div className="border-b border-slate-100 pb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Mis Tiendas</h2>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-xl">
              Plan {tiendas.length}/2 Sedes
            </span>
          </div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Gestión Multi-Sucursal Corporativa</p>
        </div>

        {tiendas.length === 0 ? (
           <div className="bg-white p-12 rounded-[2.5rem] text-center shadow-xl border border-slate-100 flex flex-col items-center justify-center gap-4">
            <div className="mb-2 text-slate-400"><Store size={56} /></div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">Sin Sucursales</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto">No tienes sucursales registradas actualmente.</p>
            <button
              onClick={abrirModalCreate}
              className="mt-4 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={16} /> REGISTRAR PRIMERA SUCURSAL
            </button>
          </div>
        ) : (
          <>
            {/* Grid Superior: Sucursales registradas + Tarjeta de Expansión si solo hay 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {tiendas.map((t) => {
                const isActiveSession = t.id_tienda === user?.tiendaId;
                const isStatusActive = t.estado === 'Activo';

                return (
                  <div key={t.id_tienda} className={`bg-white rounded-[2rem] shadow-xl border ${isActiveSession ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-100'} p-6 sm:p-7 relative overflow-hidden group hover:shadow-2xl transition-all duration-300 flex flex-col justify-between`}>
                    {isActiveSession && (
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl z-20 shadow-md">
                        Sesión Actual
                      </div>
                    )}

                    <div>
                      <div className="flex items-start gap-4 mb-6 relative z-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors ${isStatusActive ? (isActiveSession ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-indigo-50 text-indigo-600') : 'bg-slate-100 text-slate-400'}`}>
                          <Store size={28} />
                        </div>
                        <div className="flex-1 min-w-0 pr-10">
                          <h3 className="text-xl font-black text-slate-800 tracking-tighter italic truncate" title={t.nombre_establecimiento}>{t.nombre_establecimiento}</h3>
                          <p className="text-xs font-bold text-slate-400 truncate flex items-center gap-1 mt-1"><MapPin size={12}/> {t.direccion || 'Sin dirección registrada'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Sucursal</p>
                            <p className="text-sm font-bold text-slate-800">#{t.id_tienda}</p>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                            <p className={`text-sm font-black ${isStatusActive ? 'text-emerald-500' : 'text-rose-500'}`}>{t.estado}</p>
                         </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 pt-4 border-t border-slate-100">
                      {!isActiveSession && isStatusActive ? (
                        <button 
                          onClick={() => handleSwitchStore(t.id_tienda)}
                          className="w-full sm:flex-1 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          Gestionar aquí <ArrowRight size={14} />
                        </button>
                      ) : (
                         <div className={`w-full sm:flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-default ${isActiveSession ? 'bg-indigo-50 text-indigo-600 font-black' : 'bg-slate-100 text-slate-400'}`}>
                           {isActiveSession ? '✦ En Gestión Activa' : 'Sucursal Inactiva'}
                         </div>
                      )}
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => abrirModalEdit(t)}
                          className="flex-1 sm:flex-none p-3 rounded-xl bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center"
                          title="Editar Tienda"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => toggleStatus(t.id_tienda)}
                          className={`flex-1 sm:flex-none p-3 rounded-xl transition-colors flex items-center justify-center ${isStatusActive ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'}`}
                          title={isStatusActive ? "Desactivar Tienda" : "Activar Tienda"}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Tarjeta CTA de expansión si solo tiene 1 tienda */}
              {tiendas.length === 1 && (
                <div className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/40 border-2 border-dashed border-indigo-200/90 rounded-[2rem] p-7 flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-indigo-400 hover:shadow-xl transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner mb-3 group-hover:scale-110 transition-transform">
                    <Plus size={28} />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Cupo 2 de 2 Disponible
                    </span>
                    <h4 className="text-xl font-black text-slate-800 tracking-tighter italic">Habilita una Segunda Sucursal</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Tu plan de microempresa incluye hasta 2 sucursales simultáneas. Expande tu alcance abriendo una nueva sede con inventario aislado.
                    </p>
                  </div>
                  <button
                    onClick={abrirModalCreate}
                    className="mt-5 w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={15} /> REGISTRAR 2DA SUCURSAL
                  </button>
                </div>
              )}
            </div>

            {/* Nivel Inferior: Expediente Operativo Completo de la Sucursal Activa */}
            <div className="pt-6 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><Building2 size={16} /></span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tighter italic uppercase">
                      Expediente de la Sucursal Activa
                    </h3>
                  </div>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 pl-7">
                    {tienda?.nombre_establecimiento || 'Sucursal Seleccionada'} &bull; Sede #{user?.tiendaId}
                  </p>
                </div>
                {tienda && (
                  <button
                    onClick={() => abrirModalEdit(tienda)}
                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
                  >
                    <Pencil size={13} /> Editar Ficha Maestra
                  </button>
                )}
              </div>

              {/* Grid de 3 Columnas con Detalles Operativos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Identidad Comercial */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                  <h4 className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><ClipboardList size={15} /></span>
                    Identidad Comercial
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NIT / Documento</p>
                      <p className="text-sm font-bold text-slate-800">{tienda?.documento || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Razón Social</p>
                      <p className="text-sm font-bold text-slate-800 truncate" title={tienda?.razon_social}>{tienda?.razon_social || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificador Interno</p>
                      <p className="text-sm font-bold text-indigo-600">ID #{tienda?.id_tienda || user?.tiendaId}</p>
                    </div>
                  </div>
                </div>

                {/* Contacto y Ubicación */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                  <h4 className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Phone size={15} /></span>
                    Contacto y Localización
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dirección Física</p>
                      <p className="text-sm font-bold text-slate-800 truncate" title={tienda?.direccion}>{tienda?.direccion || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ciudad Sede</p>
                      <p className="text-sm font-bold text-slate-800">{tienda?.ciudad || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teléfono / Móvil</p>
                      <p className="text-sm font-bold text-slate-800">{tienda?.celular || 'No especificado'}</p>
                    </div>
                  </div>
                </div>

                {/* Operatividad */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
                  <div>
                    <h4 className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Calendar size={15} /></span>
                      Operatividad
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha de Apertura</p>
                        <p className="text-base font-black text-slate-800 tracking-tight">{formatearFecha(tienda?.fecha_creacion || tienda?.anio_creacion)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado Operativo</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${tienda?.estado === 'Activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {tienda?.estado || 'Activo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                    Aislamiento de Sesión Activa OK
                  </div>
                </div>
              </div>

              {/* Panel Resumen de Personal Asignado a la Sucursal Activa */}
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 tracking-tighter italic uppercase">
                        Equipo Asignado a esta Sucursal
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {usuarios.length} {usuarios.length === 1 ? 'colaborador activo' : 'colaboradores activos'} en {tienda?.nombre_establecimiento || 'esta sede'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/registro-tendero')}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md transition-colors self-start sm:self-auto active:scale-95"
                  >
                    Gestionar en Colaboradores <ArrowRight size={14} />
                  </button>
                </div>

                {usuarios.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-600 font-bold text-sm">No hay colaboradores vinculados directamente a esta sucursal</p>
                    <p className="text-slate-400 text-xs mt-1">Puedes registrar cajeros y tenderos para esta sede desde el módulo de Colaboradores.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {usuarios.map((u, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-white hover:shadow-md transition-all duration-200 flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-sm shrink-0 ${u.genero === 'Femenino' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {(u.nombres || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-sm font-black tracking-tight truncate" title={u.nombres}>{u.nombres}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {u.rol}
                            </span>
                            <span className="text-xs text-indigo-600 font-bold truncate">@{u.usuario}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // --------------------------------------------------------
  // TENDERO VIEW
  // --------------------------------------------------------
  const renderTenderoView = () => {
    if (!tienda) {
      return (
        <div className="bg-white p-12 rounded-[2.5rem] text-center shadow-xl border border-slate-100 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="mb-2 text-slate-400"><Store size={56} /></div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">Perfil Inexistente</h3>
          <p className="text-slate-500 font-medium max-w-md mx-auto">No se encontró información de la sucursal vinculada a esta sesión corporativa de StockPilot.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Mi Tienda</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Centro de Gestión Comercial y Usuarios</p>
          </div>
        </div>

        {/* Tarjeta Principal Tienda */}
        <div className="bg-white p-4 sm:p-6 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-shadow duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-5 md:pb-8 mb-5 md:mb-8 gap-4 md:gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
                  <Store size={36} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-4xl font-black text-slate-800 tracking-tighter italic mb-1">
                    {tienda.nombre_establecimiento}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full mr-2 bg-emerald-500"></span>
                      ACTIVA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid de Información Tienda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                <h4 className="flex items-center gap-3 text-slate-800 font-black text-xs uppercase tracking-widest border-b border-white pb-3 mb-4">
                  <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><ClipboardList size={18} /></span> IDENTIDAD COMERCIAL
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Sistema</p>
                    <p className="text-sm font-bold text-slate-800">{tienda.id_tienda}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIT / Documento</p>
                    <p className="text-sm font-bold text-slate-800">{tienda.documento || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Razón Social</p>
                    <p className="text-sm font-bold text-slate-800">{tienda.razon_social || 'No especificada'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                <h4 className="flex items-center gap-3 text-slate-800 font-black text-xs uppercase tracking-widest border-b border-white pb-3 mb-4">
                  <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Phone size={18} /></span> CONTACTO DIRECTO
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Móvil Principal</p>
                    <p className="text-sm font-bold text-slate-800">{tienda.celular || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dirección Física</p>
                    <p className="text-sm font-bold text-slate-800">{tienda.direccion}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ciudad Sede</p>
                    <p className="text-sm font-bold text-slate-800">{tienda.ciudad || 'No especificada'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm text-slate-500">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 text-center">Fecha de Apertura</p>
                  <p className="text-xl font-black text-indigo-600 tracking-tighter italic">{formatearFecha(tienda.fecha_creacion || tienda.anio_creacion)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase mb-6 pl-2 border-l-4 border-indigo-600">
            Personal Registrado
          </h3>
          {usuarios.length === 0 ? (
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 text-center shadow-sm">
               <p className="text-slate-400 font-bold italic">Aún no hay usuarios o colaboradores vinculados a esta sucursal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usuarios.map((u, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-200 transition-colors transition-shadow transition-transform duration-300 group flex items-start gap-5">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl tracking-tighter border border-indigo-100 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                     {(u.nombres || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-lg font-black tracking-tighter truncate mb-1" title={u.nombres}>{u.nombres}</p>
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                      Rol: {u.rol}
                    </span>
                    <div className="space-y-1 text-xs">
                      {u.correo && (
                        <p className="flex items-center gap-2 text-slate-500 font-medium truncate" title={u.correo}>
                          <Mail size={14} /> <span className="truncate">{u.correo}</span>
                        </p>
                      )}
                      {u.celular && (
                        <p className="flex items-center gap-2 text-slate-500 font-medium">
                          <Smartphone size={14} /> {u.celular}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in pb-12 font-outfit">
      
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando con matriz corporativa...</p>
        </div>
      ) : user?.rol === 'Administrador' ? renderAdminView() : renderTenderoView()}

      {/* Modal Editar / Crear Tienda */}
      {(editModalOpen || createModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-outfit">
          <div className="bg-white rounded-[2.5rem] w-full max-w-[700px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                   {createModalOpen ? <Plus size={20} /> : <Pencil size={20} />}
                 </div>
                 <div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">
                     {createModalOpen ? 'Nueva Sucursal' : 'Modificar Perfil'}
                   </h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     {createModalOpen ? 'Expansión de negocio' : 'Actualización de datos maestros'}
                   </p>
                 </div>
              </div>
              <button onClick={() => { setEditModalOpen(false); setCreateModalOpen(false); }} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors shadow-sm text-xl font-bold">&times;</button>
            </div>

            {/* Cuerpo Scroll Modal */}
            <form onSubmit={submitTienda} className="overflow-y-auto p-6 lg:p-8 custom-scrollbar-hidden flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="nombre_establecimiento" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre Comercial <span className="text-rose-500 text-sm">*</span></label>
                  <input id="nombre_establecimiento" required name="nombre_establecimiento" value={formData.nombre_establecimiento} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Ej. Tienda Central..." />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="razon_social" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Razón Social</label>
                  <input id="razon_social" name="razon_social" value={formData.razon_social} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Ej. Mi Tienda S.A.S" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="documento" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">NIT / ID Tributario</label>
                  <input id="documento" name="documento" value={formData.documento} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Ej. 900.123.456-7" />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                   <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-1"><MapPin size={12} /> Datos de Ubicación</h4>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="direccion" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dirección Física <span className="text-rose-500 text-sm">*</span></label>
                  <input id="direccion" required name="direccion" value={formData.direccion} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Avenida Siempre Viva 123..." />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ciudad" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ciudad Sede</label>
                  <input id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Requerido para logística" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="celular" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Celular / Teléfono</label>
                  <input id="celular" name="celular" value={formData.celular} onChange={handleInputChange} type="tel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="+57 300 000 0000" />
                </div>

              </div>
              
              {/* Footer Modal */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 pb-2">
                <button type="button" onClick={() => { setEditModalOpen(false); setCreateModalOpen(false); }} className="px-8 py-4 rounded-2xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-colors">
                  Descartar
                </button>
                <button type="submit" disabled={editLoading} className="px-8 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50">
                  {editLoading ? 'Sincronizando...' : <><Save size={14} /> Guardar Perfil</>}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default TiendasPage;
