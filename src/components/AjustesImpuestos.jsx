import { useState } from "react";

function AjustesImpuestos() {
  const [perfilActivo, setPerfilActivo] = useState("estandar");

  // Estado para Perfil Estándar
  const [stdIva, setStdIva] = useState(21);
  const [stdIrpf, setStdIrpf] = useState(15);

  // Estado para Perfil Personalizado
  const [customIva, setCustomIva] = useState(21);
  const [customIrpf, setCustomIrpf] = useState(15);
  const [customPrefijo, setCustomPrefijo] = useState(new Date().getFullYear() + "-");
  const [customNumero, setCustomNumero] = useState(1);
  const [customMoneda, setCustomMoneda] = useState("€");

  const guardarAjustes = () => {
    if (perfilActivo === "estandar") {
      alert(`Guardado: Perfil Estándar (IVA ${stdIva}%, IRPF ${stdIrpf}%, Moneda €)`);
    } else {
      alert(`Guardado: Perfil Personalizado (IVA ${customIva}%, IRPF ${customIrpf}%)`);
    }
  };

  const hideArrowsClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="bg-white w-full max-w-4xl p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
      <h1 className="mb-2">Ajustes de Facturación</h1>
      <p className="text-gray-600 mb-8">
        Selecciona cómo quieres que se calculen y numeren tus facturas por defecto.
      </p>
      
      {/* --- CAJA 1: PERFIL ESTÁNDAR --- */}
      <div 
        onClick={() => setPerfilActivo("estandar")}
        className={`mb-8 p-6 md:p-8 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
          perfilActivo === "estandar" 
            ? "border-blue-500 bg-blue-50 shadow-md" 
            : "border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-70"
        }`}
      >
        <div className="flex items-center mb-2">
          <input 
            type="radio" 
            checked={perfilActivo === "estandar"} 
            onChange={() => setPerfilActivo("estandar")}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
          />
          <h2 className="ml-3 text-xl font-bold text-gray-800 m-0">Perfil Estándar (Recomendado)</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-8 ml-8">
          Selecciona las retenciones legales. La numeración será correlativa automáticamente.
        </p>

        {/* Usamos un grid de 2 columnas en pantallas pequeñas y 3 en grandes, con más espacio (gap-6) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ml-8 ${perfilActivo !== "estandar" ? "pointer-events-none" : ""}`}>
          
          <div className="flex flex-col min-w-0">
            <label className="text-sm font-semibold text-gray-700 mb-2">IVA por defecto</label>
            <select 
              value={stdIva} 
              onChange={(e) => setStdIva(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value={21}>21% (General)</option>
              <option value={10}>10% (Reducido)</option>
              <option value={4}>4% (Superreducido)</option>
              <option value={0}>0% (Exento)</option>
            </select>
          </div>

          <div className="flex flex-col min-w-0">
            <label className="text-sm font-semibold text-gray-700 mb-2">IRPF por defecto</label>
            <select 
              value={stdIrpf} 
              onChange={(e) => setStdIrpf(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value={15}>15% (General)</option>
              <option value={7}>7% (Nuevos)</option>
              <option value={0}>0% (Exento)</option>
            </select>
          </div>

          {/* Textos estáticos rediseñados para parecer información, no inputs falsos */}
          <div className="flex flex-col min-w-0 sm:col-span-2 md:col-span-1 justify-center bg-blue-100/50 p-3 rounded-md border border-blue-200">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Numeración Automática</span>
            <span className="text-sm text-blue-900">Formato: <strong>{new Date().getFullYear()}-XXX</strong> (en €)</span>
          </div>

        </div>
      </div>

      {/* --- CAJA 2: PERFIL PERSONALIZADO --- */}
      <div 
        onClick={() => setPerfilActivo("personalizado")}
        className={`mb-8 p-6 md:p-8 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
          perfilActivo === "personalizado" 
            ? "border-blue-500 bg-white shadow-md" 
            : "border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-60"
        }`}
      >
        <div className="flex items-center mb-8">
          <input 
            type="radio" 
            checked={perfilActivo === "personalizado"} 
            onChange={() => setPerfilActivo("personalizado")}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
          />
          <h2 className="ml-3 text-xl font-bold text-gray-800 m-0">Perfil Personalizado</h2>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ml-8 ${perfilActivo !== "personalizado" ? "pointer-events-none" : ""}`}>
          
          <div className="flex flex-col min-w-0">
            <label className="text-sm font-semibold text-gray-700 mb-2">IVA (%)</label>
            <input 
              type="number" 
              value={customIva}
              onChange={(e) => setCustomIva(Number(e.target.value))}
              className={`w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${hideArrowsClass}`}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <label className="text-sm font-semibold text-gray-700 mb-2">IRPF (%)</label>
            <input 
              type="number" 
              value={customIrpf}
              onChange={(e) => setCustomIrpf(Number(e.target.value))}
              className={`w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${hideArrowsClass}`}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <label className="text-sm font-semibold text-gray-700 mb-2">Prefijo</label>
            <input 
              type="text" 
              value={customPrefijo}
              onChange={(e) => setCustomPrefijo(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <label className="text-sm font-semibold text-gray-700 mb-2">Nº Inicial</label>
            <input 
              type="number" 
              value={customNumero}
              onChange={(e) => setCustomNumero(Number(e.target.value))}
              className={`w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${hideArrowsClass}`}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <label className="text-sm font-semibold text-gray-700 mb-2">Moneda</label>
            {customMoneda !== "otra" ? (
              <select 
                value={customMoneda} 
                onChange={(e) => setCustomMoneda(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="€">€ (Euro)</option>
                <option value="$">$ (USD)</option>
                <option value="£">£ (GBP)</option>
                <option value="otra">Otra...</option>
              </select>
            ) : (
              <input 
                type="text" 
                autoFocus
                placeholder="Ej. ¥"
                onChange={(e) => setCustomMoneda(e.target.value)}
                onBlur={(e) => { if(e.target.value === "") setCustomMoneda("€") }}
                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}
          </div>

        </div>
      </div>

      {/* BOTÓN DE GUARDAR */}
      <div className="flex justify-end border-t border-gray-200 pt-6 mt-4">
        <button 
          onClick={guardarAjustes}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors"
        >
          Guardar Configuración
        </button>
      </div>

    </div>
  );
}

export default AjustesImpuestos;