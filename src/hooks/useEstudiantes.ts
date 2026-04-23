import { useState, useEffect } from 'react';
import { formService } from '@/services/form';
import type { Estudiante } from '@/types';

export const useEstudiantes = () => {
  const [cedulaSearch, setCedulaSearch]       = useState('');
  const [showDropdown, setShowDropdown]       = useState(false);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState<Estudiante[]>([]);
  const [estudiantes, setEstudiantes]         = useState<Estudiante[]>([]);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => {
    const cargarEstudiantes = async () => {
      try {
        setLoading(true);
        const data = await formService.getEstudiantes();
        setEstudiantes(data);
      } catch {
        setEstudiantes([]);
      } finally {
        setLoading(false);
      }
    };
    cargarEstudiantes();
  }, []);

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

  return { cedulaSearch, setCedulaSearch, showDropdown, setShowDropdown, filteredEstudiantes, loading };
};
