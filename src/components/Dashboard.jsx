import { FileText, Users, GraduationCap, TrendingUp, Clock } from "lucide-react";

function Dashboard({ setVistaActiva }) {
  // Función para las tarjetas de acción rápida
  const QuickAction = ({ icon: Icon, title, desc, color, onClick }) => (
    <button 
      onClick={onClick}
      className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start text-left group"
    >
      <div className={`p-3 rounded-lg text-white mb-4 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </button>
  );

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resumen General</h1>
        <p className="text-gray-600">Bienvenido/a de nuevo. ¿Qué te gustaría gestionar hoy?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <QuickAction 
          onClick={() => setVistaActiva("factura")}
          icon={FileText} title="Crear Factura" desc="Emitir un nuevo recibo o factura." color="bg-blue-600" 
        />
        <QuickAction 
          onClick={() => setVistaActiva("clientes")}
          icon={Users} title="Nuevo Cliente" desc="Registrar un alumno o tutor nuevo." color="bg-green-600" 
        />
        <QuickAction 
          onClick={() => setVistaActiva("productos")}
          icon={GraduationCap} title="Nuevo Curso" desc="Añadir una nueva cuota al catálogo." color="bg-purple-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-gray-500" /> Estadísticas del Mes</h3>
          <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
            [Gráfico en construcción]
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-gray-500" /> Últimas Facturas Emitidas</h3>
          <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
            [Tabla de recientes en construcción]
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;