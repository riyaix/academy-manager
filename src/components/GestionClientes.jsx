import { useState } from "react";

function GestionClientes() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Datos simulados (Mock data)
  const [clientes, setClientes] = useState([
    { COD_CLI: "C001", DNI: "12345678A", APELLIDOS: "García López", NOMBRE: "María", DIRECCION: "Calle Falsa 123", CP: "28001", CIUDAD: "Madrid", EMAIL: "maria@email.com", TELEFONO: "600123456", ALUMNO: "Hugo García" },
    { COD_CLI: "C002", DNI: "87654321B", APELLIDOS: "Martínez", NOMBRE: "Carlos", DIRECCION: "Av. Principal 45", CP: "08002", CIUDAD: "Barcelona", EMAIL: "carlos@email.com", TELEFONO: "600987654", ALUMNO: "Carlos Martínez (Adulto)" }
  ]);

  return (
    <div className="bg-white w-full max-w-6xl p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Base de Datos: Clientes</h1>
          <p className="text-sm text-gray-600">Gestiona los padres/tutores y los alumnos de la academia.</p>
        </div>
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors"
        >
          {mostrarFormulario ? "✕ Cancelar" : "+ Añadir Cliente"}
        </button>
      </div>

      {/* FORMULARIO PARA AÑADIR CLIENTE */}
      {mostrarFormulario && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-4">Registrar Nuevo Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col"><label className="font-semibold text-gray-700">Código</label><input type="text" className="border rounded p-2" placeholder="Ej. C003" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700">DNI / NIF</label><input type="text" className="border rounded p-2" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700">Nombre</label><input type="text" className="border rounded p-2" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700">Apellidos</label><input type="text" className="border rounded p-2" /></div>
            <div className="flex flex-col md:col-span-2"><label className="font-semibold text-gray-700">Dirección</label><input type="text" className="border rounded p-2" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700">C.P.</label><input type="text" className="border rounded p-2" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700">Ciudad</label><input type="text" className="border rounded p-2" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700">Email</label><input type="email" className="border rounded p-2" /></div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700">Teléfono</label><input type="text" className="border rounded p-2" /></div>
            <div className="flex flex-col md:col-span-2"><label className="font-semibold text-gray-700">Nombre del Alumno/a</label><input type="text" className="border rounded p-2" placeholder="¿Quién asiste a clase?" /></div>
          </div>
          <button className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">Guardar Cliente</button>
        </div>
      )}

      {/* TABLA DE CLIENTES */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 uppercase tracking-wider text-gray-600 text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Cód</th>
              <th className="px-4 py-3">Cliente (Facturación)</th>
              <th className="px-4 py-3">DNI</th>
              <th className="px-4 py-3">Alumno/a</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clientes.map((cliente) => (
              <tr key={cliente.COD_CLI} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{cliente.COD_CLI}</td>
                <td className="px-4 py-3">{cliente.NOMBRE} {cliente.APELLIDOS}</td>
                <td className="px-4 py-3 text-gray-500">{cliente.DNI}</td>
                <td className="px-4 py-3 text-blue-600 font-medium">{cliente.ALUMNO}</td>
                <td className="px-4 py-3 text-gray-500">{cliente.TELEFONO} <br/><span className="text-xs">{cliente.EMAIL}</span></td>
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

export default GestionClientes;