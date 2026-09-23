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
            <h2 className="titular text-2xl sm:text-3xl md:text-4xl text-tinta">Mis Tiendas</h2>
            <span className="px-3 py-1 bg-azul/10 border border-azul/30 text-azul text-xs font-bold rounded-2xl">
              Plan {tiendas.length}/2 Sedes
            </span>
          </div>
          <p className="text-slate-500 font-bold text-xs mt-1">Gestión Multi-Sucursal Corporativa</p>
        </div>

        {tiendas.length === 0 ? (
           <div className="bg-white p-12 rounded-2xl text-center shadow-lg border border-slate-100 flex flex-col items-center justify-center gap-4">
            <div className="mb-2 text-slate-500"><Store size={56} /></div>
            <h3 className="titular text-2xl text-tinta">Sin Sucursales</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto">No tienes sucursales registradas actualmente.</p>
            <button
              onClick={abrirModalCreate}
              className="mt-4 px-6 py-3.5 rounded-lg bg-azul text-white text-xs font-bold shadow-lg hover:bg-azul-hondo transition-all active:scale-95 flex items-center gap-2"
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
                  <div key={t.id_tienda} className={`bg-white rounded-2xl shadow-lg border ${isActiveSession ? 'border-azul ring-4 ring-azul/30' : 'border-slate-100'} p-6 sm:p-7 relative overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col justify-between`}>
                    {isActiveSession && (
                      <div className="absolute top-0 right-0 bg-azul text-white text-xs font-bold uppercase tracking-wide px-4 py-1.5 rounded-bl-xl z-20 shadow-md">
                        Sesión Actual
                      </div>
                    )}

                    <div>
                      <div className="flex items-start gap-4 mb-6 relative z-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-colors ${isStatusActive ? (isActiveSession ? 'bg-azul text-white' : 'bg-azul/10 text-azul') : 'bg-slate-100 text-slate-500'}`}>
                          <Store size={28} />
                        </div>
                        <div className="flex-1 min-w-0 pr-10">
                          <h3 className="titular text-xl text-tinta truncate" title={t.nombre_establecimiento}>{t.nombre_establecimiento}</h3>
                          <p className="text-xs font-bold text-slate-500 truncate flex items-center gap-1 mt-1"><MapPin size={12}/> {t.direccion || 'Sin dirección registrada'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                            <p className="text-xs font-bold text-slate-500 mb-1">ID Sucursal</p>
                            <p className="text-sm font-bold text-tinta">#{t.id_tienda}</p>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                            <p className="text-xs font-bold text-slate-500 mb-1">Estado</p>
                            <p className={`text-sm font-bold ${isStatusActive ? 'text-exito' : 'text-peligro'}`}>{t.estado}</p>
                         </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 pt-4 border-t border-slate-100">
                      {!isActiveSession && isStatusActive ? (
                        <button 
                          onClick={() => handleSwitchStore(t.id_tienda)}
                          className="w-full sm:flex-1 py-3 rounded-lg bg-menu text-white text-xs font-bold hover:bg-azul transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          Gestionar aquí <ArrowRight size={14} />
                        </button>
                      ) : (
                         <div className={`w-full sm:flex-1 py-3 rounded-2xl text-xs font-bold text-center cursor-default ${isActiveSession ? 'bg-azul/10 text-azul font-bold' : 'bg-slate-100 text-slate-500'}`}>
                           {isActiveSession ? '✦ En Gestión Activa' : 'Sucursal Inactiva'}
                         </div>
                      )}
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => abrirModalEdit(t)}
                          className="flex-1 sm:flex-none p-3 rounded-lg bg-slate-100 text-slate-500 hover:text-azul hover:bg-azul/10 transition-colors flex items-center justify-center"
                          title="Editar Tienda"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => toggleStatus(t.id_tienda)}
                          className={`flex-1 sm:flex-none p-3 rounded-lg transition-colors flex items-center justify-center ${isStatusActive ? 'bg-rose-50 text-peligro hover:bg-peligro-suave' : 'bg-emerald-50 text-exito hover:bg-exito-suave'}`}
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
                <div className="bg-azul/5 border-2 border-dashed border-azul/20 rounded-2xl p-7 flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-azul hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-azul/10 text-azul flex items-center justify-center shadow-inner mb-3 transition-transform">
                    <Plus size={28} />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <span className="inline-block px-3 py-1 bg-azul/10 text-azul rounded-full text-xs font-bold uppercase tracking-wide">
                      Cupo 2 de 2 Disponible
                    </span>
                    <h4 className="titular text-xl text-tinta">Habilita una Segunda Sucursal</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Tu plan de microempresa incluye hasta 2 sucursales simultáneas. Expande tu alcance abriendo una nueva sede con inventario aislado.
                    </p>
                  </div>
                  <button
                    onClick={abrirModalCreate}
                    className="mt-5 w-full py-3.5 px-5 rounded-lg bg-azul hover:bg-azul-hondo text-white text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
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
                    <span className="p-1.5 bg-azul/10 text-azul rounded-lg"><Building2 size={16} /></span>
                    <h3 className="titular text-xl sm:text-2xl text-tinta">
                      Expediente de la Sucursal Activa
                    </h3>
                  </div>
                  <p className="text-slate-500 font-bold text-xs mt-1 pl-7">
                    {tienda?.nombre_establecimiento || 'Sucursal Seleccionada'} &bull; Sede #{user?.tiendaId}
                  </p>
                </div>
                {tienda && (
                  <button
                    onClick={() => abrirModalEdit(tienda)}
                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-600 hover:text-azul hover:bg-azul/10 text-xs font-bold transition-colors shadow-sm"
                  >
                    <Pencil size={13} /> Editar Ficha Maestra
                  </button>
                )}
              </div>

              {/* Grid de 3 Columnas con Detalles Operativos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Identidad Comercial */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40">
                  <h4 className="font-bold flex items-center gap-2 text-tinta text-xs border-b border-slate-100 pb-3 mb-4">
                    <span className="p-1.5 bg-azul/10 text-azul rounded-lg"><ClipboardList size={15} /></span>
                    Identidad Comercial
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500">NIT / Documento</p>
                      <p className="text-sm font-bold text-tinta">{tienda?.documento || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Razón Social</p>
                      <p className="text-sm font-bold text-tinta truncate" title={tienda?.razon_social}>{tienda?.razon_social || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Identificador Interno</p>
                      <p className="text-sm font-bold text-azul">ID #{tienda?.id_tienda || user?.tiendaId}</p>
                    </div>
                  </div>
                </div>

                {/* Contacto y Ubicación */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40">
                  <h4 className="font-bold flex items-center gap-2 text-tinta text-xs border-b border-slate-100 pb-3 mb-4">
                    <span className="p-1.5 bg-azul/10 text-azul rounded-lg"><Phone size={15} /></span>
                    Contacto y Localización
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Dirección Física</p>
                      <p className="text-sm font-bold text-tinta truncate" title={tienda?.direccion}>{tienda?.direccion || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Ciudad Sede</p>
                      <p className="text-sm font-bold text-tinta">{tienda?.ciudad || 'No especificada'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Teléfono / Móvil</p>
                      <p className="text-sm font-bold text-tinta">{tienda?.celular || 'No especificado'}</p>
                    </div>
                  </div>
                </div>

                {/* Operatividad */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold flex items-center gap-2 text-tinta text-xs border-b border-slate-100 pb-3 mb-4">
                      <span className="p-1.5 bg-azul/10 text-azul rounded-lg"><Calendar size={15} /></span>
                      Operatividad
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500">Fecha de Apertura</p>
                        <p className="text-base font-bold text-tinta tracking-tight">{formatearFecha(tienda?.fecha_creacion || tienda?.anio_creacion)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500">Estado Operativo</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${tienda?.estado === 'Activo' ? 'bg-emerald-50 text-exito' : 'bg-rose-50 text-peligro'}`}>
                          {tienda?.estado || 'Activo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 text-xs font-bold text-slate-500">
                    Aislamiento de Sesión Activa OK
                  </div>
                </div>
              </div>

              {/* Panel Resumen de Personal Asignado a la Sucursal Activa */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-azul/10 text-azul flex items-center justify-center font-bold">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="titular text-lg text-tinta">
                        Equipo Asignado a esta Sucursal
                      </h4>
                      <p className="text-xs font-bold text-slate-500">
                        {usuarios.length} {usuarios.length === 1 ? 'colaborador activo' : 'colaboradores activos'} en {tienda?.nombre_establecimiento || 'esta sede'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/registro-tendero')}
                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-menu hover:bg-azul text-white text-xs font-bold shadow-md transition-colors self-start sm:self-auto active:scale-95"
                  >
                    Gestionar en Colaboradores <ArrowRight size={14} />
                  </button>
                </div>

                {usuarios.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-600 font-bold text-sm">No hay colaboradores vinculados directamente a esta sucursal</p>
                    <p className="text-slate-500 text-xs mt-1">Puedes registrar cajeros y tenderos para esta sede desde el módulo de Colaboradores.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {usuarios.map((u, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-azul/30 hover:bg-white hover:shadow-md transition-all duration-200 flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base shadow-sm shrink-0 ${u.genero === 'Femenino' ? 'bg-peligro-suave text-peligro' : 'bg-azul/10 text-azul'}`}>
                          {(u.nombres || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-tinta text-sm font-bold tracking-tight truncate" title={u.nombres}>{u.nombres}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {u.rol}
                            </span>
                            <span className="text-xs text-azul font-bold truncate">@{u.usuario}</span>
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
        <div className="bg-white p-12 rounded-2xl text-center shadow-lg border border-slate-100 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="mb-2 text-slate-500"><Store size={56} /></div>
          <h3 className="titular text-2xl text-tinta">Perfil Inexistente</h3>
          <p className="text-slate-500 font-medium max-w-md mx-auto">No se encontró información de la sucursal vinculada a esta sesión corporativa de StockPilot.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
          <div>
            <h2 className="titular text-2xl sm:text-3xl md:text-4xl text-tinta">Mi Tienda</h2>
            <p className="text-slate-500 font-bold text-xs mt-1">Centro de Gestión Comercial y Usuarios</p>
          </div>
        </div>

        {/* Tarjeta Principal Tienda */}
        <div className="bg-white p-4 sm:p-6 lg:p-10 rounded-2xl sm:rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-shadow duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-azul/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 transition-transform duration-700 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-5 md:pb-8 mb-5 md:mb-8 gap-4 md:gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-azul text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
                  <Store size={36} />
                </div>
                <div>
                  <h3 className="titular text-xl sm:text-2xl lg:text-4xl text-tinta mb-1">
                    {tienda.nombre_establecimiento}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-2xl text-xs font-bold uppercase tracking-wide border bg-emerald-50 text-exito border-exito-suave">
                      <span className="w-1.5 h-1.5 rounded-full mr-2 bg-emerald-500"></span>
                      ACTIVA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid de Información Tienda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-azul/30 hover:bg-azul/10 transition-colors">
                <h4 className="font-bold flex items-center gap-3 text-tinta text-xs border-b border-white pb-3 mb-4">
                  <span className="p-2 bg-azul/10 text-azul rounded-lg"><ClipboardList size={18} /></span> IDENTIDAD COMERCIAL
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500">ID Sistema</p>
                    <p className="text-sm font-bold text-tinta">{tienda.id_tienda}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">NIT / Documento</p>
                    <p className="text-sm font-bold text-tinta">{tienda.documento || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">Razón Social</p>
                    <p className="text-sm font-bold text-tinta">{tienda.razon_social || 'No especificada'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-azul/30 hover:bg-azul/10 transition-colors">
                <h4 className="font-bold flex items-center gap-3 text-tinta text-xs border-b border-white pb-3 mb-4">
                  <span className="p-2 bg-azul/10 text-azul rounded-lg"><Phone size={18} /></span> CONTACTO DIRECTO
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Móvil Principal</p>
                    <p className="text-sm font-bold text-tinta">{tienda.celular || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">Dirección Física</p>
                    <p className="text-sm font-bold text-tinta">{tienda.direccion}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">Ciudad Sede</p>
                    <p className="text-sm font-bold text-tinta">{tienda.ciudad || 'No especificada'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-4 hover:border-azul/30 hover:bg-azul/10 transition-colors">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm text-slate-500">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1 text-center">Fecha de Apertura</p>
                  <p className="text-xl font-bold text-azul">{formatearFecha(tienda.fecha_creacion || tienda.anio_creacion)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <h3 className="titular text-2xl text-tinta mb-6 pl-2 border-l-4 border-azul">
            Personal Registrado
          </h3>
          {usuarios.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center shadow-sm">
               <p className="text-slate-500 font-bold">Aún no hay usuarios o colaboradores vinculados a esta sucursal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usuarios.map((u, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-lg hover:border-azul/30 transition-colors transition-shadow transition-transform duration-300 group flex items-start gap-5">
                  <div className="w-16 h-16 bg-azul/10 text-azul rounded-2xl flex items-center justify-center font-bold text-2xl border border-azul/30 shrink-0 group-hover:bg-azul-hondo group-hover:text-white transition-colors">
                     {(u.nombres || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-tinta text-lg font-bold truncate mb-1" title={u.nombres}>{u.nombres}</p>
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold mb-3">
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
    <div className="animate-fade-in pb-12">
      
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse">
          <div className="w-16 h-16 border-4 border-azul/30 border-t-azul rounded-full animate-spin mb-4"></div>
          <p className="text-xs font-bold text-slate-500">Sincronizando con matriz corporativa...</p>
        </div>
      ) : user?.rol === 'Administrador' ? renderAdminView() : renderTenderoView()}

      {/* Modal Editar / Crear Tienda */}
      {(editModalOpen || createModalOpen) && (
        <div className="fixed inset-0 bg-tinta/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[700px] shadow-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-azul/10 text-azul rounded-full flex items-center justify-center">
                   {createModalOpen ? <Plus size={20} /> : <Pencil size={20} />}
                 </div>
                 <div>
                   <h3 className="titular text-2xl text-tinta">
                     {createModalOpen ? 'Nueva Sucursal' : 'Modificar Perfil'}
                   </h3>
                   <p className="text-xs font-bold text-slate-500">
                     {createModalOpen ? 'Expansión de negocio' : 'Actualización de datos maestros'}
                   </p>
                 </div>
              </div>
              <button onClick={() => { setEditModalOpen(false); setCreateModalOpen(false); }} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors shadow-sm text-xl font-bold">&times;</button>
            </div>

            {/* Cuerpo Scroll Modal */}
            <form onSubmit={submitTienda} className="overflow-y-auto p-6 lg:p-8 custom-scrollbar-hidden flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="nombre_establecimiento" className="block text-xs font-semibold text-slate-600 pl-1">Nombre Comercial <span className="text-peligro text-sm">*</span></label>
                  <input id="nombre_establecimiento" required name="nombre_establecimiento" value={formData.nombre_establecimiento} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="Ej. Tienda Central..." />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="razon_social" className="block text-xs font-semibold text-slate-600 pl-1">Razón Social</label>
                  <input id="razon_social" name="razon_social" value={formData.razon_social} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="Ej. Mi Tienda S.A.S" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="documento" className="block text-xs font-semibold text-slate-600 pl-1">NIT / ID Tributario</label>
                  <input id="documento" name="documento" value={formData.documento} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="Ej. 900.123.456-7" />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                   <h4 className="font-bold text-xs text-azul mb-4 flex items-center gap-1"><MapPin size={12} /> Datos de Ubicación</h4>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="direccion" className="block text-xs font-semibold text-slate-600 pl-1">Dirección Física <span className="text-peligro text-sm">*</span></label>
                  <input id="direccion" required name="direccion" value={formData.direccion} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="Avenida Siempre Viva 123..." />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ciudad" className="block text-xs font-semibold text-slate-600 pl-1">Ciudad Sede</label>
                  <input id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="Requerido para logística" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="celular" className="block text-xs font-semibold text-slate-600 pl-1">Celular / Teléfono</label>
                  <input id="celular" name="celular" value={formData.celular} onChange={handleInputChange} type="tel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="+57 300 000 0000" />
                </div>

              </div>
              
              {/* Footer Modal */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 pb-2">
                <button type="button" onClick={() => { setEditModalOpen(false); setCreateModalOpen(false); }} className="px-8 py-4 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200 transition-colors">
                  Descartar
                </button>
                <button type="submit" disabled={editLoading} className="px-8 py-4 rounded-lg bg-azul text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-azul-hondo transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50">
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
