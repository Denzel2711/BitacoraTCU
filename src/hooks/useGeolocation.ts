import { useState } from 'react';
import { COSTA_RICA_CENTER } from '@/constants/form';
import type { FormData } from '@/types';

export const useGeolocation = (
  _formData: FormData,
  updateFormData: (updates: Partial<FormData>) => void
) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(COSTA_RICA_CENTER);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está disponible en este navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateFormData({ ubicacionLat: coords.latitude, ubicacionLng: coords.longitude });
        setMapCenter([coords.latitude, coords.longitude]);
        alert(`Ubicación registrada: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      },
      () => alert('Error al obtener la ubicación. Por favor, active la ubicación en su dispositivo o seleccione manualmente en el mapa.')
    );
  };

  const handleMapClick = (lat: number, lng: number) =>
    updateFormData({ ubicacionLat: lat, ubicacionLng: lng });

  return { mapCenter, setMapCenter, handleGetLocation, handleMapClick };
};
