"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Move, Check, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImageBase64: string) => void;
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [fileSizeInfo, setFileSizeInfo] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Initialize image when src changes
  useEffect(() => {
    if (imageSrc && isOpen) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        imageRef.current = img;
        setImageSize({ width: img.width, height: img.height });
        setZoom(1);
        setPosition({ x: 0, y: 0 });

        // Calculate rough original size
        const approxKb = Math.round((imageSrc.length * 3) / 4 / 1024);
        setFileSizeInfo(`Ukuran asli: ~${approxKb > 1024 ? (approxKb / 1024).toFixed(1) + ' MB' : approxKb + ' KB'}`);
      };
    }
  }, [imageSrc, isOpen]);

  // Render canvas preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300; // Output canvas resolution (300x300 px)
    canvas.width = size;
    canvas.height = size;

    // Clear background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    // Calculate aspect ratio fill
    const aspect = img.width / img.height;
    let drawW = size;
    let drawH = size;

    if (aspect > 1) {
      drawW = size * aspect;
      drawH = size;
    } else {
      drawW = size;
      drawH = size / aspect;
    }

    // Apply zoom
    drawW *= zoom;
    drawH *= zoom;

    // Center coordinates + user drag offset
    const x = (size - drawW) / 2 + position.x;
    const y = (size - drawH) / 2 + position.y;

    ctx.drawImage(img, x, y, drawW, drawH);
  }, [zoom, position]);

  useEffect(() => {
    if (isOpen) {
      drawPreview();
    }
  }, [isOpen, zoom, position, drawPreview]);

  if (!isOpen || !imageSrc) return null;

  // Mouse Drag Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Drag Event Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Crop & Compress Image Output
  const handleSaveCroppedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export to JPEG with 82% quality (Compresses 3MB -> ~25-45KB)
    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
    
    onCropComplete(compressedDataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Potong & Kompres Foto</h2>
              <p className="text-[11px] text-slate-400">Atur posisi avatar & kompresi otomatis</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas & Crop Overlay Area */}
        <div className="p-6 bg-slate-900/95 flex flex-col items-center justify-center select-none">
          <div 
            className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-purple-500 shadow-2xl shadow-purple-900/50 cursor-grab active:cursor-grabbing group"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas 
              ref={canvasRef} 
              className="w-full h-full object-cover rounded-full pointer-events-none"
            />
            
            {/* Overlay hint */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="bg-slate-900/80 text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                <Move size={12} /> Geser posisi foto
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium mt-3 flex items-center gap-1.5">
            <Move size={12} className="text-purple-400" /> Geser foto untuk menyesuaikan posisi crop
          </p>
        </div>

        {/* Controls Section */}
        <div className="p-5 space-y-4 bg-white">
          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1 text-slate-600">
                <ZoomIn size={14} className="text-purple-600" /> Perbesaran (Zoom)
              </span>
              <span className="text-[11px] font-mono text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                {zoom.toFixed(1)}x
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(1, prev - 0.2))}
                disabled={zoom <= 1}
                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-30 cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut size={16} />
              </button>
              <input 
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                disabled={zoom >= 3}
                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-30 cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title="Reset Posisi & Zoom"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Info Badge */}
          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center justify-between text-xs text-purple-900">
            <div>
              <p className="font-bold text-[11px]">Kompresi Otomatis Aktif</p>
              <p className="text-[10px] text-purple-600/90 mt-0.5">Optimasi HD 300x300px (~20-40KB, sangat cepat dimuat)</p>
            </div>
            {fileSizeInfo && (
              <span className="text-[10px] text-purple-700 font-mono font-medium bg-white px-2 py-1 rounded-md border border-purple-200/60 shadow-2xs">
                {fileSizeInfo}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveCroppedImage}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl transition-all shadow-md shadow-purple-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={15} />
              Terapkan & Kompres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
