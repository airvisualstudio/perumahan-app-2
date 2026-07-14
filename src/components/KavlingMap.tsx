"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, MapPin, Layers, Trees, Sparkles } from 'lucide-react';

interface Unit {
  id: string;
  cluster_id: string;
  unit_type_id: string;
  block_number: string;
  sell_price: number;
  orientation: 'hook' | 'middle' | 'corner';
  status: 'available' | 'reserved' | 'booking' | 'kpr_process' | 'sold' | 'unavailable';
  reserved_for?: string;
  notes?: string;
}

interface UnitType {
  id: string;
  cluster_id: string;
  name: string;
  building_area: number;
  land_area: number;
  base_price: number;
  bedrooms: number;
  bathrooms: number;
  photos?: string[];
}

interface Prospect {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  pipeline_stage: string;
}

interface Cluster {
  id: string;
  name: string;
  location: string;
  description: string;
  total_units: number;
  status: string;
  svg_content?: string;
}

interface KavlingMapProps {
  units: Unit[];
  unitTypes: UnitType[];
  prospects: Prospect[];
  activeClusterId: string;
  onUnitSelect: (unit: Unit) => void;
  clusters?: Cluster[];
  hideLegend?: boolean;
}

const statusConfig = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', fill: 'url(#grad-available)', stroke: '#22c55e' },
  reserved: { label: 'Reserved', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', fill: 'url(#grad-reserved)', stroke: '#eab308' },
  booking: { label: 'Booking Fee', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', fill: 'url(#grad-booking)', stroke: '#3b82f6' },
  kpr_process: { label: 'Proses KPR/Cash', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', fill: 'url(#grad-kpr_process)', stroke: '#f97316' },
  sold: { label: 'Terjual (Akad)', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', fill: 'url(#grad-sold)', stroke: '#ef4444' },
  unavailable: { label: 'Tidak Tersedia', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-500', fill: 'url(#grad-unavailable)', stroke: '#6b7280' }
};

export default function KavlingMap({ units, unitTypes, prospects, activeClusterId, onUnitSelect, clusters, hideLegend = false }: KavlingMapProps) {
  const [hoveredUnit, setHoveredUnit] = useState<Unit | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hoveredPlaceholder, setHoveredPlaceholder] = useState<string | null>(null);

  const activeCluster = clusters?.find(c => c.id === activeClusterId);
  const [parsedSvgReact, setParsedSvgReact] = useState<React.ReactNode | null>(null);

  const parseSvgToReact = useCallback((node: Node, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    
    const allowedTags = [
      'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 
      'polyline', 'polygon', 'text', 'tspan', 'defs', 
      'lineargradient', 'stop', 'filter', 'fedropshadow', 'style'
    ];
    
    if (!allowedTags.includes(tagName)) {
      return null;
    }
    
    const props: any = { key };
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      let name = attr.name;
      if (name.includes('-')) {
        name = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      }
      if (name === 'class') name = 'className';
      
      props[name] = attr.value;
    }
    
    const blockNumber = element.getAttribute('id') || element.getAttribute('data-block');
    const unit = blockNumber ? units.find(u => u.cluster_id === activeClusterId && u.block_number === blockNumber) : null;
    
    if (blockNumber && unit) {
      const config = statusConfig[unit.status];
      let fill = config.fill;
      let stroke = config.stroke;
      if (unit.status === 'available') {
        if ((unit as any).construction_status === 'belum_terbangun') {
          fill = '#94a3b8';
          stroke = '#64748b';
        } else if ((unit as any).construction_status === 'proses_pembangunan') {
          fill = '#3b82f6';
          stroke = '#1d4ed8';
        } else if ((unit as any).construction_status === 'finishing') {
          fill = '#8b5cf6';
          stroke = '#6d28d9';
        } else if ((unit as any).construction_status === 'ready') {
          fill = '#10b981';
          stroke = '#047857';
        }
      }
      props.fill = fill;
      props.stroke = stroke;
      props.strokeWidth = hoveredUnit?.id === unit.id ? 3.5 : (props.strokeWidth || 1.5);
      props.style = { ...props.style, cursor: 'pointer', transition: 'all 0.2s' };
      
      props.onClick = () => onUnitSelect(unit);
      props.onMouseEnter = () => setHoveredUnit(unit);
      props.onMouseLeave = () => setHoveredUnit(null);
    } else if (blockNumber && (blockNumber.match(/^[A-Z]-[0-9]+$/i) || blockNumber.match(/^[A-Z][0-9]+$/i))) {
      props.style = { ...props.style, cursor: 'default', opacity: 0.6 };
      props.onMouseEnter = () => setHoveredPlaceholder(blockNumber);
      props.onMouseLeave = () => setHoveredPlaceholder(null);
    }
    
    const children: React.ReactNode[] = [];
    for (let i = 0; i < node.childNodes.length; i++) {
      const childReact = parseSvgToReact(node.childNodes[i], `${key}-${i}`);
      if (childReact) {
        children.push(childReact);
      }
    }
    
    return React.createElement(tagName, props, children.length > 0 ? children : undefined);
  }, [activeClusterId, units, hoveredUnit, onUnitSelect]);

  useEffect(() => {
    if (typeof window === 'undefined' || !activeCluster?.svg_content) {
      setParsedSvgReact(null);
      return;
    }
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(activeCluster.svg_content, 'image/svg+xml');
      const svgElement = doc.documentElement;
      
      if (svgElement.tagName.toLowerCase() === 'svg') {
        const svgHeightClass = hideLegend ? 'max-h-[65vh] object-contain' : 'h-auto';
        svgElement.setAttribute('class', `w-full ${svgHeightClass} select-none rounded-2xl border border-gray-200/50 bg-slate-50/50 shadow-inner ` + (svgElement.getAttribute('class') || ''));
        const parsed = parseSvgToReact(svgElement, 'custom-svg-root');
        setParsedSvgReact(parsed);
      } else {
        setParsedSvgReact(<p className="text-red-500 text-xs font-bold text-center py-10 bg-slate-50 border rounded-2xl">Format SVG tidak valid.</p>);
      }
    } catch (e) {
      console.error(e);
      setParsedSvgReact(<p className="text-red-500 text-xs font-bold text-center py-10 bg-slate-50 border rounded-2xl">Gagal memproses file SVG.</p>);
    }
  }, [activeClusterId, activeCluster?.svg_content, units, hoveredUnit, parseSvgToReact]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15
    });
  };

  const getUnitInfo = (blockNumber: string) => {
    return units.find(u => u.cluster_id === activeClusterId && u.block_number === blockNumber);
  };

  const getPlotStyles = (blockNumber: string) => {
    const unit = getUnitInfo(blockNumber);
    if (!unit) {
      return {
        fill: 'url(#grad-placeholder)',
        stroke: '#d4d4d8',
        cursor: 'default',
        opacity: 0.6
      };
    }
    const config = statusConfig[unit.status];
    let fill = config.fill;
    let stroke = config.stroke;
    if (unit.status === 'available') {
      if ((unit as any).construction_status === 'belum_terbangun') {
        fill = '#94a3b8';
        stroke = '#64748b';
      } else if ((unit as any).construction_status === 'proses_pembangunan') {
        fill = '#3b82f6';
        stroke = '#1d4ed8';
      } else if ((unit as any).construction_status === 'finishing') {
        fill = '#8b5cf6';
        stroke = '#6d28d9';
      } else if ((unit as any).construction_status === 'ready') {
        fill = '#10b981';
        stroke = '#047857';
      }
    }
    return {
      fill,
      stroke,
      cursor: 'pointer',
      opacity: 1
    };
  };

  const handlePlotClick = (blockNumber: string) => {
    const unit = getUnitInfo(blockNumber);
    if (unit) {
      onUnitSelect(unit);
    }
  };

  // Predefined plot data for SVG layouts
  // Melati: A-01 to A-12
  const melatiPlots = [
    // North Block
    { block: 'A-01', x: 140, y: 50, w: 70, h: 100, labelX: 175, labelY: 105, orientation: 'hook' },
    { block: 'A-02', x: 210, y: 50, w: 60, h: 100, labelX: 240, labelY: 105, orientation: 'middle' },
    { block: 'A-03', x: 270, y: 50, w: 60, h: 100, labelX: 300, labelY: 105, orientation: 'middle' },
    { block: 'A-04', x: 330, y: 50, w: 70, h: 100, labelX: 365, labelY: 105, orientation: 'corner' },
    { block: 'A-05', x: 420, y: 50, w: 60, h: 100, labelX: 450, labelY: 105, orientation: 'middle' },
    { block: 'A-06', x: 480, y: 50, w: 60, h: 100, labelX: 510, labelY: 105, orientation: 'middle' },
    { block: 'A-07', x: 540, y: 50, w: 70, h: 100, labelX: 575, labelY: 105, orientation: 'hook' },

    // South Block
    { block: 'A-08', x: 140, y: 290, w: 70, h: 100, labelX: 175, labelY: 345, orientation: 'hook' },
    { block: 'A-09', x: 210, y: 290, w: 60, h: 100, labelX: 240, labelY: 345, orientation: 'middle' },
    { block: 'A-10', x: 270, y: 290, w: 60, h: 100, labelX: 300, labelY: 345, orientation: 'middle' },
    { block: 'A-11', x: 330, y: 290, w: 60, h: 100, labelX: 360, labelY: 345, orientation: 'middle' },
    { block: 'A-12', x: 390, y: 290, w: 70, h: 100, labelX: 425, labelY: 345, orientation: 'corner' },
    { block: 'A-13', x: 480, y: 290, w: 60, h: 100, labelX: 510, labelY: 345, orientation: 'middle' },
    { block: 'A-14', x: 540, y: 290, w: 70, h: 100, labelX: 575, labelY: 345, orientation: 'hook' }
  ];

  // Anggrek: B-01 to B-10
  const anggrekPlots = [
    // West Block
    { block: 'B-01', x: 100, y: 90, w: 110, h: 70, labelX: 155, labelY: 130, orientation: 'hook' },
    { block: 'B-02', x: 100, y: 160, w: 110, h: 60, labelX: 155, labelY: 195, orientation: 'middle' },
    { block: 'B-03', x: 100, y: 220, w: 110, h: 60, labelX: 155, labelY: 255, orientation: 'middle' },
    { block: 'B-04', x: 100, y: 280, w: 110, h: 70, labelX: 155, labelY: 320, orientation: 'corner' },

    // East Block
    { block: 'B-05', x: 310, y: 90, w: 110, h: 70, labelX: 365, labelY: 130, orientation: 'hook' },
    { block: 'B-06', x: 310, y: 160, w: 110, h: 60, labelX: 365, labelY: 195, orientation: 'middle' },
    { block: 'B-07', x: 310, y: 220, w: 110, h: 60, labelX: 365, labelY: 255, orientation: 'middle' },
    { block: 'B-08', x: 310, y: 280, w: 110, h: 70, labelX: 365, labelY: 320, orientation: 'corner' },
    { block: 'B-09', x: 310, y: 350, w: 110, h: 60, labelX: 365, labelY: 385, orientation: 'middle' }
  ];

  const renderClusterMelati = () => {
    return (
      <svg viewBox="0 0 800 480" className={`w-full ${hideLegend ? 'max-h-[65vh] object-contain' : 'h-auto'} select-none rounded-2xl border border-gray-200/50 bg-slate-50/50 shadow-inner`}>
        {/* Definitions for gradients */}
        <defs>
          <linearGradient id="grad-available" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="grad-reserved" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="grad-booking" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="grad-kpr_process" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="grad-sold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="grad-unavailable" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e4e4e7" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>
          <linearGradient id="grad-placeholder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f4f4f5" />
            <stop offset="100%" stopColor="#e4e4e7" />
          </linearGradient>
          
          {/* Environment gradients */}
          <linearGradient id="grad-park" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="grad-road" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="grad-pool" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Public Areas & Background Elements */}
        {/* Main Green Landscape */}
        <rect x="0" y="0" width="800" height="480" fill="#f1f5f9" />
        
        {/* Central Park */}
        <rect x="630" y="50" width="130" height="340" rx="16" fill="url(#grad-park)" opacity="0.8" filter="url(#shadow)" />
        <text x="695" y="210" fill="#15803d" className="text-[10px] font-black tracking-widest uppercase" textAnchor="middle" transform="rotate(-90 695 210)">Taman Hijau Melati</text>
        {/* Trees in Park */}
        <circle cx="660" cy="90" r="10" fill="#166534" opacity="0.6" />
        <circle cx="680" cy="110" r="14" fill="#15803d" opacity="0.6" />
        <circle cx="655" cy="130" r="12" fill="#16a34a" opacity="0.7" />
        <circle cx="700" cy="300" r="12" fill="#166534" opacity="0.6" />
        <circle cx="715" cy="330" r="15" fill="#15803d" opacity="0.6" />
        <circle cx="675" cy="340" r="10" fill="#16a34a" opacity="0.7" />

        {/* Main Road "Jl. Melati Utama" */}
        <rect x="50" y="180" width="570" height="80" fill="url(#grad-road)" filter="url(#shadow)" />
        <line x1="50" y1="220" x2="620" y2="220" stroke="#ffffff" strokeWidth="2" strokeDasharray="12 8" opacity="0.7" />
        <text x="335" y="226" fill="#f8fafc" className="text-[11px] font-extrabold tracking-widest uppercase" textAnchor="middle">Jl. Melati Utama</text>

        {/* Security Gate & Entrance (Left Side) */}
        <rect x="0" y="170" width="50" height="100" fill="#475569" opacity="0.9" />
        <text x="25" y="224" fill="#f8fafc" className="text-[9px] font-black uppercase" textAnchor="middle" transform="rotate(-90 25 224)">Gerbang</text>
        <line x1="50" y1="170" x2="50" y2="270" stroke="#f1f5f9" strokeWidth="4" />

        {/* Playground Area (Bottom Left) */}
        <rect x="30" y="320" width="80" height="70" rx="12" fill="#fed7aa" opacity="0.8" />
        <text x="70" y="360" fill="#c2410c" className="text-[9px] font-bold uppercase" textAnchor="middle">Playground</text>
        
        {/* Clubhouse (Top Left) */}
        <rect x="30" y="50" width="80" height="70" rx="12" fill="#bae6fd" opacity="0.8" />
        <text x="70" y="90" fill="#0369a1" className="text-[9px] font-bold uppercase" textAnchor="middle">Clubhouse</text>

        {/* Plot Elements */}
        {melatiPlots.map((plot) => {
          const unit = getUnitInfo(plot.block);
          const style = getPlotStyles(plot.block);
          const isHovered = hoveredUnit?.block_number === plot.block || hoveredPlaceholder === plot.block;
          
          return (
            <g key={plot.block}>
              <rect
                x={plot.x}
                y={plot.y}
                width={plot.w}
                height={plot.h}
                rx="6"
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={isHovered ? 3.5 : 1.5}
                className="transition-all duration-300 ease-in-out"
                style={{ cursor: style.cursor, opacity: style.opacity }}
                onClick={() => handlePlotClick(plot.block)}
                onMouseEnter={() => {
                  if (unit) {
                    setHoveredUnit(unit);
                  } else {
                    setHoveredPlaceholder(plot.block);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredUnit(null);
                  setHoveredPlaceholder(null);
                }}
                filter={isHovered ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' : ''}
              />
              <text
                x={plot.labelX}
                y={plot.labelY}
                fill={isHovered ? '#090d16' : '#4b5563'}
                className="text-xs font-black select-none pointer-events-none"
                textAnchor="middle"
              >
                {plot.block}
              </text>
              {/* Subtle visual dots showing orientation type */}
              {plot.orientation !== 'middle' && (
                <circle 
                  cx={plot.x + 8} 
                  cy={plot.y + 8} 
                  r="3.5" 
                  fill={plot.orientation === 'hook' ? '#f59e0b' : '#3b82f6'} 
                  className="pointer-events-none"
                />
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const renderClusterAnggrek = () => {
    return (
      <svg viewBox="0 0 800 480" className={`w-full ${hideLegend ? 'max-h-[65vh] object-contain' : 'h-auto'} select-none rounded-2xl border border-gray-200/50 bg-slate-50/50 shadow-inner`}>
        <defs>
          <linearGradient id="grad-available" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="grad-reserved" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="grad-booking" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="grad-kpr_process" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="grad-sold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="grad-unavailable" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e4e4e7" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>
          <linearGradient id="grad-placeholder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f4f4f5" />
            <stop offset="100%" stopColor="#e4e4e7" />
          </linearGradient>

          {/* Environment gradients */}
          <linearGradient id="grad-park" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="grad-road-v" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="800" height="480" fill="#f1f5f9" />

        {/* Central Vertical Road "Jl. Anggrek Raya" */}
        <rect x="230" y="0" width="60" height="480" fill="url(#grad-road-v)" filter="url(#shadow)" />
        <line x1="260" y1="0" x2="260" y2="480" stroke="#ffffff" strokeWidth="2" strokeDasharray="12 8" opacity="0.7" />
        
        {/* Rotated text for vertical road */}
        <text x="266" y="240" fill="#f8fafc" className="text-[11px] font-extrabold tracking-widest uppercase" textAnchor="middle" transform="rotate(90 266 240)">Jl. Anggrek Raya</text>

        {/* Public Garden (Bottom Right) */}
        <rect x="450" y="330" width="310" height="110" rx="16" fill="url(#grad-park)" opacity="0.8" filter="url(#shadow)" />
        <text x="605" y="380" fill="#15803d" className="text-[10px] font-black tracking-widest uppercase" textAnchor="middle">Taman Danau Anggrek</text>
        <circle cx="520" cy="370" r="8" fill="#166534" opacity="0.6" />
        <circle cx="540" cy="390" r="12" fill="#15803d" opacity="0.6" />
        <circle cx="690" cy="380" r="10" fill="#16a34a" opacity="0.7" />

        {/* Public Swimming Pool (Top Right) */}
        <rect x="450" y="40" width="310" height="120" rx="16" fill="#bae6fd" opacity="0.8" filter="url(#shadow)" />
        {/* Pool Water */}
        <rect x="470" y="60" width="270" height="80" rx="8" fill="url(#grad-pool)" />
        <text x="605" y="105" fill="#f8fafc" className="text-[10px] font-extrabold tracking-widest uppercase" textAnchor="middle">Kolam Renang Anggrek</text>

        {/* Entrance Gate (Top Side) */}
        <rect x="210" y="0" width="100" height="40" fill="#475569" opacity="0.9" />
        <text x="260" y="24" fill="#f8fafc" className="text-[9px] font-black uppercase" textAnchor="middle">Gerbang Masuk</text>

        {/* Plots */}
        {anggrekPlots.map((plot) => {
          const unit = getUnitInfo(plot.block);
          const style = getPlotStyles(plot.block);
          const isHovered = hoveredUnit?.block_number === plot.block || hoveredPlaceholder === plot.block;
          
          return (
            <g key={plot.block}>
              <rect
                x={plot.x}
                y={plot.y}
                width={plot.w}
                height={plot.h}
                rx="6"
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={isHovered ? 3.5 : 1.5}
                className="transition-all duration-300 ease-in-out"
                style={{ cursor: style.cursor, opacity: style.opacity }}
                onClick={() => handlePlotClick(plot.block)}
                onMouseEnter={() => {
                  if (unit) {
                    setHoveredUnit(unit);
                  } else {
                    setHoveredPlaceholder(plot.block);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredUnit(null);
                  setHoveredPlaceholder(null);
                }}
                filter={isHovered ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' : ''}
              />
              <text
                x={plot.labelX}
                y={plot.labelY}
                fill={isHovered ? '#090d16' : '#4b5563'}
                className="text-xs font-black select-none pointer-events-none"
                textAnchor="middle"
              >
                {plot.block}
              </text>
              {plot.orientation !== 'middle' && (
                <circle 
                  cx={plot.x + 8} 
                  cy={plot.y + 8} 
                  r="3.5" 
                  fill={plot.orientation === 'hook' ? '#f59e0b' : '#3b82f6'} 
                  className="pointer-events-none"
                />
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className={`relative w-full ${hideLegend ? 'h-full flex flex-col justify-center items-center overflow-hidden' : ''}`} onMouseMove={handleMouseMove}>
      {parsedSvgReact ? (
        <div className="relative">
          <svg className="absolute w-0 h-0 pointer-events-none">
            <defs>
              <linearGradient id="grad-available" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
              <linearGradient id="grad-reserved" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
              <linearGradient id="grad-booking" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="grad-kpr_process" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="grad-sold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="grad-unavailable" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e4e4e7" />
                <stop offset="100%" stopColor="#a1a1aa" />
              </linearGradient>
              <linearGradient id="grad-placeholder" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f4f4f5" />
                <stop offset="100%" stopColor="#e4e4e7" />
              </linearGradient>
            </defs>
          </svg>
          {parsedSvgReact}
        </div>
      ) : activeClusterId === 'cls-melati' ? (
        renderClusterMelati()
      ) : (
        renderClusterAnggrek()
      )}

      {/* Floating Rich Tooltip */}
      <AnimatePresence>
        {hoveredUnit && (() => {
          const type = unitTypes.find(t => t.id === hoveredUnit.unit_type_id);
          const linkedProspect = hoveredUnit.reserved_for 
            ? prospects.find(p => p.id === hoveredUnit.reserved_for) 
            : null;
            
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                left: tooltipPos.x,
                top: tooltipPos.y,
                pointerEvents: 'none',
                zIndex: 9999
              }}
              className="w-64 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5 font-sans"
            >
              {type?.photos && type.photos.length > 0 && (
                <div className="w-full h-28 relative rounded-xl overflow-hidden mb-0.5 border border-gray-100">
                  <img 
                    src={type.photos[0]} 
                    alt={type.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <span className="font-black text-base text-slate-900">Kavling {hoveredUnit.block_number}</span>
                <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                  {hoveredUnit.orientation}
                </span>
              </div>
              
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Tipe Unit:</span>
                  <span className="font-bold text-gray-700">{type?.name}</span>
                </div>
                
                {type && (
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Luas Bng/Tnh:</span>
                    <span className="font-semibold">
                      {type.building_area} m² / {type.land_area} m²
                    </span>
                  </div>
                )}

                <div className="flex justify-between mt-1 pt-1.5 border-t border-gray-50">
                  <span className="text-gray-400 font-medium">Harga Jual:</span>
                  <span className="font-black text-blue-600">{formatIDR(hoveredUnit.sell_price)}</span>
                </div>
                
                <div className="flex items-center gap-1.5 mt-2 py-1 px-2.5 rounded-lg border text-[10px] font-bold justify-center bg-white">
                  <span className={`w-2 h-2 rounded-full ${
                    hoveredUnit.status === 'available' && (hoveredUnit as any).construction_status === 'belum_terbangun' ? 'bg-slate-400' :
                    hoveredUnit.status === 'available' && (hoveredUnit as any).construction_status === 'proses_pembangunan' ? 'bg-blue-500' :
                    hoveredUnit.status === 'available' && (hoveredUnit as any).construction_status === 'finishing' ? 'bg-purple-500' :
                    statusConfig[hoveredUnit.status].dot
                  }`}></span>
                  <span className="text-slate-800">
                    {hoveredUnit.status === 'available' && (hoveredUnit as any).construction_status ? (
                      (hoveredUnit as any).construction_status === 'belum_terbangun' ? 'Tersedia (Belum Terbangun)' :
                      (hoveredUnit as any).construction_status === 'proses_pembangunan' ? 'Tersedia (Proses Pembangunan)' :
                      (hoveredUnit as any).construction_status === 'finishing' ? 'Tersedia (Tahap Finishing)' :
                      'Tersedia (Ready)'
                    ) : statusConfig[hoveredUnit.status].label}
                  </span>
                </div>

                {linkedProspect && (
                  <div className="flex flex-col mt-2 pt-2 border-t border-gray-100 gap-0.5 bg-blue-50/50 p-2 rounded-xl border border-blue-100/40">
                    <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Konsumen</span>
                    <span className="font-extrabold text-slate-800 text-[11px]">{linkedProspect.full_name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{linkedProspect.phone}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}

        {hoveredPlaceholder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              left: tooltipPos.x,
              top: tooltipPos.y,
              pointerEvents: 'none',
              zIndex: 9999
            }}
            className="bg-zinc-900/90 backdrop-blur-sm text-white border border-zinc-700/50 rounded-xl shadow-xl px-3 py-2 text-xs font-semibold"
          >
            Kavling {hoveredPlaceholder} (Fase Mendatang)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive visual legend */}
      {!hideLegend && (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Info size={14} className="text-slate-400" />
            Keterangan Status Kavling
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries(statusConfig).map(([key, value]) => {
              const count = units.filter(u => u.cluster_id === activeClusterId && u.status === key).length;
              return (
                <div key={key} className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <span className={`w-3.5 h-3.5 rounded-md ${value.dot} bg-opacity-80 border border-black/5`}></span>
                  <span>{value.label}</span>
                  <span className="text-gray-400 font-normal">({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
