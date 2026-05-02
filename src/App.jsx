import { useState } from "react";
import { LayoutDashboard, FileText, Archive, Users, GraduationCap, Settings, Palette, CalendarDays, BookOpen } from "lucide-react";
import { useLocalStorage } from "./hooks/useLocalStorage";

import Dashboard from "./components/Dashboard";
import FormularioFactura from "./components/FormularioFactura";
import AjustesImpuestos from "./components/AjustesImpuestos";
import GestionClientes from "./components/GestionClientes";
import GestionProductos from "./components/GestionProductos";
import HistorialFacturas from "./components/HistorialFacturas";
import DisenoFactura from "./components/DisenoFactura";
// NUEVOS COMPONENTES
import Calendario from "./components/Calendario";
import GestionGrupos from "./components/GestionGrupos";

function App() {
  const [vistaActiva, setVistaActiva] = useState("dashboard");

  const [nombreApp, setNombreApp] = useLocalStorage("app_nombre", "Academia PRO");
  const [subtituloApp, setSubtituloApp] = useLocalStorage("app_subtitulo", "Gestión & Pagos");
  const [metodosPago, setMetodosPago] = useLocalStorage("app_metodos", ["Domiciliación Bancaria", "Transferencia", "Efectivo", "Tarjeta (TPV)"]);
  const [colorFactura, setColorFactura] = useLocalStorage("app_color", "#2563eb");
  const [logoFactura, setLogoFactura] = useLocalStorage("app_logo", null);
  const [separadorDni, setSeparadorDni] = useLocalStorage("app_separador_dni", ".");

  const [clientes, setClientes] = useLocalStorage("db_clientes", []);
  const [productos, setProductos] = useLocalStorage("db_productos", []);
  const [facturas, setFacturas] = useLocalStorage("db_facturas", []);
  
  // Bases de datos para el motor de clases
  const [grupos, setGrupos] = useLocalStorage("db_grupos", []);
  const [matriculas, setMatriculas] = useLocalStorage("db_matriculas", []);

  const NavButton = ({ id, icon: Icon, text }) => (
    <button 
      onClick={() => setVistaActiva(id)} 
      className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors font-medium cursor-pointer ${
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
      <div className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-20 shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-extrabold text-blue-400 tracking-tight mb-0 truncate" title={nombreApp}>{nombreApp}</h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1 truncate" title={subtituloApp}>{subtituloApp}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto pb-4">
          <NavButton id="dashboard" icon={LayoutDashboard} text="Panel Principal" />
          <div className="border-t border-gray-700/50 my-4 pt-2"></div>
          
          <NavButton id="factura" icon={FileText} text="Nueva Factura" />
          <NavButton id="historial" icon={Archive} text="Historial" />
          <div className="border-t border-gray-700/50 my-4 pt-2"></div>
          
          <NavButton id="clientes" icon={Users} text="Alumnos / Clientes" />
          <NavButton id="productos" icon={GraduationCap} text="Catálogo Cursos" />
          
          {/* NUEVOS BOTONES SEPARADOS */}
          <NavButton id="grupos" icon={BookOpen} text="Grupos y Matrículas" />
          <NavButton id="calendario" icon={CalendarDays} text="Calendario" />
          
          <div className="border-t border-gray-700/50 my-4 pt-2"></div>
          <NavButton id="diseno" icon={Palette} text="Diseño de Factura" />
          <NavButton id="ajustes" icon={Settings} text="Ajustes Generales" />
        </nav>
      </div>

      {/* ÁREA PRINCIPAL FIX: Ahora ocupa el 100% de la pantalla sin estar centrado en una cajita pequeña */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
        <div className="w-full flex-1">
          {vistaActiva === "dashboard" && <Dashboard setVistaActiva={setVistaActiva} clientes={clientes} productos={productos} facturas={facturas} />}
          {vistaActiva === "factura" && <FormularioFactura colorFactura={colorFactura} logoFactura={logoFactura} clientes={clientes} productos={productos} facturas={facturas} setFacturas={setFacturas} />}
          {vistaActiva === "historial" && <HistorialFacturas facturas={facturas} setFacturas={setFacturas} />}
          {vistaActiva === "clientes" && <GestionClientes clientes={clientes} setClientes={setClientes} separadorDni={separadorDni} />}
          {vistaActiva === "productos" && <GestionProductos productos={productos} setProductos={setProductos} clientes={clientes} />}
          
          {/* NUEVAS RUTAS */}
          {vistaActiva === "grupos" && <GestionGrupos clientes={clientes} productos={productos} grupos={grupos} setGrupos={setGrupos} matriculas={matriculas} setMatriculas={setMatriculas} />}
          {vistaActiva === "calendario" && <Calendario grupos={grupos} matriculas={matriculas} productos={productos} />}

          {vistaActiva === "diseno" && <DisenoFactura colorFactura={colorFactura} setColorFactura={setColorFactura} logoFactura={logoFactura} setLogoFactura={setLogoFactura} />}
          {vistaActiva === "ajustes" && <AjustesImpuestos nombreApp={nombreApp} setNombreApp={setNombreApp} subtituloApp={subtituloApp} setSubtituloApp={setSubtituloApp} metodosPago={metodosPago} setMetodosPago={setMetodosPago} separadorDni={separadorDni} setSeparadorDni={setSeparadorDni} />}
        </div>
      </div>
    </div>
  );
}

export default App;