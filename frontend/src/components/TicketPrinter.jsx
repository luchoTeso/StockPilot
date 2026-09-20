import React, { forwardRef, useState } from 'react';

const TicketPrinter = forwardRef(({ ticketData }, ref) => {
  // Respaldo si el ticket no trae fecha: se fija una sola vez (Date.now() en el render no es puro).
  const [fechaRespaldo] = useState(() => Date.now());
  if (!ticketData) return null;

  const { items, total, id_venta, metodo_pago, efectivo_recibido, cambio_devuelto, fecha } = ticketData;
  const storeName = "STOCK PILOT (Demo)"; // Esto idealmente viene del backend

  return (
    <div style={{ display: 'none' }}>
      <div 
        ref={ref}
        style={{
          width: '80mm', // Ancho estándar de impresora térmica POS
          padding: '4mm',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: 'black',
          background: 'white'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{storeName}</h2>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>Ticket de Venta #{String(id_venta).padStart(6, '0')}</p>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>{new Date(fecha || fechaRespaldo).toLocaleString('es-CO')}</p>
        </div>

        <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', margin: '10px 0', padding: '5px 0' }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ width: '15%' }}>CANT</th>
                <th style={{ width: '55%' }}>ARTÍCULO</th>
                <th style={{ width: '30%', textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td style={{ verticalAlign: 'top' }}>{item.cantidadCart || item.cantidadVendida}x</td>
                  <td style={{ verticalAlign: 'top', wordBreak: 'break-all' }}>{item.nombre_producto}</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                    ${Number((item.precio || item.precio_unitario || 0) * (item.cantidadCart || item.cantidadVendida)).toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>
            <span>TOTAL:</span>
            <span>${Number(total).toLocaleString('es-CO')}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>MÉTODO DE PAGO:</span>
            <span style={{ textTransform: 'uppercase' }}>{metodo_pago}</span>
          </div>
          
          {metodo_pago === 'Efectivo' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>EFECTIVO RECIBIDO:</span>
                <span>${Number(efectivo_recibido || total).toLocaleString('es-CO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>CAMBIO:</span>
                <span>${Number(cambio_devuelto || 0).toLocaleString('es-CO')}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
          <p style={{ margin: '2px 0' }}>¡Gracias por su compra!</p>
          <p style={{ margin: '2px 0' }}>Vuelva pronto.</p>
        </div>
      </div>
    </div>
  );
});

export default TicketPrinter;
