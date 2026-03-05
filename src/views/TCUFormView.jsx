'use client';

import { useEffect, useState } from 'react';
import { useFormData, useEstudiantes, useGeolocation, useFechaHoy } from '../hooks';
import { SUBTIPOS_PLANIFICACION, SUBTIPOS_EJECUCION, TIPOS_CAPACITACION } from '../constants/formConstants';
import { formService } from '../services/formService';
import { setupLeafletIcons } from '../utils/mapUtils';
import { validateForm } from '../utils/validators';
import FormHeader from '../components/FormHeader';
import PrivacyNotice from '../components/PrivacyNotice';
import InteractiveMap from '../components/InteractiveMap';

/**
 * Vista principal del formulario TCU
 */
const TCUFormView = () => {
  const { formData, resetForm, updateFormData } = useFormData();
  const { cedulaSearch, setCedulaSearch, showDropdown, setShowDropdown, filteredEstudiantes } = useEstudiantes();
  const { mapCenter, handleGetLocation, handleMapClick } = useGeolocation(formData, updateFormData);
  const fechaHoy = useFechaHoy();
  const [maxFechaActividad] = useState(() => new Date().toISOString().split('T')[0]);
  const [minFechaActividad] = useState(() => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 10);
    return minDate.toISOString().split('T')[0];
  });

  useEffect(() => {
    setupLeafletIcons();
  }, []);

  const handleCedulaSelect = (estudiante) => {
    updateFormData({
      cedula: estudiante.cedula,
      nombre: estudiante.nombre,
      primerApellido: estudiante.primer_apellido || estudiante.primerApellido,
      segundoApellido: estudiante.segundo_apellido || estudiante.segundoApellido,
      carrera: estudiante.carrera,
      academicoACargo: estudiante.academico_a_cargo || estudiante.academicoACargo,
      sede: estudiante.sede
    });
    setCedulaSearch(estudiante.cedula);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar el formulario completo
    const validacion = validateForm(formData);
    
    if (!validacion.valid) {
      // Mostrar todos los errores
      const mensajeErrores = validacion.errores.join('\n\n');
      alert(`Por favor corrija los siguientes errores:\n\n${mensajeErrores}`);
      return;
    }
    
    try {
      await formService.submitForm(formData);
      alert('Formulario enviado exitosamente');
      resetForm();
      setCedulaSearch('');
    } catch (error) {
      alert('Error al enviar el formulario');
    }
  };

  const handleReset = () => {
    if (confirm('¿Está seguro de que desea descartar todos los datos del formulario?')) {
      resetForm();
      setCedulaSearch('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 py-12 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-200">
        
        <FormHeader />

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          
          <PrivacyNotice />

          {/* Información General del Estudiante */}
          <div className="border-t-2 border-cyan-100 pt-8">
            <div className="flex items-center mb-6">
              <div className="flex-grow border-t-2 border-cyan-600"></div>
              <h2 className="text-2xl font-bold text-cyan-800 px-4">Información General del Estudiante</h2>
              <div className="flex-grow border-t-2 border-cyan-600"></div>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de Cédula *
                </label>
                <input
                  type="text"
                  required
                  value={cedulaSearch}
                  onChange={(e) => {
                    setCedulaSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Escriba o seleccione el número de cédula"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                />
                
                {showDropdown && filteredEstudiantes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-cyan-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                    {filteredEstudiantes.map((estudiante) => (
                      <div
                        key={estudiante.cedula}
                        onClick={() => handleCedulaSelect(estudiante)}
                        className="px-4 py-3 hover:bg-cyan-50 cursor-pointer border-b border-slate-100 transition-colors duration-150"
                      >
                        <div className="font-semibold">{estudiante.cedula}</div>
                        <div className="text-sm text-gray-600">
                          {estudiante.nombre} {estudiante.primer_apellido || estudiante.primerApellido} {estudiante.segundo_apellido || estudiante.segundoApellido}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.cedula && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-cyan-50 to-orange-50 p-6 rounded-xl border border-cyan-100 shadow-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nombre</label>
                    <p className="text-gray-900 font-semibold">{formData.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Primer Apellido</label>
                    <p className="text-gray-900 font-semibold">{formData.primerApellido}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Segundo Apellido</label>
                    <p className="text-gray-900 font-semibold">{formData.segundoApellido}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Carrera</label>
                    <p className="text-gray-900 font-semibold">{formData.carrera}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Académico a Cargo del Proyecto</label>
                    <p className="text-gray-900 font-semibold">{formData.academicoACargo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Sede</label>
                    <p className="text-gray-900 font-semibold">{formData.sede}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reporte de Actividades */}
          <div className="border-t-2 border-cyan-100 pt-8">
            <div className="flex items-center mb-6">
              <div className="flex-grow border-t-2 border-orange-500"></div>
              <h2 className="text-2xl font-bold text-orange-700 px-4">Reporte de Actividades</h2>
              <div className="flex-grow border-t-2 border-orange-500"></div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl mb-6 border border-cyan-200 shadow-sm">
              <h3 className="text-xl font-semibold text-cyan-900 mb-4 flex items-center">
                <span className="w-1 h-6 bg-cyan-600 mr-3 rounded"></span>
                Datos de la Actividad
              </h3>
              
              <div className="mb-4 bg-white p-4 rounded-lg border-l-4 border-cyan-600 shadow-sm">
                <label className="block text-sm font-medium text-cyan-700 mb-1">Fecha de Hoy</label>
                <p className="text-cyan-900 font-semibold capitalize">{fechaHoy}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de la Actividad *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fechaActividad}
                    onChange={(e) => updateFormData({ fechaActividad: e.target.value })}
                    max={maxFechaActividad}
                    min={minFechaActividad}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Esta fecha corresponde al día en que se llevó a cabo la actividad. Le recomendamos mantener sus registros actualizados. Puede ingresar actividades hasta 10 días naturales antes de la fecha actual.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Actividad *
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Las actividades de planificación corresponden a labores académicas. Las actividades de ejecución corresponden a la implementación de cada una de las actividades de su plan de trabajo.
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        required
                        name="tipoActividad"
                        value="Planificación"
                        checked={formData.tipoActividad === 'Planificación'}
                        onChange={(e) => updateFormData({ tipoActividad: e.target.value, subtipoActividad: '' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">Planificación</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        required
                        name="tipoActividad"
                        value="Ejecución del proyecto"
                        checked={formData.tipoActividad === 'Ejecución del proyecto'}
                        onChange={(e) => updateFormData({ tipoActividad: e.target.value, subtipoActividad: '' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">Ejecución del proyecto</span>
                    </label>
                  </div>
                </div>

                {formData.tipoActividad && (
                  <div className="bg-white p-4 rounded-xl border-2 border-orange-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subtipo de {formData.tipoActividad} *
                    </label>
                    <select
                      required
                      value={formData.subtipoActividad}
                      onChange={(e) => updateFormData({ subtipoActividad: e.target.value, tipoCapacitacion: '', experienciasAprendizajes: '' })}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    >
                      <option value="">Seleccione una opción</option>
                      {(formData.tipoActividad === 'Planificación' ? SUBTIPOS_PLANIFICACION : SUBTIPOS_EJECUCION).map((subtipo) => (
                        <option key={subtipo} value={subtipo}>{subtipo}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subsección: Tipo de Capacitación (solo para Inducción, sensibilización y capacitación) */}
                {formData.subtipoActividad === 'Inducción, sensibilización y capacitación sobre el proyecto' && (
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-5 rounded-xl border-2 border-cyan-300 shadow-sm">
                    <label className="block text-sm font-semibold text-cyan-900 mb-2">
                      Tipo de Capacitación *
                    </label>
                    <select
                      required
                      value={formData.tipoCapacitacion}
                      onChange={(e) => updateFormData({ tipoCapacitacion: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white"
                    >
                      <option value="">Seleccione el tipo de capacitación</option>
                      {TIPOS_CAPACITACION.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subsección: Experiencias y Aprendizajes (solo para Encuentros académicos reflexivos) */}
                {formData.subtipoActividad === 'Encuentros académicos reflexivos sobre el proyecto' && (
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-5 rounded-xl border-2 border-orange-300 shadow-sm">
                    <label className="block text-sm font-semibold text-orange-900 mb-2">
                      Experiencias y Aprendizajes *
                    </label>
                    <p className="text-xs text-gray-700 mb-3 italic">
                      Incluya reflexiones personales o del equipo sobre lo aprendido durante la actividad
                    </p>
                    <textarea
                      required
                      value={formData.experienciasAprendizajes}
                      onChange={(e) => updateFormData({ experienciasAprendizajes: e.target.value })}
                      rows="4"
                      placeholder="Describa las reflexiones y aprendizajes obtenidos..."
                      className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción de la Actividad *
                  </label>
                  <textarea
                    required
                    value={formData.descripcionActividad}
                    onChange={(e) => updateFormData({ descripcionActividad: e.target.value })}
                    minLength={60}
                    maxLength={250}
                    rows="5"
                    placeholder="Describa detalladamente la actividad realizada..."
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 ${
                      formData.descripcionActividad.length > 0 && formData.descripcionActividad.length < 60
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 focus:ring-cyan-500 focus:border-cyan-500'
                    }`}
                  />
                  <div className="flex justify-between items-start mt-1">
                    <p className="text-xs text-gray-600">
                      Contemple las acciones realizadas, las herramientas o mecanismos utilizados y los propósitos de la actividad. Mencione los nombres de las personas, entidad o comunidad con las que se colaboró durante la actividad.
                    </p>
                    <p className={`text-xs font-semibold ml-2 whitespace-nowrap ${
                      formData.descripcionActividad.length < 60 
                        ? 'text-red-600' 
                        : formData.descripcionActividad.length > 250 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {formData.descripcionActividad.length}/250 caracteres
                      {formData.descripcionActividad.length < 60 && ` (mín: 60)`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hora de Inicio *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.horaInicio}
                      onChange={(e) => updateFormData({ horaInicio: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hora Final *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.horaFinal}
                      onChange={(e) => updateFormData({ horaFinal: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tipo de Evidencias */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl mb-6 border border-orange-200 shadow-sm">
              <h3 className="text-xl font-semibold text-orange-900 mb-2 flex items-center">
                <span className="w-1 h-6 bg-orange-500 mr-3 rounded"></span>
                Tipo de Evidencias *
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                Puede adjuntar archivos, enlaces o especificaciones textuales relacionados con la actividad.
              </p>
              
              <div className="space-y-3 mb-4">
                {['Texto', 'Foto', 'Documentos'].map((tipo) => (
                  <label key={tipo} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoEvidencia"
                      value={tipo}
                      checked={formData.tipoEvidencia === tipo}
                      onChange={(e) => updateFormData({ tipoEvidencia: e.target.value })}
                      required
                      className="w-4 h-4 text-cyan-600"
                    />
                    <span className="text-gray-700 font-medium">{tipo}</span>
                  </label>
                ))}
              </div>

              {formData.tipoEvidencia === 'Texto' && (
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-4 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Evidencia de Texto *
                  </label>
                  <textarea
                    required
                    value={formData.evidenciaTexto}
                    onChange={(e) => updateFormData({ evidenciaTexto: e.target.value })}
                    rows="5"
                    placeholder="Ingrese la descripción textual o URL del video..."
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Si la evidencia requiere una descripción textual en lugar de archivos multimedia, por favor proporcione una explicación detallada de la evidencia. Describa de manera clara y concisa lo relacionado con la actividad, incluyendo cualquier información relevante para comprender la evidencia presentada. En caso de tener un video que muestre la actividad, adjúnte la dirección URL aquí.
                  </p>
                </div>
              )}

              {formData.tipoEvidencia === 'Foto' && (
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-4 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adjuntar Foto *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => updateFormData({ evidenciaFoto: e.target.files[0] })}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                  {formData.evidenciaFoto && (
                    <p className="text-sm text-orange-600 mt-2 font-medium">✓ Archivo seleccionado: {formData.evidenciaFoto.name}</p>
                  )}
                </div>
              )}

              {formData.tipoEvidencia === 'Documentos' && (
                <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-4 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adjuntar Documento *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    required
                    onChange={(e) => updateFormData({ evidenciaDocumento: e.target.files[0] })}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                  />
                  {formData.evidenciaDocumento && (
                    <p className="text-sm text-cyan-600 mt-2 font-medium">✓ Archivo seleccionado: {formData.evidenciaDocumento.name}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Geolocalización */}
          <div className="border-t-2 border-cyan-100 pt-8">
            <div className="flex items-center mb-6">
              <div className="flex-grow border-t-2 border-cyan-600"></div>
              <h2 className="text-2xl font-bold text-cyan-800 px-4">Geolocalización</h2>
              <div className="flex-grow border-t-2 border-cyan-600"></div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200 shadow-sm">
              <div className="mb-4 prose prose-sm max-w-none">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Ubicación Geográfica:</strong>
                </p>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  <li>Por favor, proporcione la ubicación geográfica donde se llevó a cabo la actividad.</li>
                  <li>Utilice la función de geolocalización de su dispositivo para registrar las coordenadas. Para actividades realizadas en su hogar proporcione únicamente el nombre de la comunidad.</li>
                </ul>
                <p className="text-sm text-gray-700 mt-3 mb-2">
                  <strong>Instrucciones:</strong>
                </p>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  <li>Asegúrese de tener la ubicación activada en su dispositivo para una precisión óptima.</li>
                  <li>Toque el icono de ubicación en su dispositivo para registrar automáticamente las coordenadas.</li>
                  <li>Si experimenta problemas con la geolocalización, describa la ubicación con detalles en el campo de texto.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                className="mb-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Obtener Ubicación GPS</span>
              </button>

              {formData.ubicacionLat && formData.ubicacionLng && (
                <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500 mb-4 shadow-sm">
                  <p className="text-sm font-semibold text-orange-700">Coordenadas registradas:</p>
                  <p className="text-orange-900 font-medium">
                    Latitud: {formData.ubicacionLat.toFixed(6)}, Longitud: {formData.ubicacionLng.toFixed(6)}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción de la Ubicación (Opcional)
                </label>
                <textarea
                  value={formData.descripcionUbicacion}
                  onChange={(e) => updateFormData({ descripcionUbicacion: e.target.value })}
                  rows="3"
                  placeholder="Ej: Comunidad de San Rafael, frente al parque central, 200 metros norte de la iglesia..."
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                />
              </div>

              <InteractiveMap 
                center={mapCenter}
                ubicacionLat={formData.ubicacionLat}
                ubicacionLng={formData.ubicacionLng}
                onMapClick={handleMapClick}
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="border-t-2 border-slate-200 pt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Descartar</span>
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-orange-500 hover:from-cyan-700 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              <span>Enviar Formulario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TCUFormView;
