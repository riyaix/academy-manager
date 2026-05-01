import { useState } from "react";
import FormularioFactura from "./components/FormularioFactura";
import AjustesImpuestos from "./components/AjustesImpuestos";
import GestionClientes from "./components/GestionClientes";
import GestionProductos from "./components/GestionProductos";
import HistorialFacturas from "./components/HistorialFacturas";

function App() {
  const [vistaActiva, setVistaActiva] = useState("factura");

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-blue-400 mb-0">Academia PRO</h2>
          <p className="text-xs text-gray-400">Facturación y Gestión</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <button onClick={() => setVistaActiva("factura")} className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${vistaActiva === "factura" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"}`}>
            📄 Nueva Factura
          </button>
          
          <button onClick={() => setVistaActiva("historial")} className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${vistaActiva === "historial" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"}`}>
            📚 Historial Facturas
          </button>

          <div className="border-t border-gray-700 my-2 pt-2"></div>
          
          <button onClick={() => setVistaActiva("clientes")} className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${vistaActiva === "clientes" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"}`}>
            👥 Clientes / Alumnos
          </button>
          
          <button onClick={() => setVistaActiva("productos")} className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${vistaActiva === "productos" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"}`}>
            📝 Cursos / Cuotas
          </button>

          <div className="border-t border-gray-700 my-2 pt-2"></div>

          <button onClick={() => setVistaActiva("ajustes")} className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${vistaActiva === "ajustes" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"}`}>
            ⚙️ Ajustes
          </button>
        </nav>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        {vistaActiva === "factura" && <FormularioFactura />}
        {vistaActiva === "historial" && <HistorialFacturas />}
        {vistaActiva === "clientes" && <GestionClientes />}
        {vistaActiva === "productos" && <GestionProductos />}
        {vistaActiva === "ajustes" && <AjustesImpuestos />}
      </div>
    </div>
  );
}

export default App;