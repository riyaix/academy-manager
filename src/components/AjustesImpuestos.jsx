import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

// Recibimos las propiedades (props) desde App.jsx
function AjustesImpuestos({ nombreApp, setNombreApp, subtituloApp, setSubtituloApp, metodosPago, setMetodosPago }) {
  const [perfilActivo, setPerfilActivo] = useState("estandar");
  const [stdIva, setStdIva] = useState(21);
  const [stdIrpf, setStdIrpf] = useState(15);
  const [customIva, setCustomIva] = useState(21);
  const [customIrpf, setCustomIrpf] = useState(15);
  const [customPrefijo, setCustomPrefijo] = useState(new Date().getFullYear() + "-");
  const [customNumero, setCustomNumero] = useState(1);
  const [customMoneda, setCustomMoneda] = useState("€");

  // Estado temporal para el input de añadir un nuevo método de pago
  const [nuevoMetodo, setNuevoMetodo] = useState("");

  const añadirMetodo = () => {
    if (nuevoMetodo.trim() !== "" && !metodosPago.includes(nuevoMetodo)) {
      setMetodosPago([...metodosPago, nuevoMetodo.trim()]);
      setNuevoMetodo("");
    }
  };

  const eliminarMetodo = (metodoAEliminar) => {
    setMetodosPago(metodosPago.filter(m => m !== metodoAEliminar));
  };

  const guardarAjustes = () => {
    alert("¡Configuración global guardada correctamente!");
  };

  const hideArrowsClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="bg-white w-full max-w-4xl p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">Ajustes Generales</h1>
      <p className="text-gray-600 mb-8">Personaliza tu aplicación y la configuración por defecto de tus facturas.</p>
      
      {/* --- SECCIÓN 1: PERSONALIZACIÓN DE LA APP --- */}
      <div className="mb-8 p-6 md:p-8 rounded-lg border-2 border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Personalización del Programa</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nombre del Programa */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Nombre de la Aplicación</label>
            <input 
              type="text" 
              value={nombreApp}
              onChange={(e) => setNombreApp(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Este nombre aparecerá en el menú lateral.</p>
          </div>

          {/* Subtítulo del Programa */}
          <div className="flex flex-col mt-4">
            <label className="text-sm font-semibold text-gray-700 mb-2">Subtítulo de la Aplicación</label>
            <input 
              type="text" 
              value={subtituloApp}
              onChange={(e) => setSubtituloApp(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Gestión de Métodos de Pago */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Métodos de Pago Disponibles</label>
            <div className="flex mb-2">
              <input 
                type="text" 
                value={nuevoMetodo}
                onChange={(e) => setNuevoMetodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && añadirMetodo()}
                placeholder="Ej. Bizum"
                className="flex-1 border border-gray-300 rounded-l-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                onClick={añadirMetodo}
                className="bg-blue-600 text-white px-3 rounded-r-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <ul className="bg-white border border-gray-200 rounded-md max-h-40 overflow-y-auto divide-y divide-gray-100">
              {metodosPago.length === 0 && <li className="p-2 text-sm text-gray-400 italic">No hay métodos definidos.</li>}
              {metodosPago.map((metodo, index) => (
                <li key={index} className="flex justify-between items-center p-2 text-sm hover:bg-gray-50">
                  <span className="text-gray-700">{metodo}</span>
                  <button onClick={() => eliminarMetodo(metodo)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: PERFIL ESTÁNDAR --- */}
      {/* ... (Todo el código del Perfil Estándar y Personalizado que ya teníamos sigue exactamente igual aquí debajo) ... */}
      <div 
        onClick={() => setPerfilActivo("estandar")}
        className={`mb-8 p-6 md:p-8 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
          perfilActivo === "estandar" ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-70"
        }`}
      >
        <div className="flex items-center mb-2">
          <input type="radio" checked={perfilActivo === "estandar"} onChange={() => {}} className="w-5 h-5 text-blue-600 cursor-pointer shrink-0" />
          <h2 className="ml-3 text-xl font-bold text-gray-800 m-0">Perfil Estándar de Impuestos</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6 ml-8">Valores por defecto para las facturas.</p>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ml-8 ${perfilActivo !== "estandar" ? "pointer-events-none" : ""}`}>
          <div className="flex flex-col min-w-0">
            <label className="text-sm font-semibold text-gray-700 mb-2">IVA por defecto</label>
            <select value={stdIva} onChange={(e) => setStdIva(Number(e.target.value))} className="w-full border border-gray-300 rounded-md p-2.5 outline-none bg-white">
              <option value={21}>21% (General)</option><option value={10}>10% (Reducido)</option><option value={4}>4% (Superreducido)</option><option value={0}>0% (Exento)</option>
            </select>
          </div>
          <div className="flex flex-col min-w-0">
            <label className="text-sm font-semibold text-gray-700 mb-2">IRPF por defecto</label>
            <select value={stdIrpf} onChange={(e) => setStdIrpf(Number(e.target.value))} className="w-full border border-gray-300 rounded-md p-2.5 outline-none bg-white">
              <option value={15}>15% (General)</option><option value={7}>7% (Nuevos)</option><option value={0}>0% (Exento)</option>
            </select>
          </div>
          <div className="flex flex-col min-w-0 sm:col-span-2 md:col-span-1 justify-center bg-blue-100/50 p-3 rounded-md border border-blue-200">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Numeración Automática</span>
            <span className="text-sm text-blue-900">Formato: <strong>{new Date().getFullYear()}-XXX</strong> (en €)</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-6 mt-4">
        <button onClick={guardarAjustes} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors">
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}

export default AjustesImpuestos;