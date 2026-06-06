"use client";

import React, { useEffect, useRef, useState } from 'react';

interface MapPickerProps {
  latitude: number;
  longitude: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ latitude, longitude, radius, onChange }: MapPickerProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Helper to dynamically load Leaflet from CDN
    const loadLeaflet = () => {
      if ((window as any).L) {
        setIsLoaded(true);
        return;
      }

      // Load CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.id = 'leaflet-css';
        document.head.appendChild(link);
      }

      // Load JS
      let script = document.getElementById('leaflet-js') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.id = 'leaflet-js';
        script.async = true;
        document.head.appendChild(script);
      }

      const handleScriptLoad = () => {
        setIsLoaded(true);
      };

      const handleScriptError = () => {
        setLoadError(true);
      };

      script.addEventListener('load', handleScriptLoad);
      script.addEventListener('error', handleScriptError);

      return () => {
        script.removeEventListener('load', handleScriptLoad);
        script.removeEventListener('error', handleScriptError);
      };
    };

    const cleanup = loadLeaflet();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || (latitude === 0 && longitude === 0)) return;
    
    const L = (window as any).L;
    if (!L) return;

    // Fix default marker icon paths (broken by default in web bundlers)
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    // Create map centered at lat/lng
    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 16,
      zoomControl: true,
    });
    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add draggable marker
    const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
    markerRef.current = marker;

    // Add geofencing circle
    const circle = L.circle([latitude, longitude], {
      radius: radius,
      color: '#6366f1', // indigo-500
      fillColor: '#818cf8', // indigo-400
      fillOpacity: 0.2,
      weight: 2
    }).addTo(map);
    circleRef.current = circle;

    // Listen to marker drag events
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
      circle.setLatLng(pos);
    });

    // Listen to map click events
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
      onChange(lat, lng);
    });

    // Invalidate size to ensure container is fully rendered properly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, [isLoaded, latitude === 0, longitude === 0]);

  // Sync coordinates changes from parent state (manual inputs)
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !markerRef.current || !circleRef.current) return;

    const currentPos = markerRef.current.getLatLng();
    const latDiff = Math.abs(currentPos.lat - latitude);
    const lngDiff = Math.abs(currentPos.lng - longitude);

    // Only update map view if differences are notable to avoid loops/stutter
    if (latDiff > 0.00001 || lngDiff > 0.00001) {
      const newPos: [number, number] = [latitude, longitude];
      markerRef.current.setLatLng(newPos);
      circleRef.current.setLatLng(newPos);
      mapRef.current.setView(newPos, mapRef.current.getZoom());
    }
  }, [latitude, longitude]);

  // Sync radius changes from parent state
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radius);
  }, [radius]);

  if (loadError) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold p-6 text-center">
        Gagal memuat peta. Silakan periksa koneksi internet Anda atau coba muat ulang halaman.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[320px] rounded-2xl border border-gray-200 overflow-hidden shadow-inner bg-gray-50 flex items-center justify-center">
      {(!isLoaded || (latitude === 0 && longitude === 0)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 z-10">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-bold">Memuat Peta...</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
