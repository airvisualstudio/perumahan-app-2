"use client";

import React, { useEffect, useRef, useState } from 'react';

interface Cluster {
  id: string;
  name: string;
  location: string;
  description: string;
  status: string;
}

interface MonitoringMapProps {
  clusters: Cluster[];
  activeClusterId: string | null;
  onClusterClick: (id: string) => void;
}

// Deterministic coordinate generator for custom/newly created clusters in Bandung
const getClusterCoordinates = (clusterId: string, location: string): [number, number] => {
  if (clusterId === 'cls-melati' || location.toLowerCase().includes('utara')) {
    return [-6.8219, 107.6104]; // Lembang / Bandung Utara
  }
  if (clusterId === 'cls-anggrek' || location.toLowerCase().includes('timur')) {
    return [-6.9328, 107.6836]; // Bandung Timur
  }
  
  // Hash the ID to generate stable and nearby coordinates in Bandung area
  let hashLat = 0;
  let hashLng = 0;
  for (let i = 0; i < clusterId.length; i++) {
    hashLat += clusterId.charCodeAt(i) * (i + 1);
    hashLng += clusterId.charCodeAt(i) * (i + 2);
  }
  
  const latOffset = ((hashLat % 80) - 40) * 0.0015; // small offsets
  const lngOffset = ((hashLng % 80) - 40) * 0.0015;
  
  return [-6.917464 + latOffset, 107.619122 + lngOffset]; // Bandung Center base
};

export default function MonitoringMap({ clusters, activeClusterId, onClusterClick }: MonitoringMapProps) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

    loadLeaflet();
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Define custom futuristic marker icons
    const createNeonIcon = (colorClass: string, glowColor: string) => {
      return L.divIcon({
        className: 'custom-neon-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75" style="background-color: ${glowColor}; animation-duration: 2s;"></span>
            <div class="relative flex items-center justify-center rounded-full w-4 h-4 border border-white" style="background-color: ${glowColor}; box-shadow: 0 0 10px ${glowColor}"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    };

    // Center of Bandung
    const map = L.map(mapContainerRef.current, {
      center: [-6.89, 107.64],
      zoom: 12,
      zoomControl: false // Disable zoom control or re-position
    });
    mapRef.current = map;

    // Custom Map Styling (Dark themed tiles)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Zoom Controls at Top Right
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    // Add Markers for clusters
    clusters.forEach(cluster => {
      const coords = getClusterCoordinates(cluster.id, cluster.location);
      const isMelati = cluster.id === 'cls-melati';
      const color = isMelati ? '#6366f1' : '#10b981'; // Indigo vs Emerald
      
      const icon = createNeonIcon(isMelati ? 'bg-indigo-500' : 'bg-emerald-500', color);
      const marker = L.marker(coords, { icon }).addTo(map);
      
      // Bind click handler
      marker.on('click', () => {
        onClusterClick(cluster.id);
      });

      // Bind tooltip showing cluster name
      marker.bindTooltip(`
        <div class="px-2 py-1 font-sans bg-slate-900/90 border border-slate-800 text-white rounded text-xs font-bold shadow-lg">
          ${cluster.name}
        </div>
      `, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.9,
        className: 'custom-tooltip'
      });

      markersRef.current[cluster.id] = marker;
    });

    // Invalidate size to ensure container is fully rendered properly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
      }
    };
  }, [isLoaded, clusters.length]);

  // Handle active cluster change (zoom & pan to it)
  useEffect(() => {
    if (!mapRef.current || !activeClusterId) return;
    
    const activeCluster = clusters.find(c => c.id === activeClusterId);
    if (!activeCluster) return;

    const coords = getClusterCoordinates(activeCluster.id, activeCluster.location);
    mapRef.current.setView(coords, 14, {
      animate: true,
      duration: 1
    });

    // Open tooltip of active cluster
    const marker = markersRef.current[activeClusterId];
    if (marker) {
      marker.openTooltip();
    }
  }, [activeClusterId, clusters]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-slate-800 text-xs text-red-400 font-bold p-6 text-center">
        Gagal memuat peta monitoring. Periksa koneksi internet Anda.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-slate-950 flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 z-10">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-indigo-400 font-mono">INITIALIZING MAP SENSORS...</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Global CSS inject for Leaflet Tooltip overrides in Dark Mode */}
      <style jsx global>{`
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip-top:before {
          border-top-color: rgb(15, 23, 42) !important;
        }
        .custom-neon-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
