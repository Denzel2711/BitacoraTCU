import { useState } from 'react';
import { COSTA_RICA_CENTER } from '@/constants/form';
import type { FormData } from '@/types';

export const useGeolocation = (
  _formData: FormData,
  updateFormData: (updates: Partial<FormData>) => void
) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(COSTA_RICA_CENTER);

  const handleMapClick = (lat: number, lng: number) =>
    updateFormData({ ubicacionLat: lat, ubicacionLng: lng });

  return { mapCenter, setMapCenter, handleMapClick };
};
