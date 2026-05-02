import { useState, useMemo } from "react";
import { FileText, Plus, Trash2, Users, Layers, Zap, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

function FormularioFactura({ clientes, productos, facturas, setFacturas, grupos, matriculas }) {
  const [modo, setModo] = useState("lote"); // 'lote' o 'manual'

  const generarIdFactura = (correlativoActual) => {
    const año = new Date().getFullYear();
    const num = facturas.filter(f => f.id && f.id.includes(`F-${año}-`)).length + correlativoActual + 1;
    return `F-${año}-${num.toString().padStart(3, '0')}`;
  };

  const [mostrarExito, setMostrarExito] = useState(false);
  const mostrarMensajeExito = () => {
    setMostrarExito(true);
    setTimeout(() => setMostrarExito(false), 3000);
  };

  // ==========================================
  // ESTADOS Y LÓGICA: FACTURACIÓN EN LOTE
  // ==========================================
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mesActualStr = `${meses[new Date().getMonth()]} ${new Date().getFullYear()}`;
  
  const [mesCobro, setMesCobro] = useState(mesActualStr);
  const [gruposSeleccionados, setGruposSeleccionados] = useState([]);

  const toggleGrupo = (idGrupo) => {
    if (gruposSeleccionados.includes(idGrupo)) setGruposSeleccionados(gruposSeleccionados.filter(id => id !== idGrupo));
    else setGruposSeleccionados([...gruposSeleccionados, idGrupo]);
  };

  const seleccionarTodosGrupos = () => {
    const gruposActivos = grupos.filter(g => g.estado !== "Archivado").map(g => g.id);
    if (gruposSeleccionados.length === gruposActivos.length) setGruposSeleccionados([]);
    else setGruposSeleccionados(gruposActivos);
  };

  const limpiarLote = () => {
    if(confirm("¿Seguro que quieres borrar la selección y empezar de cero?")) {
      setMesCobro(mesActualStr);
      setGruposSeleccionados([]);
    }
  };

  // Motor de agrupación inteligente (Agrupa por DNI/Titular para Hermanos)
  const previsualizacionLote = useMemo(() => {
    if (gruposSeleccionados.length === 0) return [];

    const facturasDraft = {}; 

    matriculas.forEach(mat => {
      if (mat.estado === "Activo" && gruposSeleccionados.includes(mat.idGrupo)) {
        const grupo = grupos.find(g => g.id === mat.idGrupo);
        const curso = productos.find(p => p.COD_PROD === grupo.idProducto);
        const cliente = clientes.find(c => c.COD_CLI === mat.idCliente);

        if (!grupo || !curso || !cliente) return;

        // Si tiene DNI, usamos el DNI para agrupar hermanos. Si no, su código de cliente.
        const identificadorFamilia = cliente.DNI ? cliente.DNI.trim() : cliente.COD_CLI;

        if (!facturasDraft[identificadorFamilia]) {
          facturasDraft[identificadorFamilia] = { cliente, lineas: [], total: 0 };
        }

        const precio = curso.CUOTA || 0;
        const nombreAlumno = cliente.ALUMNO || cliente.NOMBRE;
        
        facturasDraft[identificadorFamilia].lineas.push({
          // Añadimos el nombre del alumno para que el padre sepa de quién es la cuota
          concepto: `Cuota ${mesCobro} - ${grupo.nombre} (${nombreAlumno})`,
          cantidad: 1,
          precio: precio
        });
        facturasDraft[identificadorFamilia].total += precio;
      }
    });

    return Object.values(facturasDraft);
  }, [gruposSeleccionados, matriculas, grupos, productos, clientes, mesCobro]);

  const generarFacturasEnLote = () => {
    if (previsualizacionLote.length === 0) return;
    if (!confirm(`Vas a generar ${previsualizacionLote.length} facturas automáticas. ¿Proceder?`)) return;

    const fechaHoy = new Date().toISOString().split('T')[0];
    const nuevasFacturas = previsualizacionLote.map((draft, index) => {
      // La factura va a nombre del Titular (Padre/Madre)
      const nombreTitular = draft.cliente.NOMBRE && draft.cliente.APELLIDOS 
        ? `${draft.cliente.NOMBRE} ${draft.cliente.APELLIDOS}` 
        : draft.cliente.ALUMNO;

      return {
        id: generarIdFactura(index),
        fecha: fechaHoy,
        idCliente: draft.cliente.COD_CLI, // Usamos el ID del primer hijo encontrado como referencia
        nombreCliente: nombreTitular,
        lineas: draft.lineas,
        total: draft.total,
        estado: "Pendiente"
      };
    });

    setFacturas([...facturas, ...nuevasFacturas]);
    setGruposSeleccionados([]);
    mostrarMensajeExito();
  };

  // ==========================================
  // ESTADOS Y LÓGICA: FACTURA MANUAL
  // ==========================================
  const [clienteManual, setClienteManual] = useState("");
  const [fechaManual, setFechaManual] = useState(new Date().toISOString().split('T')[0]);
  const [lineasManual, setLineasManual] = useState([{ concepto: "", cantidad: 1, precio: 0 }]);

  const agregarLineaManual = () => setLineasManual([...lineasManual, { concepto: "", cantidad: 1, precio: 0 }]);
  
  const actualizarLineaManual = (index, campo, valor) => {
    const nuevas = [...lineasManual];
    nuevas[index][campo] = campo === "concepto" ? valor : parseFloat(valor) || 0;
    setLineasManual(nuevas);
  };

  const eliminarLineaManual = (index) => {
    if (lineasManual.length === 1) return;
    setLineasManual(lineasManual.filter((_, i) => i !== index));
  };

  const cargarProductoEnLinea = (index, codProd) => {
    const prod = productos.find(p => p.COD_PROD === codProd);
    if(prod) {
      const nuevas = [...lineasManual];
      nuevas[index].concepto = prod.CURSO;
      nuevas[index].precio = prod.CUOTA;
      setLineasManual(nuevas);
    }
  };

  const limpiarManual = () => {
    if(confirm("¿Seguro que quieres borrar todos los datos de esta factura?")) {
      setClienteManual("");
      setFechaManual(new Date().toISOString().split('T')[0]);
      setLineasManual([{ concepto: "", cantidad: 1, precio: 0 }]);
    }
  };

  const totalManual = lineasManual.reduce((sum, linea) => sum + (linea.cantidad * linea.precio), 0);

  const guardarFacturaManual = () => {
    if (!clienteManual) return alert("Selecciona un cliente.");
    if (lineasManual.some(l => !l.concepto || l.precio <= 0)) return alert("Revisa que todas las líneas tengan concepto y precio.");

    const clienteData = clientes.find(c => c.COD_CLI === clienteManual);
    const nombreTitular = clienteData.NOMBRE && clienteData.APELLIDOS 
        ? `${clienteData.NOMBRE} ${clienteData.APELLIDOS}` 
        : clienteData.ALUMNO;

    const nuevaFactura = {
      id: generarIdFactura(0),
      fecha: fechaManual,
      idCliente: clienteManual,
      nombreCliente: nombreTitular,
      lineas: lineasManual,
      total: totalManual,
      estado: "Pendiente"
    };

    setFacturas([...facturas, nuevaFactura]);
    setClienteManual("");
    setLineasManual([{ concepto: "", cantidad: 1, precio: 0 }]);
    mostrarMensajeExito();
  };

  return (
    <div className="bg-white w-full p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[85vh] relative">
      
      {mostrarExito && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 mr-2" /> ¡Facturas creadas y guardadas en el Historial!
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-100 pb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Centro de Facturación</h1>
          <p className="text-sm text-gray-600">Genera cobros de forma automatizada o manual.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button onClick={() => setModo("lote")} className={`flex items-center px-5 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${modo === "lote" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Zap className="w-4 h-4 mr-2" /> Emisión en Lote (Auto)
          </button>
          <button onClick={() => setModo("manual")} className={`flex items-center px-5 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${modo === "manual" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <FileText className="w-4 h-4 mr-2" /> Factura Única (Manual)
          </button>
        </div>
      </div>

      {/* =========================================
          VISTA 1: EMISIÓN EN LOTE (AUTOMÁTICA)
          ========================================= */}
      {modo === "lote" && (
        <div className="flex-1 flex flex-col md:flex-row gap-8">
          
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl relative">
              <h3 className="font-bold text-blue-800 mb-2 flex items-center"><Layers className="w-5 h-5 mr-2"/> 1. Define el Concepto Global</h3>
              <p className="text-sm text-blue-600/80 mb-4">Este texto aparecerá en todas las facturas generadas.</p>
              
              <label className="font-bold text-gray-700 text-sm mb-1 block">Concepto / Mes de Cobro</label>
              <input type="text" value={mesCobro} onChange={e => setMesCobro(e.target.value)} className="w-full border border-blue-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white" placeholder="Ej. Mensualidad Octubre 2026" />
            </div>

            <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl flex-1 flex flex-col relative">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 mb-1 flex items-center"><Users className="w-5 h-5 mr-2 text-gray-500"/> 2. Selecciona los Grupos a Cobrar</h3>
                  <p className="text-sm text-gray-500">Se facturará a los alumnos ACTIVOS en estos grupos.</p>
                </div>
                <button onClick={seleccionarTodosGrupos} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">Seleccionar Todos</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {grupos.filter(g => g.estado !== "Archivado").length === 0 ? (
                  <p className="text-sm text-center text-gray-400 italic py-4">No hay grupos activos configurados.</p>
                ) : (
                  grupos.filter(g => g.estado !== "Archivado").map(grupo => {
                    const isSelected = gruposSeleccionados.includes(grupo.id);
                    const activos = matriculas.filter(m => m.idGrupo === grupo.id && m.estado === "Activo").length;
                    return (
                      <div 
                        key={grupo.id} 
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                        onClickCapture={() => toggleGrupo(grupo.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 cursor-pointer" />
                          <div>
                            <p className="font-bold text-sm leading-tight">{grupo.nombre}</p>
                            <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{grupo.horaInicio} • {grupo.dias.join(", ")}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isSelected ? 'bg-blue-700/50' : 'bg-gray-100 text-gray-600'}`}>{activos} Alumnos</span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">3. Previsualización y Generación</h3>
              <button onClick={limpiarLote} className="text-sm font-bold text-gray-500 hover:text-red-600 flex items-center transition-colors cursor-pointer">
                <RotateCcw className="w-4 h-4 mr-1" /> Limpiar Todo
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {previsualizacionLote.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-bold">Sin alumnos a facturar</p>
                  <p className="text-sm mt-1">Selecciona al menos un grupo a la izquierda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800 font-medium">Agrupación Familiar Inteligente: Si varios alumnos comparten el mismo DNI (Hermanos), se agruparán sus cuotas en una única factura a nombre del Titular.</p>
                  </div>
                  
                  {previsualizacionLote.map(draft => {
                    const nombreTitular = draft.cliente.NOMBRE && draft.cliente.APELLIDOS 
                      ? `${draft.cliente.NOMBRE} ${draft.cliente.APELLIDOS}` 
                      : draft.cliente.ALUMNO;

                    return (
                      <div key={draft.cliente.COD_CLI} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm flex justify-between items-center">
                        <div className="w-2/3">
                          <p className="font-bold text-gray-800 text-sm truncate">{nombreTitular}</p>
                          <div className="mt-1 space-y-1">
                            {draft.lineas.map((linea, i) => (
                              <p key={i} className="text-[10px] text-gray-500 truncate">- {linea.concepto}</p>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-blue-600">{draft.total.toFixed(2)} €</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-200 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600 font-medium text-sm">Total Facturas a Crear:</p>
                <p className="font-black text-2xl text-gray-800">{previsualizacionLote.length}</p>
              </div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600 font-medium text-sm">Volumen de Cobro Estimado:</p>
                <p className="font-black text-2xl text-green-600">{previsualizacionLote.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)} €</p>
              </div>
              
              <button 
                onClick={generarFacturasEnLote}
                disabled={previsualizacionLote.length === 0}
                className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center transition-all ${previsualizacionLote.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg cursor-pointer hover:scale-[1.01]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <Zap className="w-6 h-6 mr-2" fill="currentColor" /> Generar Facturas Automáticamente
              </button>
            </div>
          </div>

        </div>
      )}

      {/* =========================================
          VISTA 2: FACTURACIÓN MANUAL
          ========================================= */}
      {modo === "manual" && (
        <div className="max-w-4xl mx-auto w-full">
          
          <div className="flex justify-end mb-4">
             <button onClick={limpiarManual} className="text-sm font-bold text-gray-500 hover:text-red-600 flex items-center transition-colors cursor-pointer">
                <RotateCcw className="w-4 h-4 mr-1" /> Limpiar Formulario
              </button>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="font-bold text-gray-700 text-sm mb-1 block">Seleccionar Cliente / Alumno</label>
                <select value={clienteManual} onChange={e => setClienteManual(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer font-medium">
                  <option value="">Buscar en base de datos...</option>
                  {clientes.map(c => <option key={c.COD_CLI} value={c.COD_CLI}>{c.ALUMNO || `${c.NOMBRE} ${c.APELLIDOS}`} {c.DNI ? `(${c.DNI})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700 text-sm mb-1 block">Fecha de Emisión</label>
                <input type="date" value={fechaManual} onChange={e => setFechaManual(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer font-medium" />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Conceptos a Facturar</h3>
              <button onClick={agregarLineaManual} className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center">
                <Plus className="w-4 h-4 mr-1" /> Añadir Línea Libre
              </button>
            </div>
            
            <div className="p-0">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-bold w-1/3">Catálogo (Opcional)</th>
                    <th className="px-6 py-3 font-bold w-full">Concepto / Descripción</th>
                    <th className="px-6 py-3 font-bold text-center w-24">Cant.</th>
                    <th className="px-6 py-3 font-bold text-right w-32">Precio Unit.</th>
                    <th className="px-6 py-3 font-bold text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineasManual.map((linea, index) => (
                    <tr key={index} className="bg-white">
                      <td className="px-4 py-3">
                        <select onChange={e => cargarProductoEnLinea(index, e.target.value)} className="w-full border border-gray-200 rounded p-2 text-xs outline-none focus:border-blue-500 bg-gray-50">
                          <option value="">Seleccionar curso...</option>
                          {productos.map(p => <option key={p.COD_PROD} value={p.COD_PROD}>{p.CURSO}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={linea.concepto} onChange={e => actualizarLineaManual(index, 'concepto', e.target.value)} placeholder="Ej. Libro de texto B1" className="w-full border border-gray-200 rounded p-2 text-sm font-medium outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="1" value={linea.cantidad} onChange={e => actualizarLineaManual(index, 'cantidad', e.target.value)} className="w-full border border-gray-200 rounded p-2 text-sm text-center outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-4 py-3 relative">
                        <input type="number" step="0.01" value={linea.precio} onChange={e => actualizarLineaManual(index, 'precio', e.target.value)} className="w-full border border-gray-200 rounded p-2 text-sm text-right font-mono outline-none focus:border-blue-500 pr-6" />
                        <span className="absolute right-6 top-5 text-gray-400 text-sm font-bold">€</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => eliminarLineaManual(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer disabled:opacity-30" disabled={lineasManual.length === 1}>
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-end items-center gap-6">
              <p className="text-gray-500 font-bold uppercase tracking-wide text-sm">Total a facturar:</p>
              <p className="font-black text-3xl text-gray-900">{totalManual.toFixed(2)} €</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={guardarFacturaManual} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md cursor-pointer transition-colors text-lg flex items-center">
              Guardar Factura Manual
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default FormularioFactura;