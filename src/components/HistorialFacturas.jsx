import { useState } from "react";

function HistorialFacturas() {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  // Datos simulados (Mock data)
  const [facturas, setFacturas] = useState([
    { 
      id: "2026-001", 
      fecha: "01/05/2026", 
      cliente: "García López, María", 
      alumno: "Hugo García", 
      total: 115.00, 
      estado: "Pagada",
      detalles: [
        { concepto: "Matrícula Anual", precio: 50.00 },
        { concepto: "Inglés B1 (Mensual) - Mayo", precio: 65.00 }
      ]
    },
    { 
      id: "2026-002", 
      fecha: "02/05/2026", 
      cliente: "Martínez, Carlos", 
      alumno: "Carlos Martínez (Adulto)", 
      total: 80.00, 
      estado: "Pendiente",
      detalles: [
        { concepto: "Refuerzo Matemáticas - Mayo", precio: 80.00 }
      ]
    }
  ]);

  return (
    <div className="w-full max-w-6xl relative">
      
      {/* PANTALLA PRINCIPAL: TABLA DE FACTURAS */}
      <div className="bg-white p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Historial de Facturas</h1>
          <p className="text-sm text-gray-600">Consulta, imprime o gestiona el estado de tus recibos emitidos.</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-100 uppercase tracking-wider text-gray-600 text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Nº Factura</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente / Titular</th>
                <th className="px-4 py-3">Alumno Asociado</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {facturas.map((fac) => (
                <tr key={fac.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{fac.id}</td>
                  <td className="px-4 py-3 text-gray-500">{fac.fecha}</td>
                  <td className="px-4 py-3">{fac.cliente}</td>
                  <td className="px-4 py-3 text-gray-500">{fac.alumno}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${fac.estado === 'Pagada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {fac.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{fac.total.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => setFacturaSeleccionada(fac)}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL/VENTANA EMERGENTE DE DETALLES */}
      {facturaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Cabecera del Modal */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-gray-800 m-0">Factura {facturaSeleccionada.id}</h2>
                <p className="text-sm text-gray-500">Emitida el {facturaSeleccionada.fecha}</p>
              </div>
              <button 
                onClick={() => setFacturaSeleccionada(null)}
                className="text-gray-500 hover:text-red-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 overflow-y-auto">
              <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500 font-semibold mb-1">Facturado a:</span>
                  <p className="font-medium">{facturaSeleccionada.cliente}</p>
                </div>
                <div>
                  <span className="block text-gray-500 font-semibold mb-1">Concepto de Alumno:</span>
                  <p className="font-medium text-blue-700">{facturaSeleccionada.alumno}</p>
                </div>
              </div>

              <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Conceptos Facturados</h3>
              <ul className="space-y-3 mb-6">
                {facturaSeleccionada.detalles.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>{item.concepto}</span>
                    <span className="font-medium">{item.precio.toFixed(2)} €</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-end border-t pt-4">
                <div className="text-right">
                  <span className="text-gray-500 font-semibold mr-4">Total a pagar:</span>
                  <span className="text-2xl font-bold text-gray-900">{facturaSeleccionada.total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Pie del Modal (Acciones) */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button onClick={() => setFacturaSeleccionada(null)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 font-semibold">
                Cerrar
              </button>
              <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white font-bold flex items-center">
                🖨️ Re-imprimir PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default HistorialFacturas;