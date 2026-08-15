"use client";

import React, { useRef } from 'react';
import { Printer, Download, X, CheckCircle2, Building, ShieldCheck } from 'lucide-react';
import { terbilangRupiah } from '@/lib/terbilang';

interface PrintDocumentModalProps {
  mode: 'kwitansi' | 'spr';
  isOpen: boolean;
  onClose: () => void;
  data: {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    logoUrl?: string;
    // Kwitansi Data
    receiptNo?: string;
    receiptDate?: string;
    payerName?: string;
    amount?: number;
    paymentFor?: string;
    paymentMethod?: string;
    clusterName?: string;
    unitBlock?: string;
    salesName?: string;
    // SPR Data
    sprNumber?: string;
    buyerNik?: string;
    buyerAddress?: string;
    buyerPhone?: string;
    buyerEmail?: string;
    unitType?: string;
    buildingArea?: number;
    landArea?: number;
    totalPrice?: number;
    bookingFee?: number;
    dpTotal?: number;
    kprAmount?: number;
    paymentScheme?: string;
    paymentSchedules?: Array<{ milestone_name: string; due_date: string; amount: number; status: string }>;
  };
}

export default function PrintDocumentModal({ mode, isOpen, onClose, data }: PrintDocumentModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatIDR = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {mode === 'kwitansi' ? 'Dokumen Kwitansi Pembayaran Resmi' : 'Dokumen Surat Pemesanan Rumah (SPR)'}
              </h3>
              <p className="text-[11px] text-slate-400">Siap untuk dicetak atau diunduh sebagai PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer size={15} /> Cetak / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 sm:p-12 overflow-y-auto max-h-[80vh] print:max-h-none print:p-0 print:overflow-visible bg-white text-left font-sans">
          <div ref={printRef} className="space-y-6 max-w-3xl mx-auto print:max-w-full">

            {/* KWITANSI TEMPLATE */}
            {mode === 'kwitansi' && (
              <div className="border-2 border-slate-800 p-8 rounded-2xl relative space-y-6 print:border-slate-900 print:p-6 print:rounded-none">
                {/* Header Kop Surat */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    {data.logoUrl ? (
                      <img src={data.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-purple-700 text-white font-black text-xl flex items-center justify-center">
                        D
                      </div>
                    )}
                    <div>
                      <h2 className="font-black text-lg text-slate-900 uppercase tracking-tight">
                        {data.companyName || 'PT DOMUS SOMNIA PRATAMA'}
                      </h2>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {data.companyAddress || 'Jl. Raya Developer Perumahan No. 88, Jakarta'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold">Telp: {data.companyPhone || '(021) 555-0199'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-lg inline-block">
                      KWITANSI
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-2">No: <strong>{data.receiptNo || 'KW-2026-001'}</strong></p>
                    <p className="text-[11px] text-slate-500 font-medium">Tgl: {data.receiptDate || todayStr}</p>
                  </div>
                </div>

                {/* Body Details */}
                <div className="space-y-4 text-xs font-medium text-slate-800">
                  <div className="grid grid-cols-4 gap-2 items-baseline">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Telah Diterima Dari</span>
                    <span className="col-span-3 font-extrabold text-slate-900 text-sm border-b border-dotted border-slate-400 pb-1">
                      : {data.payerName || '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 items-baseline">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Uang Sejumlah</span>
                    <span className="col-span-3 font-bold text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-100 italic text-xs leading-relaxed">
                      " {terbilangRupiah(data.amount || 0)} "
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 items-baseline">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Untuk Pembayaran</span>
                    <span className="col-span-3 font-semibold text-slate-800 border-b border-dotted border-slate-400 pb-1">
                      : {data.paymentFor || 'Pembayaran Angsuran DP Unit'} Perumahan <strong>{data.clusterName}</strong> (Blok {data.unitBlock})
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 items-baseline">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Metode / Status</span>
                    <span className="col-span-3 font-bold text-emerald-700">
                      : {data.paymentMethod || 'Transfer / Tunai'} (Status: LUNAS)
                    </span>
                  </div>
                </div>

                {/* Amount Box & Signature */}
                <div className="pt-6 flex justify-between items-end border-t border-slate-200">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col justify-center border border-slate-800 min-w-[220px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pembayaran</span>
                    <span className="text-xl font-black text-emerald-400 mt-0.5">
                      {formatIDR(data.amount)}
                    </span>
                  </div>

                  <div className="text-center space-y-12">
                    <p className="text-[11px] font-bold text-slate-600">Diterima oleh Kasir / Keuangan,</p>
                    <div className="border-b border-slate-800 font-extrabold text-xs text-slate-900 pb-1 min-w-[160px]">
                      ( {data.salesName || 'Bagian Keuangan'} )
                    </div>
                  </div>
                </div>

                {/* Footer Stamp note */}
                <div className="text-[9.5px] text-slate-400 italic text-center pt-2">
                  * Kwitansi ini sah sebagai bukti pembayaran yang diterbitkan resmi oleh sistem {data.companyName || 'Domus Somnia'}.
                </div>
              </div>
            )}

            {/* SPR (SURAT PEMESANAN RUMAH) TEMPLATE */}
            {mode === 'spr' && (
              <div className="border-2 border-slate-800 p-8 rounded-2xl relative space-y-6 print:border-slate-900 print:p-6 print:rounded-none">
                {/* Header Kop Surat */}
                <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    {data.logoUrl ? (
                      <img src={data.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-purple-700 text-white font-black text-lg flex items-center justify-center">
                        D
                      </div>
                    )}
                    <div>
                      <h2 className="font-black text-base text-slate-900 uppercase">
                        {data.companyName || 'PT DOMUS SOMNIA PRATAMA'}
                      </h2>
                      <p className="text-[10.5px] text-slate-600 font-medium">Developer & Real Estate Management</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h1 className="font-black text-base text-purple-900 uppercase tracking-tight">SURAT PEMESANAN RUMAH (SPR)</h1>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">No: <strong>{data.sprNumber || 'SPR-2026-0815'}</strong></p>
                  </div>
                </div>

                {/* Section 1: Data Pemesan */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider bg-slate-100 p-2 rounded-lg">
                    I. IDENTITAS PEMESAN (KONSUMEN)
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs p-2">
                    <div><span className="text-slate-500 font-medium">Nama Pemesan:</span> <strong className="text-slate-900">{data.payerName}</strong></div>
                    <div><span className="text-slate-500 font-medium">NIK KTP:</span> <strong className="text-slate-900">{data.buyerNik || '32760815000293'}</strong></div>
                    <div><span className="text-slate-500 font-medium">No. Telepon / WA:</span> <strong className="text-slate-900">{data.buyerPhone}</strong></div>
                    <div><span className="text-slate-500 font-medium">Email:</span> <strong className="text-slate-900">{data.buyerEmail || '-'}</strong></div>
                  </div>
                </div>

                {/* Section 2: Spesifikasi Properti */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider bg-slate-100 p-2 rounded-lg">
                    II. SPESIFIKASI UNIT RUMAH / KAVLING
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs p-2">
                    <div><span className="text-slate-500 font-medium">Nama Perumahan:</span> <strong className="text-slate-900">{data.clusterName}</strong></div>
                    <div><span className="text-slate-500 font-medium">Blok / Nomor Unit:</span> <strong className="text-purple-700 text-sm font-black">{data.unitBlock}</strong></div>
                    <div><span className="text-slate-500 font-medium">Tipe Bangunan:</span> <strong className="text-slate-900">{data.unitType}</strong></div>
                    <div><span className="text-slate-500 font-medium">Luas Bangunan / Tanah:</span> <strong className="text-slate-900">{data.buildingArea || 36} m² / {data.landArea || 72} m²</strong></div>
                  </div>
                </div>

                {/* Section 3: Skema & Harga */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider bg-slate-100 p-2 rounded-lg">
                    III. RINCIAN HARGA & SKEMA PEMBAYARAN
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="p-3 bg-slate-50 flex justify-between font-bold border-b border-slate-200">
                      <span>Total Harga Kesepakatan (Inc. Pajak):</span>
                      <span className="font-black text-sm text-slate-900">{formatIDR(data.totalPrice)}</span>
                    </div>
                    <div className="p-3 grid grid-cols-3 gap-2 text-center bg-white">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Uang Tanda Jadi (UTJ)</span>
                        <span className="font-bold text-slate-900">{formatIDR(data.bookingFee)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Uang Muka (DP)</span>
                        <span className="font-bold text-slate-900">{formatIDR(data.dpTotal)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Sisa Pelunasan / KPR</span>
                        <span className="font-bold text-purple-700">{formatIDR(data.kprAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 grid grid-cols-3 gap-4 text-center border-t border-slate-200 text-xs">
                  <div className="space-y-12">
                    <p className="font-bold text-slate-700">Pemesan (Konsumen),</p>
                    <p className="font-extrabold text-slate-900 border-b border-slate-800 pb-1 inline-block min-w-[140px]">
                      {data.payerName}
                    </p>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold text-slate-700">Sales Executive,</p>
                    <p className="font-extrabold text-slate-900 border-b border-slate-800 pb-1 inline-block min-w-[140px]">
                      {data.salesName || 'Marketing'}
                    </p>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold text-slate-700">Disetujui Developer,</p>
                    <p className="font-extrabold text-slate-900 border-b border-slate-800 pb-1 inline-block min-w-[140px]">
                      Direktur Utama
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
