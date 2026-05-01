import { useState, useMemo } from "react";
import { UserPlus, Edit, Trash2, ArrowUpDown } from "lucide-react";

// Recibimos separadorDni por props (por defecto el punto)
function GestionClientes({ clientes, setClientes, separadorDni = "." }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Hemos separado el DNI en dniNumeros y dniLetra
  const [nuevoCliente, setNuevoCliente] = useState({
    dniNumeros: "", dniLetra: "", NOMBRE: "", APELLIDOS: "", DIRECCION: "", DIRECCION_PISO: "", CP: "", CIUDAD: "", EMAIL: "", TELEFONO: "", ALUMNO: "", NOTAS: ""
  });

  const obtenerSiguienteId = () => {
    if (clientes.length === 0) return "C001";
    const ultimoNum = parseInt(clientes[clientes.length - 1].COD_CLI.replace("C", ""));
    return `C${(ultimoNum + 1).toString().padStart(3, '0')}`;
  };

  // --- LÓGICA INTELIGENTE DEL DNI ---
  const handleDniNumeros = (e) => {
    // 1. Quitamos todo lo que no sean números y limitamos a 8 caracteres
    let valorLimpio = e.target.value.replace(/\D/g, "").slice(0, 8);
    // 2. Aplicamos el separador (punto o guión) en los miles
    let valorFormateado = valorLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, separadorDni);
    setNuevoCliente({ ...nuevoCliente, dniNumeros: valorFormateado });
  };

  const handleDniLetra = (e) => {
    // Forzamos a mayúscula siempre, limitando a 1 letra
    setNuevoCliente({ ...nuevoCliente, dniLetra: e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1) });
  };

  const guardarCliente = () => {
    if (!nuevoCliente.NOMBRE || !nuevoCliente.APELLIDOS) {
      alert("Por favor, rellena al menos el nombre y apellidos.");
      return;
    }

    // Juntamos el DNI formateado con la letra para guardarlo en la base de datos
    const dniCompleto = `${nuevoCliente.dniNumeros}-${nuevoCliente.dniLetra}`;

    const clienteParaGuardar = {
      ...nuevoCliente,
      DNI: dniCompleto,
      COD_CLI: obtenerSiguienteId()
    };

    setClientes([...clientes, clienteParaGuardar]);
    setMostrarFormulario(false);
    // Reseteamos el estado
    setNuevoCliente({ dniNumeros: "", dniLetra: "", NOMBRE: "", APELLIDOS: "", DIRECCION: "", DIRECCION_PISO: "", CP: "", CIUDAD: "", EMAIL: "", TELEFONO: "", ALUMNO: "", NOTAS: "" });
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
    <th className="px-4 py-4 cursor-pointer hover:bg-gray-200 transition-colors group" onClick={() => solicitarOrden(sortKey)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === sortKey ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
      </div>
    </th>
  );

  return (
    // Hemos añadido min-h-[85vh] y flex-col para que ocupe toda la pantalla de forma elegante
    <div className="bg-white w-full p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[85vh]">
      
      {/* CABECERA DE LA PÁGINA */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Base de Datos: Clientes</h1>
          <p className="text-sm text-gray-600">Gestiona los padres/tutores, alumnos y su información de contacto.</p>
        </div>
        {!mostrarFormulario && (
          <button onClick={() => setMostrarFormulario(true)} className="flex items-center font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="w-5 h-5 mr-2" /> Añadir Cliente
          </button>
        )}
      </div>

      {/* FORMULARIO DE CLIENTE */}
      {mostrarFormulario && (
        <div className="mb-6 p-6 bg-blue-50/50 border border-blue-100 rounded-lg shadow-inner shrink-0">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center"><UserPlus className="w-5 h-5 mr-2" /> Registrar Nuevo Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Código</label>
              <input type="text" value={obtenerSiguienteId()} disabled className="border border-gray-200 rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed font-mono" />
            </div>
            
            {/* DNI PARTIDO EN DOS (Números y Letra) */}
            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-gray-700 mb-1">DNI / NIF</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={nuevoCliente.dniNumeros} 
                  onChange={handleDniNumeros} 
                  placeholder="Ej. 12.345.678"
                  className="flex-1 border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                />
                <span className="text-gray-400 flex items-center">-</span>
                <input 
                  type="text" 
                  value={nuevoCliente.dniLetra} 
                  onChange={handleDniLetra} 
                  placeholder="X"
                  className="w-12 border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold uppercase" 
                />
              </div>
            </div>

            <div className="flex flex-col md:col-span-1"><label className="font-semibold text-gray-700 mb-1">Nombre</label>
              <input type="text" name="NOMBRE" value={nuevoCliente.NOMBRE} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col md:col-span-1"><label className="font-semibold text-gray-700 mb-1">Apellidos</label>
              <input type="text" name="APELLIDOS" value={nuevoCliente.APELLIDOS} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex flex-col md:col-span-2"><label className="font-semibold text-gray-700 mb-1">Dirección (Calle, Avda...)</label>
              <input type="text" name="DIRECCION" value={nuevoCliente.DIRECCION} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Calle Mayor, 12" />
            </div>
            
            {/* NUEVO NOMBRE OFICIAL PARA PISO/PUERTA */}
            <div className="flex flex-col md:col-span-2"><label className="font-semibold text-gray-700 mb-1">Escalera / Planta / Puerta</label>
              <input type="text" name="DIRECCION_PISO" value={nuevoCliente.DIRECCION_PISO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Esc. Izq, Planta 3, Pta B" />
            </div>

            <div className="flex flex-col md:col-span-1"><label className="font-semibold text-gray-700 mb-1">C.P.</label>
              <input type="text" name="CP" value={nuevoCliente.CP} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Ciudad</label>
              <input type="text" name="CIUDAD" value={nuevoCliente.CIUDAD} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col md:col-span-2"><label className="font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" name="EMAIL" value={nuevoCliente.EMAIL} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Teléfono</label>
              <input type="text" name="TELEFONO" value={nuevoCliente.TELEFONO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col"><label className="font-semibold text-gray-700 mb-1">Nombre Alumno/a</label>
              <input type="text" name="ALUMNO" value={nuevoCliente.ALUMNO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div className="flex flex-col md:col-span-5 mt-2">
              <label className="font-semibold text-gray-700 mb-1">Notas / Observaciones</label>
              <textarea name="NOTAS" value={nuevoCliente.NOTAS} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[60px]"></textarea>
            </div>

          </div>
          
          {/* BOTONES DE ACCIÓN (Juntos y a la derecha) */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-blue-100">
            <button 
              onClick={() => setMostrarFormulario(false)} 
              className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={guardarCliente} 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors"
            >
              Guardar Cliente
            </button>
          </div>
        </div>
      )}

      {/* CONTENEDOR DE LA TABLA (Con flex-1 para que se expanda y padding-bottom para el scroll) */}
      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-gray-200 pb-2">
        <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 uppercase tracking-wider text-gray-600 text-xs font-semibold select-none sticky top-0 z-10 shadow-sm">
            <tr>
              <SortableHeader label="Cód" sortKey="COD_CLI" />
              <SortableHeader label="Nombre" sortKey="NOMBRE" />
              <SortableHeader label="Apellidos" sortKey="APELLIDOS" />
              <SortableHeader label="DNI" sortKey="DNI" />
              <SortableHeader label="Alumno/a" sortKey="ALUMNO" />
              <SortableHeader label="Dirección" sortKey="DIRECCION" />
              <SortableHeader label="Esc/Pl/Pta" sortKey="DIRECCION_PISO" />
              <SortableHeader label="CP" sortKey="CP" />
              <SortableHeader label="Ciudad" sortKey="CIUDAD" />
              <SortableHeader label="Email" sortKey="EMAIL" />
              <SortableHeader label="Teléfono" sortKey="TELEFONO" />
              <SortableHeader label="Notas" sortKey="NOTAS" />
              <th className="px-4 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clientes.length === 0 ? (
              <tr><td colSpan="13" className="px-4 py-8 text-center text-gray-500">No hay clientes registrados.</td></tr>
            ) : (
              clientesOrdenados.map((cliente) => (
                <tr key={cliente.COD_CLI} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{cliente.COD_CLI}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{cliente.NOMBRE}</td>
                  <td className="px-4 py-3 text-gray-800">{cliente.APELLIDOS}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{cliente.DNI}</td>
                  <td className="px-4 py-3 text-blue-700 font-medium">{cliente.ALUMNO}</td>
                  <td className="px-4 py-3 text-gray-600">{cliente.DIRECCION}</td>
                  <td className="px-4 py-3 text-gray-600">{cliente.DIRECCION_PISO}</td>
                  <td className="px-4 py-3 text-gray-600">{cliente.CP}</td>
                  <td className="px-4 py-3 text-gray-600">{cliente.CIUDAD}</td>
                  <td className="px-4 py-3 text-gray-600">{cliente.EMAIL}</td>
                  <td className="px-4 py-3 text-gray-600">{cliente.TELEFONO}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate" title={cliente.NOTAS}>
                    {cliente.NOTAS}
                  </td>
                  {/* Hemos quitado el sticky right-0 para evitar solapamientos */}
                  <td className="px-4 py-3 text-right">
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