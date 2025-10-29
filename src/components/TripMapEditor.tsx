import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface TripLocation {
  id: string;
  coordinates: [number, number];
  name: string;
  description: string;
  images: File[];
  videos: File[];
}

interface TripMapEditorProps {
  locations: TripLocation[];
  route: [number, number][];
  onLocationsChange: (locations: TripLocation[]) => void;
  onRouteChange: (route: [number, number][]) => void;
}

function DrawControl({ onLocationsChange, onRouteChange, locations, route }: TripMapEditorProps) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polyline: {
          shapeOptions: {
            color: '#ff6b35',
            weight: 4,
          },
        },
        marker: {},
        polygon: false,
        circle: false,
        rectangle: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);

      if (e.layerType === 'marker') {
        const latlng = layer.getLatLng();
        const newLocation: TripLocation = {
          id: Date.now().toString(),
          coordinates: [latlng.lat, latlng.lng],
          name: '',
          description: '',
          images: [],
          videos: [],
        };
        onLocationsChange([...locations, newLocation]);
      } else if (e.layerType === 'polyline') {
        const latlngs = layer.getLatLngs();
        const coordinates = latlngs.map((ll: L.LatLng) => [ll.lat, ll.lng] as [number, number]);
        onRouteChange([...route, ...coordinates]);
      }
    });

    map.on(L.Draw.Event.DELETED, () => {
      onLocationsChange([]);
      onRouteChange([]);
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map]);

  return null;
}

const TripMapEditor = ({ locations, route, onLocationsChange, onRouteChange }: TripMapEditorProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });

  const addManualLocation = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      const newLocation: TripLocation = {
        id: Date.now().toString(),
        coordinates: [lat, lng],
        name: '',
        description: '',
        images: [],
        videos: [],
      };
      onLocationsChange([...locations, newLocation]);
      setManualCoords({ lat: '', lng: '' });
      setIsAddingManually(false);
    }
  };

  const updateLocationName = (id: string, name: string) => {
    onLocationsChange(
      locations.map(loc => loc.id === id ? { ...loc, name } : loc)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            حدد مسار رحلتك والأماكن
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            استخدم أدوات الرسم لإضافة المسار والعلامات على الخريطة
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingManually(!isAddingManually)}
        >
          <MapPin className="h-4 w-4 ml-2" />
          إضافة موقع يدوياً
        </Button>
      </div>

      {isAddingManually && (
        <div className="p-4 border border-border rounded-xl bg-muted/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>خط العرض (Latitude)</Label>
              <Input
                type="number"
                step="any"
                placeholder="31.2001"
                value={manualCoords.lat}
                onChange={(e) => setManualCoords({ ...manualCoords, lat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>خط الطول (Longitude)</Label>
              <Input
                type="number"
                step="any"
                placeholder="29.9187"
                value={manualCoords.lng}
                onChange={(e) => setManualCoords({ ...manualCoords, lng: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={addManualLocation} className="w-full">
            إضافة الموقع
          </Button>
        </div>
      )}

      <div className="h-[500px] rounded-xl overflow-hidden border-2 border-border shadow-lg">
        <MapContainer
          center={[26.8206, 30.8025]} // Center of Egypt
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <DrawControl
            locations={locations}
            route={route}
            onLocationsChange={onLocationsChange}
            onRouteChange={onRouteChange}
          />

          {route.length > 0 && (
            <Polyline positions={route} color="#ff6b35" weight={4} />
          )}

          {locations.map((location, index) => (
            <Marker
              key={location.id}
              position={location.coordinates}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <Input
                    placeholder={`اسم المكان ${index + 1}`}
                    value={location.name}
                    onChange={(e) => updateLocationName(location.id, e.target.value)}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {locations.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          ✓ تم إضافة {locations.length} موقع و {route.length > 0 ? 'مسار واحد' : 'لا يوجد مسار'}
        </div>
      )}
    </div>
  );
};

export default TripMapEditor;