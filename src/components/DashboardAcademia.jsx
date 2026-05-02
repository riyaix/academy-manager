import { useState, useMemo } from "react";
import { Users, BookOpen, CalendarDays, UserPlus, FilePlus, Zap, AlertTriangle, Clock, CheckCircle2, CalendarRange, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

function DashboardAcademia({ clientes = [], grupos = [], matriculas = [], productos = [], facturas = [], navegarConAccion }) {
  
  // RANGO DE FECHAS (Year-To-Date por defecto)
  const añoActual = new Date().getFullYear();
  const hoyStrDate = new Date().toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState(`${añoActual}-01-01`);
  const [fechaHasta, setFechaHasta] = useState(hoyStrDate);

  // --- 1. CÁLCULOS Y KPIs ---
  const kpis = useMemo(() => {
    const activos = clientes.filter(c => c.ESTADO === "Activo");
    const gruposActivos = grupos.filter(g => g.estado !== "Archivado");
    const matsActivas = matriculas.filter(m => m.estado === "Activo");
    
    const mesActual = new Date().toISOString().substring(0, 7);
    const altasMes = matsActivas.filter(m => m.fechaAlta && m.fechaAlta.startsWith(mesActual)).length;

    let aforoTotal = 0;
    let ocupacionReal = 0;
    let gruposLlenos = 0;

    gruposActivos.forEach(g => {
      const alumnosEnGrupo = matsActivas.filter(m => m.idGrupo === g.id).length;
      ocupacionReal += alumnosEnGrupo;
      if (g.capacidad) {
        aforoTotal += parseInt(g.capacidad);
        if (alumnosEnGrupo >= parseInt(g.capacidad)) gruposLlenos++;
      }
    });

    return { 
      totalActivos: activos.length, 
      altasMes, 
      totalGrupos: gruposActivos.length, 
      gruposLlenos, 
      porcentajeOcupacion: aforoTotal > 0 ? Math.round((ocupacionReal / aforoTotal) * 100) : 0
    };
  }, [clientes, grupos, matriculas]);

  // --- 2. MOTOR DE GRÁFICOS MASIVOS ---
  const datosGraficos = useMemo(() => {
    const dDesde = new Date(fechaDesde);
    const dHasta = new Date(fechaHasta);
    const matsActivas = matriculas.filter(m => m.estado === "Activo");
    const gruposActivos = grupos.filter(g => g.estado !== "Archivado");
    
    const formatearMes = (mesKey) => {
      const [y, m] = mesKey.split('-');
      const nombreMes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][parseInt(m)-1];
      return `${nombreMes} ${y.substring(2)}`;
    };

    // A. EVOLUCIÓN DE MATRÍCULAS (Altas por mes)
    const mesesAltasMap = {};
    matriculas.forEach(m => {
      if (!m.fechaAlta) return;
      const fAlta = new Date(m.fechaAlta);
      if (fAlta >= dDesde && fAlta <= dHasta) {
        const mesKey = m.fechaAlta.substring(0, 7);
        mesesAltasMap[mesKey] = (mesesAltasMap[mesKey] || 0) + 1;
      }
    });
    const evolucionMatriculas = Object.keys(mesesAltasMap).sort().map(m => ({ mes: formatearMes(m), altas: mesesAltasMap[m] }));

    // B. INGRESOS GENERADOS (Cobrado vs Pendiente)
    const ingresosMap = {};
    facturas.forEach(f => {
      if (!f.fecha || f.estado === "Anulada") return;
      const fDate = new Date(f.fecha);
      if (fDate >= dDesde && fDate <= dHasta) {
        const mesKey = f.fecha.substring(0, 7);
        if (!ingresosMap[mesKey]) ingresosMap[mesKey] = { mesStr: mesKey, cobrado: 0, pendiente: 0 };
        if (f.estado === "Pagada") ingresosMap[mesKey].cobrado += f.total;
        if (f.estado === "Pendiente") ingresosMap[mesKey].pendiente += f.total;
      }
    });
    const evolucionIngresos = Object.values(ingresosMap).sort((a,b) => a.mesStr.localeCompare(b.mesStr)).map(d => ({
      mes: formatearMes(d.mesStr), 
      Cobrado: Number(d.cobrado.toFixed(2)), 
      Pendiente: Number(d.pendiente.toFixed(2))
    }));

    // C. AFLUENCIA POR DÍAS (¿Qué días la academia está más llena?)
    const diasCount = { "Lunes": 0, "Martes": 0, "Miércoles": 0, "Jueves": 0, "Viernes": 0, "Sábado": 0, "Domingo": 0 };
    gruposActivos.forEach(g => {
      const numAlumnos = matsActivas.filter(m => m.idGrupo === g.id).length;
      (g.dias || []).forEach(d => { if(diasCount[d] !== undefined) diasCount[d] += numAlumnos; });
    });
    const afluenciaDias = Object.keys(diasCount).map(d => ({ dia: d.substring(0,3), alumnos: diasCount[d] })).filter(d => d.alumnos > 0);

    // D. DISTRIBUCIÓN DE CURSOS (Top 5)
    const cursosCount = {};
    productos.forEach(p => cursosCount[p.COD_PROD] = { nombre: p.CURSO, Alumnos: 0 });
    matsActivas.forEach(m => {
      const grupo = grupos.find(g => g.id === m.idGrupo);
      if (grupo && cursosCount[grupo.idProducto]) cursosCount[grupo.idProducto].Alumnos++;
    });
    const distribucionCursos = Object.values(cursosCount).sort((a,b) => b.Alumnos - a.Alumnos).slice(0, 5);

    // E. DISTRIBUCIÓN DE EDADES
    let niños = 0; let adolescentes = 0; let adultos = 0;
    clientes.filter(c => c.ESTADO === "Activo").forEach(c => {
      const edad = parseInt(c.EDAD);
      if (!isNaN(edad)) {
        if (edad < 12) niños++;
        else if (edad <= 17) adolescentes++;
        else adultos++;
      } else adultos++;
    });
    const distribucionEdades = [
      { name: 'Niños (<12)', value: niños, color: '#4ade80' },
      { name: 'Adoles. (12-17)', value: adolescentes, color: '#60a5fa' },
      { name: 'Adultos (18+)', value: adultos, color: '#c084fc' }
    ].filter(d => d.value > 0);

    // F. TASA DE RETENCIÓN (Activos vs Inactivos)
    const inactivosCount = clientes.filter(c => c.ESTADO === "Inactivo").length;
    const activosCount = clientes.filter(c => c.ESTADO === "Activo").length;
    const tasaRetencion = [
      { name: 'Alumnos Activos', value: activosCount, color: '#3b82f6' },
      { name: 'Bajas Históricas', value: inactivosCount, color: '#f87171' }
    ];

    return { evolucionMatriculas, evolucionIngresos, afluenciaDias, distribucionCursos, distribucionEdades, tasaRetencion };
  }, [matriculas, productos, grupos, clientes, facturas, fechaDesde, fechaHasta]);

  // --- 3. ALERTAS Y CLASES DE HOY ---
  const alertas = useMemo(() => {
    const dSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][new Date().getDay()];
    const clasesHoy = grupos.filter(g => g.estado !== "Archivado" && (g.dias || []).includes(dSemana)).sort((a,b) => (a.horaInicio||"").localeCompare(b.horaInicio||""));
    const facturasPendientes = facturas.filter(f => f.estado === "Pendiente");
    return { clasesHoy, facturasPendientes, hoyStr: dSemana };
  }, [grupos, facturas]);

  // Helper para Tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl text-sm font-bold border border-gray-700">
          <p className="mb-2 opacity-80 border-b border-gray-700 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color || '#60a5fa' }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 🚀 UX MEJORADO: BANNER GIGANTE DE ACCIÓN PRINCIPAL */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between text-white gap-6">
        <div>
          <h2 className="text-2xl font-black mb-1 flex items-center"><Zap className="w-6 h-6 mr-2 text-yellow-300 fill-yellow-300"/> Generación de Cuotas</h2>
          <p className="text-blue-100 text-sm font-medium">Automatiza el cobro de todos tus alumnos activos con un solo clic. El sistema agrupará a los hermanos automáticamente.</p>
        </div>
        <button onClick={() => navegarConAccion('factura', 'lote')} className="w-full md:w-auto bg-white text-blue-700 hover:bg-gray-50 px-8 py-4 rounded-xl font-black text-lg transition-transform hover:scale-105 shadow-md flex items-center justify-center shrink-0 cursor-pointer">
          Emitir Mensualidad Completa
        </button>
      </div>

      {/* BOTONES DE ACCIÓN RÁPIDA SECUNDARIOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navegarConAccion('clientes', 'nuevo')} className="bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md p-3 rounded-xl flex items-center gap-3 transition-all group cursor-pointer">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0"><UserPlus className="w-5 h-5" /></div>
          <span className="font-bold text-gray-700 text-sm text-left leading-tight">Nuevo<br/>Alumno</span>
        </button>
        <button onClick={() => navegarConAccion('grupos', 'nuevo')} className="bg-white border border-gray-200 hover:border-indigo-500 hover:shadow-md p-3 rounded-xl flex items-center gap-3 transition-all group cursor-pointer">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0"><BookOpen className="w-5 h-5" /></div>
          <span className="font-bold text-gray-700 text-sm text-left leading-tight">Crear<br/>Grupo</span>
        </button>
        <button onClick={() => navegarConAccion('factura', 'manual')} className="bg-white border border-gray-200 hover:border-green-500 hover:shadow-md p-3 rounded-xl flex items-center gap-3 transition-all group cursor-pointer">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors shrink-0"><FilePlus className="w-5 h-5" /></div>
          <span className="font-bold text-gray-700 text-sm text-left leading-tight">Factura<br/>Suelta</span>
        </button>
        <button onClick={() => navegarConAccion('calendario', 'semana')} className="bg-white border border-gray-200 hover:border-purple-500 hover:shadow-md p-3 rounded-xl flex items-center gap-3 transition-all group cursor-pointer">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0"><CalendarDays className="w-5 h-5" /></div>
          <span className="font-bold text-gray-700 text-sm text-left leading-tight">Ver<br/>Calendario</span>
        </button>
      </div>

      {/* KPIs PRINCIPALES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Alumnos Activos</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-gray-800">{kpis.totalActivos}</h3>
            {kpis.altasMes > 0 && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded mb-1">+{kpis.altasMes} este mes</span>}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Grupos Abiertos</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black text-gray-800">{kpis.totalGrupos}</h3>
            {kpis.gruposLlenos > 0 && <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded mb-1">{kpis.gruposLlenos} Llenos</span>}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Aforo Ocupado</p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-gray-800">{kpis.porcentajeOcupacion}%</h3>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${kpis.porcentajeOcupacion > 85 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{width: `${Math.min(kpis.porcentajeOcupacion, 100)}%`}}></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cursos Ofrecidos</p>
          <h3 className="text-3xl font-black text-gray-800">{productos.length}</h3>
        </div>
      </div>

      {/* PANEL DE GRÁFICOS MASIVOS (RECHARTS) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-100 pb-4">
          <h3 className="font-bold text-gray-800 flex items-center text-lg"><BarChart3 className="w-5 h-5 mr-2 text-blue-600"/> Rendimiento Analítico</h3>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 shadow-inner">
            <CalendarRange className="w-4 h-4 text-gray-500" />
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="outline-none bg-transparent cursor-pointer" />
              <span className="text-gray-300">|</span>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="outline-none bg-transparent cursor-pointer" />
            </div>
          </div>
        </div>

        {/* FILA 1 DE GRÁFICOS: Finanzas y Cursos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 border-b border-gray-100 pb-8">
          {/* Gráfico A: Ingresos Generados */}
          <div className="h-[280px] flex flex-col">
            <p className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wider">Facturación (Cobrado vs Pendiente)</p>
            <div className="flex-1 w-full">
              {datosGraficos.evolucionIngresos.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">Sin facturas en este periodo.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosGraficos.evolucionIngresos}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f9fafb'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                    <Bar dataKey="Cobrado" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Pendiente" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico B: Afluencia por Días */}
          <div className="h-[280px] flex flex-col">
            <p className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wider">Afluencia de Alumnos por Día</p>
            <div className="flex-1 w-full">
              {datosGraficos.afluenciaDias.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">Sin grupos programados.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosGraficos.afluenciaDias} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <YAxis dataKey="dia" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12, fontWeight: 'bold'}} width={40} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="alumnos" name="Alumnos Asistentes" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* FILA 2 DE GRÁFICOS: Cursos, Edades y Retención */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Gráfico C: Evolución Altas (Líneas) */}
          <div className="h-[250px] flex flex-col">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider text-center">Evolución de Nuevas Altas</p>
            <div className="flex-1 w-full">
              {datosGraficos.evolucionMatriculas.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">Sin altas recientes.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosGraficos.evolucionMatriculas}>
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="altas" name="Nuevas Altas" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico D: Retención de Alumnos */}
          <div className="h-[250px] flex flex-col items-center">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider text-center">Tasa de Retención Histórica</p>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={datosGraficos.tasaRetencion} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                    {datosGraficos.tasaRetencion.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2">
              <span className="text-[10px] font-bold text-blue-600 flex items-center"><div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>Activos</span>
              <span className="text-[10px] font-bold text-red-500 flex items-center"><div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>Bajas</span>
            </div>
          </div>

          {/* Gráfico E: Perfil por Edades */}
          <div className="h-[250px] flex flex-col items-center">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider text-center">Perfil por Edades</p>
            <div className="flex-1 w-full">
              {datosGraficos.distribucionEdades.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">Sin datos.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={datosGraficos.distribucionEdades} outerRadius={70} dataKey="value">
                      {datosGraficos.distribucionEdades.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* CLASES DE HOY Y AVISOS DE COBRO (Cambiado 'Morosidad' a 'Avisos de Cobro') */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Clases de hoy */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
            <span className="flex items-center"><Clock className="w-5 h-5 mr-2 text-blue-500"/> Tus Clases de Hoy ({alertas.hoyStr})</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-bold">{alertas.clasesHoy.length}</span>
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {alertas.clasesHoy.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <CalendarDays className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-bold">Día libre. No tienes clases hoy.</p>
              </div>
            ) : (
              alertas.clasesHoy.map(grupo => {
                const aGrupo = matriculas.filter(m => m.idGrupo === grupo.id && m.estado === "Activo").length;
                return (
                  <div key={grupo.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${grupo.color && !grupo.color.startsWith('#') ? grupo.color : ''}`} style={grupo.color && grupo.color.startsWith('#') ? {backgroundColor: grupo.color} : {}}></div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{grupo.nombre}</p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">{grupo.horaInicio} - {grupo.horaFin}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">{aGrupo} Alumnos</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Panel de Avisos de Cobro */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-orange-500"/> Avisos de Pago</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {alertas.facturasPendientes.length > 0 ? (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl shrink-0">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-bold text-orange-900 text-sm flex items-center"><Clock className="w-4 h-4 mr-1.5 text-orange-600" /> {alertas.facturasPendientes.length} Pagos Pendientes</p>
                  <button onClick={() => navegarConAccion('historial', 'morosos')} className="text-xs font-bold text-orange-700 bg-white border border-orange-200 hover:bg-orange-100 px-2 py-1 rounded transition-colors cursor-pointer shadow-sm">Gestionar</button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {alertas.facturasPendientes.slice(0,4).map(f => (
                    <div key={f.id} className="flex justify-between items-center text-xs bg-white p-1.5 rounded border border-orange-100 shadow-sm">
                      <span className="font-bold text-gray-800 truncate pr-2">{f.nombreCliente}</span>
                      <span className="font-black text-orange-600 whitespace-nowrap">{f.total.toFixed(2)}€</span>
                    </div>
                  ))}
                  {alertas.facturasPendientes.length > 4 && <p className="text-xs text-center text-orange-600 font-bold mt-2">+ {alertas.facturasPendientes.length - 4} más...</p>}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="font-bold text-green-800 text-sm">¡Al día! No hay pagos pendientes en este momento.</p>
              </div>
            )}

            {kpis.gruposLlenos > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-start gap-3 shrink-0">
                <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-900 text-sm">Aforo Completo</p>
                  <p className="text-xs text-blue-800 mt-0.5">Tienes {kpis.gruposLlenos} grupo(s) llenos. Podrías plantearte abrir nuevos horarios.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardAcademia;