import { useState, useEffect } from 'react';
import { formService } from '../services/formService';
import { ESTUDIANTES_MOCK } from '../constants/formConstants';

/**
 * Hook para manejar la búsqueda y selección de estudiantes
 */
export const useEstudiantes = () => {
  const [cedulaSearch, setCedulaSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar estudiantes al iniciar
  useEffect(() => {
    const cargarEstudiantes = async () => {
      try {
        setLoading(true);
        const data = await formService.getEstudiantes();
        setEstudiantes(data.length > 0 ? data : ESTUDIANTES_MOCK);
      } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        // Usar datos mock si falla la API
        setEstudiantes(ESTUDIANTES_MOCK);
      } finally {
        setLoading(false);
      }
    };

    cargarEstudiantes();
  }, []);

  // Filtrar estudiantes cuando cambia la búsqueda
  useEffect(() => {
    if (cedulaSearch) {
      const filtered = estudiantes.filter(est => 
        est.cedula.includes(cedulaSearch) ||
        est.nombre.toLowerCase().includes(cedulaSearch.toLowerCase()) ||
        est.primer_apellido?.toLowerCase().includes(cedulaSearch.toLowerCase()) ||
        est.primerApellido?.toLowerCase().includes(cedulaSearch.toLowerCase())
      );
      setFilteredEstudiantes(filtered);
    } else {
      setFilteredEstudiantes(estudiantes);
    }
  }, [cedulaSearch, estudiantes]);

  return {
    cedulaSearch,
    setCedulaSearch,
    showDropdown,
    setShowDropdown,
    filteredEstudiantes,
    loading
  };
};
