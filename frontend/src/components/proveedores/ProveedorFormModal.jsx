import { createPortal } from 'react-dom';

const ProveedorFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  loading,
  formData,
  setFormData
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-tinta/60 backdrop-blur-md" role="presentation" aria-hidden="true" onClick={onClose}></div>
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-20 animate-scale-in border border-slate-100 overflow-hidden">
         <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-2xl font-black text-tinta tracking-tight uppercase italic">
              {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h3>
            <button onClick={onClose} className="text-2xl text-slate-400 hover:text-rose-500 transition-colors">&times;</button>
         </div>
         
         <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-5">
            <div className="space-y-1">
              <label htmlFor="input_nombre_empresa" className="text-xs font-semibold text-slate-600 ml-1">Nombre Comercial</label>
              <input id="input_nombre_empresa" required type="text" value={formData.nombre_empresa} onChange={e => setFormData({...formData, nombre_empresa: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-tinta outline-none focus:border-azul" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label htmlFor="input_contacto_principal" className="text-xs font-semibold text-slate-600 ml-1">Contacto Principal</label>
                    <input id="input_contacto_principal" required type="text" value={formData.contacto_principal} onChange={e => setFormData({...formData, contacto_principal: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-tinta outline-none focus:border-azul" />
                </div>
                <div className="space-y-1">
                    <label htmlFor="input_telefono" className="text-xs font-semibold text-slate-600 ml-1">Teléfono</label>
                    <input id="input_telefono" type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-tinta outline-none focus:border-azul" />
                </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="input_email" className="text-xs font-semibold text-slate-600 ml-1">Email</label>
              <input id="input_email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-tinta outline-none focus:border-azul" />
            </div>
            <div className="space-y-1">
              <label htmlFor="input_direccion" className="text-xs font-semibold text-slate-600 ml-1">Dirección Física</label>
              <input id="input_direccion" type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-tinta outline-none focus:border-azul" />
            </div>
            
            <button 
              disabled={loading}
              className="w-full py-4 bg-azul hover:bg-azul-hondo text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-colors transition-shadow animate-bounce-in mt-4"
            >
              {loading ? 'Procesando...' : (isEditing ? 'Actualizar Datos' : 'Registrar Proveedor')}
            </button>
         </form>
      </div>
    </div>,
    document.body
  );
};

export default ProveedorFormModal;
