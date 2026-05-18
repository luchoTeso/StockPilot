import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';
import { Clock, Save, Plus, BarChart2, Search, Download, Pencil, Trash2, AlertTriangle, FileText, Mail } from 'lucide-react';

const ReportesPage = () => {
  const toast = useToast();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form (Crear/Editar)
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: '', titulo: '', tipo: '', fecha_reporte: '', creador: '', descripcion: '',
    fecha_inicio: '', fecha_fin: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros de tabla
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: null, type: 'warning' });

  const openModal = (title, message, onConfirm, type = 'warning') => {
    setModalConfig({ title, message, onConfirm, type });
    setModalOpen(true);
  };

  useEffect(() => {
    cargarUsuarioYReportes();
  }, []);

  const cargarUsuarioYReportes = async () => {
    setLoading(true);
    try {
      const { data: userData } = await axios.get('/api/session-info');
      if (userData) {
        setIsAdmin(userData.rol === 'Administrador');
        if (!formData.creador) {
          setFormData(prev => ({ ...prev, creador: userData.nombres }));
        }
      }
      const { data } = await axios.get('/api/reportes');
      setReportes(data);
    } catch (err) {
      console.error('Error', err);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '---';
    // Fix: Using native split prevents JS Date object timezone drift (-1 day issue)
    const rawDate = fechaStr.split('T')[0];
    const [year, month, day] = rawDate.split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
    return rawDate;
  };

  const getColorTipo = (tipo) => {
    const colores = {
      'Inventario': '#3498db',
      'Ventas': '#2ecc71',
      'Financiero': '#e74c3c',
      'Operativo': '#f39c12',
      'Otro': '#9b59b6'
    };
    return colores[tipo] || '#95a5a6';
  };

  const handleEditClick = (reporte) => {
    setEditMode(true);
    // Para el input date el formato debe ser YYYY-MM-DD
    const fechaFormat = reporte.fecha_reporte ? reporte.fecha_reporte.split('T')[0] : '';
    setFormData({
      id: reporte.id,
      titulo: reporte.titulo,
      tipo: reporte.tipo,
      fecha_reporte: fechaFormat,
      creador: reporte.creador,
      descripcion: reporte.descripcion,
      fecha_inicio: reporte.fecha_inicio || '',
      fecha_fin: reporte.fecha_fin || ''
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData(prev => ({
      ...prev, id: '', titulo: '', tipo: '', fecha_reporte: '', descripcion: '', fecha_inicio: '', fecha_fin: ''
    }));
  };

  const handleSubmit = async (e, forceSave = false) => {
    e?.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fecha_reporte: formData.fecha_reporte,
        creador: formData.creador,
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        force: forceSave
      };

      if (editMode) {
        const { data } = await axios.put(`/api/reportes/${formData.id}`, payload);
        toast.success(data.message || 'Reporte actualizado');
        handleCancelEdit();
      } else {
        const { data } = await axios.post('/api/reportes', payload);
        toast.success(data.message || 'Reporte creado');
        setFormData(prev => ({
          ...prev, titulo: '', tipo: '', fecha_reporte: '', descripcion: '', fecha_inicio: '', fecha_fin: ''
        }));
      }
      cargarUsuarioYReportes();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.requireConfirmation) {
        setIsSubmitting(false);
        openModal(
          'Reporte Sin Datos',
          err.response.data.error,
          () => handleSubmit(null, true),
          'warning'
        );
      } else {
        toast.error(`${err.response?.data?.error || err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarReporte = (id) => {
    openModal(
      'Eliminar Reporte',
      '¿Estás seguro de que deseas eliminar este reporte de forma permanente? Esta acción no se puede deshacer.',
      async () => {
        try {
          const { data } = await axios.delete(`/api/reportes/${id}`);
          toast.success(data.message || 'Reporte eliminado');
          cargarUsuarioYReportes();
        } catch (err) {
          toast.error('Error al eliminar el reporte');
        }
      },
      'danger'
    );
  };

  const descargarReporteExcel = async (r) => {
    try {
      const resp = await axios.get(`/api/reportes/download/${r.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_${r.tipo}_${r.fecha_reporte}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Descarga de Excel iniciada');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorParse = JSON.parse(reader.result);
            toast.error(errorParse.error || 'Error al descargar el archivo');
          } catch (e) {
            toast.error('Error interno procesando la descarga.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        toast.error('Error de conexión o fallo crítico al descargar.');
      }
    }
  };

  const descargarReporteMerma = async () => {
    try {
      toast.success('Generando Auditoría de Merma...');
      const resp = await axios.get('/api/reportes/merma/pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Auditoria_Merma_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Auditoría PDF descargada correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF de Merma');
    }
  };

  const filteredReportes = useMemo(() => {
    return reportes.filter(r => {
      const ms = r.titulo?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
                 r.descripcion?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
                 r.creador?.toLowerCase().includes(filtroBusqueda.toLowerCase());
      const mt = filtroTipo === '' || r.tipo === filtroTipo;
      return ms && mt;
    });
  }, [reportes, filtroBusqueda, filtroTipo]);

  return (
    <div className="animate-fade-in pb-12 font-outfit">
      
      {/* Header Premium (Floating Style) */}
      <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl shadow-indigo-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 mt-2 animate-fade-in">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Centro de <span className="text-indigo-600">Reportes</span></h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Exportación y Análisis de Datos del Negocio
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white/60 px-6 py-3 rounded-2xl border border-white/40 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Archivos totales</span>
              <span className="text-xl font-black text-slate-800">{reportes.length} <span className="text-[10px] text-indigo-500 italic">docs</span></span>
           </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
        
        {/* Formulario */}
        {isAdmin && (
          <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 lg:sticky lg:top-6 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 lg:p-8 overflow-y-auto scrollbar-hide flex-1">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase mb-6 pb-4 border-b border-slate-100 shrink-0">
                {editMode ? 'Editar Reporte' : 'Generar Nuevo Reporte'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Nombre del Reporte <span className="text-rose-500 text-sm">*</span></label>
                  <input required type="text" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Ej. Balance Mensual..."/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Categoría <span className="text-rose-500 text-sm">*</span></label>
                    <div className="form-control-premium">
                      <CustomSelect 
                        value={formData.tipo} 
                        onChange={v => setFormData({...formData, tipo: v})} 
                        options={[
                          { value: 'Inventario', label: 'Inventario' },
                          { value: 'Ventas', label: 'Ventas' },
                          { value: 'Financiero', label: 'Financiero' },
                          { value: 'Operativo', label: 'Operativo' },
                          { value: 'Otro', label: 'Otro' }
                        ]} 
                        placeholder="Tipo..." 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Fecha del Reporte <span className="text-rose-500 text-sm">*</span></label>
                    <CustomDatePicker 
                      value={formData.fecha_reporte} 
                      onChange={v => setFormData({...formData, fecha_reporte: v})} 
                      placeholder="Fecha de emisión..." 
                      align="right-flyout"
                    />
                  </div>
                </div>

                {['Ventas', 'Financiero', 'Operativo', 'Inventario'].includes(formData.tipo) && (
                  <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-[2rem] space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pl-1 mb-2 text-center flex items-center justify-center gap-1"><Clock size={12} /> Periodo Evaluado</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1 mb-1">Corte Inicial</label>
                        <CustomDatePicker 
                          value={formData.fecha_inicio} 
                          onChange={v => setFormData({...formData, fecha_inicio: v})} 
                          placeholder="Desde..." 
                          align="right-flyout"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1 mb-1">Corte Final</label>
                        <CustomDatePicker 
                          value={formData.fecha_fin} 
                          onChange={v => setFormData({...formData, fecha_fin: v})} 
                          placeholder="Hasta..." 
                          align="right-flyout"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Responsable <span className="text-rose-500 text-sm">*</span></label>
                  <input required type="text" value={formData.creador} onChange={e => setFormData({...formData, creador: e.target.value})} className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-500" readOnly/>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Conclusiones o Notas</label>
                  <textarea required rows="3" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:border-indigo-500 outline-none text-slate-800 resize-none hover:bg-white transition-colors" placeholder="Añade detalles relevantes o un resumen aquí..."></textarea>
                </div>

                <div className="flex flex-col gap-3 pt-4 pb-2">
                  <button type="submit" disabled={isSubmitting} className={`w-full p-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${editMode ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}>
                    {editMode ? <Save size={14} /> : <Plus size={14} />} {isSubmitting ? 'GUARDANDO...' : (editMode ? 'ACTUALIZAR REPORTE' : 'CREAR REPORTE')}
                  </button>
                  {editMode && (
                    <button type="button" onClick={handleCancelEdit} className="w-full p-4 rounded-2xl text-slate-500 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-[0.2em] transition-colors">
                      CANCELAR
                    </button>
                  )}
                </div>
              </form>
            </div>
            </div>

            {/* Nuevo: Módulo de Auditoría de Mermas (Estética Armonizada) */}
            <div className="mt-8 bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden group">
               {/* Elemento decorativo sutil */}
               <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-all opacity-50"></div>
               
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shadow-sm border border-indigo-100 text-indigo-600">
                      <FileText size={20} />
                    </div>
                    <h4 className="text-slate-800 font-black text-lg tracking-tighter italic uppercase">Auditoría de Merma</h4>
                  </div>
                  
                  <p className="text-slate-500 text-[11px] font-medium leading-relaxed mb-6 pl-1">
                    Genera un reporte oficial en PDF con todos los productos vencidos y el cálculo de impacto financiero total para tu negocio.
                  </p>
                  
                  <button 
                    onClick={descargarReporteMerma}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-3"
                  >
                    DESCARGAR REPORTE (PDF)
                  </button>

                  {/* Botón de Envío de Resumen Manual */}
                  <button 
                    onClick={async () => {
                      try {
                        toast.success('Enviando resumen semanal...');
                        const resp = await axios.post('/api/alertas/test-summary');
                        toast.success(resp.data.mensaje || '¡Resumen enviado exitosamente!');
                      } catch (err) {
                        console.error(err);
                        toast.error(err.response?.data?.error || 'Error al enviar el resumen. Revisa la configuración SMTP.');
                      }
                    }}
                    className="w-full py-3 mt-3 bg-white text-indigo-600 border-2 border-indigo-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-400 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Mail size={14} /> ENVIAR RESUMEN AHORA
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Tabla Analítica */}
        <div className={isAdmin ? "lg:col-span-2 space-y-6" : "lg:col-span-1 space-y-6"}>
          
          {/* Cabecera y Filtros de Tabla */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <BarChart2 size={18} /> Archivos Generados
             </h3>
             <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
               <div className="w-full sm:w-48 z-10 form-control-premium text-sm">
                 <CustomSelect 
                    value={filtroTipo} 
                    onChange={v => setFiltroTipo(v)} 
                    options={[
                      { value: '', label: 'Todas las Categorías' },
                      { value: 'Inventario', label: 'Inventario' },
                      { value: 'Ventas', label: 'Ventas' },
                      { value: 'Financiero', label: 'Financiero' },
                      { value: 'Operativo', label: 'Operativo' },
                      { value: 'Otro', label: 'Otro' }
                    ]} 
                 />
               </div>
               <div className="relative w-full sm:w-64">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Search size={16} /></div>
                 <input 
                   type="text" 
                   placeholder="Buscar reporte..." 
                   value={filtroBusqueda} 
                   onChange={e => setFiltroBusqueda(e.target.value)} 
                   className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800 transition-colors"
                 />
               </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                    <th className="p-6 pl-8">Nombre y Detalles</th>
                    <th className="p-6">Categoría</th>
                    <th className="p-6">Fecha</th>
                    <th className="p-6">Responsable</th>
                    <th className="p-6 pr-8 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Cargando reportes guardados...</td></tr>
                  ) : filteredReportes.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Existen Registros para Este Filtro</td></tr>
                  ) : (
                    filteredReportes.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-6 pl-8">
                          <strong className="block text-lg font-black text-slate-800 tracking-tighter mb-1">{r.titulo}</strong>
                          <span className="text-slate-500 text-xs italic truncate max-w-[250px] inline-block font-medium" title={r.descripcion}>{r.descripcion}</span>
                        </td>
                        <td className="p-6">
                          <span 
                            className="text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-sm uppercase tracking-widest inline-block" 
                            style={{ backgroundColor: getColorTipo(r.tipo) }}
                          >
                            {r.tipo}
                          </span>
                        </td>
                        <td className="p-6 text-slate-500 font-medium whitespace-nowrap italic">{formatearFecha(r.fecha_reporte)}</td>
                        <td className="p-6 text-slate-800 font-bold flex items-center gap-2 mt-4 lg:mt-0">
                           <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] text-slate-600 font-black shrink-0">
                              {(r.creador || '?')[0].toUpperCase()}
                           </div>
                           <span className="truncate max-w-[120px]" title={r.creador}>{r.creador}</span>
                        </td>
                        <td className="p-6 pr-8">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => descargarReporteExcel(r)} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 flex items-center justify-center transition-all hover:scale-105 hover:-translate-y-1 shadow-sm" title="Exportar XLSX">
                              <Download size={18} />
                            </button>
                            {isAdmin && (
                              <>
                                <button onClick={() => handleEditClick(r)} className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-100 flex items-center justify-center transition-all hover:scale-105 hover:-translate-y-1 shadow-sm" title="Editar Reporte">
                                  <Pencil size={18} />
                                </button>
                                <button onClick={() => eliminarReporte(r.id)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 flex items-center justify-center transition-all hover:scale-105 hover:-translate-y-1 shadow-sm" title="Eliminar Reporte">
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4 font-outfit">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden transform animate-scale-in border border-white">
            <div className={`p-8 text-center border-b ${modalConfig.type === 'danger' ? 'border-rose-100 bg-rose-50' : 'border-amber-100 bg-amber-50'}`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg ${modalConfig.type === 'danger' ? 'bg-rose-100 text-rose-600 shadow-rose-200' : 'bg-amber-100 text-amber-600 shadow-amber-200'}`}>
                 {modalConfig.type === 'danger' ? <Trash2 size={36} /> : <AlertTriangle size={36} />}
              </div>
              <h3 className={`text-2xl font-black tracking-tighter italic uppercase ${modalConfig.type === 'danger' ? 'text-rose-600' : 'text-amber-600'}`}>
                {modalConfig.title}
              </h3>
            </div>
            <div className="p-8">
              <p className="text-slate-500 text-center font-medium leading-relaxed">{modalConfig.message}</p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4 rounded-b-[2.5rem] border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-4 rounded-2xl text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
                className={`flex-1 px-4 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all hover:-translate-y-1 active:scale-95 ${
                  modalConfig.type === 'danger' 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesPage;
