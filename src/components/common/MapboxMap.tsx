import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useHydrated } from "@/hooks/useHydrated";

export type MapMarker = {
  id: string | number;
  lat: number;
  lon: number;
  color?: string;
  title?: string;
  rotation?: number;
};

export type MapboxMapProps = {
  center?: [number, number]; // [lon, lat]
  zoom?: number;
  style?: string;
  markers?: MapMarker[];
  className?: string;
  interactive?: boolean;
};

/**
 * Mapbox GL shell centered on the Port of Singapore by default.
 * Renders a graceful unavailable panel when the public token is missing.
 */
export function MapboxMap({
  center = [103.8323, 1.2649],
  zoom = 10.2,
  style = "mapbox://styles/mapbox/dark-v11",
  markers = [],
  className,
  interactive = true,
}: MapboxMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);
  const hydrated = useHydrated();

  const token = (import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN as string | undefined) ?? "";

  useEffect(() => {
    if (!hydrated || !ref.current || !token) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: ref.current,
      style,
      center,
      zoom,
      interactive,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    if (interactive) map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token, style]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = markers.map((mk) => {
      const el = document.createElement("div");
      el.style.width = "10px";
      el.style.height = "10px";
      el.style.borderRadius = "9999px";
      el.style.background = mk.color ?? "#22d3ee";
      el.style.boxShadow = `0 0 0 3px ${mk.color ?? "#22d3ee"}33, 0 0 12px ${mk.color ?? "#22d3ee"}66`;
      if (mk.rotation != null) el.style.transform = `rotate(${mk.rotation}deg)`;
      const marker = new mapboxgl.Marker(el).setLngLat([mk.lon, mk.lat]);
      if (mk.title) marker.setPopup(new mapboxgl.Popup({ offset: 12, closeButton: false }).setText(mk.title));
      marker.addTo(map);
      return marker;
    });
  }, [markers]);

  if (!token) {
    return (
      <div className={`glass p-6 text-center text-sm text-muted-foreground ${className ?? ""}`}>
        Data unavailable from public source. Mapbox public token not configured.
      </div>
    );
  }

  return <div ref={ref} className={className} />;
}