/**
 * Configuración de los iconos de Leaflet
 */
export const setupLeafletIcons = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  const leafletModule = await import('leaflet');
  const L = leafletModule.default;

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

/**
 * Formatea las coordenadas para mostrarlas
 */
export const formatCoordinates = (lat, lng, decimals = 6) => {
  return `Latitud: ${lat.toFixed(decimals)}, Longitud: ${lng.toFixed(decimals)}`;
};
