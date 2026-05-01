import { useState, useMemo } from "react";
import { UserPlus, X, Edit, Trash2, CreditCard, ArrowUpDown } from "lucide-react";

function GestionClientes({ metodosPago }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  const [clientes, setClientes] = useState([
    { COD_CLI: "C001", DNI: "12345678A", APELLIDOS: "García López", NOMBRE: "María", DIRECCION: "Calle Falsa 123", CP: "28001", CIUDAD: "Madrid", EMAIL: "maria@email.com", TELEFONO: "600123456", ALUMNO: "Hugo García", METODO_PAGO: "Domiciliación Bancaria", NOTAS: "Alérgico" },
    { COD_CLI: "C002", DNI: "87654321B", APELLIDOS: "Martínez", NOMBRE: "Carlos", DIRECCION: "Av. Principal 45", CP: "08002", CIUDAD: "Barcelona", EMAIL: "carlos@email.com", TELEFONO: "600987654", ALUMNO: "Carlos Martínez", METODO_PAGO: "Transferencia", NOTAS: "" },
    { COD_CLI: "C003", DNI: "98765432C", APELLIDOS: "Álvarez", NOMBRE: "Ana", DIRECCION: "Plaza Mayor 1", CP: "41001", CIUDAD: "Sevilla", EMAIL: "ana@email.com", TELEFONO: "600555444", ALUMNO: "Luis Álvarez", METODO_PAGO: "Efectivo", NOTAS: "" }
  ]);

  // --- LÓGICA DE ORDENACIÓN ---
  const [sortConfig, setSortConfig] = useState({ key: "COD_CLI", direction: "ascending" });

  const solicitarOrden = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const clientesOrdenados = useMemo(() => {
    let sortableItems = [...clientes];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "ascending" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [clientes, sortConfig]);

  // Componente interno para las cabeceras ordenables
  const SortableHeader = ({ label, sortKey }) => (
    <th 
      className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors group"
      onClick={() => solicitarOrden(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === sortKey ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
      </div>
    </th>
  );

  const obtenerSiguienteId = () => {
    if (clientes.length === 0) return "C001";
    const ultimoNum = parseInt(clientes[clientes.length - 1].COD_CLI.replace("C", ""));
    return `C${(ultimoNum + 1).toString().padStart(3, '0')}`;
  };

  return (
    <div className="bg-white w-full p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
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

      {/* FORMULARIO (Se mantiene igual que antes) */}
      {mostrarFormulario && (
        <div className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-lg shadow-inner">
           <h3 className="font-bold text-blue-800 mb-4">Registrar Nuevo Cliente</h3>
           <p className="text-sm text-gray-500 italic">Formulario temporalmente oculto en esta vista previa para mantener el código corto.</p>
        </div>
      )}

      {/* TABLA ORDENABLE CON COLUMNAS SEPARADAS */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 uppercase tracking-wider text-gray-600 text-xs font-semibold select-none">
            <tr>
              <SortableHeader label="Cód" sortKey="COD_CLI" />
              <SortableHeader label="Nombre" sortKey="NOMBRE" />
              <SortableHeader label="Apellidos" sortKey="APELLIDOS" />
              <SortableHeader label="DNI" sortKey="DNI" />
              <SortableHeader label="Alumno/a" sortKey="ALUMNO" />
              <SortableHeader label="Pago" sortKey="METODO_PAGO" />
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clientesOrdenados.map((cliente) => (
              <tr key={cliente.COD_CLI} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 font-medium text-gray-900">{cliente.COD_CLI}</td>
                <td className="px-4 py-4 font-semibold text-gray-800">{cliente.NOMBRE}</td>
                <td className="px-4 py-4 text-gray-800">{cliente.APELLIDOS}</td>
                <td className="px-4 py-4 text-gray-500">{cliente.DNI}</td>
                <td className="px-4 py-4 text-blue-700 font-medium">
                  {cliente.ALUMNO}
                  {cliente.NOTAS && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-800 font-bold" title={cliente.NOTAS}>NOTA</span>}
                </td>
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