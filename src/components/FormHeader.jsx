/**
 * Componente del Header del formulario TCU
 */
const FormHeader = () => {
  return (
    <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-orange-500 text-white p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-5"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            <img src="/tcu-logo.png" alt="Logo TCU" className="h-24 w-auto" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-3 tracking-tight drop-shadow-lg">Bienvenidos</h1>
        <p className="text-xl font-light opacity-95">Formulario de Registro de Actividades TCU</p>
        <p className="text-sm mt-2 opacity-90 font-medium">Universidad Técnica Nacional</p>
      </div>
    </div>
  );
};

export default FormHeader;
