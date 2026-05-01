import { useState } from "react";
// Importamos nuestras dos "páginas"
import FormularioFactura from "./components/FormularioFactura";
import AjustesImpuestos from "./components/AjustesImpuestos";

function App() {
  // Este estado controla qué página se está viendo. Por defecto: "factura"
  const [vistaActiva, setVistaActiva] = useState("factura");

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-blue-400 mb-0">Facturador</h2>
          <p className="text-xs text-gray-400">Autónomos PRO</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setVistaActiva("factura")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              vistaActiva === "factura" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            📄 Nueva Factura
          </button>
          
          <button 
            onClick={() => setVistaActiva("ajustes")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              vistaActiva === "ajustes" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            ⚙️ Ajustes (IRPF)
          </button>
        </nav>
      </div>

      {/* ÁREA PRINCIPAL (Donde se muestran las páginas) */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        {/* Aquí ocurre la magia: Si vistaActiva es "factura", mostramos el formulario. Si no, mostramos los ajustes */}
        {vistaActiva === "factura" ? <FormularioFactura /> : <AjustesImpuestos />}
      </div>

    </div>
  );
}

export default App;