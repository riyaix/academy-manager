import { useState, useMemo } from "react";
import { Search, Download, CheckCircle, Clock, XCircle, FileText, Filter, Ban, Euro, TrendingUp, AlertCircle, CalendarRange } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function HistorialFacturas({ facturas, setFacturas, clientes, colorFactura, logoFactura }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  
  // Nuevo Estado para el Rango de Fechas
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Aplicar filtros (Búsqueda, Estado y Rango de Fechas)
  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => {
      const coincideBusqueda = 
        f.id.toLowerCase().includes(busqueda.toLowerCase()) || 
        f.nombreCliente.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "Todas" || f.estado === filtroEstado;
      
      // Lógica del Rango de Fechas
      let coincideFecha = true;
      const fDate = new Date(f.fecha);
      if (fechaDesde) {
        coincideFecha = coincideFecha && fDate >= new Date(fechaDesde);
      }
      if (fechaHasta) {
        coincideFecha = coincideFecha && fDate <= new Date(fechaHasta);
      }
      
      return coincideBusqueda && coincideEstado && coincideFecha;
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Más recientes primero
  }, [facturas, busqueda, filtroEstado, fechaDesde, fechaHasta]);

  // Calcular KPIs (Se recalculan solos al cambiar las fechas)
  const metricas = useMemo(() => {
    const stats = { cobrado: 0, pendiente: 0, emitido: 0 };
    facturasFiltradas.forEach(f => {
      if (f.estado === "Pagada") stats.cobrado += f.total;
      if (f.estado === "Pendiente") stats.pendiente += f.total;
      if (f.estado !== "Anulada") stats.emitido += f.total;
    });
    return stats;
  }, [facturasFiltradas]);

  // --- ACCIONES DE ESTADO ---
  const cambiarEstado = (id, nuevoEstado) => {
    setFacturas(facturas.map(f => f.id === id ? { ...f, estado: nuevoEstado } : f));
  };

  const formatearFechaStr = (fechaObj) => {
    if (!fechaObj) return "";
    const [año, mes, dia] = fechaObj.split('-');
    return `${dia}/${mes}/${año}`;
  };

  // --- MOTOR DE PDF DE FACTURAS ---
  const descargarPDF = (factura) => {
    try {
      const doc = new jsPDF();
      const cliente = clientes.find(c => c.COD_CLI === factura.idCliente) || {};
      const rgbColor = hexToRgb(colorFactura || "#2563eb");

      doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("FACTURA", 14, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Nº: ${factura.id}`, 150, 20);
      doc.text(`Fecha: ${formatearFechaStr(factura.fecha)}`, 150, 28);

      if (logoFactura) {
        try {
          doc.addImage(logoFactura, 'PNG', 170, 5, 30, 30);
        } catch (e) {
          console.warn("No se pudo cargar el logo en el PDF", e);
        }
      }

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Facturado a:", 14, 55);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(factura.nombreCliente, 14, 62);
      if (cliente.DNI) doc.text(`DNI/NIE: ${cliente.DNI}`, 14, 68);
      if (cliente.DIRECCION) doc.text(`Dirección: ${cliente.DIRECCION}`, 14, 74);
      if (cliente.TELEFONO) doc.text(`Teléfono: ${cliente.TELEFONO}`, 14, 80);

      const tableData = factura.lineas.map(linea => [
        linea.concepto,
        linea.cantidad.toString(),
        `${linea.precio.toFixed(2)} €`,
        `${(linea.cantidad * linea.precio).toFixed(2)} €`
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['Descripción / Concepto', 'Cant.', 'Precio Unitario', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [rgbColor.r, rgbColor.g, rgbColor.b], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        }
      });

      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL A PAGAR:", 120, finalY);
      
      doc.setFontSize(16);
      doc.setTextColor(rgbColor.r, rgbColor.g, rgbColor.b);
      doc.text(`${factura.total.toFixed(2)} €`, 165, finalY);

      if (factura.estado === "Pagada") {
        doc.setTextColor(22, 163, 74); 
        doc.setFontSize(20);
        doc.text("PAGADA", 14, finalY);
      } else if (factura.estado === "Anulada") {
        doc.setTextColor(220, 38, 38); 
        doc.setFontSize(20);
        doc.text("ANULADA", 14, finalY);
      }

      doc.save(`${factura.id}_${factura.nombreCliente.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      alert("Error generando el PDF: " + error.message);
    }
  };

  const hexToRgb = (hex) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 37, g: 99, b: 235 }; 
  };

  return (
    <div className="bg-white w-full p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[85vh]">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-100 pb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Historial de Facturas</h1>
          <p className="text-sm text-gray-600">Controla los pagos, descarga PDFs y gestiona la morosidad.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold flex items-center border border-blue-100 shadow-sm">
          <FileText className="w-5 h-5 mr-2" /> {facturasFiltradas.length} Facturas en Vista
        </div>
      </div>

      {/* MÉTRICAS FINANCIERAS (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total Emitido</p>
            <p className="text-2xl font-black text-gray-800">{metricas.emitido.toFixed(2)} €</p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Euro className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total Cobrado</p>
            <p className="text-2xl font-black text-green-600">{metricas.cobrado.toFixed(2)} €</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-0.5">Pendiente de Cobro</p>
            <p className="text-2xl font-black text-orange-600">{metricas.pendiente.toFixed(2)} €</p>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS SUPERPOTENCIADA */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 shrink-0 items-center">
        
        {/* Búsqueda Textual */}
        <div className="relative w-full lg:w-1/3">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Buscar por cliente o Nº Factura..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-2/3 justify-end items-center">
          
          {/* Filtro de Estado */}
          <div className="relative w-full md:w-auto min-w-[180px]">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <select 
              value={filtroEstado} 
              onChange={e => setFiltroEstado(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-700 cursor-pointer appearance-none"
            >
              <option value="Todas">Todos los Estados</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Pagada">Pagadas</option>
              <option value="Anulada">Anuladas</option>
            </select>
          </div>
          
          {/* Rango de Fechas */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg pl-3 pr-4 py-2 w-full md:w-auto focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
            <CalendarRange className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2 text-sm font-medium">
              <input 
                type="date" 
                value={fechaDesde} 
                onChange={e => setFechaDesde(e.target.value)}
                className="outline-none text-gray-700 bg-transparent cursor-pointer"
                title="Fecha inicial (Desde)"
              />
              <span className="text-gray-300">|</span>
              <input 
                type="date" 
                value={fechaHasta} 
                onChange={e => setFechaHasta(e.target.value)}
                className="outline-none text-gray-700 bg-transparent cursor-pointer"
                title="Fecha final (Hasta)"
              />
            </div>
            {(fechaDesde || fechaHasta) && (
              <button 
                onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
                className="ml-2 text-red-400 hover:text-red-600 font-bold text-xs"
                title="Limpiar fechas"
              >
                ✕
              </button>
            )}
          </div>

        </div>
      </div>

      {/* TABLA DE FACTURAS */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 uppercase tracking-wider text-gray-600 text-xs font-bold sticky top-0 border-b border-gray-200 z-10">
            <tr>
              <th className="px-6 py-4">Nº Factura</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Cliente / Titular</th>
              <th className="px-6 py-4 text-right">Importe</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {facturasFiltradas.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500 text-base">No se encontraron facturas con estos filtros.</td></tr>
            ) : (
              facturasFiltradas.map(factura => {
                const esPagada = factura.estado === "Pagada";
                const esAnulada = factura.estado === "Anulada";
                const esPendiente = factura.estado === "Pendiente";

                return (
                  <tr key={factura.id} className={`hover:bg-blue-50/50 transition-colors ${esAnulada ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 font-mono font-bold text-gray-800">{factura.id}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{formatearFechaStr(factura.fecha)}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{factura.nombreCliente}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{factura.idCliente}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900 text-base">{factura.total.toFixed(2)} €</td>
                    <td className="px-6 py-4 text-center">
                      {esPagada && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200"><CheckCircle className="w-3 h-3 mr-1"/> Pagada</span>}
                      {esPendiente && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200"><Clock className="w-3 h-3 mr-1"/> Pendiente</span>}
                      {esAnulada && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600 border border-gray-300"><Ban className="w-3 h-3 mr-1"/> Anulada</span>}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button onClick={() => descargarPDF(factura)} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer" title="Descargar PDF">
                        <Download className="w-5 h-5" />
                      </button>
                      
                      {esPendiente && (
                        <button onClick={() => cambiarEstado(factura.id, "Pagada")} className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors cursor-pointer" title="Marcar como Pagada">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      
                      {esPagada && (
                        <button onClick={() => cambiarEstado(factura.id, "Pendiente")} className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors cursor-pointer" title="Marcar como Pendiente">
                          <Clock className="w-5 h-5" />
                        </button>
                      )}

                      {!esAnulada && (
                        <button onClick={() => { if(confirm("¿Seguro que deseas anular esta factura? No sumará al total facturado.")) cambiarEstado(factura.id, "Anulada") }} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer ml-2" title="Anular Factura">
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistorialFacturas;