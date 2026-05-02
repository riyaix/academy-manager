import { useState, useMemo } from "react";
import { Plus, X, Edit, Trash2, ArrowUpDown, Search, Filter, Download, FileText, Table as TableIcon, BookOpen } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function GestionProductos({ productos, setProductos, clientes }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [mostrarDescarga, setMostrarDescarga] = useState(false);

  const estadoInicialProducto = {
    CURSO: "", CUOTA: "", TIPO: "Mensual", 
    ESTADO: "Activo", FECHA_CREACION: new Date().toISOString().split('T')[0]
  };

  const [nuevoProducto, setNuevoProducto] = useState(estadoInicialProducto);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);

  const obtenerSiguienteId = () => {
    if (productos.length === 0) return "P001";
    const ultimoNum = parseInt(productos[productos.length - 1].COD_PROD.replace("P", ""));
    return `P${(ultimoNum + 1).toString().padStart(3, '0')}`;
  };

  const handleChange = (e) => setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });

  const guardarProducto = () => {
    if (!nuevoProducto.CURSO || !nuevoProducto.CUOTA) {
      alert("Por favor, rellena al menos el nombre y la cuota.");
      return;
    }

    const datosProducto = {
      ...nuevoProducto,
      CUOTA: parseFloat(nuevoProducto.CUOTA)
    };

    if (editandoId) {
      setProductos(productos.map(p => p.COD_PROD === editandoId ? { ...datosProducto, COD_PROD: editandoId } : p));
    } else {
      setProductos([...productos, { ...datosProducto, COD_PROD: obtenerSiguienteId() }]);
    }

    cerrarFormulario();
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setNuevoProducto(estadoInicialProducto);
  };

  const handleEditar = () => {
    if (seleccionados.length !== 1) return;
    const prodAEditar = productos.find(p => p.COD_PROD === seleccionados[0]);
    if (prodAEditar) {
      setNuevoProducto(prodAEditar);
      setEditandoId(prodAEditar.COD_PROD);
      setMostrarFormulario(true);
    }
  };

  const handleEliminar = () => {
    if (seleccionados.length === 0) return;
    if (confirm(`¿Estás seguro de que deseas eliminar ${seleccionados.length} curso(s)?`)) {
      setProductos(productos.filter(p => !seleccionados.includes(p.COD_PROD)));
      setSeleccionados([]);
    }
  };

  const toggleSeleccionarTodo = (e) => {
    if (e.target.checked) setSeleccionados(productosMostrar.map(p => p.COD_PROD));
    else setSeleccionados([]);
  };

  const toggleSeleccionarUnico = (id) => {
    if (seleccionados.includes(id)) setSeleccionados(seleccionados.filter(s => s !== id));
    else setSeleccionados([...seleccionados, id]);
  };

  // --- LÓGICA DEL MODAL DE DETALLES DEL CURSO ---
  const abrirDetallesCurso = (curso) => {
    // MOCK DATA: Simulamos que buscamos en la base de datos de "Matriculaciones"
    // Esto lo conectaremos de verdad cuando creemos el sistema de matriculación.
    const alumnosActivos = clientes.slice(0, 2).map(c => ({
      ...c, estadoMatricula: "Activo"
    }));
    
    const alumnosHistoricos = clientes.slice(2, 4).map(c => ({
      ...c, estadoMatricula: "Baja", fechaUltimaClase: "15/12/2025"
    }));

    setCursoSeleccionado({
      ...curso,
      activos: alumnosActivos,
      historico: alumnosHistoricos
    });
  };

  // --- EXPORTACIÓN ---
  const exportarCSV = () => {
    const encabezados = ["Código", "Curso", "Tipo", "Cuota", "Estado", "Fecha Creacion"];
    const filas = productosMostrar.map(p => [
      p.COD_PROD, p.CURSO, p.TIPO, p.CUOTA.toFixed(2), p.ESTADO || "Activo", p.FECHA_CREACION || "-"
    ]);
    const contenidoCSV = [encabezados.join(","), ...filas.map(f => f.map(str => `"${str}"`).join(","))].join("\n");
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Catalogo_Cursos.csv";
    link.click();
    setMostrarDescarga(false);
  };

  const exportarPDF = () => {
    try {
      const doc = new jsPDF('portrait'); // Retrato para cursos queda mejor
      doc.setFontSize(18);
      doc.setTextColor(31, 41, 55);
      doc.text("Catálogo de Cursos y Cuotas", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);
      
      const encabezados = [["Cód", "Estado", "Nombre del Curso", "Tipo", "Cuota (€)", "Creación"]];
      const filas = productosMostrar.map(p => [
        p.COD_PROD, p.ESTADO || "Activo", p.CURSO, p.TIPO, `${p.CUOTA.toFixed(2)} €`, p.FECHA_CREACION || "-"
      ]);

      autoTable(doc, {
        head: encabezados,
        body: filas,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [147, 51, 234], textColor: 255 }, // Morado para diferenciar de clientes
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: { 0: { fontStyle: 'bold' }, 4: { halign: 'right' } },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 1) {
            if (data.cell.raw === "Activo") data.cell.styles.textColor = [22, 163, 74];
            else data.cell.styles.textColor = [220, 38, 38];
          }
        }
      });

      const pdfBlob = doc.output("blob");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = "Catalogo_Cursos.pdf";
      link.click();
      setMostrarDescarga(false);
    } catch (error) {
      alert("Error al generar el PDF: " + error.message);
    }
  };

  // --- FILTRADO Y ORDENACIÓN ---
  const [sortConfig, setSortConfig] = useState({ key: "COD_PROD", direction: "ascending" });

  const solicitarOrden = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  const productosMostrar = useMemo(() => {
    let filtrados = productos;
    
    if (busqueda) {
      const b = busqueda.toLowerCase();
      filtrados = filtrados.filter(p => 
        p.CURSO.toLowerCase().includes(b) || 
        p.COD_PROD.toLowerCase().includes(b)
      );
    }

    if (sortConfig.key !== null) {
      filtrados.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "ascending" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return filtrados;
  }, [productos, busqueda, sortConfig]);

  const SortableHeader = ({ label, sortKey, isRight = false }) => (
    <th className={`px-4 py-4 cursor-pointer hover:bg-gray-200 transition-colors group ${isRight ? 'text-right' : 'text-left'}`} onClick={() => solicitarOrden(sortKey)}>
      <div className={`flex items-center gap-1 text-gray-700 ${isRight ? 'justify-end' : ''}`}>
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === sortKey ? "text-purple-600" : "text-gray-400 group-hover:text-gray-600"}`} />
      </div>
    </th>
  );

  return (
    <div className="bg-white w-full p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[85vh]">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Catálogo: Cursos y Cuotas</h1>
          <p className="text-sm text-gray-600">Gestiona los servicios, clases y matrículas que ofreces en la academia.</p>
        </div>
        {!mostrarFormulario && (
          <button 
            onClick={() => { setEditandoId(null); setNuevoProducto(estadoInicialProducto); setMostrarFormulario(true); }} 
            className="flex items-center font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
          >
            <Plus className="w-5 h-5 mr-2" /> Añadir Curso
          </button>
        )}
      </div>

      {/* FORMULARIO */}
      {mostrarFormulario && (
        <div className="mb-6 p-6 bg-purple-50/50 border border-purple-100 rounded-lg shadow-inner shrink-0">
          <h3 className="font-bold text-purple-800 mb-4 flex items-center">
            {editandoId ? <Edit className="w-5 h-5 mr-2" /> : <BookOpen className="w-5 h-5 mr-2" />}
            {editandoId ? `Editando Curso: ${editandoId}` : "Registrar Nuevo Servicio / Cuota"}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700 mb-1">Código</label>
              <input type="text" value={editandoId || obtenerSiguienteId()} disabled className="border border-gray-200 rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed font-mono" />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-gray-700 mb-1">Nombre del Curso / Cuota</label>
              <input type="text" name="CURSO" value={nuevoProducto.CURSO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ej. Taller de Robótica" />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Tipo de Cobro</label>
              <select name="TIPO" value={nuevoProducto.TIPO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                <option value="Mensual">Mensual</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Anual">Anual</option>
                <option value="Único">Pago Único</option>
              </select>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Cuota Base (€)</label>
              <input type="number" name="CUOTA" step="0.01" value={nuevoProducto.CUOTA} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right font-mono" placeholder="0.00" />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-gray-700 mb-1">Estado</label>
              <select name="ESTADO" value={nuevoProducto.ESTADO} onChange={handleChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white font-bold">
                <option value="Activo">🟢 Activo</option>
                <option value="Inactivo">🔴 Inactivo</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-purple-100">
            <button onClick={cerrarFormulario} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-2 px-6 rounded-lg transition-colors cursor-pointer">Cancelar</button>
            <button onClick={guardarProducto} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors cursor-pointer">
              {editandoId ? "Actualizar Curso" : "Guardar Curso"}
            </button>
          </div>
        </div>
      )}

      {/* --- TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 shrink-0">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input type="text" placeholder="Buscar por nombre o código..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto relative">
          <button onClick={handleEditar} disabled={seleccionados.length !== 1} className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors border cursor-pointer ${seleccionados.length === 1 ? "bg-white text-purple-600 border-purple-200 hover:bg-purple-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"}`}>
            <Edit className="w-4 h-4 mr-2" /> Editar
          </button>

          <button onClick={handleEliminar} disabled={seleccionados.length === 0} className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors border cursor-pointer ${seleccionados.length > 0 ? "bg-white text-red-600 border-red-200 hover:bg-red-50" : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"}`}>
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar {seleccionados.length > 0 && `(${seleccionados.length})`}
          </button>

          <div className="relative">
            <button onClick={() => setMostrarDescarga(!mostrarDescarga)} className="flex items-center px-3 py-2 rounded-lg font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer">
              <Download className="w-4 h-4" />
            </button>
            {mostrarDescarga && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-lg py-2 z-20">
                <button onClick={exportarCSV} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-semibold text-gray-700 flex items-center cursor-pointer">
                  <TableIcon className="w-4 h-4 mr-2 text-green-600" /> Exportar a CSV
                </button>
                <button onClick={exportarPDF} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-semibold text-gray-700 flex items-center cursor-pointer">
                  <FileText className="w-4 h-4 mr-2 text-red-600" /> Exportar a PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-gray-200">
        <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 uppercase tracking-wider text-gray-600 text-xs font-semibold select-none sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-4 w-10">
                <input type="checkbox" checked={seleccionados.length === productosMostrar.length && productosMostrar.length > 0} onChange={toggleSeleccionarTodo} className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer" />
              </th>
              <SortableHeader label="Cód" sortKey="COD_PROD" />
              <SortableHeader label="Estado" sortKey="ESTADO" />
              <SortableHeader label="Curso / Servicio" sortKey="CURSO" />
              <SortableHeader label="Tipo" sortKey="TIPO" />
              <SortableHeader label="Creado" sortKey="FECHA_CREACION" />
              <SortableHeader label="Cuota Base" sortKey="CUOTA" isRight={true} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {productosMostrar.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No se encontraron cursos.</td></tr>
            ) : (
              productosMostrar.map((prod) => (
                <tr key={prod.COD_PROD} className={`transition-colors ${seleccionados.includes(prod.COD_PROD) ? "bg-purple-50" : "hover:bg-gray-50"} ${prod.ESTADO === "Inactivo" ? "opacity-60 bg-gray-50" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={seleccionados.includes(prod.COD_PROD)} onChange={() => toggleSeleccionarUnico(prod.COD_PROD)} className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{prod.COD_PROD}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${prod.ESTADO === 'Activo' || !prod.ESTADO ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {prod.ESTADO || "Activo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-600">
                    <button onClick={() => abrirDetallesCurso(prod)} className="hover:underline focus:outline-none cursor-pointer text-left">
                      {prod.CURSO}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{prod.TIPO}</td>
                  <td className="px-4 py-3 text-gray-600">{prod.FECHA_CREACION || "-"}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{prod.CUOTA.toFixed(2)} €</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DETALLES DEL CURSO (MATRICULACIONES) */}
      {cursoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Cabecera Modal */}
            <div className="p-6 bg-purple-700 text-white flex justify-between items-center rounded-t-xl shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center">{cursoSeleccionado.CURSO}</h2>
                <p className="text-purple-200 text-sm opacity-90 mt-1">Gestión de Alumnos y Expedientes</p>
              </div>
              <button onClick={() => setCursoSeleccionado(null)} className="text-purple-200 hover:text-white transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Resumen del Curso */}
            <div className="p-6 bg-purple-50 border-b border-purple-100 shrink-0">
              <div className="grid grid-cols-4 gap-4">
                <div><p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">Código</p><p className="font-semibold text-gray-900">{cursoSeleccionado.COD_PROD}</p></div>
                <div><p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">Cuota Base</p><p className="font-semibold text-gray-900">{cursoSeleccionado.CUOTA.toFixed(2)} € / {cursoSeleccionado.TIPO}</p></div>
                <div><p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">Creación</p><p className="font-semibold text-gray-900">{cursoSeleccionado.FECHA_CREACION || "Desconocida"}</p></div>
                <div><p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">Estado</p><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${cursoSeleccionado.ESTADO === 'Activo' || !cursoSeleccionado.ESTADO ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{cursoSeleccionado.ESTADO || "Activo"}</span></div>
              </div>
            </div>

            {/* Tablas de Alumnos (Con Scroll Integrado) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              
              {/* Tabla Activos */}
              <div>
                <h3 className="font-bold text-gray-800 border-b pb-2 mb-3 flex justify-between items-center">
                  <span>🟢 Alumnos Actualmente Matriculados</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{cursoSeleccionado.activos.length} activos</span>
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-gray-600 w-24">ID Cliente</th>
                        <th className="px-4 py-2 font-semibold text-gray-600">Alumno/a</th>
                        <th className="px-4 py-2 font-semibold text-gray-600 w-24 text-center">Edad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {cursoSeleccionado.activos.length === 0 ? (
                        <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-500 italic">No hay alumnos activos en este curso.</td></tr>
                      ) : (
                        cursoSeleccionado.activos.map(alumno => (
                          <tr key={alumno.COD_CLI} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono text-gray-500 text-xs">{alumno.COD_CLI}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{alumno.ALUMNO || `${alumno.NOMBRE} ${alumno.APELLIDOS}`}</td>
                            <td className="px-4 py-2 text-gray-600 text-center">{alumno.EDAD || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla Históricos */}
              <div>
                <h3 className="font-bold text-gray-800 border-b pb-2 mb-3 flex justify-between items-center">
                  <span>🔴 Histórico de Bajas (Antiguos Alumnos)</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{cursoSeleccionado.historico.length} bajas</span>
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-gray-600 w-24">ID Cliente</th>
                        <th className="px-4 py-2 font-semibold text-gray-600">Alumno/a</th>
                        <th className="px-4 py-2 font-semibold text-gray-600 w-24 text-center">Edad</th>
                        <th className="px-4 py-2 font-semibold text-gray-600 w-32">Última Clase</th>
                        <th className="px-4 py-2 font-semibold text-gray-600 w-24 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white opacity-80">
                      {cursoSeleccionado.historico.length === 0 ? (
                        <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500 italic">No hay registros históricos.</td></tr>
                      ) : (
                        cursoSeleccionado.historico.map(alumno => (
                          <tr key={alumno.COD_CLI} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono text-gray-500 text-xs">{alumno.COD_CLI}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{alumno.ALUMNO || `${alumno.NOMBRE} ${alumno.APELLIDOS}`}</td>
                            <td className="px-4 py-2 text-gray-600 text-center">{alumno.EDAD || "-"}</td>
                            <td className="px-4 py-2 text-gray-600">{alumno.fechaUltimaClase}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">BAJA</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0 rounded-b-xl">
              <button onClick={() => setCursoSeleccionado(null)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold py-2 px-6 rounded-lg transition-colors cursor-pointer">
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default GestionProductos;