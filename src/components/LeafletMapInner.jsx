'use client';

import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (event) => {
      onMapClick(event.latlng.lat, event.latlng.lng);
    }
  });

  return null;
};

const LeafletMapInner = ({ center, ubicacionLat, ubicacionLng, onMapClick }) => {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />
      {ubicacionLat && ubicacionLng && <Marker position={[ubicacionLat, ubicacionLng]} />}
    </MapContainer>
  );
};

export default LeafletMapInner;
