import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { listTrips } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MapPin, Users, Flame, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LivePulseMapProps {
  className?: string;
  height?: string;
  showOverlay?: boolean;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmFzdGZhZHkiLCJhIjoiY2x4cWhwY2FpMDZrdDJxc2VpZWRvMXY2NCJ9.m_3I0BkzuYqJlL9CMyBi9w';

// Bounds for Egypt only
const EGYPT_BOUNDS: [[number, number], [number, number]] = [
  [24.7, 22.0], // Southwest
  [37.0, 31.7]  // Northeast
];

const LivePulseMap: React.FC<LivePulseMapProps> = ({ 
  className, 
  height = "600px",
  showOverlay = true 
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeUsers: 142, totalTrips: 0 });
  const [showMarkers, setShowMarkers] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      // Using 'outdoors' style for a natural look with green land and blue water
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [30.8025, 26.8206],
      zoom: 5.8,
      maxBounds: EGYPT_BOUNDS,
      pitch: 0,
      antialias: true
    });

    mapRef.current = map;

    map.on('load', async () => {
      try {
        const data = await listTrips({ limit: 50 });
        const trips = data.items || [];
        setStats(prev => ({ ...prev, totalTrips: trips.length }));

        // 1. ADD HEATMAP for "Hot Region" effect
        map.addSource('heatmap-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: trips.map((t: any) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [
                  (t.activities?.[0]?.coordinates?.lng || 30.8) + (Math.random() - 0.5) * 0.1, 
                  (t.activities?.[0]?.coordinates?.lat || 26.8) + (Math.random() - 0.5) * 0.1
                ]
              },
              properties: { weight: Math.random() * 10 }
            }))
          }
        });

        map.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-source',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 10, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 5, 1, 9, 3],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(255,255,255,0)',
              0.2, 'rgba(255,245,230,0.4)',
              0.4, 'rgba(255,200,100,0.5)',
              0.6, 'rgba(255,140,50,0.6)',
              0.8, 'rgba(255,70,0,0.7)',
              1, 'rgba(230,0,0,0.8)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 5, 35, 10, 85],
            'heatmap-opacity': 0.6
          }
        });

        // 2. CREATE CLEAN MARKERS (Spiderified/Offset to prevent overlap)
        const cityTripCounts: Record<string, number> = {};

        trips.forEach((trip: any, index: number) => {
          let lat = 26.8206;
          let lng = 30.8025;

          const cityName = trip.city || trip.destination || 'Cairo';
          cityTripCounts[cityName] = (cityTripCounts[cityName] || 0) + 1;

          if (trip.activities?.[0]?.coordinates) {
            lat = trip.activities[0].coordinates.lat;
            lng = trip.activities[0].coordinates.lng;
          } else {
             const cities: any = {
                'Alexandria': [29.9187, 31.2001],
                'Cairo': [31.2357, 30.0444],
                'Luxor': [32.6421, 25.6872],
                'Aswan': [32.8998, 24.0889],
                'Dahab': [34.5197, 28.5021],
                'Sharm El Sheikh': [34.3300, 27.9158],
                'Ghurghada': [33.8116, 27.2579],
                'Marsa Matrouh': [27.2373, 31.3543]
             };
             if (cities[cityName]) {
                lng = cities[cityName][0];
                lat = cities[cityName][1];
             }
          }

          // Offset markers in the same city to prevent hidden items
          const angle = (index * 137.5) * (Math.PI / 180);
          const radius = (cityTripCounts[cityName] > 1) ? 0.05 * Math.sqrt(cityTripCounts[cityName]) : 0;
          lng += Math.cos(angle) * radius;
          lat += Math.sin(angle) * radius;

          const el = document.createElement('div');
          el.className = 'premium-marker';
          el.innerHTML = `
            <div class="marker-wrapper shadow-2xl">
               <div class="marker-image-circle border-2 border-white">
                  <img src="${trip.image || '/placeholder.svg'}" />
               </div>
               <div class="marker-details">
                  <div class="marker-title-box">
                    <span class="title">${trip.title}</span>
                    <span class="city"><i class="pin-icon"></i> ${cityName}</span>
                  </div>
               </div>
            </div>
            <div class="marker-stem"></div>
          `;

          el.onclick = () => navigate(`/trips/${trip._id || trip.id}`);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map);
          
          markersRef.current.push(marker);
        });

      } catch (err) {
        console.error("Error loading pulse map points:", err);
      }
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
      markersRef.current.forEach(m => m.remove());
    };
  }, []);

  // Toggle marker visibility
  useEffect(() => {
    markersRef.current.forEach(marker => {
      const el = marker.getElement();
      if (el) {
        el.style.display = showMarkers ? 'block' : 'none';
      }
    });
  }, [showMarkers]);

  return (
    <div className={cn("relative rounded-[3.5rem] overflow-hidden border-[6px] border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] bg-gray-100", className)}>
      <div ref={mapContainer} style={{ height }} className="w-full" />
      
      {showOverlay && (
        <div className="absolute top-10 right-10 flex flex-col gap-4 pointer-events-none">
           <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl border border-white/50 pointer-events-auto flex items-center gap-5 transition-transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                 <Flame className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                 <h3 className="font-black text-2xl text-gray-900 leading-none">مصر تشتعل!</h3>
                 <p className="text-sm font-bold text-gray-500">أكثر المناطق جذباً للرحلات آلان</p>
              </div>
           </div>

           <div className="flex gap-3 pointer-events-auto self-end">
              <div className="bg-white/90 backdrop-blur-xl px-6 py-3 rounded-full shadow-xl border border-white/50 flex items-center gap-3">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-sm font-black text-gray-800">${stats.activeUsers} مستكشف</span>
                 <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="bg-gray-900/95 backdrop-blur-xl px-6 py-3 rounded-full shadow-xl border border-white/10 flex items-center gap-3 text-white">
                 <span className="text-sm font-black">${stats.totalTrips} رحلة متميزة</span>
                 <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>

              <button 
                onClick={() => setShowMarkers(!showMarkers)}
                className="bg-white/95 backdrop-blur-xl p-3 rounded-full shadow-xl border border-white/50 pointer-events-auto hover:bg-orange-50 transition-all group flex items-center justify-center"
                title={showMarkers ? "إخفاء الرحلات" : "إظهار الرحلات"}
              >
                {showMarkers ? (
                  <EyeOff className="w-5 h-5 text-gray-700 group-hover:text-orange-600" />
                ) : (
                  <Eye className="w-5 h-5 text-orange-600 animate-pulse" />
                )}
              </button>
           </div>
        </div>
      )}

      <style>{`
        .premium-marker {
          cursor: pointer;
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
          z-index: 10;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .premium-marker:hover {
          z-index: 100 !important;
          transform: translateY(-8px) scale(1.15);
        }

        .marker-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          padding: 5px;
          border-radius: 50px;
          border: 1px solid rgba(0,0,0,0.05);
          width: 50px; /* Default size */
          height: 50px;
          overflow: hidden;
          transition: width 0.4s ease, border-radius 0.4s ease;
        }

        .premium-marker:hover .marker-wrapper {
          width: 220px;
          padding-right: 20px;
        }

        .marker-image-circle {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: #eee;
        }

        .marker-image-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .marker-details {
          opacity: 0;
          transform: translateX(20px);
          transition: all 0.3s ease;
          white-space: nowrap;
          overflow: hidden;
          margin-left: 12px;
          text-align: right;
        }

        .premium-marker:hover .marker-details {
          opacity: 1;
          transform: translateX(0);
        }

        .marker-title-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .marker-title-box .title {
          font-family: 'Cairo', sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: #111;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 140px;
        }

        .marker-title-box .city {
          font-family: 'Cairo', sans-serif;
          font-weight: 700;
          font-size: 10px;
          color: #f97316;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .marker-stem {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 6px;
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default LivePulseMap;
