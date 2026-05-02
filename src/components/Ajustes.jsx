import { Building2, Palette, Image as ImageIcon, Type, FileCheck, Mail, Phone, MapPin, Trash2, CheckCircle2, Calculator, AlignLeft, Settings2, CheckCircle } from "lucide-react";
import { useState } from "react";

function Ajustes({ 
  colorFactura, setColorFactura, logoFactura, setLogoFactura, 
  datosAcademia, setDatosAcademia, tamañoFuente, setTamañoFuente,
  fuenteApp, setFuenteApp, tipoImpuestos, setTipoImpuestos, 
  ivaDefecto, setIvaDefecto, irpfDefecto, setIrpfDefecto, 
  moneda, setMoneda, separadorDni, setSeparadorDni
}) {
  const [mostrarExito, setMostrarExito] = useState(false);
  const [pestaña, setPestaña] = useState("empresa");

  const paletaColores = ["#2563eb", "#16a34a", "#9333ea", "#ea580c", "#db2777", "#0d9488", "#475569", "#dc2626"];

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoFactura(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const guardarAjustes = () => {
    setMostrarExito(true);
    setTimeout(() => setMostrarExito(false), 3000);
  };

  const formatearTelefono = (valor) => {
    if (!valor) return ''; // FIX: Prevención si viene nulo
    let val = valor.replace(/\D/g, '');
    if (val.length > 9) val = val.slice(0, 9);
    if (val.length > 6) return `${val.slice(0,3)} ${val.slice(3,6)} ${val.slice(6)}`;
    if (val.length > 3) return `${val.slice(0,3)} ${val.slice(3)}`;
    return val;
  };

  const formatearIdentificacion = (valor) => {
    if (!valor) return ''; // FIX: Prevención si viene nulo
    let limpio = valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (limpio.length === 0) return '';
    
    if (/[A-Z]/.test(limpio[0])) { 
       let letra = limpio.slice(0, 1);
       let resto = limpio.slice(1, 9);
       let formatoResto = resto.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
       return `${letra}-${formatoResto}`;
    } else { 
       let numeros = limpio.slice(0, 8);
       let letra = limpio.slice(8, 9);
       let formatoNumeros = numeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
       if (letra) return `${formatoNumeros}-${letra}`;
       return formatoNumeros;
    }
  };

  return (
    <div className="bg-white w-full p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[85vh] relative">
      
      {mostrarExito && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 mr-2" /> Ajustes guardados correctamente
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center mb-6 border-b border-gray-100 pb-5 shrink-0 gap-6">
        <button onClick={guardarAjustes} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-bold shadow-md transition-colors cursor-pointer">
          Guardar Cambios
        </button>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Ajustes Generales</h1>
          <p className="text-sm text-gray-600">Configura la identidad, impuestos y personaliza la plataforma.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row bg-gray-100 p-1.5 rounded-lg border border-gray-200 w-full sm:w-fit mb-8 shrink-0">
        <button onClick={() => setPestaña("empresa")} className={`flex-1 sm:flex-none flex justify-center items-center px-8 py-3 rounded-md text-base font-bold transition-colors cursor-pointer ${pestaña === "empresa" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Building2 className="w-5 h-5 mr-2" /> Datos Empresa y Marca
        </button>
        <button onClick={() => setPestaña("preferencias")} className={`flex-1 sm:flex-none flex justify-center items-center px-8 py-3 rounded-md text-base font-bold transition-colors cursor-pointer ${pestaña === "preferencias" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Settings2 className="w-5 h-5 mr-2" /> Preferencias del Sistema
        </button>
      </div>

      {/* PESTAÑA 1: EMPRESA */}
      {pestaña === "empresa" && (
        <div className="flex-1 flex flex-col xl:flex-row gap-8">
          <div className="w-full xl:w-1/2 flex flex-col gap-6">
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-800">Datos Fiscales para Facturas</h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="font-bold text-gray-700 text-sm mb-1 block">Nombre Legal / Comercial</label>
                  <input type="text" value={datosAcademia?.nombre || ""} onChange={e => setDatosAcademia({...datosAcademia, nombre: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                </div>
                <div>
                  <label className="font-bold text-gray-700 text-sm mb-1 block">CIF / NIF</label>
                  <input type="text" value={datosAcademia?.cif || ""} onChange={e => setDatosAcademia({...datosAcademia, cif: formatearIdentificacion(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="B-12.345.678" />
                </div>
                <div>
                  <label className="font-bold text-gray-700 text-sm mb-1 block">Teléfono</label>
                  <input type="tel" value={datosAcademia?.telefono || ""} onChange={e => setDatosAcademia({...datosAcademia, telefono: formatearTelefono(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="912 345 678" />
                </div>
                <div className="md:col-span-2">
                  <label className="font-bold text-gray-700 text-sm mb-1 block">Correo Electrónico</label>
                  <input type="email" value={datosAcademia?.email || ""} onChange={e => setDatosAcademia({...datosAcademia, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center"><MapPin className="w-4 h-4 mr-2 text-gray-400"/> Dirección Física</h4>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-4">
                      <select value={datosAcademia?.tipoVia || 'Calle'} onChange={e => setDatosAcademia({...datosAcademia, tipoVia: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer">
                        <option value="Calle">Calle</option>
                        <option value="Avenida">Avenida</option>
                        <option value="Plaza">Plaza</option>
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-8">
                      <input type="text" value={datosAcademia?.direccion || ''} onChange={e => setDatosAcademia({...datosAcademia, direccion: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nombre de la vía" />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <input type="text" value={datosAcademia?.numero || ''} onChange={e => setDatosAcademia({...datosAcademia, numero: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nº" />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <input type="text" value={datosAcademia?.puerta || ''} onChange={e => setDatosAcademia({...datosAcademia, puerta: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Piso/Pta" />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <input type="text" value={datosAcademia?.cp || ''} onChange={e => setDatosAcademia({...datosAcademia, cp: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Código Postal" />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <input type="text" value={datosAcademia?.ciudad || ''} onChange={e => setDatosAcademia({...datosAcademia, ciudad: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Ciudad" />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <input type="text" value={datosAcademia?.provincia || ''} onChange={e => setDatosAcademia({...datosAcademia, provincia: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Provincia" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full xl:w-1/2 flex flex-col gap-6">
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-800">Identidad de Marca</h3>
              </div>
              
              <div className="p-5 space-y-6">
                <div>
                  <label className="font-bold text-gray-700 text-sm mb-2 block">Logo de la Empresa</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative group shrink-0">
                      {logoFactura ? (
                        <>
                          <img src={logoFactura} alt="Logo" className="w-full h-full object-contain p-2" />
                          <div onClick={() => setLogoFactura(null)} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                            <Trash2 className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : <ImageIcon className="w-8 h-8 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <input type="file" id="logoUpload" accept="image/png, image/jpeg" onChange={handleLogoUpload} className="hidden" />
                      <label htmlFor="logoUpload" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer inline-block shadow-sm">
                        Subir Imagen
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 text-sm mb-2 block">Color Corporativo</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {paletaColores.map(color => (
                      <button 
                        key={color} onClick={() => setColorFactura(color)} 
                        className={`w-8 h-8 rounded-full shadow-sm cursor-pointer transition-all ${colorFactura === color ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : 'opacity-80 hover:opacity-100'}`}
                        style={{ backgroundColor: color }} title={color}
                      />
                    ))}
                    <div className="w-px h-8 bg-gray-200 mx-2"></div>
                    <div className="relative border border-gray-300 rounded-lg overflow-hidden shadow-sm flex items-center bg-white h-10 w-10">
                      <input type="color" value={(colorFactura || "#2563eb").startsWith('#') ? colorFactura : '#2563eb'} onChange={e => setColorFactura(e.target.value)} className="absolute inset-0 w-16 h-16 -top-2 -left-2 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: PREFERENCIAS */}
      {pestaña === "preferencias" && (
        <div className="flex-1 flex flex-col md:flex-row gap-8 items-start">
          
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-800">Impuestos y Finanzas</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <button onClick={() => setTipoImpuestos("defecto")} className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${tipoImpuestos === "defecto" ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div className={`mt-0.5 shrink-0 ${tipoImpuestos === "defecto" ? 'text-blue-600' : 'text-gray-300'}`}>
                      {tipoImpuestos === "defecto" ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Estándar</p>
                      <p className="text-xs text-gray-500 mt-1">Exento de IVA, facturación en Euros (€).</p>
                    </div>
                  </button>

                  <button onClick={() => setTipoImpuestos("personalizado")} className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${tipoImpuestos === "personalizado" ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div className={`mt-0.5 shrink-0 ${tipoImpuestos === "personalizado" ? 'text-blue-600' : 'text-gray-300'}`}>
                      {tipoImpuestos === "personalizado" ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Personalizado</p>
                      <p className="text-xs text-gray-500 mt-1">Modifica porcentajes y divisa libremente.</p>
                    </div>
                  </button>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl border ${tipoImpuestos === "defecto" ? 'bg-gray-50 border-transparent opacity-70 pointer-events-none' : 'bg-white border-gray-200'}`}>
                  <div>
                    <label className="font-bold text-gray-700 text-sm mb-1 block">I.V.A por defecto (%)</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" value={tipoImpuestos === "defecto" ? 0 : ivaDefecto} onChange={e => setIvaDefecto(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base" />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 text-sm mb-1 block">Reserva I.R.P.F (%)</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" value={tipoImpuestos === "defecto" ? 20 : irpfDefecto} onChange={e => setIrpfDefecto(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base text-red-600" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-gray-700 text-sm mb-1 block">Moneda del Sistema</label>
                    <input type="text" value={tipoImpuestos === "defecto" ? "€" : moneda} onChange={e => setMoneda(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-800">Formato del DNI</h3>
              </div>
              <div className="p-5">
                 <select value={separadorDni} onChange={e => setSeparadorDni(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono font-bold text-gray-700 cursor-pointer">
                    <option value=".">Puntos (12.345.678-X)</option>
                    <option value="-">Guiones (12-345-678-X)</option>
                    <option value=" ">Espacios (12 345 678 X)</option>
                    <option value="">Sin separador (12345678X)</option>
                 </select>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-800">Tipografía de la Interfaz</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setFuenteApp("font-sans")} className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${fuenteApp === "font-sans" ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div><p className="font-bold text-gray-800 font-sans">Moderna</p></div><span className="text-2xl font-bold font-sans">Aa</span>
                  </button>
                  <button onClick={() => setFuenteApp("font-serif")} className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${fuenteApp === "font-serif" ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div><p className="font-bold text-gray-800 font-serif">Clásica</p></div><span className="text-2xl font-bold font-serif">Aa</span>
                  </button>
                  <button onClick={() => setFuenteApp("font-mono")} className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${fuenteApp === "font-mono" ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div><p className="font-bold text-gray-800 font-mono">Técnica</p></div><span className="text-2xl font-bold font-mono">Aa</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-800">Tamaño Visual</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                  <button onClick={() => setTamañoFuente("pequeña")} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all cursor-pointer ${tamañoFuente === "pequeña" ? 'bg-white shadow-md border border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}>
                    <span className="text-xs font-bold mb-1">Aa</span><span className="text-[10px] font-semibold uppercase">Pequeña</span>
                  </button>
                  <button onClick={() => setTamañoFuente("normal")} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all cursor-pointer ${tamañoFuente === "normal" ? 'bg-white shadow-md border border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}>
                    <span className="text-base font-bold mb-1">Aa</span><span className="text-[10px] font-semibold uppercase">Normal</span>
                  </button>
                  <button onClick={() => setTamañoFuente("grande")} className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all cursor-pointer ${tamañoFuente === "grande" ? 'bg-white shadow-md border border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}>
                    <span className="text-xl font-bold mb-1">Aa</span><span className="text-[10px] font-semibold uppercase">Grande</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

export default Ajustes;