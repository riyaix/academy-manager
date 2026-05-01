import { useState } from "react";

function GestionProductos() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Datos simulados (Mock data)
  const [productos, setProductos] = useState([
    { COD_PROD: "P001", CURSO: "Matrícula Anual", CUOTA: 50.00, TIPO: "Único" },
    { COD_PROD: "P002", CURSO: "Inglés B1 (Mensual)", CUOTA: 65.00, TIPO: "Mensual" },
    { COD_PROD: "P003", CURSO: "Refuerzo Matemáticas", CUOTA: 80.00, TIPO: "Mensual" },
    { COD_PROD: "P004", CURSO: "Curso Intensivo Verano", CUOTA: 150.00, TIPO: "Único" }
  ]);

  return (
    <div className="bg-white w-full max-w-5xl p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Catálogo: Cursos y Cuotas</h1>
          <p className="text-sm text-gray-600">Gestiona los servicios que ofreces en la academia.</p>
        </div>
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors"
        >
          {mostrarFormulario ? "✕ Cancelar" : "+ Añadir Curso"}
        </button>
      </div>

      {/* FORMULARIO PARA AÑADIR PRODUCTO */}
      {mostrarFormulario && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-4">Registrar Nuevo Servicio</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700">Código</label>
              <input type="text" className="border rounded p-2" placeholder="Ej. P005" />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-gray-700">Nombre del Curso / Cuota</label>
              <input type="text" className="border rounded p-2" placeholder="Ej. Taller de Robótica" />
            </div>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700">Cuota Base (€)</label>
              <input type="number" className="border rounded p-2" placeholder="0.00" />
            </div>
          </div>
          <button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">Guardar Curso</button>
        </div>
      )}

      {/* TABLA DE PRODUCTOS */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 uppercase tracking-wider text-gray-600 text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Cód</th>
              <th className="px-4 py-3 w-1/2">Nombre del Curso / Servicio</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Cuota (€)</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {productos.map((prod) => (
              <tr key={prod.COD_PROD} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{prod.COD_PROD}</td>
                <td className="px-4 py-3">{prod.CURSO}</td>
                <td className="px-4 py-3 text-gray-500">
                  <span className={`px-2 py-1 rounded text-xs ${prod.TIPO === 'Mensual' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                    {prod.TIPO}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{prod.CUOTA.toFixed(2)} €</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button className="text-red-600 hover:underline">Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionProductos;