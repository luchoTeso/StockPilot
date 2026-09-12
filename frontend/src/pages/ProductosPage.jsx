import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Plus, UploadCloud, ScanBarcode } from 'lucide-react';

import { useProductosPage } from '../hooks/useProductosPage';
import CustomSelect from '../components/CustomSelect';
import CameraScannerModal from '../components/CameraScannerModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

import ProductTable from '../components/productos/ProductTable';
import ProductFormModal from '../components/productos/ProductFormModal';

const ProductosPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const {
    isAdmin, loading, productos, categorias, alert, setAlert,
    filtroTexto, setFiltroTexto, filtroCategoria, setFiltroCategoria, filtroEstado, setFiltroEstado,
    uploadLoading, handleFileUpload,
    cameraScannerOpen, setCameraScannerOpen, handleBarcodeScan,
    modalOpen, editMode, formLoading, formData, proveedores, handleOpenModal, handleCloseModal, handleSubmitProducto,
    toggleModalOpen, setToggleModalOpen, toggleProducto, setToggleProducto, toggleLoading, submitToggleEstado,
    linkModalOpen, setLinkModalOpen, linkBarcodeCode, linkLoading, submitLinkBarcode, openNewProductWithBarcode,
    eliminarModalOpen, setEliminarModalOpen, eliminarProductoSel, setEliminarProductoSel, eliminarLoading, submitEliminar
  } = useProductosPage();

  return (
    <div className="animate-fade-in pb-12 space-y-8 font-outfit">
      {/* Alerta Global Premium */}
      {alert.show && (
        <button 
          type="button"
          onClick={() => navigate('/alertas')}
          className={`w-full text-left group relative flex flex-col md:flex-row items-center gap-6 p-8 rounded-[2.5rem] mb-10 shadow-2xl border backdrop-blur-xl animate-fade-in cursor-pointer hover:shadow-indigo-500/10 transition-colors transition-transform transition-shadow transform hover:-translate-y-1 outline-none focus:ring-4 focus:ring-indigo-500/50 ${alert.isCritical ? 'bg-rose-50/80 border-rose-100 text-rose-800' : 'bg-amber-50/80 border-amber-100 text-amber-800'}`}
        >
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg border-2 ${alert.isCritical ? 'bg-rose-100 border-white text-rose-600 animate-bounce' : 'bg-amber-100 border-white text-amber-600 rotate-12'}`}>
            {alert.isCritical ? <AlertCircle size={32} /> : <AlertTriangle size={32} />}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-black uppercase tracking-tighter italic mb-1">{alert.title}</h4>
            <p className="font-bold text-sm opacity-80 leading-relaxed max-w-2xl">{alert.message}</p>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden md:inline-block text-[10px] font-black uppercase tracking-[0.2em] bg-white/50 px-4 py-2 rounded-xl">Revisar Ahora →</span>
             <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setAlert({ ...alert, show: false }); }} 
                className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-black/5 transition-colors transition-transform font-black text-2xl hover:scale-110 active:scale-90 outline-none focus:ring-2 focus:ring-indigo-500"
                title="Cerrar"
                aria-label="Cerrar alerta"
             >
                &times;
             </button>
          </div>
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6 md:pb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Tus Productos</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Listado completo de lo que vendes</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <input 
                type="file" 
                accept=".csv, .xlsx" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={(e) => handleFileUpload(e.target.files[0])} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadLoading}
                className={`bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors transition-transform transition-shadow flex items-center gap-2 active:scale-95 ${uploadLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <UploadCloud size={14} /> {uploadLoading ? 'Cargando...' : 'Importar'}
              </button>
              <button onClick={() => setCameraScannerOpen(true)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors transition-transform transition-shadow flex items-center gap-2 active:scale-95 hidden sm:flex">
                <ScanBarcode size={14} /> Escanear
              </button>
              <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-colors transition-transform transition-shadow flex items-center gap-2 active:scale-95">
                <Plus size={14} /> Registrar Producto
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Bar (Filtros) */}
      <div className="bg-white p-3 sm:p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <input type="text" aria-label="Buscar código o nombre" placeholder="Buscar código o nombre..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} className="w-full sm:flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none" />
          <CustomSelect
            value={filtroCategoria}
            onChange={val => setFiltroCategoria(val)}
            placeholder="Todas las categorías"
            options={[
              { value: '', label: 'Todas las categorías' },
              ...categorias.map(c => ({ value: c, label: c }))
            ]}
            className="w-full sm:flex-1 sm:min-w-[160px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
          />
          <CustomSelect
            value={filtroEstado}
            onChange={val => setFiltroEstado(val)}
            placeholder="Estado: Todos"
            options={[
              { value: '', label: 'Estado: Todos' },
              { value: 'Disponible', label: 'Operativo' },
              { value: 'Inactivo', label: 'Suspendido' }
            ]}
            className="w-full sm:flex-1 sm:min-w-[140px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
          />
      </div>

      <ProductTable
        productos={productos}
        loading={loading}
        isAdmin={isAdmin}
        onEdit={(p) => handleOpenModal(p)}
        onToggleStatus={(p) => { setToggleProducto(p); setToggleModalOpen(true); }}
        onDelete={(p) => { setEliminarProductoSel(p); setEliminarModalOpen(true); }}
      />

      <ProductFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitProducto}
        initialData={formData}
        editMode={editMode}
        isAdmin={isAdmin}
        proveedores={proveedores}
        loading={formLoading}
        categorias={categorias}
        productos={productos}
      />

      {/* Modal de Vinculación de Código de Barras */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setLinkModalOpen(false)}></div>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative z-10 animate-scale-in">
             <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mb-4">Código Escaneado</h3>
             <p className="text-slate-600 font-bold mb-6">Hemos detectado el código <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono">{linkBarcodeCode}</span>, pero no está registrado.</p>
             
             <div className="space-y-4">
                <button onClick={() => openNewProductWithBarcode(linkBarcodeCode)} className="w-full text-left p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 transition-colors group">
                   <h4 className="font-black text-indigo-700 uppercase tracking-widest text-sm mb-1 group-hover:text-indigo-800">Crear Producto Nuevo</h4>
                   <p className="text-xs font-bold text-indigo-500">Usar este EAN para registrar un artículo que no existe en el sistema.</p>
                </button>
                
                <div className="relative flex items-center py-2">
                   <div className="flex-grow border-t border-slate-200"></div>
                   <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-black uppercase tracking-widest">O Vincular</span>
                   <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Selecciona un producto existente</label>
                   <CustomSelect
                      value=""
                      onChange={(val) => {
                         if(val) submitLinkBarcode(val, linkBarcodeCode);
                      }}
                      placeholder="Buscar producto..."
                      options={[
                        { value: '', label: 'Seleccione para vincular...' },
                        ...productos.map(p => ({ value: p.id_producto, label: `${p.nombre_producto} (SKU: ${p.codigo})` }))
                      ]}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
                   />
                   <p className="text-xs text-slate-500 mt-2 font-bold leading-tight">Asignará el EAN escaneado al producto seleccionado para futuros escaneos.</p>
                </div>
             </div>
             
             <button onClick={() => setLinkModalOpen(false)} className="w-full mt-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={toggleModalOpen}
        title="Estado del Producto"
        message={<>Vas a cambiar a estado <strong className={`uppercase ${toggleProducto?.estado === 'Disponible' ? 'text-amber-500' : 'text-emerald-500'}`}>{toggleProducto?.estado === 'Disponible' ? 'Pausado' : 'Activo'}</strong> el siguiente producto:</>}
        highlightText={toggleProducto?.nombre_producto}
        highlightColor={toggleProducto?.estado === 'Disponible' ? 'amber' : 'emerald'}
        confirmText={toggleProducto?.estado === 'Disponible' ? 'Confirmar Pausa' : 'Confirmar Reactivación'}
        onConfirm={submitToggleEstado}
        onCancel={() => setToggleModalOpen(false)}
        loading={toggleLoading}
        icon={toggleProducto?.estado === 'Disponible' ? 'pause' : 'check'}
      />

      <ConfirmDialog
        isOpen={eliminarModalOpen}
        title="Eliminar Producto"
        message={<>Vas a eliminar permanentemente este producto. Esta acción <span className="text-rose-600 font-black uppercase underline decoration-2 underline-offset-2">no se puede deshacer</span>.</>}
        highlightText={eliminarProductoSel?.nombre_producto}
        highlightColor="rose"
        confirmText="Borrar Definitivamente"
        onConfirm={submitEliminar}
        onCancel={() => setEliminarModalOpen(false)}
        loading={eliminarLoading}
        icon="trash"
      />

      <CameraScannerModal 
        isOpen={cameraScannerOpen} 
        onClose={() => setCameraScannerOpen(false)} 
        onScan={handleBarcodeScan} 
      />
    </div>
  );
};

export default ProductosPage;
