import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { listTrips } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MapPin, Users, Flame, Sparkles, Eye, EyeOff, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LivePulseMapProps {
  className?: string;
  height?: string;
  showOverlay?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Bounds for Egypt only
const EGYPT_BOUNDS: [[number, number], [number, number]] = [
  [24.7, 22.0], // Southwest
  [37.0, 31.7]  // Northeast
];

// Major Egyptian cities coordinates with expanded areas (radius in degrees)
const EGYPT_CITIES = {
  'Cairo': { center: [31.2357, 30.0444], radius: 0.15, area: 'القاهرة' },
  'Alexandria': { center: [29.9187, 31.2001], radius: 0.12, area: 'الإسكندرية' },
  'Giza': { center: [31.1313, 29.987], radius: 0.1, area: 'الجيزة' },
  'Luxor': { center: [32.6421, 25.6872], radius: 0.2, area: 'الأقصر' },
  'Aswan': { center: [32.8998, 24.0889], radius: 0.15, area: 'أسوان' },
  'Hurghada': { center: [33.8116, 27.2579], radius: 0.25, area: 'الغردقة' },
  'Sharm El Sheikh': { center: [34.3300, 27.9158], radius: 0.2, area: 'شرم الشيخ' },
  'Dahab': { center: [34.5197, 28.5021], radius: 0.15, area: 'دهب' },
  'Marsa Matrouh': { center: [27.2373, 31.3543], radius: 0.2, area: 'مرسى مطروح' },
  'Siwa': { center: [25.5196, 29.2031], radius: 0.3, area: 'سيوة' },
  'Fayoum': { center: [30.8472, 29.3573], radius: 0.15, area: 'الفيوم' },
  'Minya': { center: [30.7312, 28.1099], radius: 0.12, area: 'المنيا' },
  'Asyut': { center: [31.1857, 27.1803], radius: 0.12, area: 'أسيوط' },
  'Sohag': { center: [31.6949, 26.557], radius: 0.12, area: 'سوهاج' },
  'Qena': { center: [32.727, 26.164], radius: 0.12, area: 'قنا' },
  'Ismailia': { center: [32.2656, 30.5965], radius: 0.1, area: 'الإسماعيلية' },
  'Port Said': { center: [32.2722, 31.2565], radius: 0.1, area: 'بورسعيد' },
  'Suez': { center: [32.5499, 29.9737], radius: 0.1, area: 'السويس' },
  'Safaga': { center: [33.95, 26.75], radius: 0.15, area: 'سفاجا' },
  'El Quseir': { center: [34.28, 26.1], radius: 0.15, area: 'القصير' },
  'Al Karnak': { center: [32.65, 25.72], radius: 0.1, area: 'الكرنك' },
  'Abu Simbel': { center: [31.63, 22.34], radius: 0.2, area: 'أبو سمبل' },
  'Taba': { center: [34.78, 29.49], radius: 0.12, area: 'طابا' },
  'Nuweiba': { center: [34.66, 28.97], radius: 0.12, area: 'نويبع' },
  'Ras Sudr': { center: [32.72, 29.59], radius: 0.15, area: 'رأس سدر' },
  'Saint Catherine': { center: [33.95, 28.56], radius: 0.25, area: 'سانت كاترين' },
  'Farafra': { center: [27.97, 27.06], radius: 0.3, area: 'الفرافرة' },
  'Bahariya': { center: [28.9, 28.35], radius: 0.3, area: 'الواحات البحرية' },
  'Dakhla': { center: [29.15, 25.5], radius: 0.25, area: 'الداخلة' },
  'Kharga': { center: [30.55, 25.45], radius: 0.25, area: 'الخارجة' }
};

// Popular landmarks in each city for more realistic distribution
const CITY_LANDMARKS: Record<string, Array<[number, number]>> = {
  'Cairo': [
    [31.2357, 30.0444], // Downtown
    [31.2248, 30.0499], // Tahrir
    [31.2578, 30.0324], // Azhar
    [31.3436, 30.0993], // Heliopolis
    [31.1986, 30.0269], // Zamalek
    [31.2125, 30.0786], // Mohandessin
    [31.2689, 30.0112], // Maadi
    [31.3298, 30.1249] // Nasr City
  ],
  'Alexandria': [
    [29.9187, 31.2001], // Downtown
    [29.9545, 31.2189], // Sidi Gaber
    [29.8849, 31.2156], // Miami
    [29.9625, 31.2361], // Sporting
    [29.9039, 31.1982], // Stanly
    [29.9342, 31.2058] // Smouha
  ],
  'Hurghada': [
    [33.8116, 27.2579], // Downtown
    [33.8321, 27.2321], // Sakkala
    [33.8542, 27.1978], // Dahar
    [33.7901, 27.2812], // El Mamsha
    [33.8223, 27.1445], // Sahl Hasheesh
    [33.7654, 27.3145] // El Gouna
  ],
  'Sharm El Sheikh': [
    [34.3300, 27.9158], // Naama Bay
    [34.3621, 27.8609], // Sharm Old Market
    [34.3056, 27.9432], // Ras Um Sid
    [34.3865, 27.8023], // Sharks Bay
    [34.2589, 27.9756] // Nabq Bay
  ],
  'Luxor': [
    [32.6421, 25.6872], // East Bank
    [32.6125, 25.7083], // Karnak
    [32.5589, 25.7281], // Valley of Kings
    [32.6083, 25.6969], // Luxor Temple
    [32.5897, 25.6822] // West Bank
  ],
  'Marsa Matrouh': [
    [27.2373, 31.3543], // City Center
    [27.2105, 31.3421], // Cleopatra Beach
    [27.1876, 31.3298], // Rommel Bay
    [27.2654, 31.3765], // Marina
    [27.1567, 31.2987] // Ageeba Beach
  ]
};

const LivePulseMap: React.FC<LivePulseMapProps> = ({ 
  className, 
  height = "600px",
  showOverlay = true 
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const heatmapRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeUsers: 142, totalTrips: 0, hotspots: 12 });
  const [showMarkers, setShowMarkers] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate random point within city area
  const generateRandomPoint = (cityName: string, baseCoords: { center: number[], radius: number }, index: number, totalInCity: number): [number, number] => {
    const [centerLng, centerLat] = baseCoords.center;
    const radius = baseCoords.radius;
    
    // Check if city has predefined landmarks
    const landmarks = CITY_LANDMARKS[cityName];
    
    if (landmarks && Math.random() > 0.3) { // 70% chance to use landmarks
      // Assign trips to different landmarks
      const landmarkIndex = index % landmarks.length;
      const landmark = landmarks[landmarkIndex];
      
      // Add small random offset to avoid exact same spot
      const offsetLng = (Math.random() - 0.5) * 0.02;
      const offsetLat = (Math.random() - 0.5) * 0.02;
      
      return [landmark[0] + offsetLng, landmark[1] + offsetLat];
    }
    
    // Generate random point within radius using spiral distribution for better coverage
    const spiralAngle = index * 0.5; // Spiral factor
    const randomAngle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    
    // Combine spiral and random for natural distribution
    const angle = randomAngle + spiralAngle;
    const lng = centerLng + Math.cos(angle) * distance;
    const lat = centerLat + Math.sin(angle) * distance;
    
    return [lng, lat];
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [30.8025, 26.8206],
      zoom: isMobile ? 5.2 : 5.8,
      maxBounds: EGYPT_BOUNDS,
      pitch: 0,
      antialias: true,
      attributionControl: false
    });

    // Add navigation control
    map.addControl(new mapboxgl.NavigationControl({
      visualizePitch: false,
      showCompass: false,
      showZoom: true
    }), 'bottom-right');

    mapRef.current = map;

    map.on('load', async () => {
      setIsMapLoaded(true);
      
      try {
        const data = await listTrips({ limit: 100 });
        const trips = data.items || [];
        
        // Calculate unique hotspots
        const cityCount: Record<string, number> = {};
        
        // Group trips by city
        const cityGroups: Record<string, any[]> = {};

        // Define city mapping patterns (Matrouh first!)
        const cityPatterns = [
          { pattern: /matrouh|مطروح|marsa|مرسى/i, city: 'Marsa Matrouh' },
          { pattern: /luxor|الأقصر/i, city: 'Luxor' },
          { pattern: /aswan|أسوان/i, city: 'Aswan' },
          { pattern: /cairo|القاهرة/i, city: 'Cairo' },
          { pattern: /giza|الجيزة/i, city: 'Giza' },
          { pattern: /alexandria|alex|الإسكندرية/i, city: 'Alexandria' },
          { pattern: /hurghada|الغردقة/i, city: 'Hurghada' },
          { pattern: /sharm|شرم/i, city: 'Sharm El Sheikh' },
          { pattern: /dahab|دهب/i, city: 'Dahab' },
          { pattern: /siwa|سيوة/i, city: 'Siwa' },
          { pattern: /fayoum|فيوم/i, city: 'Fayoum' },
          { pattern: /minya|المنيا/i, city: 'Minya' },
          { pattern: /asyut|أسيوط/i, city: 'Asyut' },
          { pattern: /sohag|سوهاج/i, city: 'Sohag' },
          { pattern: /qena|قنا/i, city: 'Qena' },
          { pattern: /ismailia|الإسماعيلية/i, city: 'Ismailia' },
          { pattern: /port said|بورسعيد/i, city: 'Port Said' },
          { pattern: /suez|السويس/i, city: 'Suez' },
          { pattern: /safaga|سفاجا/i, city: 'Safaga' },
          { pattern: /quseir|القصير/i, city: 'El Quseir' }
        ];

        trips.forEach((trip: any) => {
          // Get the city name from trip data
          let cityName = trip.city || trip.destination || '';
          
          // If no city data, use a default
          if (!cityName) {
            cityName = 'Cairo';
          }
          
          // Find matching city based on patterns
          let mappedCity = 'Cairo'; // Default fallback
          
          for (const { pattern, city } of cityPatterns) {
            if (pattern.test(cityName)) {
              mappedCity = city;
              break;
            }
          }
          
          // Initialize city group if not exists
          if (!cityGroups[mappedCity]) {
            cityGroups[mappedCity] = [];
            cityCount[mappedCity] = 0;
          }
          
          cityGroups[mappedCity].push(trip);
          cityCount[mappedCity]++;
        });

        // Debug: Log city distribution
        console.log('City distribution:', Object.keys(cityGroups).map(city => 
          `${city}: ${cityGroups[city].length} trips`
        ));

        const hotspots = Object.values(cityCount).filter(count => count >= 3).length;
        
        setStats(prev => ({ 
          ...prev, 
          totalTrips: trips.length,
          hotspots: hotspots || Object.keys(cityGroups).length
        }));

        // Add heatmap with distributed points
        const heatmapFeatures: any[] = [];

        Object.entries(cityGroups).forEach(([cityName, cityTrips]) => {
          const cityData = EGYPT_CITIES[cityName as keyof typeof EGYPT_CITIES] || EGYPT_CITIES['Cairo'];
          
          cityTrips.forEach((trip: any, idx: number) => {
            // Generate multiple heat points per trip for better coverage
            for (let i = 0; i < 3; i++) {
              const [lng, lat] = generateRandomPoint(cityName, cityData, idx + i, cityTrips.length);
              
              heatmapFeatures.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lng, lat]
                },
                properties: { 
                  weight: Math.random() * 10 + 5,
                  city: cityName
                }
              });
            }
          });
        });

        map.addSource('heatmap-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: heatmapFeatures
          }
        });

        map.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-source',
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              isMobile ? 6 : 9, isMobile ? 2 : 3
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(255,255,255,0)',
              0.1, 'rgba(255,245,230,0.3)',
              0.3, 'rgba(255,200,100,0.4)',
              0.5, 'rgba(255,140,50,0.6)',
              0.7, 'rgba(255,70,0,0.7)',
              1, 'rgba(230,0,0,0.9)'
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, isMobile ? 30 : 40,
              isMobile ? 6 : 9, isMobile ? 50 : 80
            ],
            'heatmap-opacity': 0.7
          }
        });

        heatmapRef.current = 'heatmap-layer';

        // Create markers with distributed positions
        Object.entries(cityGroups).forEach(([cityName, cityTrips]) => {
          const cityData = EGYPT_CITIES[cityName as keyof typeof EGYPT_CITIES] || EGYPT_CITIES['Cairo'];
          
          cityTrips.forEach((trip: any, index: number) => {
            // Generate unique position for each trip
            const [lng, lat] = generateRandomPoint(cityName, cityData, index, cityTrips.length);

            const marker = createMarker(trip, cityName, lng, lat, cityTrips.length > 1);
            markersRef.current.push(marker);
          });
        });

        console.log(`Created ${markersRef.current.length} markers across ${Object.keys(cityGroups).length} cities`);

      } catch (err) {
        console.error("Error loading pulse map points:", err);
      }
    });

    // Handle resize
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapRef.current) mapRef.current.remove();
      markersRef.current.forEach(m => m.remove());
    };
  }, [isMobile]);

