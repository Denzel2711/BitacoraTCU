import { useState } from 'react';

export const useFechaHoy = (): string => {
  const [fechaHoy] = useState(() =>
    new Date().toLocaleDateString('es-CR', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    })
  );
  return fechaHoy;
};
