import { useState } from 'react';

/**
 * Hook para obtener la fecha actual formateada
 */
export const useFechaHoy = () => {
  const [fechaHoy] = useState(() => {
    return new Date().toLocaleDateString('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  return fechaHoy;
};
