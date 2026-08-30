import { Building2, Plus } from 'lucide-react';
import { useProveedoresPage } from '../hooks/useProveedoresPage';

import ProveedorGrid from '../components/proveedores/ProveedorGrid';
import ProveedorFormModal from '../components/proveedores/ProveedorFormModal';
import SmartOrderModal from '../components/proveedores/SmartOrderModal';
import OrdenesHistory from '../components/proveedores/OrdenesHistory';
import PaymentModal from '../components/proveedores/PaymentModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ProveedoresPage = () => {
  const {
    proveedores, loading,
    showOrderModal, setShowOrderModal, selectedSupplier,
    forecastData, smartCart, setSmartCart, riskEval, isForecastLoading, isConsultingAI, isSubmitting,
    ordenesHistory, loadingHistory, showHistoryDetail, setShowHistoryDetail, ordenDetail,
    showSupplierModal, setShowSupplierModal, supplierFormData, setSupplierFormData,
    isEditingSupplier, supplierLoading, supplierToDelete, setSupplierToDelete,
    isSendingEmail, emailMessage, setEmailMessage,
    showPaymentModal, setShowPaymentModal, paymentData, manualAmount, setManualAmount, isPaying,
    
    fetchOrderDetail, submitFinalOrder, handleSendToSupplier,
    handleRegisterPayment, confirmPayment, handleOpenSupplierModal, handleSaveSupplier,
    handleDeleteSupplier, handleOpenForecast, requestCopilot, handleToggleItem, handleEditQty, handleUpdateEstado
  } = useProveedoresPage();

  return (
    <div className="pb-32 space-y-8 animate-fade-in font-outfit">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner border border-indigo-200">
              <Building2 size={20} />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">Red de Proveedores</h1>
          </div>
          <p className="text-sm font-bold text-slate-400 max-w-xl">
            Gestiona tus compras apoyado en el Copiloto IA. Revisa qué productos necesitas pedir y genera tus órdenes de abastecimiento al instante.
          </p>
        </div>
        
        <button 
          onClick={() => handleOpenSupplierModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-colors transition-shadow transition-transform flex items-center gap-2 active:scale-95 z-20"
        >
          <Plus size={14} /> Registrar Proveedor
        </button>
      </div>

      <ProveedorGrid 
        proveedores={proveedores} 
        loading={loading} 
        onEdit={handleOpenSupplierModal} 
        onDelete={(p) => setSupplierToDelete(p)} 
        onForecast={handleOpenForecast} 
      />

      <SmartOrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        supplier={selectedSupplier}
        smartCart={smartCart}
        forecastData={forecastData}
        riskEval={riskEval}
        isForecastLoading={isForecastLoading}
        isConsultingAI={isConsultingAI}
        isSubmitting={isSubmitting}
        handleToggleItem={handleToggleItem}
        handleEditQty={handleEditQty}
        submitFinalOrder={submitFinalOrder}
        requestCopilot={requestCopilot}
        setSmartCart={setSmartCart}
      />

      <OrdenesHistory
        ordenesHistory={ordenesHistory}
        loadingHistory={loadingHistory}
        showHistoryDetail={showHistoryDetail}
        setShowHistoryDetail={setShowHistoryDetail}
        ordenDetail={ordenDetail}
        fetchOrderDetail={fetchOrderDetail}
        handleRegisterPayment={handleRegisterPayment}
        handleSendToSupplier={handleSendToSupplier}
        isSendingEmail={isSendingEmail}
        emailMessage={emailMessage}
        setEmailMessage={setEmailMessage}
        onUpdateEstado={handleUpdateEstado}
      />

      <ProveedorFormModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSubmit={handleSaveSupplier}
        isEditing={isEditingSupplier}
        loading={supplierLoading}
        formData={supplierFormData}
        setFormData={setSupplierFormData}
      />

      <ConfirmDialog
        isOpen={!!supplierToDelete}
        title="¿Confirmas la baja?"
        message={<>Vas a inhabilitar a <span className="text-rose-600">{supplierToDelete?.nombre_empresa}</span>. Se mantendrá el registro histórico pero no podrás vincularlo a nuevos productos.</>}
        highlightColor="rose"
        confirmText="Sí, inhabilitar ahora"
        cancelText="No, mantener activo"
        onConfirm={handleDeleteSupplier}
        onCancel={() => setSupplierToDelete(null)}
        loading={supplierLoading}
        icon="alert"
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={paymentData}
        manualAmount={manualAmount}
        setManualAmount={setManualAmount}
        isPaying={isPaying}
        confirmPayment={confirmPayment}
      />

    </div>
  );
};

export default ProveedoresPage;
