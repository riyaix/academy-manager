import { useState, useMemo } from "react";
import { Users, Plus, Clock, BookOpen, Trash2, UserPlus, Search, Edit, FolderKanban, UserCheck, ArrowUpDown, Printer, Archive, Phone } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function GestionGrupos({ clientes, productos, grupos, setGrupos, matriculas, setMatriculas }) {
  const [pestañaActiva, setPestañaActiva] = useState("directorio");
  
  const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  
  const [busquedaMatriculas, setBusquedaMatriculas] = useState("");
  const [busquedaGrupos, setBusquedaGrupos] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Activo"); 
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "ascending" });
  
  const [editandoGrupoId, setEditandoGrupoId] = useState(null);

  const estadoInicialGrupo = {
    nombre: "", idProducto: "", dias: [], horaInicio: "16:00", horaFin: "17:00", 
    color: "bg-blue-500", fechaInicio: "", fechaFin: "", capacidad: "", estado: "Activo"
  };
  const [nuevoGrupo, setNuevoGrupo] = useState(estadoInicialGrupo);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const paletaColores = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

  const obtenerSiguienteIdGrupo = () => `G${(grupos.length + 1).toString().padStart(3, '0')}`;

  const toggleDia = (dia) => {
    const nuevosDias = nuevoGrupo.dias.includes(dia) ? nuevoGrupo.dias.filter(d => d !== dia) : [...nuevoGrupo.dias, dia];
    setNuevoGrupo({ ...nuevoGrupo, dias: nuevosDias });
  };

  const guardarGrupo = () => {
    if (!nuevoGrupo.nombre || !nuevoGrupo.idProducto || nuevoGrupo.dias.length === 0) {
      alert("Rellena el nombre, selecciona un curso base y elige al menos un día.");
      return;
    }

    if (editandoGrupoId) {
      setGrupos(grupos.map(g => g.id === editandoGrupoId ? { ...nuevoGrupo, id: editandoGrupoId } : g));
      if (grupoSeleccionado?.id === editandoGrupoId) setGrupoSeleccionado({ ...nuevoGrupo, id: editandoGrupoId });
    } else {
      setGrupos([...grupos, { ...nuevoGrupo, id: obtenerSiguienteIdGrupo() }]);
    }
    
    cancelarFormularioGrupo();
  };

  const editarGrupo = (grupo, e) => {
    if (e) e.stopPropagation();
    setNuevoGrupo({ ...estadoInicialGrupo, ...grupo }); 
    setEditandoGrupoId(grupo.id);
    setMostrarFormGrupo(true);
  };

  const cancelarFormularioGrupo = () => {
    setMostrarFormGrupo(false);
    setEditandoGrupoId(null);
    setNuevoGrupo(estadoInicialGrupo);
  };

  const eliminarGrupo = (id, e) => {
    if (e) e.stopPropagation();
    if(confirm("¿Borrar este grupo? También se borrarán sus matriculaciones.")) {
      setGrupos(grupos.filter(g => g.id !== id));
      setMatriculas(matriculas.filter(m => m.idGrupo !== id));
      if(grupoSeleccionado?.id === id) setGrupoSeleccionado(null);
    }
  };

  const [clienteAñadir, setClienteAñadir] = useState("");

  const matricularAlumno = () => {
    if (!clienteAñadir || !grupoSeleccionado) return;
    
    const alumnosActivos = matriculas.filter(m => m.idGrupo === grupoSeleccionado.id && m.estado === "Activo").length;
    if (grupoSeleccionado.capacidad && alumnosActivos >= parseInt(grupoSeleccionado.capacidad)) {
      if(!confirm("Este grupo ha alcanzado su capacidad máxima. ¿Deseas matricularlo de todos modos?")) return;
    }

    if (matriculas.some(m => m.idCliente === clienteAñadir && m.idGrupo === grupoSeleccionado.id && m.estado === "Activo")) {
      alert("Este alumno ya está ACTIVO en este grupo.");
      return;
    }

    const nuevaMatricula = {
      id: `M${Date.now()}`, idCliente: clienteAñadir, idGrupo: grupoSeleccionado.id,
      fechaAlta: new Date().toISOString().split('T')[0], estado: "Activo"
    };

    setMatriculas([...matriculas, nuevaMatricula]);
    setClienteAñadir("");
  };

  const reMatricularAlumno = (idCliente) => {
    const alumnosActivos = matriculas.filter(m => m.idGrupo === grupoSeleccionado.id && m.estado === "Activo").length;
    if (grupoSeleccionado.capacidad && alumnosActivos >= parseInt(grupoSeleccionado.capacidad)) {
      if(!confirm("Capacidad máxima alcanzada. ¿Continuar con el alta?")) return;
    }

    const nuevaMatricula = { id: `M${Date.now()}`, idCliente: idCliente, idGrupo: grupoSeleccionado.id, fechaAlta: new Date().toISOString().split('T')[0], estado: "Activo" };
    setMatriculas([...matriculas, nuevaMatricula]);
  };

  const darBajaMatricula = (idMatricula) => {
    if(confirm("¿Dar de baja a este alumno del grupo?")) {
      setMatriculas(matriculas.map(m => m.id === idMatricula ? { ...m, estado: "Baja", fechaBaja: new Date().toISOString().split('T')[0] } : m));
    }
  };

  const imprimirAsistencia = () => {
    if (!grupoSeleccionado) return;
    try {
      const doc = new jsPDF('portrait');
      
      doc.setFontSize(18);
      doc.setTextColor(31, 41, 55);
      doc.text(`Lista de Asistencia: ${grupoSeleccionado.nombre}`, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Horario: ${grupoSeleccionado.horaInicio} - ${grupoSeleccionado.horaFin} | Días: ${grupoSeleccionado.dias.join(", ")}`, 14, 28);
      
      const alumnosDelGrupo = matriculas
        .filter(m => m.idGrupo === grupoSeleccionado.id && m.estado === "Activo")
        .map(m => {
          const c = clientes.find(cli => cli.COD_CLI === m.idCliente);
          return c ? (c.ALUMNO || `${c.NOMBRE} ${c.APELLIDOS}`) : "Alumno Desconocido";
        })
        .sort((a, b) => a.localeCompare(b));

      const encabezados = [["Nº", "Nombre del Alumno", "L", "M", "X", "J", "V"]];
      const filas = alumnosDelGrupo.map((nombre, index) => [index + 1, nombre, "", "", "", "", ""]);

      filas.push(["", "", "", "", "", "", ""]);
      filas.push(["", "", "", "", "", "", ""]);

      autoTable(doc, {
        head: encabezados,
        body: filas,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3, minCellHeight: 10 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: { 
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 15 }, 3: { cellWidth: 15 }, 4: { cellWidth: 15 }, 5: { cellWidth: 15 }, 6: { cellWidth: 15 }
        }
      });

      const pdfBlob = doc.output("blob");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `Asistencia_${grupoSeleccionado.id}.pdf`;
      link.click();
    } catch (error) {
      alert("Error al generar el PDF: " + error.message);
    }
  };

  const solicitarOrden = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  const gruposMostrar = useMemo(() => {
    let filtrados = grupos;
    
    if (filtroEstado !== "Todos") {
      filtrados = filtrados.filter(g => (g.estado || "Activo") === filtroEstado);
    }

    if (busquedaGrupos) {
      const b = busquedaGrupos.toLowerCase();
      filtrados = filtrados.filter(g => g.nombre.toLowerCase().includes(b) || g.id.toLowerCase().includes(b));
    }

    if (sortConfig.key !== null) {
      filtrados.sort((a, b) => {
        let valorA = a[sortConfig.key];
        let valorB = b[sortConfig.key];

        if (sortConfig.key === "numAlumnos") {
          valorA = matriculas.filter(m => m.idGrupo === a.id && m.estado === "Activo").length;
          valorB = matriculas.filter(m => m.idGrupo === b.id && m.estado === "Activo").length;
        }

        if (valorA < valorB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valorA > valorB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return filtrados;
  }, [grupos, busquedaGrupos, filtroEstado, sortConfig, matriculas]);

  const SortableHeader = ({ label, sortKey, isCenter = false }) => (
    <th className={`px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors group ${isCenter ? 'text-center' : 'text-left'}`} onClick={() => solicitarOrden(sortKey)}>
      <div className={`flex items-center gap-1 text-gray-700 ${isCenter ? 'justify-center' : ''}`}>
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === sortKey ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
      </div>
    </th>
  );

  return (
    <div className="bg-white w-full p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[85vh]">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-100 pb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Grupos y Matrículas</h1>
          <p className="text-sm text-gray-600">Administra tus clases, aforos y matricula a los alumnos.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button onClick={() => setPestañaActiva("directorio")} className={`flex items-center px-5 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${pestañaActiva === "directorio" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <FolderKanban className="w-4 h-4 mr-2" /> Directorio
          </button>
          <button onClick={() => setPestañaActiva("matriculas")} className={`flex items-center px-5 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${pestañaActiva === "matriculas" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <UserCheck className="w-4 h-4 mr-2" /> Matriculaciones
          </button>
        </div>
      </div>

      {mostrarFormGrupo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center">
                {editandoGrupoId ? <Edit className="w-5 h-5 mr-2" /> : <Clock className="w-5 h-5 mr-2" />}
                {editandoGrupoId ? `Editando Grupo: ${editandoGrupoId}` : "Crear Nuevo Grupo"}
              </h3>
              {!editandoGrupoId && <span className="font-mono text-blue-200">{obtenerSiguienteIdGrupo()}</span>}
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4 text-sm bg-gray-50">
              
              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-gray-700 mb-1">Nombre</label>
                <input type="text" value={nuevoGrupo.nombre} onChange={e => setNuevoGrupo({...nuevoGrupo, nombre: e.target.value})} placeholder="Ej. B1 Martes" className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              
              <div className="flex flex-col md:col-span-3">
                <label className="font-semibold text-gray-700 mb-1">Curso Vinculado</label>
                <select value={nuevoGrupo.idProducto} onChange={e => setNuevoGrupo({...nuevoGrupo, idProducto: e.target.value})} className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
                  <option value="">Seleccionar curso base...</option>
                  {productos.map(p => <option key={p.COD_PROD} value={p.COD_PROD}>{p.CURSO}</option>)}
                </select>
              </div>

              <div className="flex flex-col md:col-span-1">
                <label className="font-semibold text-gray-700 mb-1 text-center">Estado</label>
                <select value={nuevoGrupo.estado} onChange={e => setNuevoGrupo({...nuevoGrupo, estado: e.target.value})} className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer font-bold text-center">
                  <option value="Activo">Activo</option>
                  <option value="Archivado">Archivado</option>
                </select>
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-gray-700 mb-1">Fecha Inicio (Opc.)</label>
                <input type="date" value={nuevoGrupo.fechaInicio} onChange={e => setNuevoGrupo({...nuevoGrupo, fechaInicio: e.target.value})} className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white" />
              </div>
              
              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-gray-700 mb-1">Fecha Fin (Opc.)</label>
                <input type="date" value={nuevoGrupo.fechaFin} onChange={e => setNuevoGrupo({...nuevoGrupo, fechaFin: e.target.value})} className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white" />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-gray-700 mb-1">Aforo Máximo (Opc.)</label>
                <input type="number" value={nuevoGrupo.capacidad} onChange={e => setNuevoGrupo({...nuevoGrupo, capacidad: e.target.value})} placeholder="Ilimitado" className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>

              <div className="flex flex-col md:col-span-6 border-t border-gray-200 pt-4 mt-2">
                <label className="font-semibold text-gray-700 mb-2">Días de la semana</label>
                <div className="flex gap-2">
                  {diasSemana.map(dia => (
                    <button key={dia} onClick={() => toggleDia(dia)} className={`flex-1 py-2 rounded-lg border font-bold text-xs transition-colors cursor-pointer ${nuevoGrupo.dias.includes(dia) ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
                      {dia}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-gray-700 mb-1">Hora Inicio</label>
                <input type="time" step="900" value={nuevoGrupo.horaInicio} onChange={e => setNuevoGrupo({...nuevoGrupo, horaInicio: e.target.value})} className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white" />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-gray-700 mb-1">Hora Fin</label>
                <input type="time" step="900" value={nuevoGrupo.horaFin} onChange={e => setNuevoGrupo({...nuevoGrupo, horaFin: e.target.value})} className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white" />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-gray-700 mb-1">Color (Calendario)</label>
                <div className="flex gap-1 h-10 items-center bg-white border border-gray-200 rounded-lg px-2">
                  {paletaColores.slice(0,3).map(color => (
                    <button key={color} onClick={() => setNuevoGrupo({...nuevoGrupo, color})} className={`w-6 h-6 rounded-full shadow-sm cursor-pointer transition-all ${color} ${nuevoGrupo.color === color ? 'ring-2 ring-blue-500 scale-110' : 'opacity-70'}`}></button>
                  ))}
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                  <input type="color" value={nuevoGrupo.color.startsWith('#') ? nuevoGrupo.color : '#ffffff'} onChange={e => setNuevoGrupo({...nuevoGrupo, color: e.target.value})} className="w-7 h-7 p-0 border-0 rounded cursor-pointer shadow-sm" title="Personalizado" />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
              <button onClick={cancelarFormularioGrupo} className="text-gray-600 border border-gray-300 hover:bg-gray-50 font-bold py-2 px-6 rounded-lg cursor-pointer transition-colors">Cancelar</button>
              <button onClick={guardarGrupo} className="bg-green-600 text-white hover:bg-green-700 font-bold py-2 px-6 rounded-lg shadow-sm cursor-pointer transition-colors">
                {editandoGrupoId ? "Actualizar Grupo" : "Guardar Grupo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          PESTAÑA 1: DIRECTORIO DE GRUPOS
          ========================================= */}
      {pestañaActiva === "directorio" && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div className="flex flex-1 max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input type="text" placeholder="Buscar por código o nombre..." value={busquedaGrupos} onChange={e => setBusquedaGrupos(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="border border-gray-300 rounded-lg px-4 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-gray-700 cursor-pointer">
                <option value="Todos">Todos</option>
                <option value="Activo">Solo Activos</option>
                <option value="Archivado">Solo Archivados</option>
              </select>
            </div>
            
            <button onClick={() => setMostrarFormGrupo(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center shadow-sm cursor-pointer transition-colors">
              <Plus className="w-5 h-5 mr-1" /> Crear Grupo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 uppercase tracking-wider text-gray-600 text-xs font-bold sticky top-0 border-b border-gray-200 z-10">
                <tr>
                  <SortableHeader label="Cód" sortKey="id" />
                  <SortableHeader label="Grupo" sortKey="nombre" />
                  <SortableHeader label="Curso Base" sortKey="idProducto" />
                  <th className="px-6 py-4">Horario y Días</th>
                  <th className="px-6 py-4">Fechas</th>
                  <SortableHeader label="Aforo" sortKey="numAlumnos" isCenter={true} />
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {gruposMostrar.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-500">No hay grupos que coincidan.</td></tr>
                ) : (
                  gruposMostrar.map(grupo => {
                    const isHex = grupo.color.startsWith('#');
                    const numAlumnos = matriculas.filter(m => m.idGrupo === grupo.id && m.estado === "Activo").length;
                    const nombreCurso = productos.find(p => p.COD_PROD === grupo.idProducto)?.CURSO || "Curso no encontrado";
                    
                    const isArchivado = grupo.estado === "Archivado";
                    const isLleno = grupo.capacidad && numAlumnos >= parseInt(grupo.capacidad);
                    
                    return (
                      <tr key={grupo.id} className={`hover:bg-gray-50 transition-colors ${isArchivado ? 'opacity-60 bg-gray-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full shadow-sm ${!isHex ? grupo.color : ''}`} style={isHex ? {backgroundColor: grupo.color} : {}}></div>
                            <span className="font-mono text-gray-500 font-bold">{grupo.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-gray-900 flex items-center gap-2">
                          {grupo.nombre}
                          {isArchivado && <Archive className="w-3 h-3 text-gray-400" title="Archivado" />}
                        </td>
                        <td className="px-6 py-4 font-semibold text-blue-600">{nombreCurso}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-700">{grupo.horaInicio} - {grupo.horaFin}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{grupo.dias.join(", ")}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {grupo.fechaInicio || grupo.fechaFin ? (
                            <>
                              <p className="text-xs">Inicio: <span className="font-semibold">{grupo.fechaInicio || "-"}</span></p>
                              <p className="text-xs mt-0.5">Fin: <span className="font-semibold">{grupo.fechaFin || "-"}</span></p>
                            </>
                          ) : <span className="text-xs text-gray-400 italic">No definidas</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${isArchivado ? 'bg-gray-200 text-gray-600' : isLleno ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                            {numAlumnos} {grupo.capacidad ? `/ ${grupo.capacidad}` : 'Activos'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => editarGrupo(grupo)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors" title="Editar Grupo"><Edit className="w-5 h-5"/></button>
                          <button onClick={() => eliminarGrupo(grupo.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors ml-1" title="Eliminar Grupo"><Trash2 className="w-5 h-5"/></button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          PESTAÑA 2: MATRICULACIONES
          ========================================= */}
      {pestañaActiva === "matriculas" && (
        <div className="flex-1 flex flex-col md:flex-row gap-6">
          
          <div className="w-full md:w-1/3 flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
              <h3 className="font-bold text-gray-800 flex items-center"><BookOpen className="w-5 h-5 mr-2" /> Selecciona un Grupo</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {grupos.filter(g => g.estado !== "Archivado").length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center mt-4">No tienes grupos activos.</p>
              ) : (
                grupos.filter(g => g.estado !== "Archivado").map(grupo => {
                  const numAlumnos = matriculas.filter(m => m.idGrupo === grupo.id && m.estado === "Activo").length;
                  const isHex = grupo.color.startsWith('#');
                  const isLleno = grupo.capacidad && numAlumnos >= parseInt(grupo.capacidad);

                  return (
                    <div 
                      key={grupo.id} 
                      onClick={() => setGrupoSeleccionado(grupo)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${grupoSeleccionado?.id === grupo.id ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${!isHex ? grupo.color : ''}`} style={isHex ? {backgroundColor: grupo.color} : {}}></span>
                          <h4 className="font-extrabold text-gray-800 text-sm truncate">{grupo.nombre}</h4>
                        </div>
                        <span className="text-xs font-mono text-gray-400 font-bold ml-2">{grupo.id}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-bold mb-1 pl-5">{grupo.dias.join(", ")} • {grupo.horaInicio}</p>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isLleno ? 'text-red-800 bg-red-100' : 'text-blue-800 bg-blue-100'}`}>
                          {numAlumnos} {grupo.capacidad ? `/ ${grupo.capacidad}` : ''} Activos
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Click para gestionar</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="w-full md:w-2/3 flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {!grupoSeleccionado ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                <Users className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-bold">Selecciona un grupo</p>
              </div>
            ) : (
              <>
                <div className={`p-6 text-white ${!grupoSeleccionado.color.startsWith('#') ? grupoSeleccionado.color : ''}`} style={grupoSeleccionado.color.startsWith('#') ? {backgroundColor: grupoSeleccionado.color} : {}}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black mb-1 flex items-center gap-3">
                        {grupoSeleccionado.nombre}
                        <span className="text-sm font-mono bg-black/20 px-2 py-1 rounded">{grupoSeleccionado.id}</span>
                        {/* MEDIDOR DE AFORO EN CABECERA */}
                        {(() => {
                          const activos = matriculas.filter(m => m.idGrupo === grupoSeleccionado.id && m.estado === "Activo").length;
                          const isLleno = grupoSeleccionado.capacidad && activos >= parseInt(grupoSeleccionado.capacidad);
                          return (
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ml-2 ${isLleno ? 'bg-red-500/80 text-white shadow-sm' : 'bg-white/20'}`}>
                              {activos} {grupoSeleccionado.capacidad ? `/ ${grupoSeleccionado.capacidad}` : 'Alumnos'}
                            </span>
                          );
                        })()}
                      </h2>
                      <p className="opacity-90 font-bold">{productos.find(p => p.COD_PROD === grupoSeleccionado.idProducto)?.CURSO || "Curso no encontrado"}</p>
                    </div>
                    <div className="text-right">
                      <button onClick={imprimirAsistencia} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer text-sm shadow-sm">
                        <Printer className="w-4 h-4" /> Imprimir Asistencia
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-3 shadow-inner">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input type="text" placeholder="Buscar alumno matriculado..." value={busquedaMatriculas} onChange={e => setBusquedaMatriculas(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex flex-1 gap-2">
                    <select value={clienteAñadir} onChange={e => setClienteAñadir(e.target.value)} className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium cursor-pointer">
                      <option value="">Buscar en base de datos...</option>
                      {clientes.filter(c => c.ESTADO !== "Inactivo").map(c => (
                        <option key={c.COD_CLI} value={c.COD_CLI}>{c.ALUMNO || `${c.NOMBRE} ${c.APELLIDOS}`}</option>
                      ))}
                    </select>
                    <button onClick={matricularAlumno} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-bold flex items-center transition-colors cursor-pointer shadow-sm">
                      <UserPlus className="w-4 h-4 mr-2" /> Añadir
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white sticky top-0 border-b border-gray-200 shadow-sm z-10">
                      <tr>
                        <th className="px-6 py-4 font-extrabold text-gray-600 text-xs uppercase tracking-wider">Estudiante</th>
                        <th className="px-6 py-4 font-extrabold text-gray-600 text-xs uppercase tracking-wider text-center">Contacto</th>
                        <th className="px-6 py-4 font-extrabold text-gray-600 text-xs uppercase tracking-wider text-center">Estado</th>
                        <th className="px-6 py-4 font-extrabold text-gray-600 text-xs uppercase tracking-wider text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const matriculasGrupo = matriculas.filter(m => m.idGrupo === grupoSeleccionado.id);
                        const historialAgrupado = matriculasGrupo.reduce((acc, mat) => {
                          if (!acc[mat.idCliente]) acc[mat.idCliente] = { activa: null, totalCiclos: 0, matriculas: [] };
                          acc[mat.idCliente].totalCiclos += 1;
                          acc[mat.idCliente].matriculas.push(mat);
                          if (mat.estado === "Activo") acc[mat.idCliente].activa = mat;
                          return acc;
                        }, {});

                        let registros = Object.keys(historialAgrupado).map(id => ({ idCliente: id, ...historialAgrupado[id] }));
                        if (busquedaMatriculas) {
                          const b = busquedaMatriculas.toLowerCase();
                          registros = registros.filter(r => {
                            const c = clientes.find(cli => cli.COD_CLI === r.idCliente);
                            return c && (c.NOMBRE.toLowerCase().includes(b) || c.APELLIDOS.toLowerCase().includes(b) || (c.ALUMNO && c.ALUMNO.toLowerCase().includes(b)));
                          });
                        }

                        if (registros.length === 0) return <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">Aún no hay alumnos.</td></tr>;

                        return registros.map(reg => {
                          const estudiante = clientes.find(c => c.COD_CLI === reg.idCliente);
                          const esActivo = !!reg.activa;
                          
                          // Buscamos la matrícula más reciente para ver fechas
                          const ultimaMatricula = reg.matriculas.sort((a,b) => new Date(b.fechaAlta) - new Date(a.fechaAlta))[0];

                          return (
                            <tr key={reg.idCliente} className={`hover:bg-blue-50 transition-colors ${!esActivo ? 'bg-gray-50/50' : ''}`}>
                              <td className="px-6 py-4">
                                <p className={`font-bold ${esActivo ? 'text-gray-900' : 'text-gray-500'}`}>{estudiante?.ALUMNO || `${estudiante?.NOMBRE} ${estudiante?.APELLIDOS}`}</p>
                                <div className="flex gap-2 items-center mt-1">
                                  <span className="text-xs text-gray-400 font-mono">{reg.idCliente}</span>
                                  {estudiante?.EDAD && <span className="text-xs text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded">{estudiante.EDAD} años</span>}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 text-center">
                                {estudiante?.TELEFONO ? (
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="flex items-center text-gray-700 font-medium text-xs"><Phone className="w-3 h-3 mr-1 text-gray-400"/> {estudiante.TELEFONO}</span>
                                  </div>
                                ) : <span className="text-xs text-gray-400 italic">Sin teléfono</span>}
                              </td>

                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {esActivo ? (
                                    <>
                                      <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">🟢 Activo</span>
                                      <span className="text-[10px] text-gray-500">Alta: {ultimaMatricula?.fechaAlta}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">🔴 Baja</span>
                                      <span className="text-[10px] text-gray-500">Baja: {ultimaMatricula?.fechaBaja}</span>
                                    </>
                                  )}
                                  {reg.totalCiclos > 1 && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">Historial: {reg.totalCiclos} Ciclos</span>}
                                </div>
                              </td>

                              <td className="px-6 py-4 text-right">
                                {esActivo ? (
                                  <button onClick={() => darBajaMatricula(reg.activa.id)} className="text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 px-3 py-1.5 rounded border border-red-200 transition-colors cursor-pointer">Dar Baja</button>
                                ) : (
                                  <button onClick={() => reMatricularAlumno(reg.idCliente)} className="text-xs font-bold text-green-600 hover:text-white hover:bg-green-600 px-3 py-1.5 rounded border border-green-200 transition-colors cursor-pointer">Re-Matricular</button>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default GestionGrupos;