import { useState } from "react";

function FormularioFactura() {
  // Aquí guardaremos los datos que escribas en el formulario
  const [emisor, setEmisor] = useState({
    nombre: "",
    nif: "",
    direccion: "",
  });

  // Esta función actualiza el estado cada vez que escribes en un campo
  const handleChangeEmisor = (e) => {
    setEmisor({
      ...emisor,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
      
      {/* Contenedor principal de la factura (tipo papel A4) */}
      <div className="bg-white w-full max-w-4xl p-10 rounded-xl shadow-lg border border-gray-200">
        
        {/* Usando el <h1> que configuramos en index.css */}
        <h1>Nueva Factura</h1>

        {/* Sección: Datos del Emisor */}
        <section className="mb-8">
          <h2>Tus Datos (Emisor)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Campo: Nombre */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">Nombre y Apellidos</label>
              <input 
                type="text" 
                name="nombre"
                value={emisor.nombre}
                onChange={handleChangeEmisor}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej. Juan Pérez García"
              />
            </div>

            {/* Campo: NIF */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">NIF / DNI</label>
              <input 
                type="text" 
                name="nif"
                value={emisor.nif}
                onChange={handleChangeEmisor}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej. 12345678A"
              />
            </div>

            {/* Campo: Dirección (Ocupa dos columnas) */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-1">Domicilio Fiscal</label>
              <input 
                type="text" 
                name="direccion"
                value={emisor.direccion}
                onChange={handleChangeEmisor}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej. Calle Mayor 1, 28001, Madrid"
              />
            </div>

          </div>
        </section>

        {/* Para comprobar que funciona, mostramos lo que escribes abajo */}
        <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800"><strong>Vista previa de tus datos:</strong></p>
          <p className="text-sm text-blue-900">{emisor.nombre} | {emisor.nif} | {emisor.direccion}</p>
        </div>

      </div>
    </div>
  );
}

export default FormularioFactura;