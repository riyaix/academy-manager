import { useState, useMemo } from "react";
import { UserPlus, X, Edit, Trash2, ArrowUpDown, Search, Filter, Download, FileText, Table as TableIcon } from "lucide-react";
// Importamos las librerías profesionales para PDF
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function GestionClientes({ clientes, setClientes, separadorDni = "." }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarDescarga, setMostrarDescarga] = useState(false);
  
  // Filtros actualizados con Edad Máxima
  const [filtros, setFiltros] = useState({ edadMinima: "", edadMaxima: "", estado: "" });

  const estadoInicialCliente = {
    dniNumeros: "", dniLetra: "", NOMBRE: "", APELLIDOS: "", 
    tipoVia: "C/", nombreVia: "", numero: "", 
    portalAbrev: "Pta.", portalNum: "", pisoNum: "", pisoLetra: "",
    CP: "", CIUDAD: "Badajoz", EMAIL: "", TELEFONO: "", ALUMNO: "", EDAD: "", 
    FECHA_ALTA: new Date().toISOString().split('T')[0], ESTADO: "Activo", NOTAS: ""
  };

  const [nuevoCliente, setNuevoCliente] = useState(estadoInicialCliente);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);

  const obtenerSiguienteId = () => {
    if (clientes.length === 0) return "C001";
    const ultimoNum = parseInt(clientes[clientes.length - 1].COD_CLI.replace("C", ""));
    return `C${(ultimoNum + 1).toString().padStart(3, '0')}`;
  };

  const handleDniNumeros = (e) => {
    let valorLimpio = e.target.value.replace(/\D/g, "").slice(0, 8);
    let valorFormateado = valorLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, separadorDni);
    setNuevoCliente({ ...nuevoCliente, dniNumeros: valorFormateado });
  };

  const handleDniLetra = (e) => setNuevoCliente({ ...nuevoCliente, dniLetra: e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1) });
  const handlePisoLetra = (e) => setNuevoCliente({ ...nuevoCliente, pisoLetra: e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) });
  
  const handleTelefono = (e) => {
    let tel = e.target.value.replace(/\D/g, "").slice(0, 9);
    if (tel.length > 7) tel = tel.replace(/(\d{3})(\d{2})(\d{2})(\d{1,2})/, "$1 $2 $3 $4");
    else if (tel.length > 5) tel = tel.replace(/(\d{3})(\d{2})(\d{1,2})/, "$1 $2 $3");
    else if (tel.length > 3) tel = tel.replace(/(\d{3})(\d{1,2})/, "$1 $2");
    setNuevoCliente({ ...nuevoCliente, TELEFONO: tel });
  };

  const handleCP = (e) => {
    let cp = e.target.value.replace(/\D/g, "").slice(0, 5);
    let ciudad = nuevoCliente.CIUDAD;
    if (cp.length >= 2) {
      const prefijo = cp.substring(0, 2);
      if (prefijo === "06") ciudad = "Badajoz";
      else if (prefijo === "10") ciudad = "Cáceres";
      else if (prefijo === "28") ciudad = "Madrid";
      else if (prefijo === "08") ciudad = "Barcelona";
      else if (prefijo === "41") ciudad = "Sevilla";
      else if (prefijo === "46") ciudad = "Valencia";
    } else if (cp.length === 0) {
      ciudad = "Badajoz"; 
    }
    setNuevoCliente({ ...nuevoCliente, CP: cp, CIUDAD: ciudad });
  };

  const handleChange = (e) => setNuevoCliente({ ...nuevoCliente, [e.target.name]: e.target.value });

  const guardarCliente = () => {
    if (!nuevoCliente.NOMBRE || !nuevoCliente.APELLIDOS) {
      alert("Por favor, rellena al menos el nombre y apellidos.");
      return;
    }

    const dniCompleto = nuevoCliente.dniNumeros ? `${nuevoCliente.dniNumeros}-${nuevoCliente.dniLetra}` : "";
    const direccionFormateada = `${nuevoCliente.tipoVia} ${nuevoCliente.nombreVia}` + (nuevoCliente.numero ? `, n.º ${nuevoCliente.numero}` : "");
    let pisoFormateado = "";
    if (nuevoCliente.portalNum) pisoFormateado += `${nuevoCliente.portalAbrev} ${nuevoCliente.portalNum} `;
    if (nuevoCliente.pisoNum) pisoFormateado += `Apt. ${nuevoCliente.pisoNum} `;
    if (nuevoCliente.pisoLetra) pisoFormateado += `${nuevoCliente.pisoLetra}`;

    const datosCliente = {
      ...nuevoCliente,
      DNI: dniCompleto,
      DIRECCION: direccionFormateada.trim(),
      DIRECCION_PISO: pisoFormateado.trim(),
    };

    if (editandoId) {
      setClientes(clientes.map(c => c.COD_CLI === editandoId ? { ...datosCliente, COD_CLI: editandoId } : c));
    } else {
      setClientes([...clientes, { ...datosCliente, COD_CLI: obtenerSiguienteId() }]);
    }

    cerrarFormulario();
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setNuevoCliente(estadoInicialCliente);
  };

  const handleEditar = () => {
    if (seleccionados.length !== 1) return;
    const clienteAEditar = clientes.find(c => c.COD_CLI === seleccionados[0]);
    if (clienteAEditar) {
      const partesDni = clienteAEditar.DNI ? clienteAEditar.DNI.split('-') : ["", ""];
      setNuevoCliente({ ...clienteAEditar, dniNumeros: partesDni[0] || "", dniLetra: partesDni[1] || "" });
      setEditandoId(clienteAEditar.COD_CLI);
      setMostrarFormulario(true);
    }
  };

  const handleEliminar = () => {
    if (seleccionados.length === 0) return;
    if (confirm(`¿Estás seguro de que deseas eliminar ${seleccionados.length} cliente(s)?`)) {
      setClientes(clientes.filter(c => !seleccionados.includes(c.COD_CLI)));
      setSeleccionados([]);
    }
  };

  const toggleSeleccionarTodo = (e) => {
    if (e.target.checked) setSeleccionados(clientesMostrar.map(c => c.COD_CLI));
    else setSeleccionados([]);
  };

  const toggleSeleccionarUnico = (id) => {
    if (seleccionados.includes(id)) setSeleccionados(seleccionados.filter(s => s !== id));
    else setSeleccionados([...seleccionados, id]);
  };

  // --- LÓGICA DE EXPORTACIÓN (CSV y PDF REAL) ---
  const exportarCSV = () => {
    const encabezados = ["Código", "Estado", "Nombre", "Apellidos", "DNI", "Alumno", "Edad", "Fecha Alta", "Direccion", "CP", "Ciudad", "Email", "Telefono"];
    const filas = clientesMostrar.map(c => [
      c.COD_CLI, c.ESTADO || "Activo", c.NOMBRE, c.APELLIDOS, c.DNI, c.ALUMNO, c.EDAD, c.FECHA_ALTA, c.DIRECCION, c.CP, c.CIUDAD, c.EMAIL, c.TELEFONO
    ]);
    const contenidoCSV = [encabezados.join(","), ...filas.map(f => f.map(str => `"${str}"`).join(","))].join("\n");
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Listado_Clientes_Academia.csv";
    link.click();
    setMostrarDescarga(false);
  };

  const exportarPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(18);
      doc.setTextColor(31, 41, 55);
      doc.text("Base de Datos: Clientes y Alumnos", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);
      
      const encabezados = [["Cód", "Estado", "Nombre y Apellidos", "DNI", "Alumno", "Edad", "Teléfono", "Ciudad"]];
      const filas = clientesMostrar.map(c => [
        c.COD_CLI, c.ESTADO || "Activo", `${c.NOMBRE} ${c.APELLIDOS}`, c.DNI, c.ALUMNO, c.EDAD || "-", c.TELEFONO, c.CIUDAD
      ]);

      autoTable(doc, {
        head: encabezados,
        body: filas,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { textColor: [255, 255, 255] } },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 1) {
            if (data.cell.raw === "Activo") data.cell.styles.textColor = [22, 163, 74];
            else data.cell.styles.textColor = [220, 38, 38];
          }
        }
      });

      // Mismo sistema de descarga que usa el CSV (infalible en Tauri)
      const pdfBlob = doc.output("blob");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = "Listado_Clientes_Academia.pdf";
      link.click();
      
      setMostrarDescarga(false);
    } catch (error) {
      alert("Error al generar el PDF: " + error.message);
      console.error(error);
    }
  };

  const abrirHistorialAlumno = (cliente) => {
    if (!cliente.ALUMNO) return;
    const añoActual = new Date().getFullYear();
    const mockHistorial = [
      { año: añoActual, curso: "Inglés B2 - Grupo Tarde" },
      { año: añoActual - 1, curso: "Inglés B1 - Grupo Mañana" },
      { año: añoActual - 2, curso: "Refuerzo General" }
    ];
    setAlumnoSeleccionado({ ...cliente, historial: mockHistorial });
  };

  const [sortConfig, setSortConfig] = useState({ key: "COD_CLI", direction: "ascending" });

  const solicitarOrden = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  const clientesMostrar = useMemo(() => {
    let filtrados = clientes;
    
    // Filtro de Búsqueda
    if (busqueda) {
      const b = busqueda.toLowerCase();
      filtrados = filtrados.filter(c => 
        c.NOMBRE.toLowerCase().includes(b) || 
        c.APELLIDOS.toLowerCase().includes(b) || 
        (c.DNI && c.DNI.toLowerCase().includes(b)) ||
        (c.ALUMNO && c.ALUMNO.toLowerCase().includes(b))
      );
    }

    // Filtro de Estado (Asegurando la retrocompatibilidad con clientes antiguos sin estado)
    if (filtros.estado) {
      filtrados = filtrados.filter(c => (c.ESTADO || "Activo") === filtros.estado);
    }
    
    // Filtros de Edad (Rango Dinámico)
    if (filtros.edadMinima) {
      filtrados = filtrados.filter(c => c.EDAD && parseInt(c.EDAD) >= parseInt(filtros.edadMinima));
    }
    if (filtros.edadMaxima) {
      filtrados = filtrados.filter(c => c.EDAD && parseInt(c.EDAD) <= parseInt(filtros.edadMaxima));
    }

    if (sortConfig.key !== null) {
      filtrados.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "ascending" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return filtrados;
  }, [clientes, busqueda, sortConfig, filtros]);

  const SortableHeader = ({ label, sortKey }) => (
    <th className="px-4 py-4 cursor-pointer hover:bg-gray-200 transition-colors group" onClick={() => solicitarOrden(sortKey)}>
      <div className="flex items-center gap-1 text-gray-700">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === sortKey ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
      </div>
    </th>
  );

  return (
    <div className="bg-white w-full p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[85vh]">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Base de Datos: Clientes</h1>
          <p className="text-sm text-gray-600">Gestiona los padres/tutores, alumnos y su información de contacto.</p>
        </div>
        {!mostrarFormulario && (
          <button 
            onClick={() => { setEditandoId(null); setNuevoCliente(estadoInicialCliente); setMostrarFormulario(true); }} 
            className="flex items-center font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Añadir Cliente
          </button>
        )}
      </div>

      {/* FORMULARIO */}
      {mostrarFormulario && (
        <div className="mb-6 p-6 bg-blue-50/50 border border-blue-100 rounded-lg shadow-inner shrink-0">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center">
            {editandoId ? <Edit className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
            {editandoId ? `Editando Cliente: ${editandoId}` : "Registrar Nuevo Cliente"}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700 mb-1">Código</label>
              <input type="text" value={editandoId || obtenerSiguienteId()} disabled className="border border-gray-200 rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed font-mono" />
            </div>
            
            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">DNI / NIF</label>
              <div className="flex gap-1">
                <input type="text" value={nuevoCliente.dniNumeros} onChange={handleDniNumeros} placeholder="12.345.678" className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-left" />
                <span className="text-gray-400 flex items-center">-</span>
                <input type="text" value={nuevoCliente.dniLetra} onChange={handleDniLetra} placeholder="X" className="w-10 border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold uppercase" />
              </div>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Nombre</label>
              <input type="text" name="NOMBRE" value={nuevoCliente.NOMBRE} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-gray-700 mb-1">Apellidos</label>
              <input type="text" name="APELLIDOS" value={nuevoCliente.APELLIDOS} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Tipo de Vía</label>
              <select name="tipoVia" value={nuevoCliente.tipoVia} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="C/">C/ (Calle)</option><option value="Av.">Av. (Avenida)</option><option value="Pl.">Pl. (Plaza)</option><option value="Pº">Pº (Paseo)</option><option value="Ctra.">Ctra. (Carretera)</option><option value="Cam.">Cam. (Camino)</option>
              </select>
            </div>
            
            <div className="flex flex-col md:col-span-3">
              <label className="font-semibold text-gray-700 mb-1">Nombre de la Vía</label>
              <input type="text" name="nombreVia" value={nuevoCliente.nombreVia} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Mayor" />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Número</label>
              <div className="flex">
                <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l p-2 text-gray-500 font-semibold select-none">n.º</span>
                <input type="text" name="numero" value={nuevoCliente.numero} onChange={handleChange} className="w-full border border-gray-300 rounded-r p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Portal / Puerta</label>
              <div className="flex">
                <select name="portalAbrev" value={nuevoCliente.portalAbrev} onChange={handleChange} className="bg-gray-50 border border-r-0 border-gray-300 rounded-l p-2 outline-none focus:ring-2 focus:ring-blue-500 text-xs">
                  <option value="Pta.">Pta.</option><option value="P.">P.</option><option value="Esc.">Esc.</option><option value="Blq.">Blq.</option>
                </select>
                <input type="text" name="portalNum" value={nuevoCliente.portalNum} onChange={handleChange} className="w-full border border-gray-300 rounded-r p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Piso / Letra</label>
              <div className="flex">
                <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l p-2 text-gray-500 font-semibold select-none">Apt.</span>
                <input 
                  type="text" name="pisoNum" value={nuevoCliente.pisoNum} onChange={handleChange} 
                  className="w-1/2 border border-r-0 border-gray-300 p-2 outline-none text-center focus:ring-2 focus:ring-blue-500" 
                  placeholder="3" 
                />
                <input 
                  type="text" name="pisoLetra" value={nuevoCliente.pisoLetra} onChange={handlePisoLetra} 
                  className="w-1/2 border border-gray-300 rounded-r p-2 outline-none text-center uppercase font-bold focus:ring-2 focus:ring-blue-500" 
                  placeholder="B" 
                />
              </div>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">C.P.</label>
              <input type="text" name="CP" value={nuevoCliente.CP} onChange={handleCP} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="06001" />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-gray-700 mb-1">Ciudad</label>
              <input type="text" name="CIUDAD" value={nuevoCliente.CIUDAD} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" name="EMAIL" value={nuevoCliente.EMAIL} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Teléfono</label>
              <input type="text" name="TELEFONO" value={nuevoCliente.TELEFONO} onChange={handleTelefono} placeholder="600 12 34 56" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-left" />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-gray-700 mb-1">Nombre Alumno/a</label>
              <input type="text" name="ALUMNO" value={nuevoCliente.ALUMNO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Edad</label>
              <input type="number" name="EDAD" value={nuevoCliente.EDAD} onChange={handleChange} placeholder="Años" className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Fecha Alta</label>
              <input type="date" name="FECHA_ALTA" value={nuevoCliente.FECHA_ALTA} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Estado</label>
              <select name="ESTADO" value={nuevoCliente.ESTADO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold">
                <option value="Activo">🟢 Activo</option>
                <option value="Inactivo">🔴 Inactivo</option>
              </select>
            </div>
            
            <div className="flex flex-col md:col-span-5 mt-2">
              <label className="font-semibold text-gray-700 mb-1">Notas / Observaciones</label>
              <textarea name="NOTAS" value={nuevoCliente.NOTAS} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[60px]"></textarea>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-blue-100">
            <button onClick={cerrarFormulario} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold py-2 px-6 rounded-lg transition-colors">Cancelar</button>
            <button onClick={guardarCliente} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors">
              {editandoId ? "Actualizar Cliente" : "Guardar Cliente"}
            </button>
          </div>
        </div>
      )}

      {/* --- TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 shrink-0">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, DNI o alumno..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto relative">
          <button onClick={handleEditar} disabled={seleccionados.length !== 1} className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors border ${seleccionados.length === 1 ? "bg-white text-blue-600 border-blue-200 hover:bg-blue-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"}`}>
            <Edit className="w-4 h-4 mr-2" /> Editar
          </button>

          <button onClick={handleEliminar} disabled={seleccionados.length === 0} className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors border ${seleccionados.length > 0 ? "bg-white text-red-600 border-red-200 hover:bg-red-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"}`}>
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar {seleccionados.length > 0 && `(${seleccionados.length})`}
          </button>

          <div className="relative">
            <button onClick={() => setMostrarFiltros(!mostrarFiltros)} className={`flex items-center px-3 py-2 rounded-lg font-semibold transition-colors border ${mostrarFiltros || filtros.estado || filtros.edadMinima || filtros.edadMaxima ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}>
              <Filter className="w-4 h-4" />
            </button>
            {mostrarFiltros && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-20">
                <h4 className="font-bold text-gray-800 mb-3">Filtrar Tabla</h4>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                  <select value={filtros.estado} onChange={(e) => setFiltros({...filtros, estado: e.target.value})} className="w-full border rounded p-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-sm">
                    <option value="">Todos</option>
                    <option value="Activo">Solo Activos</option>
                    <option value="Inactivo">Solo Inactivos (Bajas)</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rango de Edad</label>
                  <div className="flex gap-2">
                    <input type="number" value={filtros.edadMinima} onChange={(e) => setFiltros({...filtros, edadMinima: e.target.value})} className="w-1/2 border rounded p-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-sm" placeholder="Mínimo" />
                    <input type="number" value={filtros.edadMaxima} onChange={(e) => setFiltros({...filtros, edadMaxima: e.target.value})} className="w-1/2 border rounded p-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-sm" placeholder="Máximo" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setFiltros({ estado: "", edadMinima: "", edadMaxima: "" })} className="text-xs text-red-600 hover:underline">Limpiar</button>
                  <button onClick={() => setMostrarFiltros(false)} className="bg-blue-600 text-white text-xs px-3 py-1 rounded">Aplicar</button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setMostrarDescarga(!mostrarDescarga)} className="flex items-center px-3 py-2 rounded-lg font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
            </button>
            {mostrarDescarga && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-lg py-2 z-20">
                <button onClick={exportarCSV} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-semibold text-gray-700 flex items-center">
                  <TableIcon className="w-4 h-4 mr-2 text-green-600" /> Exportar a CSV
                </button>
                <button onClick={exportarPDF} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-semibold text-gray-700 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-red-600" /> Exportar a PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE CLIENTES */}
      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-gray-200">
        <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 uppercase tracking-wider text-gray-600 text-xs font-semibold select-none sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-4 w-10">
                <input type="checkbox" checked={seleccionados.length === clientesMostrar.length && clientesMostrar.length > 0} onChange={toggleSeleccionarTodo} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
              </th>
              <SortableHeader label="Cód" sortKey="COD_CLI" />
              <SortableHeader label="Estado" sortKey="ESTADO" />
              <SortableHeader label="Nombre" sortKey="NOMBRE" />
              <SortableHeader label="Apellidos" sortKey="APELLIDOS" />
              <SortableHeader label="DNI" sortKey="DNI" />
              <SortableHeader label="Alumno/a" sortKey="ALUMNO" />
              <SortableHeader label="Edad" sortKey="EDAD" />
              <SortableHeader label="Alta" sortKey="FECHA_ALTA" />
              <SortableHeader label="Dirección" sortKey="DIRECCION" />
              <SortableHeader label="Detalles Piso" sortKey="DIRECCION_PISO" />
              <SortableHeader label="CP" sortKey="CP" />
              <SortableHeader label="Ciudad" sortKey="CIUDAD" />
              <SortableHeader label="Email" sortKey="EMAIL" />
              <SortableHeader label="Teléfono" sortKey="TELEFONO" />
              <SortableHeader label="Notas" sortKey="NOTAS" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clientesMostrar.length === 0 ? (
              <tr>
                <td colSpan="16" className="px-4 py-8 text-center text-gray-500">
                  No se encontraron clientes.
                </td>
              </tr>
            ) : (
              clientesMostrar.map((cliente) => (
                <tr key={cliente.COD_CLI} className={`transition-colors ${seleccionados.includes(cliente.COD_CLI) ? "bg-blue-50" : "hover:bg-gray-50"} ${cliente.ESTADO === "Inactivo" ? "opacity-60 bg-gray-50" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={seleccionados.includes(cliente.COD_CLI)} onChange={() => toggleSeleccionarUnico(cliente.COD_CLI)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{cliente.COD_CLI}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                      cliente.ESTADO === 'Activo' || !cliente.ESTADO
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {cliente.ESTADO || "Activo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{cliente.NOMBRE}</td>
                  <td className="px-4 py-3 text-gray-700">{cliente.APELLIDOS}</td>
                  <td className="px-4 py-3 text-gray-700">{cliente.DNI}</td>
                  <td className="px-4 py-3 text-blue-600 font-bold">
                    {cliente.ALUMNO ? (
                      <button onClick={() => abrirHistorialAlumno(cliente)} className="hover:underline focus:outline-none">
                        {cliente.ALUMNO}
                      </button>
                    ) : (
                      <span className="text-gray-400 font-normal">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{cliente.EDAD ? `${cliente.EDAD}` : "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{cliente.FECHA_ALTA || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{cliente.DIRECCION}</td>
                  <td className="px-4 py-3 text-gray-700">{cliente.DIRECCION_PISO}</td>
                  <td className="px-4 py-3 text-gray-700">{cliente.CP}</td>
                  <td className="px-4 py-3 text-gray-700">{cliente.CIUDAD}</td>
                  <td className="px-4 py-3 text-gray-700">{cliente.EMAIL}</td>
                  <td className="px-4 py-3 text-gray-700">{cliente.TELEFONO}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate" title={cliente.NOTAS}>
                    {cliente.NOTAS}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE HISTORIAL DEL ALUMNO */}
      {alumnoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center">Historial de Alumno</h2>
                <p className="text-blue-100 text-sm opacity-90">Expediente Académico</p>
              </div>
              <button onClick={() => setAlumnoSeleccionado(null)} className="text-blue-100 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre</p>
                  <p className="font-semibold text-gray-900 text-lg">{alumnoSeleccionado.ALUMNO}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Edad</p>
                  <p className="font-semibold text-gray-900 text-lg">{alumnoSeleccionado.EDAD ? `${alumnoSeleccionado.EDAD} años` : "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-bold text-gray-800 mb-4">Cursos Realizados</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-gray-600 w-24">Año</th>
                      <th className="px-4 py-2 font-semibold text-gray-600">Curso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alumnoSeleccionado.historial.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-gray-500">{item.año}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{item.curso}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button onClick={() => setAlumnoSeleccionado(null)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold py-2 px-6 rounded-lg transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionClientes;