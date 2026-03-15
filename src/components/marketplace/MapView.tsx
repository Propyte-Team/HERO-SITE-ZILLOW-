'use client';

import { useEffect, useRef, useState } from 'react';
import type { Property } from '@/types/property';
import { formatPriceShort } from '@/lib/formatters';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
}

export default function MapView({ properties, onPropertyClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token === 'your_mapbox_token_here' || !mapContainer.current) {
      setError(true);
      return;
    }

    let map: mapboxgl.Map;

    async function initMap() {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;

        mapboxgl.accessToken = token!;

        map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-87.25, 20.42],
          zoom: 9,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
          setLoaded(true);

          properties.forEach(property => {
            const el = document.createElement('div');
            el.className = 'mapbox-price-pin';
            el.innerHTML = `<div style="background:#1E3A5F;color:white;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer">${formatPriceShort(property.price.mxn)}</div>`;

            el.addEventListener('click', () => {
              if (onPropertyClick) onPropertyClick(property);
            });

            new mapboxgl.Marker({ element: el })
              .setLngLat([property.location.lng, property.location.lat])
              .addTo(map);
          });
        });

        mapRef.current = map;
      } catch {
        setError(true);
      }
    }

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [properties, onPropertyClick]);

  if (error) {
    return (
      <div className="w-full h-full bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Configura tu token de Mapbox</p>
          <p className="text-sm text-gray-400 mt-1">Agrega NEXT_PUBLIC_MAPBOX_TOKEN en .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-[#F4F6F8] flex items-center justify-center z-10">
          <div className="animate-pulse text-gray-400">Cargando mapa...</div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
