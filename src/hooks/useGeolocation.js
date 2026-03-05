import { useState } from 'react';
import { COSTA_RICA_CENTER } from '../constants/formConstants';

/**
 * Hook para manejar la geolocalización y el mapa
 */
export const useGeolocation = (formData, updateFormData) => {
  const [mapCenter, setMapCenter] = useState(COSTA_RICA_CENTER);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          updateFormData({
            ubicacionLat: lat,
            ubicacionLng: lng
          });
          setMapCenter([lat, lng]);
          alert(`Ubicación registrada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        },
        (error) => {
          alert('Error al obtener la ubicación. Por favor, active la ubicación en su dispositivo o seleccione manualmente en el mapa.');
        }
      );
    } else {
      alert('La geolocalización no está disponible en este navegador.');
    }
  };

  const handleMapClick = (lat, lng) => {
    updateFormData({
      ubicacionLat: lat,
      ubicacionLng: lng
    });
  };

  return {
    mapCenter,
    setMapCenter,
    handleGetLocation,
    handleMapClick
  };
};
