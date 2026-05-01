import { useState } from "react";
import { FileText, Archive, Users, GraduationCap, Settings } from "lucide-react";

import FormularioFactura from "./components/FormularioFactura";
import AjustesImpuestos from "./components/AjustesImpuestos";
import GestionClientes from "./components/GestionClientes";
import GestionProductos from "./components/GestionProductos";
import HistorialFacturas from "./components/HistorialFacturas";

function App() {
  const [vistaActiva, setVistaActiva] = useState("factura");

  // ESTADOS GLOBALES (Compartidos entre varias pantallas)
  const [nombreApp, setNombreApp] = useState("Academia PRO");
  const [metodosPago, setMetodosPago] = useState(["Domiciliación Bancaria", "Transferencia", "Efectivo", "Tarjeta (TPV)"]);

  const NavButton = ({ id, icon: Icon, text }) => (
    <button 
      onClick={() => setVistaActiva(id)} 
      className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors font-medium ${
        vistaActiva === id ? "bg-blue-600 text-white shadow-md" : "text-gray-300 hover:bg-gray-800 hover:text-white"
      }`}
    >
      <Icon className="w-5 h-5 mr-3" strokeWidth={2} />
      {text}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* BARRA LATERAL */}
      <div className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6">
          {/* Aquí usamos la variable nombreApp para que cambie dinámicamente */}
          <h2 className="text-2xl font-extrabold text-blue-400 tracking-tight mb-0 truncate" title={nombreApp}>
            {nombreApp}
          </h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Gestión & Pagos</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto">
          <NavButton id="factura" icon={FileText} text="Nueva Factura" />
          <NavButton id="historial" icon={Archive} text="Historial" />
          <div className="border-t border-gray-700/50 my-4 pt-2"></div>
          <NavButton id="clientes" icon={Users} text="Alumnos / Clientes" />
          <NavButton id="productos" icon={GraduationCap} text="Cursos / Cuotas" />
          <div className="border-t border-gray-700/50 my-4 pt-2"></div>
          <NavButton id="ajustes" icon={Settings} text="Ajustes Generales" />
        </nav>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start">
        {vistaActiva === "factura" && <FormularioFactura />}
        {vistaActiva === "historial" && <HistorialFacturas />}
        
        {/* Pasamos los métodos de pago a la gestión de clientes */}
        {vistaActiva === "clientes" && <GestionClientes metodosPago={metodosPago} />}
        
        {vistaActiva === "productos" && <GestionProductos />}
        
        {/* Pasamos las variables y las funciones para modificarlas a los Ajustes */}
        {vistaActiva === "ajustes" && (
          <AjustesImpuestos 
            nombreApp={nombreApp} setNombreApp={setNombreApp}
            metodosPago={metodosPago} setMetodosPago={setMetodosPago}
          />
        )}
      </div>
    </div>
  );
}

export default App;