// Create marker element with enhanced hover design
const createMarker = (trip: any, cityName: string, lng: number, lat: number, isClustered: boolean) => {
  const el = document.createElement('div');
  el.className = `premium-marker ${isClustered ? 'clustered' : ''}`;
  
  // Get Arabic city name if available
  const cityData = EGYPT_CITIES[cityName as keyof typeof EGYPT_CITIES];
  const displayCity = cityData?.area || cityName;
  
  // Get price if available
  const price = trip.price || trip.startingPrice || 'مناسب';
  const duration = trip.duration || 'يوم';
  
  el.innerHTML = `
    <div class="marker-wrapper ${isClustered ? 'clustered' : ''}">
      <div class="marker-image-circle border-2 border-white shadow-lg">
        <img src="${trip.image || '/placeholder.svg'}" alt="${trip.title || 'رحلة'}" loading="lazy" />
      </div>
      <div class="marker-hover-card">
        <div class="hover-card-image">
          <img src="${trip.image || '/placeholder.svg'}" alt="${trip.title || 'رحلة'}" />
          <div class="hover-card-city">${displayCity}</div>
        </div>
        <div class="hover-card-content">
          <h4 class="hover-card-title">${trip.title || 'رحلة مميزة'}</h4>
          <div class="hover-card-details">
            <span class="hover-card-price">${price} جنيه</span>
            <span class="hover-card-duration">${duration}</span>
          </div>
          <div class="hover-card-footer">
            <span class="hover-card-view">اضغط للعرض</span>
          </div>
        </div>
      </div>
      <div class="marker-stem"></div>
    </div>
  `;

  el.onclick = () => navigate(`/trips/${trip._id || trip.id}`);

  return new mapboxgl.Marker({ element: el })
    .setLngLat([lng, lat])
    .addTo(mapRef.current!);
};

  // Toggle marker visibility
  useEffect(() => {
    markersRef.current.forEach(marker => {
      const el = marker.getElement();
      if (el) {
        if (showMarkers) {
          el.style.display = 'block';
          el.style.opacity = '1';
        } else {
          el.style.display = 'none';
        }
      }
    });
  }, [showMarkers]);

  // Toggle heatmap visibility
  const toggleHeatmap = () => {
    if (mapRef.current && heatmapRef.current) {
      const visibility = mapRef.current.getLayoutProperty(heatmapRef.current, 'visibility');
      mapRef.current.setLayoutProperty(
        heatmapRef.current, 
        'visibility', 
        visibility === 'visible' ? 'none' : 'visible'
      );
    }
  };

  // Fly to city
  const flyToCity = (cityName: string) => {
    const cityData = EGYPT_CITIES[cityName as keyof typeof EGYPT_CITIES];
    if (mapRef.current && cityData) {
      mapRef.current.flyTo({
        center: [cityData.center[0], cityData.center[1]],
        zoom: isMobile ? 8 : 9,
        duration: 1500,
        essential: true
      });
      setSelectedCity(cityName);
      
      // Auto hide city selection after 3 seconds
      setTimeout(() => setSelectedCity(null), 3000);
    }
  };

  return (
    <div className={cn(
      "relative rounded-2xl md:rounded-3xl lg:rounded-[2.5rem] overflow-hidden border-2 md:border-4 border-white/30 shadow-xl bg-gray-100",
      className
    )}>
      <div 
        ref={mapContainer} 
        style={{ height: isMobile ? '400px' : height }} 
        className="w-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px]"
      />
      
      {showOverlay && (
        <>
          {/* Main Stats Cards */}
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 lg:top-6 lg:right-6 flex flex-col gap-2 sm:gap-3 pointer-events-none max-w-[calc(100%-1rem)] sm:max-w-none z-10">
            
            {/* Hotspot Card */}
            <div className="bg-white/95 backdrop-blur-2xl p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl border border-white/50 pointer-events-auto flex items-center gap-2 sm:gap-3 transition-transform hover:scale-[1.02]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200/50 flex-shrink-0">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="font-black text-sm sm:text-base lg:text-lg text-gray-900 leading-none truncate">
                  {isMobile ? 'مناطق ساخنة' : 'مصر تشتعل!'}
                </h3>
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 truncate">
                  {stats.hotspots} {isMobile ? 'منطقة' : 'أكثر المناطق جذباً'}
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pointer-events-auto self-end">
              <div className="bg-white/90 backdrop-blur-xl px-2 py-1 sm:px-4 sm:py-2 rounded-full shadow-xl border border-white/50 flex items-center gap-1 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-[10px] sm:text-xs lg:text-sm font-black text-gray-800">
                  {stats.activeUsers}
                </span>
                <Users className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-600 flex-shrink-0" />
              </div>
              
              <div className="bg-gray-900/95 backdrop-blur-xl px-2 py-1 sm:px-4 sm:py-2 rounded-full shadow-xl border border-white/10 flex items-center gap-1 sm:gap-2 text-white">
                <span className="text-[10px] sm:text-xs lg:text-sm font-black">
                  {stats.totalTrips}
                </span>
                <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-yellow-400 flex-shrink-0" />
              </div>

              {/* Control Buttons */}
              <div className="flex gap-1 sm:gap-2">
                <button 
                  onClick={() => setShowMarkers(!showMarkers)}
                  className="bg-white/95 backdrop-blur-xl p-1.5 sm:p-2 lg:p-2.5 rounded-full shadow-xl border border-white/50 pointer-events-auto hover:bg-orange-50 transition-all group"
                  title={showMarkers ? "إخفاء الرحلات" : "إظهار الرحلات"}
                >
                  {showMarkers ? (
                    <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-700 group-hover:text-orange-600" />
                  ) : (
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-orange-600 animate-pulse" />
                  )}
                </button>

                <button 
                  onClick={toggleHeatmap}
                  className="bg-white/95 backdrop-blur-xl p-1.5 sm:p-2 lg:p-2.5 rounded-full shadow-xl border border-white/50 pointer-events-auto hover:bg-orange-50 transition-all group"
                  title="إظهار/إخفاء الخريطة الحرارية"
                >
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-orange-600 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick City Navigation */}
          <div className={cn(
            "absolute left-2 right-2 sm:left-auto sm:right-4 lg:right-6",
            "bottom-2 sm:bottom-4 lg:bottom-6",
            "flex flex-wrap gap-1 sm:gap-2 justify-center pointer-events-none z-10"
          )}>
            {Object.keys(EGYPT_CITIES).slice(0, isMobile ? 4 : 8).map((city) => {
              const cityData = EGYPT_CITIES[city as keyof typeof EGYPT_CITIES];
              return (
                <button
                  key={city}
                  onClick={() => flyToCity(city)}
                  className={cn(
                    "pointer-events-auto px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2",
                    "bg-white/90 backdrop-blur-xl rounded-full shadow-lg",
                    "border border-white/50 hover:bg-orange-50 transition-all",
                    "text-[10px] sm:text-xs lg:text-sm font-bold",
                    selectedCity === city ? "text-orange-600 bg-orange-50" : "text-gray-700"
                  )}
                >
                  {isMobile && city.length > 8 ? cityData?.area.substring(0, 4) + '...' : (cityData?.area || city)}
                </button>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="absolute left-2 top-2 sm:left-4 sm:top-auto sm:bottom-4 lg:bottom-6 bg-white/90 backdrop-blur-xl px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl shadow-lg border border-white/50 text-[8px] sm:text-xs flex items-center gap-2 sm:gap-3 pointer-events-none z-10">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-gray-700 font-medium">نشط</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full" />
              <span className="text-gray-700 font-medium">هادئ</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full" />
              <span className="text-gray-700 font-medium">{markersRef.current.length} رحلة</span>
            </div>
          </div>
        </>
      )}

<style>{`
        .premium-marker {
          cursor: pointer;
          filter: drop-shadow(0 8px 12px rgba(0,0,0,0.15));
          z-index: 10;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .premium-marker:hover {
          z-index: 10000 !important;
          transform: translateY(-8px) scale(1.05);
        }

        .marker-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          padding: 3px;
          border-radius: 40px;
          border: 2px solid #f97316;
          width: 42px;
          height: 42px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }

        .marker-wrapper.clustered {
          border-color: #f59e0b;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }

        @media (min-width: 768px) {
          .marker-wrapper {
            width: 46px;
            height: 46px;
            padding: 4px;
          }
        }

        @media (max-width: 767px) {
          .marker-wrapper {
            width: 38px;
            height: 38px;
            padding: 2px;
          }
        }

        .marker-image-circle {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          flex-shrink: 0;
        }

        .marker-image-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Hover Card - Hidden by default */
        .marker-hover-card {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-10px);
          background: white;
          border-radius: 16px;
          padding: 0;
          width: 240px;
          box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.3), 0 0 0 2px #f97316;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          pointer-events: none;
          margin-bottom: 15px;
          overflow: hidden;
          direction: rtl;
        }

        .premium-marker:hover .marker-hover-card {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(-15px);
        }

        /* Hover Card Image */
        .hover-card-image {
          position: relative;
          width: 100%;
          height: 130px;
          overflow: hidden;
        }

        .hover-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .premium-marker:hover .hover-card-image img {
          transform: scale(1.1);
        }

        .hover-card-city {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(249, 115, 22, 0.95);
          backdrop-filter: blur(4px);
          color: white;
          padding: 5px 12px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.3);
        }

        /* Hover Card Content */
        .hover-card-content {
          padding: 15px;
          background: white;
        }

        .hover-card-title {
          font-family: 'Cairo', 'Tajawal', sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: #1f2937;
          margin: 0 0 10px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-align: right;
        }

        .hover-card-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .hover-card-price {
          font-family: 'Cairo', 'Tajawal', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: #f97316;
          background: #fff7ed;
          padding: 4px 12px;
          border-radius: 30px;
          letter-spacing: 0.5px;
        }

        .hover-card-duration {
          font-family: 'Cairo', 'Tajawal', sans-serif;
          font-weight: 600;
          font-size: 13px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 5px;
          background: #f3f4f6;
          padding: 4px 10px;
          border-radius: 30px;
        }

        .hover-card-duration::before {
          content: '⏱️';
          font-size: 12px;
        }

        .hover-card-footer {
          display: flex;
          justify-content: center;
          margin-top: 10px;
        }

        .hover-card-view {
          font-family: 'Cairo', 'Tajawal', sans-serif;
          font-weight: 700;
          font-size: 12px;
          color: #f97316;
          background: #f3f4f6;
          padding: 6px 20px;
          border-radius: 30px;
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
          letter-spacing: 0.3px;
        }

        .premium-marker:hover .hover-card-view {
          background: #f97316;
          color: white;
          transform: scale(1.02);
        }

        .marker-stem {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 10px;
          background: #f97316;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Mapbox controls customization */
        .mapboxgl-ctrl-bottom-right {
          bottom: 10px;
          right: 10px;
        }
        
        .mapboxgl-ctrl-group {
          border-radius: 50% !important;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        .mapboxgl-ctrl-group button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        @media (max-width: 767px) {
          .mapboxgl-ctrl-group button {
            width: 32px;
            height: 32px;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* Mobile Responsive for hover card */
        @media (max-width: 767px) {
          .marker-hover-card {
            width: 200px;
          }
          
          .hover-card-image {
            height: 110px;
          }
          
          .hover-card-title {
            font-size: 13px;
            margin-bottom: 8px;
          }
          
          .hover-card-price {
            font-size: 16px;
            padding: 3px 10px;
          }
          
          .hover-card-duration {
            font-size: 11px;
            padding: 3px 8px;
          }
          
          .hover-card-view {
            font-size: 11px;
            padding: 5px 15px;
          }
          
          .hover-card-city {
            font-size: 10px;
            padding: 3px 10px;
          }
          
          button {
            min-height: 36px;
            min-width: 36px;
          }
          
          .premium-marker {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Tablet Responsive */
        @media (min-width: 768px) and (max-width: 1024px) {
          .marker-hover-card {
            width: 220px;
          }
          
          .hover-card-image {
            height: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default LivePulseMap;
