import { useState } from "react";
import { UserPlus, X, Edit, Trash2, CreditCard } from "lucide-react";

// Recibimos los metodosPago desde App.jsx
function GestionClientes({ metodosPago }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  const [clientes, setClientes] = useState([
    { COD_CLI: "C001", DNI: "12345678A", APELLIDOS: "García López", NOMBRE: "María", DIRECCION: "Calle Falsa 123", CP: "28001", CIUDAD: "Madrid", EMAIL: "maria@email.com", TELEFONO: "600123456", ALUMNO: "Hugo García", METODO_PAGO: "Domiciliación Bancaria", NOTAS: "Alérgico al cacahuete." },
    { COD_CLI: "C002", DNI: "87654321B", APELLIDOS: "Martínez", NOMBRE: "Carlos", DIRECCION: "Av. Principal 45", CP: "08002", CIUDAD: "Barcelona", EMAIL: "carlos@email.com", TELEFONO: "600987654", ALUMNO: "Carlos Martínez", METODO_PAGO: "Transferencia", NOTAS: "" }
  ]);

  // Función para calcular el siguiente ID automáticamente
  const obtenerSiguienteId = () => {
    if (clientes.length === 0) return "C001";
    // Extraemos el número del último cliente (Ej: "C002" -> 2)
    const ultimoNum = parseInt(clientes[clientes.length - 1].COD_CLI.replace("C", ""));
    // Le sumamos 1 y rellenamos con ceros (Ej: 2 + 1 = 3 -> "C003")
    return `C${(ultimoNum + 1).toString().padStart(3, '0')}`;
  };

  return (
    <div className="bg-white w-full max-w-6xl p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Base de Datos: Clientes</h1>
          <p className="text-sm text-gray-600">Gestiona los padres/tutores, alumnos y sus formas de pago.</p>
        </div>
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className={`flex items-center font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors ${
            mostrarFormulario ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {mostrarFormulario ? <><X className="w-5 h-5 mr-2" /> Cancelar</> : <><UserPlus className="w-5 h-5 mr-2" /> Añadir Cliente</>}
        </button>
      </div>

      {mostrarFormulario && (
        <div className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-lg shadow-inner">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" /> Registrar Nuevo Cliente
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
            
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">DNI / NIF</label><input type="text" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Nombre</label><input type="text" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Apellidos</label><input type="text" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex flex-col md:col-span-2"><label className="font-semibold text-gray-700 mb-1">Dirección</label><input type="text" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">C.P.</label><input type="text" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Ciudad</label><input type="text" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Email</label><input type="email" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Teléfono</label><input type="text" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex flex-col md:col-span-1"><label className="font-semibold text-gray-700 mb-1">Nombre Alumno/a</label><input type="text" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            
            {/* SELECT DINÁMICO DE MÉTODOS DE PAGO */}
            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1 flex items-center">
                <CreditCard className="w-4 h-4 mr-1 text-gray-500" /> Método de Pago
              </label>
              <select className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {metodosPago.map((metodo, idx) => (
                  <option key={idx} value={metodo}>{metodo}</option>
                ))}
              </select>
            </div>

            {/* NUEVO CAMPO: NOTAS */}
            <div className="flex flex-col md:col-span-4 mt-2">
              <label className="font-semibold text-gray-700 mb-1">Notas / Observaciones</label>
              <textarea 
                className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[60px]" 
                placeholder="Ej. Alergias, horarios especiales, avisos importantes..."
              ></textarea>
            </div>

          </div>
          <div className="flex justify-end mt-6">
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors">
              Guardar Cliente
            </button>
          </div>
        </div>
      )}

      {/* La tabla se mantiene igual... */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 uppercase tracking-wider text-gray-600 text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Cód</th>
              <th className="px-4 py-3">Cliente / DNI</th>
              <th className="px-4 py-3">Alumno/a</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clientes.map((cliente) => (
              <tr key={cliente.COD_CLI} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 font-medium text-gray-900">{cliente.COD_CLI}</td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-gray-800">{cliente.NOMBRE} {cliente.APELLIDOS}</div>
                  <div className="text-xs text-gray-500">{cliente.DNI}</div>
                </td>
                <td className="px-4 py-4 text-blue-700 font-medium">
                  {cliente.ALUMNO}
                  {/* Si hay nota, mostramos un pequeño aviso */}
                  {cliente.NOTAS && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-800 font-bold" title={cliente.NOTAS}>NOTA</span>}
                </td>
                <td className="px-4 py-4"><div className="text-gray-700">{cliente.TELEFONO}</div><div className="text-xs text-gray-500">{cliente.EMAIL}</div></td>
                <td className="px-4 py-4"><span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"><CreditCard className="w-3 h-3 mr-1" /> {cliente.METODO_PAGO}</span></td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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

export default GestionClientes;