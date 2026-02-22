import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface MapboxTripMapProps {
  positions: { lat: number; lng: number }[];
  activityNames?: string[];
  onMarkerClick?: (index: number) => void;
  className?: string;
  height?: string;
}

export const MapboxTripMap = ({
  positions,
  activityNames = [],
  onMarkerClick,
  className = "",
  height = "280px",
}: MapboxTripMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || !positions.length) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const center: [number, number] = [positions[0].lng, positions[0].lat];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

    map.on("load", () => {
      const coords = positions.map((p) => [p.lng, p.lat] as [number, number]);

      if (coords.length >= 2) {
        if (!map.getSource("route")) {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
              properties: {},
            },
          });

          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            paint: {
              "line-color": "#4F46E5",
              "line-width": 4,
              "line-opacity": 0.8,
              "line-dasharray": [2, 1],
            },
          });
        } else {
          const src = map.getSource("route") as mapboxgl.GeoJSONSource;
          if (src) {
            src.setData({
              type: "Feature",
              geometry: { type: "LineString", coordinates: coords },
              properties: {},
            });
          }
        }
      }

      if (coords.length > 1) {
        map.fitBounds(
          coords.reduce(
            (acc, c) => acc.extend(c as [number, number]),
            new mapboxgl.LngLatBounds(coords[0], coords[0])
          ),
          { padding: 40, maxZoom: 14 }
        );
      } else if (coords.length === 1) {
        map.setCenter(coords[0]);
        map.setZoom(13);
      }

      positions.forEach((pos, idx) => {
        const el = document.createElement("div");
        el.className = "mapbox-marker-activity";
        el.style.cssText = `
          width: 28px; height: 28px;
          background: white;
          color: #4F46E5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          border: 2px solid #4F46E5;
        `;
        el.textContent = String(idx + 1);

        const name = activityNames[idx] || `نقطة ${idx + 1}`;
        const popup = new mapboxgl.Popup({ offset: 15 })
          .setHTML(`<div dir="rtl" style="padding:8px;min-width:120px"><strong style="color:#4F46E5">${name}</strong></div>`);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([pos.lng, pos.lat])
          .setPopup(popup)
          .addTo(map);

        if (onMarkerClick) {
          el.addEventListener("click", () => onMarkerClick(idx));
        }
        markersRef.current.push(marker);
      });
    });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions.length, JSON.stringify(positions)]);

  if (!positions.length) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: "100%", minHeight: "200px" }}
    />
  );
};
