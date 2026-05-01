import { useState, useMemo } from "react";
import { UserPlus, X, Edit, Trash2, CreditCard, ArrowUpDown } from "lucide-react";

// Recibimos clientes y setClientes desde App.jsx
function GestionClientes({ clientes, setClientes, metodosPago }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // ESTADOS DEL FORMULARIO PARA UN NUEVO CLIENTE
  const [nuevoCliente, setNuevoCliente] = useState({
    DNI: "", NOMBRE: "", APELLIDOS: "", DIRECCION: "", CP: "", CIUDAD: "", EMAIL: "", TELEFONO: "", ALUMNO: "", METODO_PAGO: metodosPago[0] || "", NOTAS: ""
  });

  const obtenerSiguienteId = () => {
    if (clientes.length === 0) return "C001";
    const ultimoNum = parseInt(clientes[clientes.length - 1].COD_CLI.replace("C", ""));
    return `C${(ultimoNum + 1).toString().padStart(3, '0')}`;
  };

  // FUNCIÓN INTELIGENTE PARA GUARDAR
  const guardarCliente = () => {
    if (!nuevoCliente.NOMBRE || !nuevoCliente.APELLIDOS) {
      alert("Por favor, rellena al menos el nombre y apellidos.");
      return;
    }

    const clienteParaGuardar = {
      ...nuevoCliente,
      COD_CLI: obtenerSiguienteId()
    };

    // Añadimos el cliente a la base de datos y limpiamos el formulario
    setClientes([...clientes, clienteParaGuardar]);
    setMostrarFormulario(false);
    setNuevoCliente({ DNI: "", NOMBRE: "", APELLIDOS: "", DIRECCION: "", CP: "", CIUDAD: "", EMAIL: "", TELEFONO: "", ALUMNO: "", METODO_PAGO: metodosPago[0] || "", NOTAS: "" });
  };

  const eliminarCliente = (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      setClientes(clientes.filter(c => c.COD_CLI !== id));
    }
  };

  const handleChange = (e) => {
    setNuevoCliente({ ...nuevoCliente, [e.target.name]: e.target.value });
  };

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

  const SortableHeader = ({ label, sortKey }) => (
    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors group" onClick={() => solicitarOrden(sortKey)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === sortKey ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
      </div>
    </th>
  );

  return (
    <div className="bg-white w-full p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Base de Datos: Clientes</h1>
          <p className="text-sm text-gray-600">Gestiona los padres/tutores, alumnos y sus formas de pago.</p>
        </div>
        <button onClick={() => setMostrarFormulario(!mostrarFormulario)} className={`flex items-center font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors ${mostrarFormulario ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
          {mostrarFormulario ? <><X className="w-5 h-5 mr-2" /> Cancelar</> : <><UserPlus className="w-5 h-5 mr-2" /> Añadir Cliente</>}
        </button>
      </div>

      {mostrarFormulario && (
        <div className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-lg shadow-inner">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center"><UserPlus className="w-5 h-5 mr-2" /> Registrar Nuevo Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Código (Auto)</label>
              <input type="text" value={obtenerSiguienteId()} disabled className="border border-gray-200 rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed font-mono" />
            </div>
            
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">DNI / NIF</label>
              <input type="text" name="DNI" value={nuevoCliente.DNI} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Nombre</label>
              <input type="text" name="NOMBRE" value={nuevoCliente.NOMBRE} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Apellidos</label>
              <input type="text" name="APELLIDOS" value={nuevoCliente.APELLIDOS} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col md:col-span-2"><label className="font-semibold text-gray-700 mb-1">Dirección</label>
              <input type="text" name="DIRECCION" value={nuevoCliente.DIRECCION} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">C.P.</label>
              <input type="text" name="CP" value={nuevoCliente.CP} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Ciudad</label>
              <input type="text" name="CIUDAD" value={nuevoCliente.CIUDAD} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" name="EMAIL" value={nuevoCliente.EMAIL} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Teléfono</label>
              <input type="text" name="TELEFONO" value={nuevoCliente.TELEFONO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col md:col-span-1"><label className="font-semibold text-gray-700 mb-1">Nombre Alumno/a</label>
              <input type="text" name="ALUMNO" value={nuevoCliente.ALUMNO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1 flex items-center"><CreditCard className="w-4 h-4 mr-1 text-gray-500" /> Método de Pago</label>
              <select name="METODO_PAGO" value={nuevoCliente.METODO_PAGO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {metodosPago.map((metodo, idx) => <option key={idx} value={metodo}>{metodo}</option>)}
              </select>
            </div>

            <div className="flex flex-col md:col-span-4 mt-2">
              <label className="font-semibold text-gray-700 mb-1">Notas / Observaciones</label>
              <textarea name="NOTAS" value={nuevoCliente.NOTAS} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[60px]"></textarea>
            </div>

          </div>
          <div className="flex justify-end mt-6">
            <button onClick={guardarCliente} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors">
              Guardar Cliente
            </button>
          </div>
        </div>
      )}

      {/* TABLA ORDENABLE */}
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
            {clientes.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No hay clientes registrados.</td></tr>
            ) : (
              clientesOrdenados.map((cliente) => (
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
                      <button onClick={() => eliminarCliente(cliente.COD_CLI)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionClientes;