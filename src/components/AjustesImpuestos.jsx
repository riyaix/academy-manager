import { useState } from "react";

function AjustesImpuestos() {
  // Estado para controlar qué perfil está activo ("estandar" o "personalizado")
  const [perfilActivo, setPerfilActivo] = useState("estandar");

  // Estado para los valores del perfil Personalizado
  const [customIva, setCustomIva] = useState(21);
  const [customIrpf, setCustomIrpf] = useState(15);
  const [customPrefijo, setCustomPrefijo] = useState(new Date().getFullYear() + "-");
  const [customNumero, setCustomNumero] = useState(1);
  const [customMoneda, setCustomMoneda] = useState("€");

  const guardarAjustes = () => {
    if (perfilActivo === "estandar") {
      alert("Guardado: Usando Perfil Estándar (IVA 21%, IRPF 15%, Moneda €)");
    } else {
      alert(`Guardado: Usando Perfil Personalizado (IVA ${customIva}%, IRPF ${customIrpf}%)`);
    }
  };

  return (
    <div className="bg-white w-full max-w-4xl p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
      <h1>Ajustes de Facturación</h1>
      <p className="text-gray-600 mb-8">
        Selecciona cómo quieres que se calculen y numeren tus facturas por defecto.
      </p>
      
      {/* --- CAJA 1: PERFIL ESTÁNDAR --- */}
      <div 
        onClick={() => setPerfilActivo("estandar")}
        className={`mb-6 p-6 rounded-lg border-2 cursor-pointer transition-all ${
          perfilActivo === "estandar" 
            ? "border-blue-500 bg-blue-50 shadow-md" 
            : "border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-70"
        }`}
      >
        <div className="flex items-center mb-4">
          <input 
            type="radio" 
            checked={perfilActivo === "estandar"} 
            onChange={() => setPerfilActivo("estandar")}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <h2 className="ml-3 text-xl font-bold text-gray-800 m-0">Perfil Estándar (Recomendado)</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 ml-8">
          Utiliza los valores legales más comunes para autónomos en España. La numeración se gestionará automáticamente.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 ml-8 text-sm">
          <div className="bg-white p-3 rounded border border-gray-200 text-center">
            <span className="block text-gray-500 font-semibold mb-1">IVA</span>
            <span className="font-bold text-gray-800">21%</span>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200 text-center">
            <span className="block text-gray-500 font-semibold mb-1">IRPF</span>
            <span className="font-bold text-gray-800">15%</span>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200 text-center">
            <span className="block text-gray-500 font-semibold mb-1">Prefijo</span>
            <span className="font-bold text-gray-800">{new Date().getFullYear()}-</span>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200 text-center">
            <span className="block text-gray-500 font-semibold mb-1">Número</span>
            <span className="font-bold text-gray-800">Automático</span>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200 text-center">
            <span className="block text-gray-500 font-semibold mb-1">Moneda</span>
            <span className="font-bold text-gray-800">€</span>
          </div>
        </div>
      </div>

      {/* --- CAJA 2: PERFIL PERSONALIZADO --- */}
      <div 
        onClick={() => setPerfilActivo("personalizado")}
        className={`mb-8 p-6 rounded-lg border-2 cursor-pointer transition-all ${
          perfilActivo === "personalizado" 
            ? "border-blue-500 bg-white shadow-md" 
            : "border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-60"
        }`}
      >
        <div className="flex items-center mb-6">
          <input 
            type="radio" 
            checked={perfilActivo === "personalizado"} 
            onChange={() => setPerfilActivo("personalizado")}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <h2 className="ml-3 text-xl font-bold text-gray-800 m-0">Perfil Personalizado</h2>
        </div>

        {/* Los inputs solo son interactivos si este perfil está activo */}
        <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ml-8 ${perfilActivo !== "personalizado" ? "pointer-events-none" : ""}`}>
          
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">IVA (%)</label>
            <input 
              type="number" 
              value={customIva}
              onChange={(e) => setCustomIva(Number(e.target.value))}
              className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">IRPF (%)</label>
            <input 
              type="number" 
              value={customIrpf}
              onChange={(e) => setCustomIrpf(Number(e.target.value))}
              className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">Prefijo</label>
            <input 
              type="text" 
              value={customPrefijo}
              onChange={(e) => setCustomPrefijo(e.target.value)}
              className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">Nº Inicial</label>
            <input 
              type="number" 
              value={customNumero}
              onChange={(e) => setCustomNumero(Number(e.target.value))}
              className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">Moneda</label>
            <input 
              type="text" 
              value={customMoneda}
              onChange={(e) => setCustomMoneda(e.target.value)}
              className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

        </div>
      </div>

      {/* BOTÓN DE GUARDAR */}
      <div className="flex justify-end border-t border-gray-200 pt-6">
        <button 
          onClick={guardarAjustes}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-md transition-colors"
        >
          Guardar Configuración
        </button>
      </div>

    </div>
  );
}

export default AjustesImpuestos;