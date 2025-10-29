import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Navigation, Trash2 } from 'lucide-react';
import type { TripLocation } from './TripMapEditor';

interface MapboxTripEditorProps {
  locations: TripLocation[];
  route: [number, number][];
  onLocationsChange: (locations: TripLocation[]) => void;
  onRouteChange: (route: [number, number][]) => void;
}

const MapboxTripEditor: React.FC<MapboxTripEditorProps> = ({
  locations,
  route,
  onLocationsChange,
  onRouteChange,
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [token, setToken] = useState<string>('');
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (!token) return; // wait for token

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [30.8025, 26.8206], // [lng, lat] center Egypt
      zoom: 5.2,
      pitch: 0,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

    map.on('load', () => {
      // Add route source & layer
      if (!map.getSource('route')) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: route.map(([lat, lng]) => [lng, lat]),
            },
            properties: {},
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#ff6b35',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });
      }

      // Render existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = locations.map((loc) => {
        const marker = new mapboxgl.Marker()
          .setLngLat([loc.coordinates[1], loc.coordinates[0]])
          .addTo(map);
        return marker;
      });
    });

    // Click handler
    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;

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
    };

    map.on('click', handleClick);

    mapRef.current = map;

    return () => {
      map.off('click', handleClick);
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Update route on state change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('route') as mapboxgl.GeoJSONSource | undefined;
    if (src) {
      src.setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: route.map(([lat, lng]) => [lng, lat]),
        },
        properties: {},
      } as any);
    }
  }, [route]);

  // Update markers on state change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = locations.map((loc) => {
      const marker = new mapboxgl.Marker()
        .setLngLat([loc.coordinates[1], loc.coordinates[0]])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(`
          <div style="min-width:180px">
            <div style="font-weight:600;margin-bottom:4px">${loc.name || 'موقع بدون اسم'}</div>
            <div style="font-size:12px;color:#666">${loc.coordinates[0].toFixed(4)}, ${loc.coordinates[1].toFixed(4)}</div>
          </div>
        `))
        .addTo(map);
      return marker;
    });
  }, [locations]);

  const addManualLocation = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
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

  const clearRoute = () => onRouteChange([]);

  return (
    <div className="space-y-4">
      {!token && (
        <div className="p-4 border border-border rounded-xl bg-muted/30 space-y-2">
          <Label>أدخل مفتاح Mapbox العام لبدء استخدام الخريطة</Label>
          <Input
            placeholder="pk.*********************"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            احصل على المفتاح من حسابك على mapbox.com ثم الصقه هنا
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            حدد مسار رحلتك والأماكن
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            انقر على الخريطة لإضافة مواقع أو فعّل وضع رسم المسار
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={isDrawingRoute ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setIsDrawingRoute(!isDrawingRoute);
              setIsAddingManually(false);
            }}
            disabled={!token}
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
            disabled={!token}
          >
            <MapPin className="h-4 w-4 ml-2" />
            إضافة موقع يدوياً
          </Button>
          {route.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearRoute}>
              <Trash2 className="h-4 w-4 ml-2 text-destructive" />
              مسح المسار
            </Button>
          )}
        </div>
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
          <Button onClick={addManualLocation} className="w-full" disabled={!token}>
            إضافة الموقع
          </Button>
        </div>
      )}

      <div className="h-[500px] rounded-xl overflow-hidden border-2 border-border shadow-lg relative">
        <div ref={mapContainer} className="absolute inset-0" />
        {!token && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">أدخل مفتاح Mapbox لعرض الخريطة</p>
          </div>
        )}
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

export default MapboxTripEditor;
