import { useState, useMemo } from "react";
import { Calendar, Users, Plus, Clock, BookOpen, Trash2, UserPlus, Search, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";

function CalendarioClases({ clientes, productos, grupos, setGrupos, matriculas, setMatriculas }) {
  const [subVista, setSubVista] = useState("calendario"); 
  
  // Controles de Fecha y Calendario
  const [fechaBase, setFechaBase] = useState(new Date()); // Fecha actual que estamos viendo
  const [vistaCalendario, setVistaCalendario] = useState("semanal"); 
  const [turno, setTurno] = useState("tarde"); 
  
  // Controles del Panel de Matriculaciones
  const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [busquedaMatriculas, setBusquedaMatriculas] = useState("");

  const [nuevoGrupo, setNuevoGrupo] = useState({
    nombre: "", idProducto: "", dias: [], horaInicio: "16:00", horaFin: "17:00", color: "bg-blue-500"
  });

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const paletaColores = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

  // Generamos horas en incrementos de 30 min
  const horasMañana = Array.from({length: 11}, (_, i) => `${Math.floor(i/2) + 9}`.padStart(2,'0') + (i%2===0 ? ":00" : ":30"));
  const horasTarde = Array.from({length: 11}, (_, i) => `${Math.floor(i/2) + 16}`.padStart(2,'0') + (i%2===0 ? ":00" : ":30"));
  const horasActuales = turno === "mañana" ? horasMañana : horasTarde;

  // --- FUNCIONES DE FECHAS ---
  const obtenerLunes = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const lunesActual = obtenerLunes(fechaBase);
  
  // Array con los 7 días (objetos Date) de la semana actual en pantalla
  const diasSemanaActual = Array.from({length: 7}, (_, i) => {
    const d = new Date(lunesActual);
    d.setDate(d.getDate() + i);
    return d;
  });

  const navegarCalendario = (direccion) => {
    const nuevaFecha = new Date(fechaBase);
    if (vistaCalendario === "diaria") {
      nuevaFecha.setDate(nuevaFecha.getDate() + direccion);
    } else if (vistaCalendario === "semanal") {
      nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7));
    } else if (vistaCalendario === "mensual") {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    }
    setFechaBase(nuevaFecha);
  };

  const formatearFechaStr = (date) => `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  // --- LÓGICA DE GRUPOS ---
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
    setGrupos([...grupos, { ...nuevoGrupo, id: obtenerSiguienteIdGrupo() }]);
    setMostrarFormGrupo(false);
    setNuevoGrupo({ nombre: "", idProducto: "", dias: [], horaInicio: "16:00", horaFin: "17:00", color: "bg-blue-500" });
  };

  const eliminarGrupo = (id) => {
    if(confirm("¿Borrar este grupo? También se borrarán sus matriculaciones.")) {
      setGrupos(grupos.filter(g => g.id !== id));
      setMatriculas(matriculas.filter(m => m.idGrupo !== id));
      if(grupoSeleccionado?.id === id) setGrupoSeleccionado(null);
    }
  };

  // --- LÓGICA DE MATRICULACIÓN ---
  const [clienteAñadir, setClienteAñadir] = useState("");

  const matricularAlumno = () => {
    if (!clienteAñadir || !grupoSeleccionado) return;
    if (matriculas.some(m => m.idCliente === clienteAñadir && m.idGrupo === grupoSeleccionado.id && m.estado === "Activo")) {
      alert("Este alumno ya está ACTIVO en este grupo.");
      return;
    }

    const nuevaMatricula = {
      id: `M${Date.now()}`,
      idCliente: clienteAñadir,
      idGrupo: grupoSeleccionado.id,
      fechaAlta: new Date().toISOString().split('T')[0],
      estado: "Activo"
    };

    setMatriculas([...matriculas, nuevaMatricula]);
    setClienteAñadir("");
  };

  const reMatricularAlumno = (idCliente) => {
    const nuevaMatricula = {
      id: `M${Date.now()}`,
      idCliente: idCliente,
      idGrupo: grupoSeleccionado.id,
      fechaAlta: new Date().toISOString().split('T')[0],
      estado: "Activo"
    };
    setMatriculas([...matriculas, nuevaMatricula]);
  };

  const darBajaMatricula = (idMatricula) => {
    if(confirm("¿Dar de baja a este alumno del grupo?")) {
      setMatriculas(matriculas.map(m => m.id === idMatricula ? { ...m, estado: "Baja", fechaBaja: new Date().toISOString().split('T')[0] } : m));
    }
  };

  // --- AYUDANTES DE RENDERIZADO DEL CALENDARIO ---
  const calcularPosicionBloque = (horaInicio, horaFin) => {
    const baseHour = turno === "mañana" ? 9 : 16;
    const startH = parseInt(horaInicio.split(":")[0]);
    const startM = parseInt(horaInicio.split(":")[1]) / 60;
    const endH = parseInt(horaFin.split(":")[0]);
    const endM = parseInt(horaFin.split(":")[1]) / 60;
    
    if (startH < baseHour || startH > baseHour + 5) return null;

    const top = ((startH - baseHour) + startM) * 8; 
    const height = ((endH + endM) - (startH + startM)) * 8;
    return { top: `${top}rem`, height: `${height}rem` };
  };

  const generarMesRender = () => {
    const year = fechaBase.getFullYear();
    const month = fechaBase.getMonth();
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const primerDiaIndex = new Date(year, month, 1).getDay();
    const desfase = primerDiaIndex === 0 ? 6 : primerDiaIndex - 1; 
    
    const dias = Array(desfase).fill(null);
    for(let i=1; i<=diasEnMes; i++) {
      dias.push(new Date(year, month, i));
    }
    return dias;
  };

  return (
    <div className="bg-white w-full p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[85vh]">
      
      {/* CABECERA Y NAVEGACIÓN MAESTRA */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 shrink-0 gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Horarios y Matriculaciones</h1>
          <p className="text-sm text-gray-600">Planifica tus clases y gestiona la asistencia.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button onClick={() => setSubVista("calendario")} className={`flex items-center px-4 py-2 rounded-md font-semibold transition-colors cursor-pointer ${subVista === "calendario" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Calendar className="w-4 h-4 mr-2" /> Planificador
          </button>
          <button onClick={() => setSubVista("matriculas")} className={`flex items-center px-4 py-2 rounded-md font-semibold transition-colors cursor-pointer ${subVista === "matriculas" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Users className="w-4 h-4 mr-2" /> Matrículas
          </button>
        </div>
      </div>

      {/* =========================================
          VISTA 1: CALENDARIO
          ========================================= */}
      {subVista === "calendario" && (
        <div className="flex-1 flex flex-col">
          
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            
            <div className="flex bg-blue-50 p-1 rounded-lg border border-blue-100">
              <button onClick={() => setVistaCalendario("diaria")} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${vistaCalendario === "diaria" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}>Diaria</button>
              <button onClick={() => setVistaCalendario("semanal")} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${vistaCalendario === "semanal" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}>Semanal</button>
              <button onClick={() => setVistaCalendario("mensual")} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${vistaCalendario === "mensual" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}>Mensual</button>
            </div>

            {/* Navegación del Calendario */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button onClick={() => navegarCalendario(-1)} className="p-1 hover:bg-white rounded text-gray-600 cursor-pointer"><ChevronLeft className="w-5 h-5"/></button>
                <button onClick={() => setFechaBase(new Date())} className="px-3 text-sm font-bold text-gray-700 hover:bg-white rounded cursor-pointer">Hoy</button>
                <button onClick={() => navegarCalendario(1)} className="p-1 hover:bg-white rounded text-gray-600 cursor-pointer"><ChevronRight className="w-5 h-5"/></button>
              </div>
              
              <div className="text-gray-700 text-sm font-semibold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 min-w-[200px] text-center">
                {vistaCalendario === "mensual" && fechaBase.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                {vistaCalendario === "semanal" && `Del ${formatearFechaStr(diasSemanaActual[0])} al ${formatearFechaStr(diasSemanaActual[6])}`}
                {vistaCalendario === "diaria" && fechaBase.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>

            {vistaCalendario !== "mensual" && (
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button onClick={() => setTurno("mañana")} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${turno === "mañana" ? "bg-yellow-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-200"}`}><Sun className="w-4 h-4 mr-2" /> Mañana (9-14h)</button>
                <button onClick={() => setTurno("tarde")} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${turno === "tarde" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-200"}`}><Moon className="w-4 h-4 mr-2" /> Tarde (16-21h)</button>
              </div>
            )}

            <button onClick={() => setMostrarFormGrupo(!mostrarFormGrupo)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm cursor-pointer">
              <Plus className="w-4 h-4 mr-1" /> Nuevo Grupo
            </button>
          </div>

          {vistaCalendario === "diaria" && (
            <div className="flex gap-2 mb-4 justify-center">
              {diasSemanaActual.map((diaDate) => {
                const isSelected = diaDate.toDateString() === fechaBase.toDateString();
                const nombreDia = diasSemana[(diaDate.getDay() + 6) % 7];
                return (
                  <button 
                    key={diaDate} 
                    onClick={() => setFechaBase(diaDate)} 
                    className={`px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all flex flex-col items-center ${isSelected ? "bg-gray-800 text-white shadow-md scale-105" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    <span>{nombreDia}</span>
                    <span className="text-xs opacity-80">{diaDate.getDate()}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Formulario Nuevo Grupo */}
          {mostrarFormGrupo && (
            <div className="mb-6 p-5 bg-blue-50 border border-blue-100 rounded-lg shadow-inner">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center"><Clock className="w-4 h-4 mr-2" /> Configurar Nuevo Grupo</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                
                <div className="flex flex-col md:col-span-1">
                  <label className="font-semibold text-gray-700 mb-1">Nombre</label>
                  <input type="text" value={nuevoGrupo.nombre} onChange={e => setNuevoGrupo({...nuevoGrupo, nombre: e.target.value})} placeholder="Ej. B1 Martes" className="border rounded p-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div className="flex flex-col md:col-span-1">
                  <label className="font-semibold text-gray-700 mb-1">Curso Vinculado</label>
                  <select value={nuevoGrupo.idProducto} onChange={e => setNuevoGrupo({...nuevoGrupo, idProducto: e.target.value})} className="border rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
                    <option value="">Seleccionar...</option>
                    {productos.map(p => <option key={p.COD_PROD} value={p.COD_PROD}>{p.CURSO}</option>)}
                  </select>
                </div>

                <div className="flex flex-col md:col-span-3">
                  <label className="font-semibold text-gray-700 mb-1">Días de la semana</label>
                  <div className="flex gap-1">
                    {diasSemana.map(dia => (
                      <button key={dia} onClick={() => toggleDia(dia)} className={`flex-1 py-2 rounded border font-semibold text-xs transition-colors cursor-pointer ${nuevoGrupo.dias.includes(dia) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                        {dia.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="font-semibold text-gray-700 mb-1">Inicio</label>
                  <input type="time" step="900" value={nuevoGrupo.horaInicio} onChange={e => setNuevoGrupo({...nuevoGrupo, horaInicio: e.target.value})} className="border rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                </div>

                <div className="flex flex-col">
                  <label className="font-semibold text-gray-700 mb-1">Fin</label>
                  <input type="time" step="900" value={nuevoGrupo.horaFin} onChange={e => setNuevoGrupo({...nuevoGrupo, horaFin: e.target.value})} className="border rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                </div>

                <div className="flex flex-col md:col-span-3">
                  <label className="font-semibold text-gray-700 mb-1">Color Identificativo</label>
                  <div className="flex gap-2 h-9 items-center">
                    {paletaColores.map(color => (
                      <button key={color} onClick={() => setNuevoGrupo({...nuevoGrupo, color})} className={`w-8 h-8 rounded-full shadow-sm cursor-pointer transition-all ${color} ${nuevoGrupo.color === color ? 'ring-4 ring-blue-300 scale-110' : 'opacity-70 hover:opacity-100'}`}></button>
                    ))}
                    <input type="color" value={nuevoGrupo.color.startsWith('#') ? nuevoGrupo.color : '#ffffff'} onChange={e => setNuevoGrupo({...nuevoGrupo, color: e.target.value})} className="w-8 h-8 p-0 border-0 rounded cursor-pointer shadow-sm ml-2" title="Color personalizado" />
                    
                    <div className="flex-1 text-right">
                      <button onClick={() => setMostrarFormGrupo(false)} className="text-red-500 hover:underline mr-4 font-semibold cursor-pointer">Cancelar</button>
                      <button onClick={guardarGrupo} className="bg-green-600 text-white px-6 py-2 rounded-md font-bold shadow-sm hover:bg-green-700 cursor-pointer">Guardar</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* GRILLA DEL CALENDARIO */}
          <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-gray-50 shadow-inner">
            
            {vistaCalendario !== "mensual" && (
              <>
                <div className={`grid border-b border-gray-200 bg-white shadow-sm z-10 ${vistaCalendario === "diaria" ? "grid-cols-2" : "grid-cols-8"}`}>
                  <div className="p-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200">Horario</div>
                  {(vistaCalendario === "diaria" ? [fechaBase] : diasSemanaActual).map((diaDate) => {
                    const nombreDia = diasSemana[(diaDate.getDay() + 6) % 7];
                    return (
                      <div key={nombreDia} className="p-3 text-center border-r border-gray-200 last:border-0 bg-gray-50/50 flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-gray-700">{nombreDia} {diaDate.getDate()}</span>
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex-1 overflow-y-auto relative bg-white">
                  <div className={`grid min-h-full ${vistaCalendario === "diaria" ? "grid-cols-2" : "grid-cols-8"}`}>
                    
                    <div className="border-r border-gray-200 bg-gray-50">
                      {horasActuales.map(hora => (
                        <div key={hora} className="h-32 border-b border-gray-200 p-2 text-right text-xs font-bold text-gray-500 relative">
                          <span className="-mt-2 block pr-1">{hora}</span>
                        </div>
                      ))}
                    </div>
                    
                    {(vistaCalendario === "diaria" ? [fechaBase] : diasSemanaActual).map((diaDate) => {
                      const nombreDia = diasSemana[(diaDate.getDay() + 6) % 7];
                      return (
                        <div key={nombreDia} className="border-r border-gray-200 last:border-0 relative">
                          {horasActuales.map(hora => <div key={`${nombreDia}-${hora}`} className="h-32 border-b border-gray-100"></div>)}
                          
                          {grupos.filter(g => g.dias.includes(nombreDia)).map(grupo => {
                            const pos = calcularPosicionBloque(grupo.horaInicio, grupo.horaFin);
                            if (!pos) return null; 

                            const isHex = grupo.color.startsWith('#');
                            const numKids = matriculas.filter(m => m.idGrupo === grupo.id && m.estado === "Activo").length;
                            const nomCurso = productos.find(p => p.COD_PROD === grupo.idProducto)?.CURSO || "";

                            return (
                              <div 
                                key={`${grupo.id}-${nombreDia}`}
                                onClick={() => { setGrupoSeleccionado(grupo); setSubVista("matriculas"); }}
                                className={`absolute left-1 right-1 rounded-lg shadow-md p-3 text-white overflow-hidden cursor-pointer hover:ring-2 hover:ring-offset-1 hover:z-10 transition-all border border-black/10 ${!isHex ? grupo.color : ''}`}
                                style={{ top: pos.top, height: pos.height, ...(isHex ? {backgroundColor: grupo.color} : {}) }}
                              >
                                <p className="font-extrabold text-sm drop-shadow-md truncate">{grupo.nombre}</p>
                                <p className="text-xs font-bold opacity-90 truncate my-0.5">{nomCurso}</p>
                                <div className="mt-1 flex items-center justify-between text-xs font-medium bg-black/20 px-2 py-1 rounded">
                                  <span>{grupo.horaInicio}-{grupo.horaFin}</span>
                                  <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {numKids}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {vistaCalendario === "mensual" && (
              <div className="flex-1 flex flex-col bg-white">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                  {diasSemana.map(dia => <div key={dia} className="p-3 text-center text-xs font-bold text-gray-500 uppercase">{dia}</div>)}
                </div>
                <div className="grid grid-cols-7 grid-rows-5 flex-1">
                  {generarMesRender().map((diaObj, idx) => {
                    const diaSemanaNombre = diasSemana[idx % 7];
                    const gruposDelDia = diaObj ? grupos.filter(g => g.dias.includes(diaSemanaNombre)) : [];
                    
                    return (
                      <div key={idx} className={`border-r border-b border-gray-100 p-1 md:p-2 flex flex-col ${!diaObj ? 'bg-gray-50' : 'bg-white hover:bg-blue-50 transition-colors'}`}>
                        {diaObj && <span className="text-sm font-bold text-gray-400 mb-1 block text-right">{diaObj.getDate()}</span>}
                        {diaObj && (
                          <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-24">
                            {gruposDelDia.map(g => {
                              const isHex = g.color.startsWith('#');
                              return (
                                <div 
                                  key={g.id} 
                                  onClick={() => { setGrupoSeleccionado(g); setSubVista("matriculas"); }}
                                  className={`text-[10px] md:text-xs text-white p-1 rounded truncate cursor-pointer shadow-sm ${!isHex ? g.color : ''}`}
                                  style={isHex ? {backgroundColor: g.color} : {}}
                                  title={`${g.nombre} (${g.horaInicio})`}
                                >
                                  <span className="font-bold">{g.horaInicio}</span> {g.nombre}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          VISTA 2: MATRICULACIONES
          ========================================= */}
      {subVista === "matriculas" && (
        <div className="flex-1 flex flex-col md:flex-row gap-6">
          
          <div className="w-full md:w-1/3 flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
              <h3 className="font-bold text-gray-800 flex items-center"><BookOpen className="w-5 h-5 mr-2" /> Selecciona un Grupo</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {grupos.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center mt-4">Crea grupos en el calendario primero.</p>
              ) : (
                grupos.map(grupo => {
                  const numAlumnos = matriculas.filter(m => m.idGrupo === grupo.id && m.estado === "Activo").length;
                  const isHex = grupo.color.startsWith('#');
                  return (
                    <div 
                      key={grupo.id} 
                      onClick={() => setGrupoSeleccionado(grupo)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${grupoSeleccionado?.id === grupo.id ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-extrabold text-gray-800 text-sm truncate">{grupo.nombre}</h4>
                        <span className={`w-3 h-3 rounded-full shrink-0 ${!isHex ? grupo.color : ''}`} style={isHex ? {backgroundColor: grupo.color} : {}}></span>
                      </div>
                      <p className="text-xs text-gray-500 font-bold mb-2">{grupo.dias.join(", ")} • {grupo.horaInicio}-{grupo.horaFin}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded-md">{numAlumnos} Alumnos Activos</span>
                        <button onClick={(e) => {e.stopPropagation(); eliminarGrupo(grupo.id)}} className="text-gray-400 hover:text-red-500 cursor-pointer p-1"><Trash2 className="w-4 h-4"/></button>
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
                <p className="text-lg font-bold">Selecciona un grupo a la izquierda</p>
                <p className="text-sm">Podrás añadir alumnos y revisar el historial de altas y bajas.</p>
              </div>
            ) : (
              <>
                <div 
                  className={`p-6 text-white ${!grupoSeleccionado.color.startsWith('#') ? grupoSeleccionado.color : ''}`}
                  style={grupoSeleccionado.color.startsWith('#') ? {backgroundColor: grupoSeleccionado.color} : {}}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black mb-1">{grupoSeleccionado.nombre}</h2>
                      <p className="opacity-90 font-bold">
                        {productos.find(p => p.COD_PROD === grupoSeleccionado.idProducto)?.CURSO || "Curso no encontrado"}
                      </p>
                    </div>
                    <div className="text-right bg-black/20 p-2 rounded-lg backdrop-blur-sm">
                      <p className="font-bold text-lg">{grupoSeleccionado.horaInicio} - {grupoSeleccionado.horaFin}</p>
                      <p className="text-sm font-medium mt-1">{grupoSeleccionado.dias.join(" • ")}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-3 shadow-inner">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input 
                      type="text" 
                      placeholder="Buscar alumno..." 
                      value={busquedaMatriculas}
                      onChange={e => setBusquedaMatriculas(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-1 gap-2">
                    <select 
                      value={clienteAñadir} 
                      onChange={e => setClienteAñadir(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium cursor-pointer"
                    >
                      <option value="">Matricular alumno nuevo...</option>
                      {clientes.filter(c => c.ESTADO !== "Inactivo").map(c => (
                        <option key={c.COD_CLI} value={c.COD_CLI}>{c.ALUMNO || `${c.NOMBRE} ${c.APELLIDOS}`} ({c.EDAD ? c.EDAD+' años' : 'Sin edad'})</option>
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
                        <th className="px-6 py-4 font-extrabold text-gray-600 text-xs uppercase tracking-wider text-center">Estado y Ciclos</th>
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

                        let registros = Object.keys(historialAgrupado).map(id => ({
                          idCliente: id, ...historialAgrupado[id]
                        }));

                        if (busquedaMatriculas) {
                          const b = busquedaMatriculas.toLowerCase();
                          registros = registros.filter(r => {
                            const c = clientes.find(cli => cli.COD_CLI === r.idCliente);
                            return c && (c.NOMBRE.toLowerCase().includes(b) || c.APELLIDOS.toLowerCase().includes(b) || (c.ALUMNO && c.ALUMNO.toLowerCase().includes(b)));
                          });
                        }

                        if (registros.length === 0) {
                          return <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-500 italic">No hay registros que coincidan.</td></tr>;
                        }

                        return registros.map(reg => {
                          const estudiante = clientes.find(c => c.COD_CLI === reg.idCliente);
                          const esActivo = !!reg.activa;
                          const esRecurrente = reg.totalCiclos > 1;

                          return (
                            <tr key={reg.idCliente} className={`hover:bg-blue-50 transition-colors ${!esActivo ? 'bg-gray-50/50' : ''}`}>
                              <td className="px-6 py-4">
                                <p className={`font-bold ${esActivo ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {estudiante?.ALUMNO || `${estudiante?.NOMBRE} ${estudiante?.APELLIDOS}`}
                                </p>
                                <div className="flex gap-2 items-center mt-1">
                                  <span className="text-xs text-gray-400 font-mono">{reg.idCliente}</span>
                                  {estudiante?.EDAD && <span className="text-xs text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded">{estudiante.EDAD} años</span>}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {esActivo ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                      🟢 Matriculado
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                      🔴 Baja
                                    </span>
                                  )}
                                  
                                  {esRecurrente && (
                                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                      Historial: {reg.totalCiclos} Ciclos
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-6 py-4 text-right">
                                {esActivo ? (
                                  <button onClick={() => darBajaMatricula(reg.activa.id)} className="text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 px-3 py-1.5 rounded border border-red-200 transition-colors cursor-pointer">
                                    Tramitar Baja
                                  </button>
                                ) : (
                                  <button onClick={() => reMatricularAlumno(reg.idCliente)} className="text-xs font-bold text-green-600 hover:text-white hover:bg-green-600 px-3 py-1.5 rounded border border-green-200 transition-colors cursor-pointer">
                                    Dar de Alta
                                  </button>
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

export default CalendarioClases;