import { useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Trash2 } from 'lucide-react';
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

function MapClickHandler({ 
  onLocationsChange, 
  onRouteChange, 
  locations, 
  route,
  isDrawingRoute 
}: TripMapEditorProps & { isDrawingRoute: boolean }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      
      if (isDrawingRoute) {
        onRouteChange([...route, [lat, lng]]);
      } else {
        const newLocation: TripLocation = {
          id: Date.now().toString(),
          coordinates: [lat, lng],
          name: '',
          description: '',
          images: [],
          videos: [],
        };
        onLocationsChange([...locations, newLocation]);
      }
    },
  });

  return null;
}

const TripMapEditor = ({ locations, route, onLocationsChange, onRouteChange }: TripMapEditorProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
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

  const removeLocation = (id: string) => {
    onLocationsChange(locations.filter(loc => loc.id !== id));
  };

  const clearRoute = () => {
    onRouteChange([]);
  };

  const updateLocationName = (id: string, name: string) => {
    onLocationsChange(
      locations.map(loc => loc.id === id ? { ...loc, name } : loc)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            حدد مسار رحلتك والأماكن
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            انقر على الخريطة لإضافة مواقع أو ارسم المسار
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={isDrawingRoute ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsDrawingRoute(!isDrawingRoute);
              setIsAddingManually(false);
            }}
          >
            <Navigation className="h-4 w-4 ml-2" />
            {isDrawingRoute ? 'إيقاف رسم المسار' : 'رسم المسار'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddingManually(!isAddingManually);
              setIsDrawingRoute(false);
            }}
          >
            <MapPin className="h-4 w-4 ml-2" />
            إضافة موقع يدوياً
          </Button>
          {route.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearRoute}
            >
              <Trash2 className="h-4 w-4 ml-2 text-destructive" />
              مسح المسار
            </Button>
          )}
        </div>
      </div>

      {!isDrawingRoute && !isAddingManually && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
          💡 انقر على الخريطة لإضافة موقع جديد
        </div>
      )}

      {isDrawingRoute && (
        <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg text-sm">
          🗺️ انقر على الخريطة لإضافة نقاط على المسار
        </div>
      )}

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
          center={[26.8206, 30.8025]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler
            locations={locations}
            route={route}
            onLocationsChange={onLocationsChange}
            onRouteChange={onRouteChange}
            isDrawingRoute={isDrawingRoute}
          />

          {route.length > 0 && (
            <Polyline positions={route} color="#ff6b35" weight={4} opacity={0.7} />
          )}

          {locations.map((location, index) => (
            <Marker key={location.id} position={location.coordinates}>
              <Popup>
                <div className="p-2 min-w-[200px] space-y-2">
                  <Input
                    placeholder={`اسم المكان ${index + 1}`}
                    value={location.name}
                    onChange={(e) => updateLocationName(location.id, e.target.value)}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => removeLocation(location.id)}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف الموقع
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          {locations.length > 0 && (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {locations.length} موقع
            </span>
          )}
        </div>
        <div className="text-muted-foreground">
          {route.length > 0 && (
            <span className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-secondary" />
              {route.length} نقطة في المسار
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripMapEditor;