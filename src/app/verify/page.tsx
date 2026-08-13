"use client";

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  FileText, 
  UserCheck, 
  CalendarDays,
  QrCode,
  Upload,
  Camera,
  Search,
  ArrowLeft,
  Loader2,
  Home
} from 'lucide-react';

interface VerificationData {
  doc_type: string;
  doc_number: string;
  status: 'approved' | 'revoked' | 'draft' | 'pending_approval' | 'rejected';
  created_at: string;
  approved_at?: string;
  revoked_at?: string;
  revoked_reason?: string;
  issuer: string;
  approver_final: string;
  cluster_name?: string | null;
}

export default function PublicVerificationPortal() {
  const [tokenInput, setTokenInput] = useState('');
  const [doc, setDoc] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'input' | 'camera' | 'upload'>('input');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  // HTML5 QR Scanner states
  const [isScannerLoaded, setIsScannerLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const qrScannerRef = useRef<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // Read token from URL on mount (client-side only to avoid SSR issues)
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success) setSettings(json.settings);
      })
      .catch(err => console.error(err));

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      if (t) {
        setTokenInput(t);
        handleVerify(t);
      }
    }
  }, []);

  // Cleanup scanner on unmount or mode change
  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, [activeMode]);

  const handleVerify = async (tokenToCheck: string) => {
    const token = (tokenToCheck || tokenInput).trim();
    if (!token) return;

    setIsLoading(true);
    setError(null);
    setDoc(null);

    try {
      const res = await fetch(`/api/documents?token=${token}`);
      const json = await res.json();

      if (json.success) {
        setDoc(json.document);
      } else {
        setError(json.error || 'Token dokumen tidak valid atau tidak ditemukan.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server verifikasi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to extract token from scanned URL or raw string
  const extractToken = (text: string): string => {
    let token = text.trim();
    if (token.includes('/verify/')) {
      const parts = token.split('/verify/');
      token = parts[parts.length - 1];
      token = token.split('?')[0].split('#')[0];
    }
    return token;
  };

  // Start Camera QR Scan using html5-qrcode library
  const startCameraScan = () => {
    if (typeof window === 'undefined' || !(window as any).Html5Qrcode) {
      setScanError('Library scanner belum siap. Silakan muat ulang.');
      return;
    }

    setScanError(null);
    setIsScanning(true);

    try {
      const html5QrCode = new (window as any).Html5Qrcode("camera-reader");
      qrScannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText: string) => {
          // Successfully scanned QR Code
          const token = extractToken(decodedText);
          setTokenInput(token);
          setActiveMode('input');
          stopCameraScan();
          handleVerify(token);
        },
        () => {
          // Silent scan error (polling for QR)
        }
      ).catch((err: any) => {
        console.error("Camera start error:", err);
        setScanError("Kamera tidak dapat diakses. Pastikan izin kamera diberikan.");
        setIsScanning(false);
      });
    } catch (err) {
      setScanError("Inisialisasi scanner gagal.");
      setIsScanning(false);
    }
  };

  // Stop Camera Scan
  const stopCameraScan = () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      qrScannerRef.current.stop().then(() => {
        setIsScanning(false);
        qrScannerRef.current = null;
      }).catch((err: any) => {
        console.error("Stop scanner error:", err);
      });
    } else {
      setIsScanning(false);
    }
  };

  // Handle File Upload (Image or PDF)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setDoc(null);
    setUploadedFileName(file.name);

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        let tokenFound = '';

        // 1. Try pdf.js extraction & canvas QR scan if available
        if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
          try {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullPdfText = '';

            for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullPdfText += ' ' + pageText;

              // Render page to canvas to scan embedded QR code image
              try {
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                  await page.render({ canvasContext: context, viewport }).promise;
                  const dataUrl = canvas.toDataURL('image/png');
                  const blob = await (await fetch(dataUrl)).blob();
                  const pngFile = new File([blob], 'page.png', { type: 'image/png' });

                  if ((window as any).Html5Qrcode) {
                    const html5QrCode = new (window as any).Html5Qrcode("file-reader-dummy");
                    const scannedResult = await html5QrCode.scanFile(pngFile, true);
                    if (scannedResult) {
                      tokenFound = extractToken(scannedResult);
                      if (tokenFound) break;
                    }
                  }
                }
              } catch (qrErr) {
                // Ignore page QR scan error, fall through to text match
              }
            }

            if (!tokenFound && fullPdfText) {
              const urlMatch = fullPdfText.match(/\/verify\/([a-zA-Z0-9_-]+)/);
              const tokenParamMatch = fullPdfText.match(/token=([a-zA-Z0-9_-]+)/);
              const hexUuidMatch = fullPdfText.match(/[a-f0-9]{32}/i);
              const docNumMatch = fullPdfText.match(/(INV|KWT|SUR|DOC)[\/_\-][0-9]{4}[\/_\-][0-9]{2}[\/_\-][0-9]{4}/i);

              if (urlMatch && urlMatch[1]) tokenFound = urlMatch[1];
              else if (tokenParamMatch && tokenParamMatch[1]) tokenFound = tokenParamMatch[1];
              else if (hexUuidMatch && hexUuidMatch[0]) tokenFound = hexUuidMatch[0];
              else if (docNumMatch && docNumMatch[0]) tokenFound = docNumMatch[0];
            }
          } catch (pdfJsErr) {
            console.error("PDFjs parse error:", pdfJsErr);
          }
        }

        // 2. Fallback: Read raw bytes as string if pdf.js did not find token
        if (!tokenFound) {
          const rawText = new TextDecoder('latin1').decode(arrayBuffer);
          const urlMatch = rawText.match(/\/verify\/([a-zA-Z0-9_-]+)/);
          const tokenParamMatch = rawText.match(/token=([a-zA-Z0-9_-]+)/);
          const hexUuidMatch = rawText.match(/[a-f0-9]{32}/i);
          const docNumMatch = rawText.match(/(INV|KWT|SUR|DOC)[\/_\-][0-9]{4}[\/_\-][0-9]{2}[\/_\-][0-9]{4}/i);

          if (urlMatch && urlMatch[1]) tokenFound = urlMatch[1];
          else if (tokenParamMatch && tokenParamMatch[1]) tokenFound = tokenParamMatch[1];
          else if (hexUuidMatch && hexUuidMatch[0]) tokenFound = hexUuidMatch[0];
          else if (docNumMatch && docNumMatch[0]) tokenFound = docNumMatch[0];
        }

        if (tokenFound) {
          const cleanToken = extractToken(tokenFound);
          setTokenInput(cleanToken);
          setActiveMode('input');
          await handleVerify(cleanToken);
        } else {
          setError(`File PDF "${file.name}" tidak memiliki token verifikasi atau QR Code resmi Domus CRM.`);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("PDF Read Error:", err);
        setError("Gagal membaca file PDF. Pastikan file PDF tidak terkunci atau rusak.");
        setIsLoading(false);
      }
    } else {
      // Image upload QR scanning
      if (typeof window === 'undefined' || !(window as any).Html5Qrcode) {
        setError('Library scanner belum siap. Silakan muat ulang.');
        setIsLoading(false);
        return;
      }

      const html5QrCode = new (window as any).Html5Qrcode("file-reader-dummy");
      
      html5QrCode.scanFile(file, true)
        .then((decodedText: string) => {
          const token = extractToken(decodedText);
          setTokenInput(token);
          setActiveMode('input');
          handleVerify(token);
        })
        .catch((err: any) => {
          console.error("QR File Decode Error:", err);
          setError(`Gagal mendeteksi QR Code dari gambar "${file.name}". Pastikan QR Code terlihat jelas.`);
          setIsLoading(false);
        });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* CDN Scripts for html5-qrcode & pdf.js */}
      <Script 
        src="https://unpkg.com/html5-qrcode" 
        strategy="lazyOnload"
        onLoad={() => setIsScannerLoaded(true)}
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" 
        strategy="lazyOnload"
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-lg mx-auto">
        <div className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Logo & Branding */}
          <div className="flex flex-col items-center gap-1.5 border-b border-slate-900 pb-5 text-center">
            {settings?.org_logo ? (
              <img src={settings.org_logo} alt="Logo" className="w-10 h-10 object-cover rounded-xl shadow-lg border border-slate-800" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                {settings?.org_name ? settings.org_name.charAt(0) : 'D'}
              </div>
            )}
            <span className="font-extrabold text-base tracking-widest text-slate-300 mt-2 uppercase">{settings?.org_name || 'PT DOMUS SOMNIA PROPERTI'}</span>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Portal Verifikasi Keabsahan Dokumen</span>
          </div>

          {/* Verification Results Panel (if loaded) */}
          {isLoading ? (
            <div className="flex flex-col gap-3 py-10 items-center justify-center text-center">
              <Loader2 className="animate-spin text-blue-500" size={36} />
              <span className="text-xs text-slate-400 font-medium">Memverifikasi tanda tangan digital dokumen...</span>
            </div>
          ) : doc || error ? (
            <div className="flex flex-col gap-5">
              {/* Back button */}
              <button 
                onClick={() => {
                  setDoc(null);
                  setError(null);
                  setUploadedFileName(null);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 self-start font-bold transition-colors"
              >
                <ArrowLeft size={14} /> Verifikasi Dokumen Lain
              </button>

              {error ? (
                /* NOT FOUND / INVALID STATUS */
                <div className="flex flex-col gap-5 text-center items-center py-4 border border-red-500/20 bg-red-950/10 rounded-2xl p-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
                    <AlertTriangle size={36} className="animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                  <div>
                    <h2 className="text-md font-black text-rose-500 tracking-wider">DOKUMEN TIDAK VALID / PALSU</h2>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                      Kode atau URL token verifikasi tidak dikenal dalam database. Tanda tangan QR Code pada dokumen ini kemungkinan palsu atau telah dimodifikasi secara ilegal.
                    </p>
                  </div>
                </div>
              ) : doc?.status === 'revoked' ? (
                /* REVOKED STATUS */
                <div className="flex flex-col gap-5 text-center items-center py-4 border border-amber-500/20 bg-amber-950/10 rounded-2xl p-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                    <XCircle size={36} />
                  </div>
                  <div>
                    <h2 className="text-md font-black text-amber-500 tracking-wider">DOKUMEN TIDAK BERLAKU</h2>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                      Dokumen ini telah <strong>DICABUT / DIBATALKAN</strong> oleh pihak manajemen.
                    </p>
                    {doc.revoked_reason && (
                      <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 text-left w-full">
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[8px] block mb-1">Alasan Pencabutan:</span>
                        &quot;{doc.revoked_reason}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SUCCESS / VALID STATUS */
                <>
                  <div className="flex flex-col gap-5 text-center items-center py-2">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                      <CheckCircle size={36} className="animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-md font-black text-emerald-500 tracking-wider">✓ DOKUMEN VALID & ASLI</h2>
                      <p className="text-slate-500 text-[10px] font-semibold mt-1">Diterbitkan secara resmi oleh pengembang {settings?.org_name || 'PT Domus Somnia'}.</p>
                      {uploadedFileName && (
                        <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-[10px] font-mono text-blue-300">
                          <FileText size={11} className="text-blue-400" /> File: {uploadedFileName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document Metadata Details Panel */}
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3.5 text-xs text-left">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-slate-500" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Jenis & Nomor Dokumen</span>
                        <span className="font-extrabold text-slate-200">{doc?.doc_type} - {doc?.doc_number}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-slate-500" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Organisasi Penerbit</span>
                        <span className="font-bold text-slate-300">{doc?.issuer}</span>
                      </div>
                    </div>

                    {doc?.cluster_name && (
                      <div className="flex items-center gap-3">
                        <Home size={16} className="text-slate-500" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Proyek Perumahan</span>
                          <span className="font-bold text-slate-300">{doc?.cluster_name}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <CalendarDays size={16} className="text-slate-500" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Tanggal Disetujui</span>
                        <span className="font-bold text-slate-300">
                          {doc?.approved_at ? new Date(doc.approved_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <UserCheck size={16} className="text-slate-500" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Approver Terakhir (Penandatangan)</span>
                        <span className="font-bold text-slate-300">{doc?.approver_final}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 text-center font-semibold leading-relaxed mt-2 border-t border-slate-900 pt-4">
                    * Sesuai regulasi PII (Personal Identifiable Information), isi nominal transaksi dan alamat lengkap pelanggan dirahasiakan pada portal verifikasi publik ini.
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Mode Selector tabs */
            <div className="flex flex-col gap-5">
              <div className="flex border border-slate-800 bg-slate-900/40 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setActiveMode('input')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeMode === 'input' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Search size={14} /> Input Manual
                </button>
                <button
                  onClick={() => setActiveMode('camera')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeMode === 'camera' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera size={14} /> Kamera HP
                </button>
                <button
                  onClick={() => setActiveMode('upload')}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeMode === 'upload' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload size={14} /> Unggah File
                </button>
              </div>

              {/* INPUT MODE */}
              {activeMode === 'input' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5 text-left text-xs font-semibold">
                    <label className="text-slate-400 uppercase tracking-wider text-[9px] font-bold">Masukkan Kode Token Dokumen</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: d8c8942a781b4d8bb8fe11ad50ccfe01"
                        value={tokenInput}
                        onChange={e => setTokenInput(e.target.value)}
                        className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 flex-1 text-slate-100 font-mono text-sm tracking-wide"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleVerify(tokenInput)}
                    disabled={!tokenInput.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle size={15} /> VERIFIKASI SEKARANG
                  </button>
                </div>
              )}

              {/* CAMERA MODE */}
              {activeMode === 'camera' && (
                <div className="flex flex-col gap-4 items-center">
                  <div className="w-full aspect-square max-w-[320px] bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden relative flex items-center justify-center">
                    <div id="camera-reader" className="w-full h-full"></div>
                    {!isScanning && (
                      <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center text-center p-6 bg-slate-950/70 z-10">
                        <Camera size={36} className="text-slate-500" />
                        <span className="text-xs text-slate-300 font-bold">Scan via Kamera Perangkat</span>
                        <p className="text-[10px] text-slate-500 leading-relaxed max-w-[200px]">Arahkan kamera HP ke QR Code yang tertera di sudut kanan bawah dokumen.</p>
                      </div>
                    )}
                  </div>

                  {scanError && (
                    <span className="text-[11px] text-rose-500 font-bold text-center">{scanError}</span>
                  )}

                  {!isScanning ? (
                    <button
                      onClick={startCameraScan}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                    >
                      <Camera size={14} /> Aktifkan Kamera
                    </button>
                  ) : (
                    <button
                      onClick={stopCameraScan}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                    >
                      <XCircle size={14} /> Matikan Kamera
                    </button>
                  )}
                </div>
              )}

              {/* UPLOAD FILE MODE */}
              {activeMode === 'upload' && (
                <div className="flex flex-col gap-4">
                  <div className="w-full border-2 border-dashed border-slate-800 rounded-2xl p-8 hover:bg-slate-900/40 hover:border-blue-500/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative text-center">
                    <input 
                      type="file" 
                      accept="image/*,application/pdf,.pdf" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText size={28} className="text-red-400" />
                      <Upload size={24} className="text-blue-400" />
                    </div>
                    <span className="text-xs text-slate-200 font-bold mt-1">Unggah PDF Dokumen / Foto QR</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-[260px]">
                      Pilih atau seret berkas <strong className="text-slate-300">PDF (.pdf)</strong> asli atau <strong className="text-slate-300">foto/screenshot QR Code (.png, .jpg)</strong> untuk diverifikasi keabsahannya.
                    </p>
                  </div>
                  
                  {/* Dummy reader target for file scan */}
                  <div id="file-reader-dummy" className="hidden"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="py-6 border-t border-slate-950 text-slate-600 text-[10px] font-bold text-center tracking-wider bg-slate-950/20 uppercase">
        {settings?.org_name || 'PT DOMUS SOMNIA PROPERTI'} &copy; {new Date().getFullYear()} · ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}
