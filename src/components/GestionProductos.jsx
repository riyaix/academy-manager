import { useState } from "react";
// Importamos los iconos de Lucide
import { Plus, X, Edit, Trash2, BookOpen } from "lucide-react";

function GestionProductos() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Datos simulados (Mock data)
  const [productos, setProductos] = useState([
    { COD_PROD: "P001", CURSO: "Matrícula Anual", CUOTA: 50.00, TIPO: "Único" },
    { COD_PROD: "P002", CURSO: "Inglés B1 (Mensual)", CUOTA: 65.00, TIPO: "Mensual" },
    { COD_PROD: "P003", CURSO: "Refuerzo Matemáticas", CUOTA: 80.00, TIPO: "Mensual" },
    { COD_PROD: "P004", CURSO: "Curso Intensivo Verano", CUOTA: 150.00, TIPO: "Único" }
  ]);

  // Función para calcular el siguiente ID automáticamente
  const obtenerSiguienteId = () => {
    if (productos.length === 0) return "P001";
    // Extraemos el número del último producto (Ej: "P004" -> 4)
    const ultimoNum = parseInt(productos[productos.length - 1].COD_PROD.replace("P", ""));
    // Le sumamos 1 y rellenamos con ceros (Ej: 4 + 1 = 5 -> "P005")
    return `P${(ultimoNum + 1).toString().padStart(3, '0')}`;
  };

  return (
    <div className="bg-white w-full max-w-5xl p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Catálogo: Cursos y Cuotas</h1>
          <p className="text-sm text-gray-600">Gestiona los servicios, clases y matrículas que ofreces en la academia.</p>
        </div>
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className={`flex items-center font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors ${
            mostrarFormulario 
              ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {mostrarFormulario ? (
            <><X className="w-5 h-5 mr-2" /> Cancelar</>
          ) : (
            <><Plus className="w-5 h-5 mr-2" /> Añadir Curso</>
          )}
        </button>
      </div>

      {/* FORMULARIO PARA AÑADIR PRODUCTO */}
      {mostrarFormulario && (
        <div className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-lg shadow-inner">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" /> Registrar Nuevo Servicio / Cuota
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            
            {/* ID GENERADO AUTOMÁTICAMENTE (Deshabilitado) */}
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700 mb-1">Código (Auto)</label>
              <input 
                type="text" 
                value={obtenerSiguienteId()} 
                disabled 
                className="border border-gray-200 rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed font-mono" 
              />
            </div>

            {/* NOMBRE DEL CURSO */}
            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-gray-700 mb-1">Nombre del Curso / Cuota</label>
              <input 
                type="text" 
                className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Ej. Taller de Robótica" 
              />
            </div>

            {/* TIPO DE COBRO */}
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700 mb-1">Tipo de Cobro</label>
              <select className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="Mensual">Mensual</option>
                <option value="Único">Pago Único (Matrícula/Material)</option>
                <option value="Trimestral">Trimestral</option>
              </select>
            </div>

            {/* CUOTA BASE */}
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700 mb-1">Cuota Base (€)</label>
              <input 
                type="number" 
                step="0.01"
                className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="0.00" 
              />
            </div>

          </div>
          <div className="flex justify-end mt-6">
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors">
              Guardar Curso
            </button>
          </div>
        </div>
      )}

      {/* TABLA DE PRODUCTOS */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
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
              <tr key={prod.COD_PROD} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 font-medium text-gray-900">{prod.COD_PROD}</td>
                <td className="px-4 py-4 font-semibold text-gray-800">{prod.CURSO}</td>
                <td className="px-4 py-4 text-gray-500">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    prod.TIPO === 'Mensual' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {prod.TIPO}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-bold text-gray-900">{prod.CUOTA.toFixed(2)} €</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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