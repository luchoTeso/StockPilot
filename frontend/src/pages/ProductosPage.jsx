import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Plus, UploadCloud, ScanBarcode } from 'lucide-react';

import { useProductosPage } from '../hooks/useProductosPage';
import CustomSelect from '../components/CustomSelect';
import CameraScannerModal from '../components/CameraScannerModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

import ProductTable from '../components/productos/ProductTable';
import ProductFormModal from '../components/productos/ProductFormModal';
import VentaModal from '../components/productos/VentaModal';
import AgregarStockModal from '../components/productos/AgregarStockModal';

const ProductosPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const {
    isAdmin, loading, productos, categorias, alert, setAlert,
    filtroTexto, setFiltroTexto, filtroCategoria, setFiltroCategoria, filtroEstado, setFiltroEstado,
    uploadLoading, handleFileUpload,
    cameraScannerOpen, setCameraScannerOpen, handleBarcodeScan,
    modalOpen, editMode, formLoading, formData, proveedores, handleOpenModal, handleCloseModal, handleSubmitProducto,
    ventaModalOpen, setVentaModalOpen, ventaProducto, setVentaProducto, ventaLoading, submitVenta,
    stockModalOpen, setStockModalOpen, stockProducto, setStockProducto, stockLoading, submitAgregarStock,
    toggleModalOpen, setToggleModalOpen, toggleProducto, setToggleProducto, toggleLoading, submitToggleEstado,
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
        onSell={(p) => { setVentaProducto(p); setVentaModalOpen(true); }}
        onAddStock={(p) => { setStockProducto(p); setStockModalOpen(true); }}
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
      />

      <VentaModal
        isOpen={ventaModalOpen}
        onClose={() => setVentaModalOpen(false)}
        onSubmit={submitVenta}
        producto={ventaProducto}
        loading={ventaLoading}
      />

      <AgregarStockModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        onSubmit={submitAgregarStock}
        producto={stockProducto}
        loading={stockLoading}
      />

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
