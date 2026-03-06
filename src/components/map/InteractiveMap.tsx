import dynamic from 'next/dynamic';

const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-cyan-50" />,
});

interface InteractiveMapProps {
  center: [number, number];
  ubicacionLat?: number | null;
  ubicacionLng?: number | null;
  onMapClick: (lat: number, lng: number) => void;
}

const InteractiveMap = ({ center, ubicacionLat, ubicacionLng, onMapClick }: InteractiveMapProps) => (
  <div className="mt-4 rounded-xl overflow-hidden border-2 border-cyan-300 shadow-md" style={{ height: '400px' }}>
    <LeafletMapInner
      center={center}
      ubicacionLat={ubicacionLat}
      ubicacionLng={ubicacionLng}
      onMapClick={onMapClick}
    />
  </div>
);

export default InteractiveMap;
