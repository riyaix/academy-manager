import { useState, useRef } from "react";
import { Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Sun, Moon, Calendar as CalendarIcon } from "lucide-react";

function Calendario({ grupos, matriculas, productos }) {
  const [fechaBase, setFechaBase] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState("semanal"); 
  const [turno, setTurno] = useState("tarde"); 
  
  const dateInputRef = useRef(null);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const horasMañana = Array.from({length: 11}, (_, i) => `${Math.floor(i/2) + 9}`.padStart(2,'0') + (i%2===0 ? ":00" : ":30"));
  const horasTarde = Array.from({length: 11}, (_, i) => `${Math.floor(i/2) + 16}`.padStart(2,'0') + (i%2===0 ? ":00" : ":30"));
  const horasActuales = turno === "mañana" ? horasMañana : horasTarde;

  const obtenerLunes = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const lunesActual = obtenerLunes(fechaBase);
  
  const diasSemanaActual = Array.from({length: 7}, (_, i) => {
    const d = new Date(lunesActual);
    d.setDate(d.getDate() + i);
    return d;
  });

  const navegarCalendario = (direccion, saltoRapido = false) => {
    const nuevaFecha = new Date(fechaBase);
    if (vistaCalendario === "diaria") {
      nuevaFecha.setDate(nuevaFecha.getDate() + (saltoRapido ? direccion * 7 : direccion));
    } else if (vistaCalendario === "semanal") {
      nuevaFecha.setDate(nuevaFecha.getDate() + (saltoRapido ? direccion * 28 : direccion * 7));
    } else if (vistaCalendario === "mensual") {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + (saltoRapido ? direccion * 12 : direccion));
    }
    setFechaBase(nuevaFecha);
  };

  const formatearFechaStr = (date) => `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

  const cambiarFechaDirecta = (e) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-');
    setFechaBase(new Date(year, month - 1, day));
  };

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
    for(let i=1; i<=diasEnMes; i++) dias.push(new Date(year, month, i));
    return dias;
  };

  const gridEstilo = { 
    gridTemplateColumns: vistaCalendario === "diaria" ? "80px minmax(300px, 450px) 1fr" : "80px repeat(7, minmax(0, 1fr))" 
  };

  return (
    <div className="bg-white w-full p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[85vh]">
      
      {/* NAVEGACIÓN DEL CALENDARIO (GRILLA DE 3 COLUMNAS) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 items-center mb-6 shrink-0 gap-4">
        
        {/* IZQUIERDA: Selector de Vista */}
        <div className="flex justify-start">
          <div className="flex bg-blue-50 p-1 rounded-lg border border-blue-100">
            <button onClick={() => setVistaCalendario("diaria")} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${vistaCalendario === "diaria" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}>Diaria</button>
            <button onClick={() => setVistaCalendario("semanal")} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${vistaCalendario === "semanal" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}>Semanal</button>
            <button onClick={() => setVistaCalendario("mensual")} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${vistaCalendario === "mensual" ? "bg-blue-600 text-white shadow-sm" : "text-blue-700 hover:bg-blue-100"}`}>Mensual</button>
          </div>
        </div>

        {/* CENTRO: Controles de Navegación Modernos */}
        <div className="flex justify-center items-center gap-3">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-sm">
            <button onClick={() => navegarCalendario(-1, true)} className="p-1.5 hover:bg-white rounded text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Salto grande atrás"><ChevronsLeft className="w-5 h-5"/></button>
            <button onClick={() => navegarCalendario(-1)} className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-blue-600 transition-colors cursor-pointer" title="Atrás"><ChevronLeft className="w-5 h-5"/></button>
            
            <button onClick={() => setFechaBase(new Date())} className="px-4 py-1 text-xs font-black tracking-wider text-gray-700 hover:bg-white hover:text-blue-700 rounded cursor-pointer transition-colors uppercase">Hoy</button>
            
            <button onClick={() => navegarCalendario(1)} className="p-1.5 hover:bg-white rounded text-gray-600 hover:text-blue-600 transition-colors cursor-pointer" title="Adelante"><ChevronRight className="w-5 h-5"/></button>
            <button onClick={() => navegarCalendario(1, true)} className="p-1.5 hover:bg-white rounded text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Salto grande adelante"><ChevronsRight className="w-5 h-5"/></button>
          </div>
          
          <button 
            onClick={() => {
              if (dateInputRef.current && dateInputRef.current.showPicker) {
                dateInputRef.current.showPicker();
              }
            }}
            className="relative flex items-center justify-center text-blue-800 text-sm font-bold bg-blue-50/50 px-5 py-2.5 rounded-lg border border-blue-100 min-w-[260px] shadow-sm hover:bg-blue-100 transition-colors cursor-pointer group"
          >
            <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
            {vistaCalendario === "mensual" && fechaBase.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
            {vistaCalendario === "semanal" && `DEL ${formatearFechaStr(diasSemanaActual[0])} AL ${formatearFechaStr(diasSemanaActual[6])}`}
            {vistaCalendario === "diaria" && fechaBase.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            
            <input 
              ref={dateInputRef}
              type="date" 
              onChange={cambiarFechaDirecta}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
              tabIndex="-1"
            />
          </button>
        </div>

        {/* DERECHA: Turnos de Horario */}
        <div className="flex justify-end">
          {vistaCalendario !== "mensual" ? (
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button onClick={() => setTurno("mañana")} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${turno === "mañana" ? "bg-yellow-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-200"}`}><Sun className="w-4 h-4 mr-2" /> Mañana (9-14h)</button>
              <button onClick={() => setTurno("tarde")} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${turno === "tarde" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-200"}`}><Moon className="w-4 h-4 mr-2" /> Tarde (16-21h)</button>
            </div>
          ) : (
            <div className="min-h-[40px]"></div>
          )}
        </div>
      </div>

      {vistaCalendario === "diaria" && (
        <div className="flex gap-2 mb-4 justify-center shrink-0">
          {diasSemanaActual.map((diaDate) => {
            const isSelected = diaDate.toDateString() === fechaBase.toDateString();
            const nombreDia = diasSemana[(diaDate.getDay() + 6) % 7];
            return (
              <button 
                key={diaDate} 
                onClick={() => setFechaBase(diaDate)} 
                className={`px-6 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all flex flex-col items-center border ${isSelected ? "bg-gray-800 border-gray-900 text-white shadow-md scale-105" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-200 hover:border-gray-300"}`}
              >
                <span>{nombreDia}</span>
                <span className="text-xs opacity-80">{diaDate.getDate()}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* GRILLA DEL CALENDARIO */}
      <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-gray-50 shadow-inner">
        
        {vistaCalendario !== "mensual" && (
          <>
            <div className="grid border-b border-gray-200 bg-white shadow-sm z-10 shrink-0" style={gridEstilo}>
              <div className="p-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200 flex items-center justify-center">Horario</div>
              {(vistaCalendario === "diaria" ? [fechaBase] : diasSemanaActual).map((diaDate) => {
                const nombreDia = diasSemana[(diaDate.getDay() + 6) % 7];
                return (
                  <div key={nombreDia} className="p-3 text-center border-r border-gray-200 last:border-0 bg-gray-50/50 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-gray-800">{nombreDia} {diaDate.getDate()}</span>
                  </div>
                )
              })}
              {vistaCalendario === "diaria" && <div className="bg-gray-50/50"></div>}
            </div>
            
            {/* Se ha eliminado el pt-4. El calendario empieza justo debajo de la cabecera */}
            <div className="flex-1 overflow-y-auto relative bg-white pb-4">
              <div className="grid min-h-full" style={gridEstilo}>
                
                <div className="border-r border-gray-200 bg-gray-50">
                  {horasActuales.map(hora => (
                    <div key={hora} className="h-16 border-b border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                      <span>{hora}</span>
                    </div>
                  ))}
                </div>
                
                {(vistaCalendario === "diaria" ? [fechaBase] : diasSemanaActual).map((diaDate) => {
                  const nombreDia = diasSemana[(diaDate.getDay() + 6) % 7];
                  return (
                    <div key={nombreDia} className="border-r border-gray-200 relative">
                      {horasActuales.map(hora => <div key={`${nombreDia}-${hora}`} className="h-16 border-b border-gray-100"></div>)}
                      
                      {grupos.filter(g => g.dias.includes(nombreDia)).map(grupo => {
                        const pos = calcularPosicionBloque(grupo.horaInicio, grupo.horaFin);
                        if (!pos) return null; 

                        const isHex = grupo.color.startsWith('#');
                        const numKids = matriculas.filter(m => m.idGrupo === grupo.id && m.estado === "Activo").length;
                        const nomCurso = productos.find(p => p.COD_PROD === grupo.idProducto)?.CURSO || "";

                        return (
                          <div 
                            key={`${grupo.id}-${nombreDia}`}
                            className={`absolute left-2 right-2 rounded-md shadow-md p-3 text-white overflow-hidden hover:ring-2 hover:ring-white hover:z-10 transition-all border border-black/10 flex flex-col justify-between cursor-pointer ${!isHex ? grupo.color : ''}`}
                            style={{ 
                              top: `calc(${pos.top} + 4px)`, 
                              height: `calc(${pos.height} - 8px)`, 
                              ...(isHex ? {backgroundColor: grupo.color} : {}) 
                            }}
                            title={`${grupo.nombre} (${numKids} Alumnos)`}
                          >
                            <div>
                              <p className="font-extrabold text-sm drop-shadow-md truncate leading-tight">{grupo.nombre}</p>
                              <p className="text-xs font-bold opacity-90 truncate leading-tight mt-1">{nomCurso}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs font-medium bg-black/20 px-2 py-1 rounded mt-2">
                              <span>{grupo.horaInicio}-{grupo.horaFin}</span>
                              <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {numKids}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
                {vistaCalendario === "diaria" && <div className="bg-gray-50/30"></div>}
              </div>
            </div>
          </>
        )}

        {/* VISTA MENSUAL */}
        {vistaCalendario === "mensual" && (
          <div className="flex-1 flex flex-col bg-white">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 shrink-0">
              {diasSemana.map(dia => <div key={dia} className="p-3 text-center text-xs font-bold text-gray-500 uppercase">{dia}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 flex-1">
              {generarMesRender().map((diaObj, idx) => {
                const diaSemanaNombre = diasSemana[idx % 7];
                const gruposDelDia = diaObj ? grupos.filter(g => g.dias.includes(diaSemanaNombre)) : [];
                
                return (
                  <div key={idx} className={`border-r border-b border-gray-100 p-2 flex flex-col ${!diaObj ? 'bg-gray-50' : 'bg-white hover:bg-blue-50 transition-colors'}`}>
                    {diaObj && <span className="text-sm font-bold text-gray-500 mb-2 block text-right">{diaObj.getDate()}</span>}
                    {diaObj && (
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                        {gruposDelDia.map(g => {
                          const isHex = g.color.startsWith('#');
                          return (
                            <div 
                              key={g.id} 
                              className={`text-[10px] md:text-xs text-white px-1.5 py-1 rounded truncate shadow-sm font-medium cursor-pointer hover:ring-2 hover:ring-white transition-all ${!isHex ? g.color : ''}`}
                              style={isHex ? {backgroundColor: g.color} : {}}
                              title={`${g.nombre} (${g.horaInicio})`}
                            >
                              <span className="font-bold mr-1">{g.horaInicio}</span>{g.nombre}
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
  );
}

export default Calendario;