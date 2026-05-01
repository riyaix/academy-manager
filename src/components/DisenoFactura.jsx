import { Upload, Palette } from "lucide-react";

function DisenoFactura({ colorFactura, setColorFactura, logoFactura, setLogoFactura }) {
  
  // Función para manejar la subida de la imagen
  const manejarSubidaLogo = (e) => {
    const file = e.target.files[0];
    if (file) {
      const urlImagen = URL.createObjectURL(file);
      setLogoFactura(urlImagen);
    }
  };

  const eliminarLogo = () => {
    setLogoFactura(null);
  };

  return (
    <div className="bg-white w-full p-6 md:p-10 rounded-xl shadow-sm border border-gray-200">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Diseño de Factura</h1>
        <p className="text-sm text-gray-600">Personaliza la apariencia de los PDFs que envías a tus clientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* PANEL DE CONTROLES */}
        <div className="space-y-8">
          {/* Selector de Color */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Palette className="w-5 h-5 mr-2" /> Color Principal</h3>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={colorFactura} 
                onChange={(e) => setColorFactura(e.target.value)}
                className="w-14 h-14 p-1 rounded cursor-pointer border border-gray-300 bg-white"
              />
              <div>
                <p className="text-sm font-semibold text-gray-700">Código Hexadecimal</p>
                <p className="text-xs text-gray-500 font-mono mt-1">{colorFactura.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Subida de Logo */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Upload className="w-5 h-5 mr-2" /> Logotipo</h3>
            {!logoFactura ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> o arrastra</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG (Recomendado apaisado)</p>
                </div>
                <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={manejarSubidaLogo} />
              </label>
            ) : (
              <div className="flex flex-col items-start gap-4">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <img src={logoFactura} alt="Logo" className="max-h-24 object-contain" />
                </div>
                <button onClick={eliminarLogo} className="text-sm text-red-600 hover:text-red-800 font-semibold">
                  Eliminar Logotipo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* VISTA PREVIA (Mockup) */}
        <div className="bg-gray-100 p-8 rounded-lg flex justify-center items-start border border-gray-200">
          <div className="bg-white w-full max-w-sm rounded-md shadow-lg overflow-hidden flex flex-col min-h-[400px]">
            {/* Cabecera dinámica de la vista previa */}
            <div className="p-6 border-b-4 flex justify-between items-start" style={{ borderColor: colorFactura }}>
              <div className="w-24 h-12 bg-gray-100 flex items-center justify-center rounded text-xs text-gray-400 overflow-hidden">
                {logoFactura ? <img src={logoFactura} alt="Logo" className="max-h-full max-w-full object-contain" /> : "LOGO"}
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ color: colorFactura }}>FACTURA</h2>
            </div>
            {/* Resto del mockup vacío */}
            <div className="p-6 flex-1">
              <div className="w-1/2 h-2 bg-gray-200 rounded mb-2"></div>
              <div className="w-1/3 h-2 bg-gray-200 rounded mb-8"></div>
              <div className="w-full h-8 bg-gray-100 rounded mb-2 mt-4"></div>
              <div className="w-full h-4 bg-gray-50 rounded mb-2"></div>
              <div className="w-full h-4 bg-gray-50 rounded mb-2"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DisenoFactura;