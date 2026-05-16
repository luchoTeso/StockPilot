import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TiendasPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [tienda, setTienda] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Edición Tienda
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_establecimiento: '',
    direccion: '',
    documento: '',
    razon_social: '',
    celular: '',
    ciudad: ''
  });

  const cargarTienda = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/tienda');
      if (data.tienda) {
        setTienda(data.tienda);
        setUsuarios(data.usuarios || []);
      }
    } catch (err) {
      console.error('Error al cargar la tienda', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTienda();
  }, []);

  const abrirModalEdit = () => {
    setFormData({
      nombre_establecimiento: tienda.nombre_establecimiento || '',
      direccion: tienda.direccion || '',
      documento: tienda.documento || '',
      razon_social: tienda.razon_social || '',
      celular: tienda.celular || '',
      ciudad: tienda.ciudad || ''
    });
    setEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitEditTienda = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const { data } = await axios.put(`/api/tienda/update/${tienda.id_tienda}`, formData);
      if (data.success) {
        toast.success(data.message || 'Tienda actualizada correctamente');
        setTienda(data.tienda);
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error('Error editando tienda:', err);
      toast.error(err.response?.data?.error || 'Error al actualizar la tienda');
    } finally {
      setEditLoading(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '---';
    // Si la fecha es solo un año (ej. 2020), no podemos pasarla directo al constructor de Date de JS
    // porque lo interpreta como milisegundos desde 1970
    if (typeof fechaStr === 'number' || (typeof fechaStr === 'string' && fechaStr.length === 4 && !isNaN(fechaStr))) {
      return `Año ${fechaStr}`;
    }
    return new Date(fechaStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="animate-fade-in pb-12 font-outfit">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Mi Tienda</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Centro de Gestión Comercial y Usuarios</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando con matriz corporativa...</p>
        </div>
      ) : !tienda ? (
        <div className="bg-white p-12 rounded-[2.5rem] text-center shadow-xl border border-slate-100 flex flex-col items-center justify-center gap-4">
          <div className="text-6xl mb-2">🏪</div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">Perfil Inexistente</h3>
          <p className="text-slate-500 font-medium max-w-md mx-auto">No se encontró información de la sucursal vinculada a esta sesión corporativa de StockPilot.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Tarjeta Principal Tienda */}
          <div className="bg-white p-4 sm:p-6 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
            {/* Elemento Decorativo Fondo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-5 md:pb-8 mb-5 md:mb-8 gap-4 md:gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200 text-4xl shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
                    🏪
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

                {user?.rol === 'Administrador' && (
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 p-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                      onClick={abrirModalEdit}
                    >
                      <span>✏️</span> EDITAR PERFIL
                    </button>
                  </div>
                )}
              </div>

              {/* Grid de Información Tienda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                
                {/* Datos Generales */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                  <h4 className="flex items-center gap-3 text-slate-800 font-black text-xs uppercase tracking-widest border-b border-white pb-3 mb-4">
                    <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg text-lg">📋</span> IDENTIDAD COMERCIAL
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

                {/* Contacto */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                  <h4 className="flex items-center gap-3 text-slate-800 font-black text-xs uppercase tracking-widest border-b border-white pb-3 mb-4">
                    <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg text-lg">📞</span> CONTACTO DIRECTO
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

                {/* Fundación */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                  <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center text-3xl shadow-sm">
                    📅
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
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 group flex items-start gap-5">
                    
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
                            <span>✉️</span> <span className="truncate">{u.correo}</span>
                          </p>
                        )}
                        {u.celular && (
                          <p className="flex items-center gap-2 text-slate-500 font-medium">
                            <span>📱</span> {u.celular}
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
      )}

      {/* Modal Editar Tienda */}
      {editModalOpen && tienda && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-outfit">
          <div className="bg-white rounded-[2.5rem] w-full max-w-[700px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">✏️</div>
                 <div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">Modificar Perfil</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actualización de datos maestros</p>
                 </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors shadow-sm text-xl font-bold">&times;</button>
            </div>

            {/* Cuerpo Scroll Modal */}
            <form onSubmit={submitEditTienda} className="overflow-y-auto p-6 lg:p-8 custom-scrollbar-hidden flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre Comercial <span className="text-rose-500 text-sm">*</span></label>
                  <input required name="nombre_establecimiento" value={formData.nombre_establecimiento} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Ej. Tienda Central..." />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Razón Social</label>
                  <input name="razon_social" value={formData.razon_social} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Ej. Mi Tienda S.A.S" />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">NIT / ID Tributario</label>
                  <input name="documento" value={formData.documento} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Ej. 900.123.456-7" />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                   <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">📍 Datos de Ubicación</h4>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dirección Físca <span className="text-rose-500 text-sm">*</span></label>
                  <input required name="direccion" value={formData.direccion} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Avenida Siempre Viva 123..." />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ciudad Sede</label>
                  <input name="ciudad" value={formData.ciudad} onChange={handleInputChange} type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Requerido para logística" />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Celular / Teléfono</label>
                  <input name="celular" value={formData.celular} onChange={handleInputChange} type="tel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="+57 300 000 0000" />
                </div>

              </div>
              
              {/* Footer Modal */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 pb-2">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-8 py-4 rounded-2xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-colors">
                  Descartar
                </button>
                <button type="submit" disabled={editLoading} className="px-8 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                  {editLoading ? 'Sincronizando...' : 'Guadar Perfil 💾'}
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
