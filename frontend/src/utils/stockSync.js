/**
 * @file stockSync.js
 * @description Utilidad para la sincronización de datos entre pestañas y componentes.
 * Utiliza BroadcastChannel para notificar cambios en el inventario, ventas y productos.
 */

const SYNC_CHANNEL_NAME = 'stockpilot_sync_channel';

// Crear el canal de transmisión
const syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);

/**
 * Tipos de eventos soportados para la sincronización.
 */
export const SYNC_EVENTS = {
  STOCK_UPDATED: 'STOCK_UPDATED',     // Cuando se agrega stock manualmente
  SALE_COMPLETED: 'SALE_COMPLETED',   // Al registrar una venta exitosa
  PRODUCT_MODIFIED: 'PRODUCT_MODIFIED', // Edición o cambio de estado de producto
  STRATEGY_APPLIED: 'STRATEGY_APPLIED'  // Cuando se aplica una estrategia de IA
};

/**
 * Emite un evento de sincronización a todas las pestañas abiertas.
 * @param {string} type - Tipo de evento (usar SYNC_EVENTS)
 * @param {Object} data - Datos adicionales opcionales
 */
export const emitSyncEvent = (type, data = {}) => {
  console.log(`[Sync] Emitted: ${type}`, data);
  syncChannel.postMessage({ type, data, timestamp: Date.now() });
  
  // También emitir localmente para componentes en la misma pestaña
  const localEvent = new CustomEvent('stockpilot-local-sync', { 
    detail: { type, data } 
  });
  window.dispatchEvent(localEvent);
};

/**
 * Hook u opción para suscribirse a cambios.
 * @param {Function} callback - Función a ejecutar cuando ocurra un evento
 * @returns {Function} Función para desuscribirse
 */
export const subscribeToSync = (callback) => {
  const handleMessage = (event) => {
    callback(event.data);
  };

  const handleLocal = (event) => {
    callback(event.detail);
  };

  syncChannel.addEventListener('message', handleMessage);
  window.addEventListener('stockpilot-local-sync', handleLocal);

  // Devolver función de limpieza
  return () => {
    syncChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('stockpilot-local-sync', handleLocal);
  };
};
