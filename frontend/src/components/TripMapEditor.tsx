import { useRef, useState, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Trash2, Search, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export interface TripLocation {
  id: string;
  coordinates: [number, number]; // [lat, lng] to match existing interface
  name: string;
  description: string;
  images: (File | string)[];
  videos: (File | string)[];
}

interface TripMapEditorProps {
  locations: TripLocation[];
  route: [number, number][]; // [lat, lng] array
  onLocationsChange: (locations: TripLocation[]) => void;
  onRouteChange: (route: [number, number][]) => void;
  destination?: string;
  className?: string;
}

interface GeocodingResult {
  place_name: string;
  center: [number, number]; // [lng, lat] from Mapbox
}

// City coordinates map (Mapbox uses [lng, lat])
const cityCoordinates: Record<string, [number, number]> = {
  alexandria: [29.9187, 31.2001],
  matrouh: [27.2373, 31.3543],
  luxor: [32.6421, 25.6872],
  aswan: [32.8998, 24.0889],
  hurghada: [33.8116, 27.2579],
  sharm: [34.3300, 27.9158],
  dahab: [34.5197, 28.5021],
  cairo: [31.2357, 30.0444],
  giza: [31.2089, 30.0131],
};

const TripMapEditor = ({ locations, route, onLocationsChange, onRouteChange, destination, className }: TripMapEditorProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const initialCenter: [number, number] = (destination && cityCoordinates[destination] 
      ? cityCoordinates[destination] 
      : [30.8025, 26.8206]) as [number, number];
      
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: destination ? 11 : 6,
      attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    
    mapRef.current = map;

    map.on('load', () => {
      // Add source and layer for route
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.map(p => [p[1], p[0]]) // Mapbox uses [lng, lat]
          }
        }
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ff6b35',
          'line-width': 4,
          'line-opacity': 0.7
        }
      });
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Determine if we are clicking on a marker (to prevent adding new point when clicking popup/marker)
      // This is a bit tricky in Mapbox GL JS compared to Leaflet'sstopPropagation
      
      // Use local refs for states since event listener is stable
    });

    return () => {
      map.remove();
    };
  }, []);

  // Use refs for states to use in map events
  const isDrawingRouteRef = useRef(isDrawingRoute);
  useEffect(() => { isDrawingRouteRef.current = isDrawingRoute; }, [isDrawingRoute]);
  
  const locationsRef = useRef(locations);
  useEffect(() => { locationsRef.current = locations; }, [locations]);

  const routeRef = useRef(route);
  useEffect(() => { routeRef.current = route; }, [route]);

  // Handle map clicks
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    const handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
      // If user clicked a marker or popup, don't add point
      // Mapbox markers are DOM elements, so if the target is inside a marker, we don't trigger this or we filter it.
      // Actually, map click events don't trigger if you click a DOM marker (unless you set pointer-events: none)
      
      const { lng, lat } = e.lngLat;
      
      if (isDrawingRouteRef.current) {
        onRouteChange([...routeRef.current, [lat, lng]]);
      } else {
        const newLocation: TripLocation = {
          id: Date.now().toString(),
          coordinates: [lat, lng],
          name: '',
          description: '',
          images: [],
          videos: [],
        };
        onLocationsChange([...locationsRef.current, newLocation]);
      }
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [onLocationsChange, onRouteChange]);

  // Update Route Layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    const source = map.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route.map(p => [p[1], p[0]])
        }
      });
    }
  }, [route]);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    // Remove markers that are no longer in locations
    const currentIds = new Set(locations.map(l => l.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    locations.forEach((loc, index) => {
      if (!markersRef.current[loc.id]) {
        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'p-2 min-w-[200px] space-y-2 font-cairo text-right';
        
        const titleInput = document.createElement('input');
        titleInput.placeholder = `اسم المكان ${index + 1}`;
        titleInput.value = loc.name;
        titleInput.className = 'w-full px-3 py-2 border rounded-lg text-sm mb-2';
        titleInput.oninput = (e) => {
          const val = (e.target as HTMLInputElement).value;
          const updated = [...locationsRef.current].map(l => l.id === loc.id ? { ...l, name: val } : l);
          onLocationsChange(updated);
        };
        
        const delBtn = document.createElement('button');
        delBtn.innerHTML = 'حذف الموقع';
        delBtn.className = 'w-full bg-red-500 text-white text-xs py-2 rounded-lg hover:bg-red-600 transition-colors';
        delBtn.onclick = () => {
          onLocationsChange(locationsRef.current.filter(l => l.id !== loc.id));
        };

        popupContent.appendChild(titleInput);
        popupContent.appendChild(delBtn);

        const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent);
        
        const marker = new mapboxgl.Marker({ color: '#indigo' })
          .setLngLat([loc.coordinates[1], loc.coordinates[0]])
          .setPopup(popup)
          .addTo(map);
          
        markersRef.current[loc.id] = marker;
      } else {
        // Just update position if needed
        markersRef.current[loc.id].setLngLat([loc.coordinates[1], loc.coordinates[0]]);
      }
    });
  }, [locations, onLocationsChange]);

  // Handle destination changes (centering)
  useEffect(() => {
    if (!mapRef.current || !destination) return;
    const center = cityCoordinates[destination];
    if (center) {
      mapRef.current.flyTo({
        center: center,
        zoom: 12,
        essential: true
      });
    }
  }, [destination]);

  // Search places using Mapbox Geocoding API
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=eg&language=ar,en&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      
      const results: GeocodingResult[] = data.features.map((item: any) => ({
        place_name: item.place_name,
        center: item.center, // [lng, lat]
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('Mapbox Geocoding error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) searchPlaces(searchQuery);
      else setSearchResults([]);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPlaces]);

  const handleSelectPlace = (result: GeocodingResult) => {
    const newLocation: TripLocation = {
      id: Date.now().toString(),
      coordinates: [result.center[1], result.center[0]], // [lat, lng]
      name: result.place_name.split(',')[0],
      description: '',
      images: [],
      videos: [],
    };
    onLocationsChange([...locations, newLocation]);
    
    mapRef.current?.flyTo({ center: result.center, zoom: 15 });
    setSearchQuery('');
    setSearchResults([]);
  };

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
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 12 });
      setManualCoords({ lat: '', lng: '' });
      setIsAddingManually(false);
    }
  };

  return (
    <div className={`space-y-4 h-full flex flex-col font-cairo ${className || ''}`} dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-right">
          <h3 className="text-lg font-bold flex items-center justify-end gap-2">
            حدد مسار رحلتك والأماكن
            <Navigation className="h-5 w-5 text-indigo-600" />
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            انقر على الخريطة لإضافة مواقع أو ارسم المسار
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end w-full sm:w-auto">
          <Button
            variant={isDrawingRoute ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsDrawingRoute(!isDrawingRoute);
              setIsAddingManually(false);
            }}
            className="rounded-xl"
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
            className="rounded-xl"
          >
            <MapPin className="h-4 w-4 ml-2" />
            إضافة موقع يدوياً
          </Button>
          {route.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRouteChange([])}
              className="rounded-xl border-red-100 text-red-600"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              مسح المسار
            </Button>
          )}
        </div>
      </div>

      {isAddingManually && (
        <div className="p-4 border border-indigo-100 rounded-2xl bg-indigo-50/30 space-y-3">
          <div className="grid grid-cols-2 gap-3" dir="ltr">
            <div className="space-y-2">
              <Label className="text-right block">خط العرض (Lat)</Label>
              <Input
                type="number"
                step="any"
                placeholder="30.0444"
                value={manualCoords.lat}
                onChange={(e) => setManualCoords({ ...manualCoords, lat: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right block">خط الطول (Lng)</Label>
              <Input
                type="number"
                step="any"
                placeholder="31.2357"
                value={manualCoords.lng}
                onChange={(e) => setManualCoords({ ...manualCoords, lng: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <Button onClick={addManualLocation} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
            إضافة الموقع
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Input
            type="text"
            placeholder="ابحث عن مكان (مثل: المتحف المصري، الأهرامات...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-12 pl-4 h-12 rounded-2xl border-gray-100 shadow-sm"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full"
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="absolute z-[100] w-full mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectPlace(result)}
                className="w-full text-right px-4 py-4 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-b-0 flex items-center justify-between"
              >
                <span className="text-sm font-bold text-gray-800">{result.place_name}</span>
                <MapPin className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
        
        {isSearching && (
          <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 text-center text-sm text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
            جاري البحث...
          </div>
        )}
      </div>

      <div className="relative rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl flex-1 min-h-[500px] isolate">
        <div ref={mapContainer} className="h-full w-full" />
        
        {/* Mapbox Style Custom CSS for popups */}
        <style dangerouslySetInnerHTML={{ __html: `
          .mapboxgl-popup-content {
            border-radius: 20px;
            padding: 15px;
            box-shadow: 0 10px 25px rgba(0,0,30,0.1);
          }
          .mapboxgl-popup-close-button {
            right: 10px;
            top: 10px;
            font-size: 16px;
          }
        ` }} />
      </div>

      <div className="flex items-center justify-between text-[10px] sm:text-xs">
        <div className="flex items-center gap-4">
          {locations.length > 0 && (
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-black flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {locations.length} مواقع
            </span>
          )}
          {route.length > 0 && (
            <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full font-black flex items-center gap-1.5">
              <Navigation className="h-3 w-3" />
              {route.length} نقاط في المسار
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripMapEditor;