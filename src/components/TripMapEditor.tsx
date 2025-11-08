import { useRef, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Trash2, Search, X } from 'lucide-react';
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
  images: (File | string)[];
  videos: (File | string)[];
}

interface TripMapEditorProps {
  locations: TripLocation[];
  route: [number, number][];
  onLocationsChange: (locations: TripLocation[]) => void;
  onRouteChange: (route: [number, number][]) => void;
  destination?: string;
}

interface MapCenterUpdaterProps {
  center: [number, number];
  zoom: number;
}

function MapCenterUpdater({ center, zoom }: MapCenterUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
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

interface GeocodingResult {
  place_name: string;
  center: [number, number];
}

// City coordinates map for centering map
const cityCoordinates: Record<string, [number, number]> = {
  alexandria: [31.2001, 29.9187],
  matrouh: [31.3543, 27.2373],
  luxor: [25.6872, 32.6421],
  aswan: [24.0889, 32.8998],
  hurghada: [27.2579, 33.8116],
  sharm: [27.9158, 34.3300],
  dahab: [28.5021, 34.5197],
  bahariya: [27.8751, 28.3481],
};

// City name mapping for search filtering
const cityNameMap: Record<string, string> = {
  alexandria: "الإسكندرية",
  matrouh: "مرسى مطروح",
  luxor: "الأقصر",
  aswan: "أسوان",
  hurghada: "الغردقة",
  sharm: "شرم الشيخ",
  dahab: "دهب",
  bahariya: "الواحات البحرية",
};

// English city names for Nominatim API
const cityNameEnMap: Record<string, string> = {
  alexandria: "Alexandria",
  matrouh: "Marsa Matruh",
  luxor: "Luxor",
  aswan: "Aswan",
  hurghada: "Hurghada",
  sharm: "Sharm El Sheikh",
  dahab: "Dahab",
  bahariya: "Bahariya Oasis",
};

const TripMapEditor = ({ locations, route, onLocationsChange, onRouteChange, destination }: TripMapEditorProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    destination && cityCoordinates[destination] ? cityCoordinates[destination] : [26.8206, 30.8025]
  );
  const [mapZoom, setMapZoom] = useState(destination ? 11 : 6);

  // Update map center when destination changes
  useEffect(() => {
    const newCenter: [number, number] = destination && cityCoordinates[destination] 
      ? cityCoordinates[destination] 
      : [26.8206, 30.8025];
    const newZoom = destination ? 11 : 6;
    setMapCenter(newCenter);
    setMapZoom(newZoom);
  }, [destination]);

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

  // Geocoding search function using OpenStreetMap Nominatim (free, no key needed)
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Build search query with city filter if destination is selected
      let searchQuery = query.trim();
      
      if (destination && cityNameEnMap[destination]) {
        // Add city name to search query to filter results
        const cityName = cityNameEnMap[destination];
        searchQuery = `${query}, ${cityName}, Egypt`;
      }
      
      // Using OpenStreetMap Nominatim geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&accept-language=ar,en&countrycodes=eg`
      );
      const data = await response.json();
      
      // Filter results to only include places within the selected city
      let filteredData = data;
      if (destination && cityNameEnMap[destination]) {
        const cityName = cityNameEnMap[destination].toLowerCase();
        const cityNameAr = cityNameMap[destination]?.toLowerCase() || '';
        
        filteredData = data.filter((item: any) => {
          const displayName = item.display_name.toLowerCase();
          // Check if the result contains the city name (in English or Arabic)
          return displayName.includes(cityName) || 
                 displayName.includes(cityNameAr) ||
                 // Also check address components
                 (item.address && (
                   item.address.city?.toLowerCase().includes(cityName) ||
                   item.address.town?.toLowerCase().includes(cityName) ||
                   item.address.city?.toLowerCase().includes(cityNameAr) ||
                   item.address.town?.toLowerCase().includes(cityNameAr)
                 ));
        });
      }
      
      // Limit to 5 results after filtering
      const results: GeocodingResult[] = filteredData.slice(0, 5).map((item: any) => ({
        place_name: item.display_name,
        center: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [destination]);

  // Handle search input with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPlaces(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPlaces]);

  // Handle place selection from search results
  const handleSelectPlace = (result: GeocodingResult) => {
    const newLocation: TripLocation = {
      id: Date.now().toString(),
      coordinates: result.center,
      name: result.place_name.split(',')[0], // Use first part of name
      description: '',
      images: [],
      videos: [],
    };
    onLocationsChange([...locations, newLocation]);
    
    // Center map on selected place
    setMapCenter(result.center);
    setMapZoom(15);
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
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

      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن مكان (مثل: المتحف المصري، الأهرامات، الإسكندرية...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 pl-4"
            onFocus={() => {
              if (searchQuery.trim() && searchResults.length === 0) {
                searchPlaces(searchQuery);
              }
            }}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectPlace(result)}
                className="w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{result.place_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {isSearching && (
          <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
            جاري البحث...
          </div>
        )}
      </div>

      <div className="relative h-[500px] rounded-xl overflow-hidden border-2 border-border shadow-lg" style={{ position: 'relative', width: '100%', isolation: 'isolate' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
          scrollWheelZoom={true}
          key={destination} // Re-center when destination changes
          className="!overflow-hidden"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=xvqrf2BsXB6Y8siw9uiP"
          />
          
          <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
          
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