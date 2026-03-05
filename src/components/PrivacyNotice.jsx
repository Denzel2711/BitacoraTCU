/**
 * Componente de aviso de privacidad
 */
const PrivacyNotice = () => {
  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-orange-900 mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Privacidad de la Información
      </h2>
      <p className="text-sm text-gray-800 leading-relaxed">
        Al completar este formulario usted es consciente que la información será de uso por parte del Área de Extensión y Acción Social de la Universidad Técnica Nacional. Los datos serán gestionados mediante esta aplicación. La gestión de los datos estará a cargo del académico a cargo del Proyecto de TCU102A &quot;Gestión del árbol urbano en mi comunidad&quot; a quien podrá contactar al correo <a href="mailto:arboricultura@utn.ac.cr" className="text-blue-600 hover:underline">arboricultura@utn.ac.cr</a>. Se resguarda la confidencialidad de la información en concordancia a la Ley de protección de la persona frente al tratamiento de sus datos personales (Ley No. 8968) de la República de Costa Rica y su respectivo Reglamento.
      </p>
    </div>
  );
};

export default PrivacyNotice;
