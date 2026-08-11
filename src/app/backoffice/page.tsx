"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useCrudModal } from '@/context/CrudModalContext';
import { 
  Settings, 
  Users, 
  MapPin, 
  ShieldCheck, 
  Check, 
  FileText,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Edit3,
  ChevronDown,
  Type,
  AlignLeft,
  Minus,
  Space,
  Table,
  PenLine,
  QrCode,
  Hash,
  X,
  Copy,
  Star,
  Lock,
  LayoutTemplate,
  Home,
  Building2,
} from 'lucide-react';

import { DocumentTemplate, DocumentTemplateBlock, TemplateBlockType, Employee } from '@/lib/db';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  employee_id: string;
  annual_leave_balance: number;
  is_active: boolean;
  accessible_clusters?: string[];
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  created_at: string;
}

// ─── Block Palette Definition ─────────────────────────────────────────────────

const BLOCK_PALETTE: { type: TemplateBlockType; label: string; icon: React.ReactNode; desc: string; default: Partial<DocumentTemplateBlock> }[] = [
  { type: 'heading',    label: 'Heading',      icon: <Type size={14} />,       desc: 'Judul besar bold', default: { content: 'Judul Dokumen', size: 'xl', bold: true, align: 'center' } },
  { type: 'paragraph',  label: 'Paragraf',     icon: <AlignLeft size={14} />,  desc: 'Teks statis', default: { content: 'Tulis konten paragraf di sini...' } },
  { type: 'field',      label: 'Field Statis', icon: <Hash size={14} />,       desc: 'Label & nilai tetap', default: { label: 'Label', value: 'Nilai' } },
  { type: 'data_field', label: 'Field Data',   icon: <Edit3 size={14} />,      desc: 'Variabel merge {{key}}', default: { variable_key: 'nama_field', variable_label: 'Nama Field', variable_required: true } },
  { type: 'table',      label: 'Tabel',        icon: <Table size={14} />,      desc: 'Tabel multi-kolom', default: { table_headers: ['Kolom 1', 'Kolom 2', 'Kolom 3'], table_rows: 3 } },
  { type: 'divider',    label: 'Divider',      icon: <Minus size={14} />,      desc: 'Garis pemisah', default: {} },
  { type: 'spacer',     label: 'Spacer',       icon: <Space size={14} />,      desc: 'Ruang kosong', default: {} },
  { type: 'signature',  label: 'Tanda Tangan', icon: <PenLine size={14} />,    desc: 'Blok ttd & nama', default: { align: 'right', label: 'Hormat Kami,' } },
  { type: 'qr',         label: 'QR Code',      icon: <QrCode size={14} />,     desc: 'Kode QR verifikasi', default: {} },
];

// ─── Block Preview Renderer ───────────────────────────────────────────────────

function BlockPreview({ block }: { block: DocumentTemplateBlock }) {
  const textAlign = block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left';
  const textSize = block.size === 'xl' ? 'text-xl' : block.size === 'lg' ? 'text-lg' : block.size === 'sm' ? 'text-xs' : 'text-sm';

  switch (block.type) {
    case 'heading':
      return <p className={`${textAlign} ${textSize} ${block.bold ? 'font-extrabold' : 'font-semibold'} text-gray-900 tracking-tight`}>{block.content || 'JUDUL DOKUMEN'}</p>;
    case 'paragraph':
      return <p className={`${textAlign} text-xs text-gray-600 leading-relaxed`}>{block.content || 'Teks paragraf...'}</p>;
    case 'field':
      return (
        <div className="flex gap-2 text-xs">
          <span className="font-bold text-gray-700 min-w-[120px]">{block.label || 'Label'}:</span>
          <span className="text-gray-600">{block.value || 'Nilai'}</span>
        </div>
      );
    case 'data_field':
      return (
        <div className="flex gap-2 text-xs">
          <span className="font-bold text-gray-700 min-w-[120px]">{block.variable_label || block.variable_key || 'Field'}:</span>
          <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 rounded px-1.5 py-0.5 font-mono text-[10px]">{`{{${block.variable_key || 'key'}}}`}</span>
          {block.variable_required && <span className="text-red-400 text-[10px]">*wajib</span>}
        </div>
      );
    case 'table':
      return (
        <div className="overflow-hidden rounded border border-gray-200 text-[10px]">
          <div className="grid bg-gray-100" style={{ gridTemplateColumns: `repeat(${block.table_headers?.length || 3}, 1fr)` }}>
            {(block.table_headers || ['Kolom 1', 'Kolom 2', 'Kolom 3']).map((h, i) => (
              <div key={i} className="border-r border-gray-200 last:border-0 px-2 py-1 font-bold text-gray-600 uppercase tracking-wide">{h}</div>
            ))}
          </div>
          {Array.from({ length: Math.min(block.table_rows || 2, 2) }).map((_, i) => (
            <div key={i} className="grid border-t border-gray-200" style={{ gridTemplateColumns: `repeat(${block.table_headers?.length || 3}, 1fr)` }}>
              {(block.table_headers || ['', '', '']).map((_, j) => (
                <div key={j} className="border-r border-gray-100 last:border-0 px-2 py-1.5 text-gray-300">—</div>
              ))}
            </div>
          ))}
        </div>
      );
    case 'divider':
      return <hr className="border-t border-gray-300" />;
    case 'spacer':
      return <div className="h-4" />;
    case 'signature':
      return (
        <div className={`flex flex-col gap-1 ${block.align === 'right' ? 'items-end' : 'items-start'}`}>
          <span className="text-xs text-gray-600">{block.label || 'Hormat Kami,'}</span>
          <div className="w-24 h-10 border-b border-gray-400 mt-3" />
          <span className="text-xs font-bold text-gray-700">( Nama & Jabatan )</span>
        </div>
      );
    case 'qr':
      return (
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
            <QrCode size={24} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wide">Kode Verifikasi</p>
            <p className="text-[9px] text-gray-400 font-mono">scan QR untuk verifikasi dokumen</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

// ─── Block Editor ─────────────────────────────────────────────────────────────

function BlockEditor({ block, onChange, onDelete }: {
  block: DocumentTemplateBlock;
  onChange: (updated: DocumentTemplateBlock) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const palEntry = BLOCK_PALETTE.find(p => p.type === block.type);

  const inp = (field: keyof DocumentTemplateBlock, label: string, type = 'text', placeholder = '') => (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={(block as any)[field] || ''}
        placeholder={placeholder}
        onChange={e => onChange({ ...block, [field]: type === 'number' ? Number(e.target.value) : e.target.value })}
        className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </div>
  );

  const sel = (field: keyof DocumentTemplateBlock, label: string, options: [string, string][]) => (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <select
        value={(block as any)[field] || ''}
        onChange={e => onChange({ ...block, [field]: e.target.value })}
        className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Block Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setOpen(o => !o)}>
        <GripVertical size={14} className="text-gray-300 cursor-grab" />
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
          {palEntry?.icon}
          {palEntry?.label || block.type}
        </span>
        <span className="text-xs text-gray-500 flex-1 truncate">{block.content || block.variable_label || block.label || palEntry?.desc}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Block Controls (collapsed by default) */}
      {open && (
        <div className="px-3 py-3 flex flex-col gap-2 bg-white">
          {/* Preview */}
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3">
            <BlockPreview block={block} />
          </div>

          {/* Type-specific controls */}
          <div className="grid grid-cols-2 gap-2">
            {(block.type === 'heading' || block.type === 'paragraph') && (
              <>
                <div className="col-span-2">{inp('content', 'Konten Teks', 'text', 'Tulis teks...')}</div>
                {block.type === 'heading' && (
                  <>
                    {sel('align', 'Alignment', [['left','Kiri'],['center','Tengah'],['right','Kanan']])}
                    {sel('size', 'Ukuran', [['sm','Kecil'],['base','Normal'],['lg','Besar'],['xl','Sangat Besar']])}
                    <div className="flex items-center gap-1.5 col-span-2">
                      <input type="checkbox" checked={!!block.bold} onChange={e => onChange({ ...block, bold: e.target.checked })} id={`bold-${block.id}`} className="rounded" />
                      <label htmlFor={`bold-${block.id}`} className="text-xs text-gray-600 font-semibold">Bold / Tebal</label>
                    </div>
                  </>
                )}
              </>
            )}
            {block.type === 'field' && (
              <>
                {inp('label', 'Label')}
                {inp('value', 'Nilai')}
              </>
            )}
            {block.type === 'data_field' && (
              <>
                {inp('variable_key', 'Variable Key', 'text', 'nama_variabel')}
                {inp('variable_label', 'Label Form', 'text', 'Nama Field')}
                <div className="flex items-center gap-1.5 col-span-2">
                  <input type="checkbox" checked={!!block.variable_required} onChange={e => onChange({ ...block, variable_required: e.target.checked })} id={`req-${block.id}`} className="rounded" />
                  <label htmlFor={`req-${block.id}`} className="text-xs text-gray-600 font-semibold">Wajib diisi</label>
                </div>
              </>
            )}
            {block.type === 'table' && (
              <>
                <div className="col-span-2">{inp('table_headers', 'Header Kolom (pisah koma)', 'text', 'Kolom 1, Kolom 2')}</div>
                {inp('table_rows', 'Jumlah Baris Contoh', 'number', '3')}
              </>
            )}
            {block.type === 'signature' && (
              <>
                {inp('label', 'Label Atas TTD', 'text', 'Hormat Kami,')}
                {sel('align', 'Posisi', [['left','Kiri'],['right','Kanan']])}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Template Builder Panel ───────────────────────────────────────────────────

function TemplateBuilder({ 
  template, 
  onSave, 
  onCancel 
}: { 
  template: Partial<DocumentTemplate>; 
  onSave: (t: DocumentTemplate) => void; 
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [tpl, setTpl] = useState<DocumentTemplate>({
    id: template.id || ('tpl-' + Math.random().toString(36).substr(2, 9)),
    name: template.name || '',
    description: template.description || '',
    doc_type_key: template.doc_type_key || '',
    prefix: template.prefix || '',
    is_builtin: template.is_builtin || false,
    approval_chain_roles: template.approval_chain_roles || ['manager'],
    blocks: template.blocks || [],
    paper_size: template.paper_size || 'A4',
    created_by: template.created_by || user?.id || 'usr-admin',
    created_at: template.created_at || new Date().toISOString(),
  });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragSrcIdx = useRef<number | null>(null);

  const addBlock = (palType: typeof BLOCK_PALETTE[0]) => {
    const newBlock: DocumentTemplateBlock = {
      id: 'blk-' + Math.random().toString(36).substr(2, 9),
      type: palType.type,
      ...palType.default
    };
    setTpl(t => ({ ...t, blocks: [...t.blocks, newBlock] }));
  };

  const updateBlock = (idx: number, updated: DocumentTemplateBlock) => {
    const blocks = [...tpl.blocks];
    blocks[idx] = updated;
    setTpl(t => ({ ...t, blocks }));
  };

  const deleteBlock = (idx: number) => {
    const blocks = tpl.blocks.filter((_, i) => i !== idx);
    setTpl(t => ({ ...t, blocks }));
  };

  // Drag & Drop reorder & add from palette
  const onDragStart = (idx: number) => { dragSrcIdx.current = idx; };
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  
  const onDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (dataStr.startsWith('new-block:')) {
      const blockType = dataStr.replace('new-block:', '') as TemplateBlockType;
      const palType = BLOCK_PALETTE.find(p => p.type === blockType);
      if (palType) {
        const newBlock: DocumentTemplateBlock = {
          id: 'blk-' + Math.random().toString(36).substr(2, 9),
          type: palType.type,
          ...palType.default
        };
        const blocks = [...tpl.blocks];
        blocks.splice(idx, 0, newBlock);
        setTpl(t => ({ ...t, blocks }));
      }
    } else if (dragSrcIdx.current !== null) {
      if (dragSrcIdx.current === idx) return;
      const blocks = [...tpl.blocks];
      const [moved] = blocks.splice(dragSrcIdx.current, 1);
      blocks.splice(idx, 0, moved);
      setTpl(t => ({ ...t, blocks }));
    }
    dragSrcIdx.current = null;
    setDragOverIdx(null);
  };

  const handleSave = async () => {
    if (!tpl.name || !tpl.doc_type_key || !tpl.prefix) {
      alert('Nama template, kode tipe dokumen, dan prefix wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_template', actor_id: user?.id || 'usr-admin', template: tpl })
      });
      const json = await res.json();
      if (json.success) {
        onSave(tpl);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const chainRoles = tpl.approval_chain_roles.join(', ');

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Builder Top Bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <X size={16} />
        </button>
        <div className="flex-1">
          <input
            value={tpl.name}
            onChange={e => setTpl(t => ({ ...t, name: e.target.value }))}
            placeholder="Nama Template Dokumen..."
            className="text-base font-extrabold text-gray-900 bg-transparent border-none outline-none w-full placeholder-gray-300 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={() => setShowPreview(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showPreview ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Eye size={14} /> Preview A4
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={14} />
          {saving ? 'Menyimpan...' : 'Simpan Template'}
        </button>
      </div>

      <div className={`flex flex-1 gap-0 overflow-hidden ${showPreview ? 'flex-row' : 'flex-col'}`}>

        {/* ── Left: Metadata + Block Editor ── */}
        <div className={`flex flex-col gap-0 overflow-y-auto ${showPreview ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
          {/* Metadata Row */}
          <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-200">
            {tpl.is_builtin && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-3">
                <Star size={11} className="text-amber-500" /> Ini adalah template bawaan sistem. Anda dapat mengedit struktur dan konfigurasinya.
              </div>
            )}
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kode Tipe Dokumen *</label>
                <input
                  value={tpl.doc_type_key}
                  onChange={e => setTpl(t => ({ ...t, doc_type_key: e.target.value.toUpperCase() }))}
                  placeholder="cth: PKS"
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono uppercase disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Prefix Nomor *</label>
                <input
                  value={tpl.prefix}
                  onChange={e => setTpl(t => ({ ...t, prefix: e.target.value.toUpperCase() }))}
                  placeholder="cth: PKS"
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono uppercase disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Rantai Approval (role, pisah koma)</label>
                <input
                  value={chainRoles}
                  onChange={e => setTpl(t => ({ ...t, approval_chain_roles: e.target.value.split(',').map(r => r.trim()).filter(Boolean) }))}
                  placeholder="manager, admin"
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Ukuran Kertas</label>
                <select
                  value={tpl.paper_size || 'A4'}
                  onChange={e => setTpl(t => ({ ...t, paper_size: e.target.value as any }))}
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="Letter">Letter (8.5 x 11 in)</option>
                  <option value="Legal">Legal (8.5 x 14 in)</option>
                  <option value="F4">F4 / Folio (8.5 x 13 in)</option>
                </select>
              </div>
            </div>
            <div className="mt-2">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Deskripsi (opsional)</label>
              <input
                value={tpl.description || ''}
                onChange={e => setTpl(t => ({ ...t, description: e.target.value }))}
                placeholder="Keterangan singkat template..."
                className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Block Palette */}
          <div className="px-5 py-3 border-b border-gray-200 bg-white">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tambah / Seret Blok</p>
            <div className="flex flex-wrap gap-1.5">
              {BLOCK_PALETTE.map(p => (
                <button
                  key={p.type}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', `new-block:${p.type}`);
                  }}
                  onClick={() => addBlock(p)}
                  title={p.desc}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all bg-white text-gray-600 cursor-grab active:cursor-grabbing"
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Block Canvas */}
          <div 
            className="px-5 py-4 flex flex-col gap-2 min-h-[400px]"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const dataStr = e.dataTransfer.getData('text/plain');
              if (dataStr.startsWith('new-block:')) {
                const blockType = dataStr.replace('new-block:', '') as TemplateBlockType;
                const palType = BLOCK_PALETTE.find(p => p.type === blockType);
                if (palType) {
                  addBlock(palType);
                }
              }
            }}
          >
            {tpl.blocks.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-xl">
                <LayoutTemplate size={28} className="mx-auto mb-2 opacity-40" />
                Belum ada blok. Klik tombol di atas atau seret blok ke sini.
              </div>
            )}
            {tpl.blocks.map((block, idx) => (
              <div
                key={block.id}
                draggable={true}
                onDragStart={() => onDragStart(idx)}
                onDragOver={e => onDragOver(e, idx)}
                onDrop={e => onDrop(e, idx)}
                onDragLeave={() => setDragOverIdx(null)}
                className={`transition-all ${dragOverIdx === idx ? 'ring-2 ring-indigo-400 ring-offset-1 rounded-xl' : ''}`}
              >
                <BlockEditor
                  block={block}
                  onChange={u => updateBlock(idx, u)}
                  onDelete={() => deleteBlock(idx)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: A4 Live Preview ── */}
        {showPreview && (
          <div className="w-1/2 overflow-y-auto bg-gray-200 flex flex-col items-center py-6 px-4">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-3">Preview — {tpl.name || 'Untitled'} ({tpl.paper_size || 'A4'})</p>
            <div 
              className="bg-white shadow-xl transition-all duration-300" 
              style={{ 
                width: tpl.paper_size === 'Letter' ? '612px' : tpl.paper_size === 'Legal' ? '612px' : tpl.paper_size === 'F4' ? '612px' : '595px', 
                minHeight: tpl.paper_size === 'Letter' ? '792px' : tpl.paper_size === 'Legal' ? '1008px' : tpl.paper_size === 'F4' ? '936px' : '842px', 
                padding: '48px 56px', 
                fontFamily: "'Google Sans', sans-serif" 
              }}
            >
              {/* Letterhead */}
              <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-6">
                <div>
                  <p className="font-extrabold text-sm text-gray-900">PT Domus Somnia Properti</p>
                  <p className="text-[10px] text-gray-500">Jl. Raya Perumahan No. 1, Bandung</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">No. Dokumen:</p>
                  <p className="font-bold text-xs text-gray-900">{tpl.prefix || 'DOC'}/2026/01/0001</p>
                </div>
              </div>

              {/* Blocks */}
              <div className="flex flex-col gap-3">
                {tpl.blocks.map(block => (
                  <div key={block.id}>
                    <BlockPreview block={block} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Backoffice Page ─────────────────────────────────────────────────────

export default function BackofficePage() {
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useCrudModal();
  
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'gps' | 'audit' | 'templates' | 'properties'>('company');

  // Company Profile States
  const [orgName, setOrgName] = useState('');
  const [orgLogo, setOrgLogo] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgBankAccount, setOrgBankAccount] = useState('');
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companySaveSuccess, setCompanySaveSuccess] = useState('');
  
  const [usersList, setUsersList] = useState<User[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [selectedUserForAccess, setSelectedUserForAccess] = useState<User | null>(null);
  const [tempSelectedClusters, setTempSelectedClusters] = useState<string[]>([]);
  const [tempRole, setTempRole] = useState<string>('staff');
  const [tempDepartment, setTempDepartment] = useState<string>('');
  const [tempName, setTempName] = useState<string>('');
  const [tempEmployeeId, setTempEmployeeId] = useState<string>('');
  const [tempLeaveBalance, setTempLeaveBalance] = useState<number>(12);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empIdString, setEmpIdString] = useState('');
  const [empLeaveBalance, setEmpLeaveBalance] = useState(12);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [officeSettings, setOfficeSettings] = useState<any>(null);
  
  // GPS Config fields
  const [officeName, setOfficeName] = useState('');
  const [officeLat, setOfficeLat] = useState(0);
  const [officeLng, setOfficeLng] = useState(0);
  const [officeRadius, setOfficeRadius] = useState(100);

  // Policy Config fields
  const [workHoursStart, setWorkHoursStart] = useState('09:00');
  const [workHoursEnd, setWorkHoursEnd] = useState('18:00');
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState(15);
  const [permissionTypes, setPermissionTypes] = useState<any[]>([]);
  const [newPermissionName, setNewPermissionName] = useState('');
  const [newPermissionRequiresAttachment, setNewPermissionRequiresAttachment] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Template state
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Partial<DocumentTemplate> | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Property Management States
  const [clusters, setClusters] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [unitTypes, setUnitTypes] = useState<any[]>([]);
  
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [isAddingCluster, setIsAddingCluster] = useState(false);
  const [isAddingUnitType, setIsAddingUnitType] = useState(false);
  const [isAddingUnit, setIsAddingUnit] = useState(false);

  const [isEditingClusterId, setIsEditingClusterId] = useState<string>('');
  const [isEditingUnitTypeId, setIsEditingUnitTypeId] = useState<string>('');
  const [isEditingUnitId, setIsEditingUnitId] = useState<string>('');

  // Cluster Form State
  const [clName, setClName] = useState('');
  const [clLocation, setClLocation] = useState('');
  const [clDesc, setClDesc] = useState('');
  const [clStatus, setClStatus] = useState<'pre_launch' | 'active' | 'sold_out'>('active');
  const [clSvgContent, setClSvgContent] = useState('');
  const [selectedSvgFileName, setSelectedSvgFileName] = useState('');
  const [clLogo, setClLogo] = useState('');
  const [clAddress, setClAddress] = useState('');
  const [clEmail, setClEmail] = useState('');
  const [clPhone, setClPhone] = useState('');
  const [clBankAccount, setClBankAccount] = useState('');

  // UnitType Form State
  const [utName, setUtName] = useState('');
  const [utBuildingArea, setUtBuildingArea] = useState('');
  const [utLandArea, setUtLandArea] = useState('');
  const [utBasePrice, setUtBasePrice] = useState('');
  const [utBedrooms, setUtBedrooms] = useState('2');
  const [utBathrooms, setUtBathrooms] = useState('1');
  const [utHasCarport, setUtHasCarport] = useState(true);
  const [utDesc, setUtDesc] = useState('');

  // Unit Form State
  const [uBlockNumber, setUBlockNumber] = useState('');
  const [uUnitTypeId, setUUnitTypeId] = useState('');
  const [uSellPrice, setUSellPrice] = useState('');
  const [uOrientation, setUOrientation] = useState<'hook' | 'middle' | 'corner'>('middle');
  const [uStatus, setUStatus] = useState<string>('available');
  const [uNotes, setUNotes] = useState('');
  const [uConstructionStatus, setUConstructionStatus] = useState<string>('belum_terbangun');
  const [uLegalStatus, setULegalStatus] = useState<'shm' | 'shgb' | 'ajb' | 'other'>('shm');
  const [uPbbStatus, setUPbbStatus] = useState<'paid' | 'unpaid' | 'not_registered'>('not_registered');
  const [uLandDocuments, setULandDocuments] = useState<any[]>([]);
  const [uTaxDocuments, setUTaxDocuments] = useState<any[]>([]);
  const [uPbbNop, setUPbbNop] = useState('');
  const [uPbbOwnerName, setUPbbOwnerName] = useState('');

  const fetchBackofficeData = async () => {
    try {
      const res = await fetch('/api/db');
      const json = await res.json();
      if (json.success) {
        setUsersList(json.data.users || []);
        setEmployeesList(json.data.employees || []);
        setAuditLogs(json.data.auditLogs || []);
        setClusters(json.data.clusters || []);
        setUnits(json.data.units || []);
        setUnitTypes(json.data.unitTypes || []);
        
        const settings = json.data.settings;
        if (settings) {
          setLateThresholdMinutes(settings.late_threshold_minutes ?? 15);
          setWorkHoursStart(settings.work_hours_start ?? '09:00');
          setWorkHoursEnd(settings.work_hours_end ?? '18:00');
          setPermissionTypes(settings.permission_types ?? []);
          
          setOrgName(settings.org_name ?? 'PT Domus Somnia Properti');
          setOrgLogo(settings.org_logo ?? '');
          setOrgAddress(settings.org_address ?? 'Grand Surapati Core Blok B-03, Jl. Phh. Mustofa No.39, Bandung');
          setOrgEmail(settings.org_email ?? 'info@domus.com');
          setOrgPhone(settings.org_phone ?? '(022) 1234567');
          setOrgBankAccount(settings.org_bank_account ?? '131-00-1234567-8 a/n PT Domus Somnia Properti');
          
          const office = settings.office_locations?.[0];
          setOfficeSettings(office);
          if (office) {
            setOfficeName(office.name);
            setOfficeLat(office.latitude);
            setOfficeLng(office.longitude);
            setOfficeRadius(office.radius_meters);
          }
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/documents?templates=1');
      const json = await res.json();
      if (json.success) setTemplates(json.templates || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingTemplates(false);
  };

  useEffect(() => {
    fetchBackofficeData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'templates') {
        setActiveTab('templates');
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'templates' && templates.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit');
      if (editId) {
        const found = templates.find(t => t.id === editId);
        if (found) {
          setEditingTemplate(found);
        }
      }
    }
  }, [activeTab, templates]);

  const handleSaveSettings = async () => {
    try {
      const office = {
        id: officeSettings?.id || 'loc-main',
        name: officeName,
        latitude: officeLat,
        longitude: officeLng,
        radius_meters: officeRadius,
        is_active: true
      };

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_settings',
          actor_id: user?.id,
          office_locations: [office],
          late_threshold_minutes: Number(lateThresholdMinutes),
          work_hours_start: workHoursStart,
          work_hours_end: workHoursEnd,
          permission_types: permissionTypes
        })
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccess('Pengaturan absensi & geofencing berhasil disimpan!');
        const message = `Admin *${user?.name}* memperbarui kebijakan absensi:
- Jam Kerja: *${workHoursStart} - ${workHoursEnd}*
- Toleransi Terlambat: *${lateThresholdMinutes} menit*
- Radius GPS: *${officeRadius} meter*
- Jumlah Tipe Izin: *${permissionTypes.length} tipe*`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));
        setTimeout(() => setSaveSuccess(''), 3000);
        fetchBackofficeData();
      } else {
        alert(json.error);
      }
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan pengaturan.');
    }
  };

  const handleSaveCompanySettings = async () => {
    setIsSavingCompany(true);
    setCompanySaveSuccess('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_company_settings',
          actor_id: user?.id,
          org_name: orgName,
          org_logo: orgLogo,
          org_address: orgAddress,
          org_email: orgEmail,
          org_phone: orgPhone,
          org_bank_account: orgBankAccount
        })
      });
      const json = await res.json();
      if (json.success) {
        showSuccess('Pengaturan Perusahaan Disimpan', 'Profil perusahaan berhasil diperbarui.', 'UPDATE');
        setCompanySaveSuccess('Profil perusahaan berhasil diperbarui!');
        fetchBackofficeData();
      } else {
        showError('Gagal Menyimpan', json.error || 'Gagal menyimpan profil perusahaan.');
      }
    } catch (err: any) {
      showError('Gagal Menyimpan', err?.message || 'Terjadi kesalahan koneksi.');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleSaveUserAccess = async () => {
    if (!selectedUserForAccess) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_access',
          actor_id: user?.id,
          target_user_id: selectedUserForAccess.id,
          accessible_clusters: tempRole === 'admin' ? [] : tempSelectedClusters,
          role: tempRole,
          department: tempDepartment,
          name: tempName,
          employee_id: tempEmployeeId,
          annual_leave_balance: tempLeaveBalance
        })
      });
      const json = await res.json();
      if (json.success) {
        showSuccess('Akses Perusahaan Diperbarui', `Akses perumahan untuk ${selectedUserForAccess.name} berhasil diperbarui.`, 'UPDATE');
        setSelectedUserForAccess(null);
        fetchBackofficeData();
        
        const clusterNames = tempRole === 'admin' 
          ? 'Semua Perumahan (Admin)' 
          : tempSelectedClusters.length > 0 
            ? tempSelectedClusters.map(id => clusters.find(c => c.id === id)?.name || id).join(', ')
            : 'Semua Perumahan';
        const message = `Admin *${user?.name}* memperbarui hak akses & role staf *${tempName}*:\n- Role: *${tempRole}* (${tempDepartment})\n- Akses Perumahan: *${clusterNames}*`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));
      } else {
        showError('Gagal Menyimpan Akses', json.error || 'Gagal menyimpan akses perumahan.');
      }
    } catch (err: any) {
      showError('Gagal Menyimpan Akses', err?.message || 'Terjadi kesalahan koneksi.');
    }
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_employee',
          actor_id: user?.id,
          id: selectedEmployee.id,
          name: empName,
          department: empDepartment,
          employee_id: empIdString,
          annual_leave_balance: empLeaveBalance,
          is_active: selectedEmployee.is_active
        })
      });
      const json = await res.json();
      if (json.success) {
        showSuccess('Data Karyawan Diperbarui', `Data karyawan ${empName} berhasil diperbarui.`, 'UPDATE');
        setSelectedEmployee(null);
        fetchBackofficeData();
        
        const message = `Admin *${user?.name}* memperbarui data karyawan *${empName}* (${empIdString}):\n- Departemen: *${empDepartment}*\n- Saldo Cuti: *${empLeaveBalance} Hari*`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));
      } else {
        showError('Gagal Menyimpan', json.error || 'Gagal menyimpan data karyawan.');
      }
    } catch (err: any) {
      showError('Gagal Menyimpan', err?.message || 'Terjadi kesalahan koneksi.');
    }
  };

  const handleCreateEmployee = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_employee',
          actor_id: user?.id,
          name: empName,
          department: empDepartment,
          employee_id: empIdString,
          annual_leave_balance: empLeaveBalance
        })
      });
      const json = await res.json();
      if (json.success) {
        showSuccess('Karyawan Baru Ditambahkan', `Karyawan ${empName} berhasil ditambahkan!`, 'CREATE');
        setIsAddingEmployee(false);
        setEmpName('');
        setEmpDepartment('');
        setEmpIdString('');
        setEmpLeaveBalance(12);
        fetchBackofficeData();
        
        const message = `Admin *${user?.name}* mendaftarkan karyawan baru *${empName}* (${empIdString}) di departemen *${empDepartment}*`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));
      } else {
        showError('Gagal Menambah Karyawan', json.error || 'Gagal membuat data karyawan.');
      }
    } catch (err: any) {
      showError('Gagal Menambah Karyawan', err?.message || 'Terjadi kesalahan koneksi.');
    }
  };

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClusterLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPermissionType = () => {
    if (!newPermissionName.trim()) {
      alert('Nama tipe izin tidak boleh kosong.');
      return;
    }
    
    const isDup = permissionTypes.some(pt => pt.name.toLowerCase() === newPermissionName.trim().toLowerCase());
    if (isDup) {
      alert('Tipe izin dengan nama tersebut sudah ada.');
      return;
    }

    const newPt = {
      id: 'prm-' + Math.random().toString(36).substr(2, 9),
      name: newPermissionName.trim(),
      requires_attachment: newPermissionRequiresAttachment
    };

    setPermissionTypes([...permissionTypes, newPt]);
    setNewPermissionName('');
    setNewPermissionRequiresAttachment(false);
  };

  const handleDeletePermissionType = (name: string) => {
    showConfirm(
      'Konfirmasi Hapus Tipe Izin',
      `Apakah Anda yakin ingin menghapus tipe izin "${name}"?`,
      () => {
        setPermissionTypes(prev => prev.filter(p => p.name !== name));
        showSuccess('Tipe Izin Dihapus', `Tipe izin "${name}" telah dihapus dari daftar.`, 'DELETE');
      },
      'DELETE',
      'Hapus Tipe Izin'
    );
  };

  const handleDeleteTemplate = (id: string) => {
    showConfirm(
      'Konfirmasi Hapus Template',
      'Hapus template ini? Dokumen yang sudah dibuat tidak akan terpengaruh.',
      async () => {
        setDeletingId(id);
        try {
          const res = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete_template',
              actor_id: user?.id || 'usr-admin',
              template_id: id
            })
          });
          const json = await res.json();
          if (json.success) {
            showSuccess('Template Dihapus', 'Template dokumen berhasil dihapus.', 'DELETE');
            setTemplates(json.templates || []);
          } else {
            showError('Gagal Hapus', json.error || 'Gagal menghapus template.');
          }
        } catch (e: any) {
          showError('Gagal Hapus', e?.message || 'Terjadi kesalahan sistem.');
        } finally {
          setDeletingId(null);
        }
      },
      'DELETE',
      'Hapus Template'
    );
  };

  const handleTemplateSaved = (saved: DocumentTemplate) => {
    setEditingTemplate(null);
    fetchTemplates();
  };

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clName || !clLocation) {
      alert('Nama perumahan dan lokasi wajib diisi!');
      return;
    }
    try {
      const isEditing = !!isEditingClusterId;
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEditing ? 'update_cluster' : 'create_cluster',
          cluster_id: isEditing ? isEditingClusterId : undefined,
          name: clName,
          location: clLocation,
          description: clDesc,
          status: clStatus,
          svg_content: clSvgContent || undefined,
          logo_url: clLogo || undefined,
          address: clAddress || undefined,
          email: clEmail || undefined,
          phone: clPhone || undefined,
          bank_account: clBankAccount || undefined,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(isEditing ? 'Cluster perumahan berhasil diperbarui!' : 'Cluster perumahan baru berhasil dibuat!');
        setIsAddingCluster(false);
        setIsEditingClusterId('');
        setClName('');
        setClLocation('');
        setClDesc('');
        setClSvgContent('');
        setSelectedSvgFileName('');
        setClLogo('');
        setClAddress('');
        setClEmail('');
        setClPhone('');
        setClBankAccount('');
        fetchBackofficeData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUnitType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utName || !utBuildingArea || !utLandArea || !utBasePrice) {
      alert('Informasi tipe unit wajib diisi!');
      return;
    }
    try {
      const isEditing = !!isEditingUnitTypeId;
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEditing ? 'update_unit_type' : 'create_unit_type',
          unit_type_id: isEditing ? isEditingUnitTypeId : undefined,
          cluster_id: selectedClusterId,
          name: utName,
          building_area: utBuildingArea,
          land_area: utLandArea,
          base_price: utBasePrice,
          bedrooms: utBedrooms,
          bathrooms: utBathrooms,
          has_carport: utHasCarport,
          description: utDesc,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(isEditing ? 'Tipe unit berhasil diperbarui!' : 'Tipe unit baru berhasil ditambahkan!');
        setIsAddingUnitType(false);
        setIsEditingUnitTypeId('');
        setUtName('');
        setUtBuildingArea('');
        setUtLandArea('');
        setUtBasePrice('');
        setUtBedrooms('2');
        setUtBathrooms('1');
        setUtHasCarport(true);
        setUtDesc('');
        fetchBackofficeData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uBlockNumber || !uUnitTypeId || !uSellPrice) {
      alert('Informasi kavling wajib diisi!');
      return;
    }
    try {
      const isEditing = !!isEditingUnitId;
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEditing ? 'update_unit' : 'create_unit',
          unit_id: isEditing ? isEditingUnitId : undefined,
          cluster_id: selectedClusterId,
          unit_type_id: uUnitTypeId,
          block_number: uBlockNumber,
          sell_price: uSellPrice,
          orientation: uOrientation,
          status: uStatus,
          notes: uNotes,
          construction_status: uConstructionStatus,
          legal_status: uLegalStatus,
          pbb_status: uPbbStatus,
          pbb_nop: uPbbNop,
          pbb_owner_name: uPbbOwnerName,
          land_documents: uLandDocuments,
          tax_documents: uTaxDocuments,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(isEditing ? 'Data kavling berhasil diperbarui!' : 'Kavling baru berhasil ditambahkan!');
        setIsAddingUnit(false);
        setIsEditingUnitId('');
        setUBlockNumber('');
        setUSellPrice('');
        setUNotes('');
        setUConstructionStatus('belum_terbangun');
        setULegalStatus('shm');
        setUPbbStatus('not_registered');
        setUPbbNop('');
        setUPbbOwnerName('');
        setULandDocuments([]);
        setUTaxDocuments([]);
        fetchBackofficeData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditCluster = (cluster: any) => {
    setIsEditingClusterId(cluster.id);
    setClName(cluster.name);
    setClLocation(cluster.location);
    setClDesc(cluster.description || '');
    setClStatus(cluster.status);
    setClSvgContent(cluster.svg_content || '');
    setSelectedSvgFileName(cluster.svg_content ? 'Peta Tersimpan.svg' : '');
    setClLogo(cluster.logo_url || '');
    setClAddress(cluster.address || '');
    setClEmail(cluster.email || '');
    setClPhone(cluster.phone || '');
    setClBankAccount(cluster.bank_account || '');
    setIsAddingCluster(true);
  };

  const handleStartEditUnitType = (type: any) => {
    setIsEditingUnitTypeId(type.id);
    setUtName(type.name);
    setUtBuildingArea(type.building_area.toString());
    setUtLandArea(type.land_area.toString());
    setUtBasePrice(type.base_price.toString());
    setUtBedrooms(type.bedrooms.toString());
    setUtBathrooms(type.bathrooms.toString());
    setUtHasCarport(type.has_carport);
    setUtDesc(type.description || '');
    setIsAddingUnitType(true);
  };

  const handleStartEditUnit = (unit: any) => {
    setIsEditingUnitId(unit.id);
    setUBlockNumber(unit.block_number);
    setUUnitTypeId(unit.unit_type_id);
    setUSellPrice(unit.sell_price.toString());
    setUOrientation(unit.orientation);
    setUStatus(unit.status);
    setUNotes(unit.notes || '');
    setUConstructionStatus(unit.construction_status || 'belum_terbangun');
    setULegalStatus(unit.legal_status || 'shm');
    setUPbbStatus(unit.pbb_status || 'not_registered');
    setUPbbNop(unit.pbb_nop || '');
    setUPbbOwnerName(unit.pbb_owner_name || '');
    setULandDocuments(unit.land_documents || []);
    setUTaxDocuments(unit.tax_documents || []);
    setIsAddingUnit(true);
  };

  const handleDeleteCluster = (clusterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      'Konfirmasi Hapus Perumahan',
      'Apakah Anda yakin ingin menghapus perumahan ini? Seluruh data tipe unit dan kavling di dalamnya juga akan terhapus.',
      async () => {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_cluster',
            cluster_id: clusterId,
            actor_id: user?.id
          })
        });
        const result = await res.json();
        if (result.success) {
          showSuccess('Perumahan Dihapus', 'Cluster perumahan berhasil dihapus.', 'DELETE');
          if (selectedClusterId === clusterId) setSelectedClusterId('');
          fetchBackofficeData();
        } else {
          showError('Gagal Hapus', result.error || 'Gagal menghapus perumahan.');
        }
      },
      'DELETE',
      'Hapus Perumahan'
    );
  };

  const handleDeleteUnitType = (typeId: string) => {
    showConfirm(
      'Konfirmasi Hapus Tipe Unit',
      'Apakah Anda yakin ingin menghapus tipe unit ini? Kavling yang terkait dengan tipe ini juga akan dihapus.',
      async () => {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_unit_type',
            unit_type_id: typeId,
            actor_id: user?.id
          })
        });
        const result = await res.json();
        if (result.success) {
          showSuccess('Tipe Unit Dihapus', 'Tipe unit berhasil dihapus.', 'DELETE');
          fetchBackofficeData();
        } else {
          showError('Gagal Hapus', result.error || 'Gagal menghapus tipe unit.');
        }
      },
      'DELETE',
      'Hapus Tipe Unit'
    );
  };

  const handleDeleteUnit = (unitId: string) => {
    showConfirm(
      'Konfirmasi Hapus Kavling',
      'Apakah Anda yakin ingin menghapus kavling ini?',
      async () => {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_unit',
            unit_id: unitId,
            actor_id: user?.id
          })
        });
        const result = await res.json();
        if (result.success) {
          showSuccess('Kavling Dihapus', 'Kavling berhasil dihapus.', 'DELETE');
          fetchBackofficeData();
        } else {
          showError('Gagal Hapus', result.error || 'Gagal menghapus kavling.');
        }
      },
      'DELETE',
      'Hapus Kavling'
    );
  };

  const handleSvgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedSvgFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setClSvgContent(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const newTemplateBlank: Partial<DocumentTemplate> = {
    name: '',
    doc_type_key: '',
    prefix: '',
    is_builtin: false,
    approval_chain_roles: ['manager', 'admin'],
    blocks: [],
  };

  if (user?.role !== 'admin') {
    return (
      <AppShell>
        <div className="max-w-md mx-auto text-center py-12 flex flex-col items-center gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <ShieldCheck size={48} className="text-red-500 bg-red-50 p-2 rounded-full border border-red-200" />
          <h2 className="text-lg font-extrabold text-gray-950">Akses Ditolak</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Halaman Backoffice khusus bagi akun ber-role <strong>Admin</strong>. Gunakan widget Role Switcher di pojok kanan bawah untuk masuk sebagai Admin.
          </p>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="w-full animate-pulse flex flex-col gap-6">
          <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </AppShell>
    );
  }

  // ── Template Builder fullscreen overlay mode ──
  if (editingTemplate !== null) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden">
        <TemplateBuilder
          template={editingTemplate}
          onSave={handleTemplateSaved}
          onCancel={() => setEditingTemplate(null)}
        />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full text-left">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Backoffice Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Konfigurasi GPS, kelola akun staf, audit logs, dan template dokumen.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          {([
            ['company', 'Profil Perusahaan', <Building2 size={14} />],
            ['users', 'User Management', <Users size={14} />],
            ['gps', 'GPS & Lokasi', <MapPin size={14} />],
            ['audit', 'Audit Logs', <Settings size={14} />],
            ['templates', 'Template Dokumen', <LayoutTemplate size={14} />],
          ] as const).map(([tab, label, icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── COMPANY PROFILE ── */}
        {activeTab === 'company' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-extrabold text-gray-900 font-sans tracking-tight">Profil & Identitas Perusahaan</h2>
              <p className="text-xs text-gray-500 mt-0.5">Ubah nama perusahaan, alamat, email, nomor telepon, logo resmi, dan rekening pembayaran KPR / Booking.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Inputs */}
              <div className="lg:col-span-2 flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Perusahaan *</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="Nama PT / CV Developer"
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Email Perusahaan</label>
                    <input
                      type="email"
                      value={orgEmail}
                      onChange={e => setOrgEmail(e.target.value)}
                      placeholder="info@perusahaan.com"
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nomor Telepon</label>
                    <input
                      type="text"
                      value={orgPhone}
                      onChange={e => setOrgPhone(e.target.value)}
                      placeholder="(022) 123456"
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Logo Perusahaan (Link URL / Unggah Gambar)</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={orgLogo}
                      onChange={e => setOrgLogo(e.target.value)}
                      placeholder="https://link-ke-gambar-logo.png"
                      className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs"
                    />
                    <label className="px-4 py-2.5 border border-dashed border-gray-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-center font-bold text-xs transition-all whitespace-nowrap gap-1">
                      <span>Unggah Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCompanyLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Alamat Resmi Kantor Pusat</label>
                  <textarea
                    rows={3}
                    value={orgAddress}
                    onChange={e => setOrgAddress(e.target.value)}
                    placeholder="Alamat kantor lengkap..."
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none font-medium text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Rekening Bank Untuk Pembayaran Tagihan</label>
                  <input
                    type="text"
                    value={orgBankAccount}
                    onChange={e => setOrgBankAccount(e.target.value)}
                    placeholder="Contoh: Bank Mandiri 131-00-1234567-8 a/n PT Domus Somnia Properti"
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-sm"
                  />
                </div>

                {companySaveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold animate-pulse">
                    {companySaveSuccess}
                  </div>
                )}

                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveCompanySettings}
                    disabled={isSavingCompany}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <Save size={16} /> Simpan Perubahan Profil
                  </button>
                </div>
              </div>

              {/* Visual Preview Card */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 flex flex-col gap-6 h-fit text-left">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block border-b border-slate-200/50 pb-2">Kop Surat & Branding Preview</span>
                
                <div className="bg-white border border-gray-300 shadow-lg rounded-xl p-5 flex flex-col gap-4 font-sans text-[11px] text-gray-800">
                  <div className="flex justify-between items-start border-b border-gray-800 pb-3 mb-1">
                    <div className="flex items-center gap-2 text-left">
                      {orgLogo ? (
                        <img src={orgLogo} alt="Logo" className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">
                          {orgName ? orgName.charAt(0) : 'D'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-extrabold text-xs text-gray-900 tracking-tight leading-none uppercase">{orgName || 'PT DEVELOPER PROPERTI'}</span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Property Developer</span>
                      </div>
                    </div>
                    <div className="flex flex-col text-right text-[8px] text-gray-500 font-semibold leading-relaxed max-w-[130px]">
                      <span className="truncate block" title={orgAddress}>{orgAddress || 'Alamat Kantor'}</span>
                      <span>Telp: {orgPhone || 'Telepon'}</span>
                      <span>Email: {orgEmail || 'Email'}</span>
                    </div>
                  </div>

                  <div className="py-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex flex-col gap-1 items-center justify-center">
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Pembayaran Via Transfer:</span>
                    <span className="font-extrabold text-xs text-indigo-700 text-center px-1">{orgBankAccount || 'Rekening Bank'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USER MANAGEMENT ── */}
        {/* ── USER MANAGEMENT ── */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6 text-left w-full animate-in fade-in duration-200">
            {/* 1. AKUN PENGGUNA SISTEM (USER ACCOUNTS) */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-100 font-extrabold text-xs text-gray-500 uppercase tracking-wider flex justify-between items-center">
                <span>Manajemen Akses & Akun Sistem</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="p-4">Email Login</th>
                      <th className="p-4">Nama Staf</th>
                      <th className="p-4">Role Akses</th>
                      <th className="p-4">Akses Perumahan / Cluster</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => {
                      const linkedEmp = employeesList.find(e => e.user_id === u.id);
                      return (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                          <td className="p-4 font-black text-gray-900">{u.email}</td>
                          <td className="p-4 font-semibold text-gray-700">{linkedEmp ? linkedEmp.name : <span className="text-gray-400 italic">Belum terhubung</span>}</td>
                          <td className="p-4 capitalize">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                              u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                              u.role === 'manager' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            {u.role === 'admin' ? (
                              <span className="text-[10px] font-bold text-red-750 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">Semua (Admin)</span>
                            ) : u.accessible_clusters && u.accessible_clusters.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {u.accessible_clusters.map((cid: string) => {
                                  const clusterName = clusters.find(c => c.id === cid)?.name || cid;
                                  return (
                                    <span key={cid} className="text-[9.5px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                                      {clusterName}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[10px] font-semibold text-gray-400 italic">Semua Perumahan</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${u.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                              {u.is_active ? 'AKTIF' : 'NON-AKTIF'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedUserForAccess(u);
                                setTempSelectedClusters(u.accessible_clusters || []);
                                setTempRole(u.role);
                                setTempName(linkedEmp ? linkedEmp.name : 'Staf Domus');
                                setTempDepartment(linkedEmp ? linkedEmp.department : 'Umum');
                                setTempEmployeeId(linkedEmp ? linkedEmp.employee_id : 'EMP-MOCK');
                                setTempLeaveBalance(linkedEmp ? linkedEmp.annual_leave_balance : 12);
                              }}
                              className="px-3 py-1.5 bg-indigo-50 border border-indigo-150 text-indigo-750 rounded-xl hover:bg-indigo-100 text-[10.5px] font-bold transition-colors cursor-pointer"
                            >
                              Atur Akses & Role
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. DATA KARYAWAN (EMPLOYEES DATA) */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-100 font-extrabold text-xs text-gray-500 uppercase tracking-wider flex justify-between items-center">
                <span>Daftar Kepegawaian (HR)</span>
                <button
                  onClick={() => {
                    setIsAddingEmployee(true);
                    setEmpName('');
                    setEmpDepartment('');
                    setEmpIdString('EMP-' + Math.random().toString().substr(2, 6));
                    setEmpLeaveBalance(12);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={11} /> Tambah Karyawan
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="p-4">ID Karyawan</th>
                      <th className="p-4">Nama</th>
                      <th className="p-4">Departemen</th>
                      <th className="p-4 text-center">Saldo Cuti</th>
                      <th className="p-4">Status Akun Login</th>
                      <th className="p-4 text-center">Keaktifan</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeesList.map(e => {
                      const linkedUser = usersList.find(u => u.id === e.user_id);
                      return (
                        <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                          <td className="p-4 font-bold text-gray-700">{e.employee_id}</td>
                          <td className="p-4 font-black text-gray-900">{e.name}</td>
                          <td className="p-4 font-semibold text-gray-650">{e.department}</td>
                          <td className="p-4 text-center font-bold text-slate-700">{e.annual_leave_balance} Hari</td>
                          <td className="p-4">
                            {linkedUser ? (
                              <span className="text-[10px] font-semibold text-emerald-750 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                                Terhubung: {linkedUser.email}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                                Belum Terhubung
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${e.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                              {e.is_active ? 'AKTIF' : 'NON-AKTIF'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedEmployee(e);
                                setEmpName(e.name);
                                setEmpDepartment(e.department);
                                setEmpIdString(e.employee_id);
                                setEmpLeaveBalance(e.annual_leave_balance);
                              }}
                              className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-200 text-[10.5px] font-bold transition-colors cursor-pointer"
                            >
                              Edit Karyawan
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── GPS & POLICY CONFIG ── */}
        {activeTab === 'gps' && (
          <div className="flex flex-col gap-6 w-full text-left">
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
                <Check size={18} className="bg-green-500 text-white rounded-full p-0.5" />
                {saveSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
              {/* Geofencing & Work Hours Policy */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
                <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 flex items-center gap-2 text-indigo-700">
                  <MapPin size={18} />
                  Geofencing & Kebijakan Jam Kerja
                </h2>

                <div className="flex flex-col gap-4 text-xs font-semibold">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Kantor / Cabang *</label>
                    <input 
                      type="text" 
                      required 
                      value={officeName} 
                      onChange={e => setOfficeName(e.target.value)}
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Latitude *</label>
                      <input 
                        type="number" 
                        step="any" 
                        required 
                        value={officeLat} 
                        onChange={e => setOfficeLat(Number(e.target.value))}
                        className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Longitude *</label>
                      <input 
                        type="number" 
                        step="any" 
                        required 
                        value={officeLng} 
                        onChange={e => setOfficeLng(Number(e.target.value))}
                        className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Radius Toleransi (Meter) *</label>
                    <input 
                      type="number" 
                      required 
                      value={officeRadius} 
                      onChange={e => setOfficeRadius(Number(e.target.value))}
                      className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Titik Lokasi Kantor & Radius Geofence (Klik/Geser Pin)</label>
                    <MapPicker 
                      latitude={officeLat} 
                      longitude={officeLng} 
                      radius={officeRadius} 
                      onChange={(lat, lng) => {
                        setOfficeLat(Number(lat.toFixed(6)));
                        setOfficeLng(Number(lng.toFixed(6)));
                      }}
                    />
                  </div>

                  <div className="border-t border-gray-100 my-2 pt-3 flex flex-col gap-4">
                    <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Kebijakan Waktu</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-wider text-[9px]">Jam Masuk Kerja (Clock-in)</label>
                        <input 
                          type="time" 
                          required 
                          value={workHoursStart} 
                          onChange={e => setWorkHoursStart(e.target.value)}
                          className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium" 
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-wider text-[9px]">Jam Pulang Kerja (Clock-out)</label>
                        <input 
                          type="time" 
                          required 
                          value={workHoursEnd} 
                          onChange={e => setWorkHoursEnd(e.target.value)}
                          className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium" 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Batas Toleransi Keterlambatan (Menit)</label>
                      <input 
                        type="number" 
                        required 
                        value={lateThresholdMinutes} 
                        onChange={e => setLateThresholdMinutes(Number(e.target.value))}
                        className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium" 
                      />
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5">Staf yang clock-in onsite lewat dari Jam Masuk + Toleransi akan ditandai terlambat dan wajib menulis alasan.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Permission Types */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-5">
                <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 flex items-center gap-2 text-indigo-700">
                  <ShieldCheck size={18} />
                  Daftar Tipe Izin & Sakit
                </h2>

                <div className="flex flex-col gap-4 text-xs font-semibold">
                  <span className="text-[10px] text-gray-400 font-medium -mt-2">Atur tipe izin/sakit apa saja yang bisa diajukan oleh staf, beserta kewajiban melampirkan file/gambar bukti pendukung.</span>

                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Nama Izin</th>
                          <th className="p-3 text-center">Wajib Bukti</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissionTypes.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-gray-400 italic font-medium">Belum ada tipe izin kustom.</td>
                          </tr>
                        ) : (
                          permissionTypes.map((pt) => (
                            <tr key={pt.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-gray-800">{pt.name}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                  pt.requires_attachment 
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {pt.requires_attachment ? 'YA (Wajib Gambar)' : 'TIDAK'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePermissionType(pt.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Permission Form */}
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex flex-col gap-3">
                    <span className="font-extrabold text-xs text-gray-800 uppercase tracking-wide">Tambah Tipe Izin</span>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Izin *</label>
                      <input 
                        type="text"
                        placeholder="cth: Sakit Rawat Inap, Izin Duka, dll"
                        value={newPermissionName}
                        onChange={e => setNewPermissionName(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input 
                        type="checkbox"
                        id="requires_attachment"
                        checked={newPermissionRequiresAttachment}
                        onChange={e => setNewPermissionRequiresAttachment(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="requires_attachment" className="text-gray-700 font-bold select-none cursor-pointer">Wajib sertakan bukti lampiran (foto / gambar)</label>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPermissionType}
                      className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Tambah Ke List
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* General Save Settings */}
            <div className="flex justify-end pt-3 border-t border-gray-200">
              <button 
                onClick={handleSaveSettings}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} /> SIMPAN SEMUA PENGATURAN ABSENSI
              </button>
            </div>
          </div>
        )}


        {/* ── AUDIT LOGS ── */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-extrabold text-xs text-gray-500 uppercase tracking-wider">
              Audit Logs Sistem Terkini
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User ID</th>
                    <th className="p-4">Aksi</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-500">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                      <td className="p-4 font-bold text-slate-700">{log.user_id}</td>
                      <td className="p-4"><code className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-indigo-700 font-mono font-bold">{log.action}</code></td>
                      <td className="p-4 font-semibold text-gray-600 capitalize">{log.entity_type}</td>
                      <td className="p-4"><span className="text-green-600 font-bold">SUCCESS</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TEMPLATE DOKUMEN ── */}
        {activeTab === 'templates' && (
          <div className="flex flex-col gap-4">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-base text-gray-900">Template Dokumen</h2>
                <p className="text-xs text-gray-500 mt-0.5">Buat dan kelola template dokumen kustom seperti PKS, SPK, dan lainnya.</p>
              </div>
              <button
                onClick={() => setEditingTemplate(newTemplateBlank)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={16} /> Buat Template Baru
              </button>
            </div>

            {/* Template Grid */}
            {loadingTemplates ? (
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map(tpl => (
                  <div key={tpl.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group">
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {tpl.is_builtin ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded uppercase tracking-wide flex items-center gap-0.5">
                              <Star size={9} /> Built-in
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded uppercase tracking-wide">
                              Kustom
                            </span>
                          )}
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {tpl.prefix}/YYYY/MM/####
                          </span>
                        </div>
                        <p className="font-extrabold text-sm text-gray-900 truncate">{tpl.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{tpl.description || 'Tidak ada deskripsi'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText size={28} className="text-indigo-100 opacity-60" />
                      </div>
                    </div>

                    {/* Block count + approval chain */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-gray-500 font-semibold bg-gray-50 border border-gray-100 rounded px-2 py-0.5">
                        {tpl.blocks.length} blok
                      </span>
                      {tpl.approval_chain_roles.map(r => (
                        <span key={r} className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded capitalize">{r}</span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => setEditingTemplate(tpl)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                      >
                        <Eye size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        disabled={deletingId === tpl.id}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                ))}

                {/* New template card */}
                <button
                  onClick={() => setEditingTemplate(newTemplateBlank)}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Plus size={18} className="text-indigo-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 group-hover:text-indigo-600 transition-colors">Buat Template Baru</p>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PROPERTIES & KAVLING MANAGEMENT ── */}
        {activeTab === 'properties' && (
          <div className="flex flex-col gap-6 w-full text-left">
            
            {/* VIEW 1: Adding a new Cluster/Housing Project */}
            {isAddingCluster ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">{isEditingClusterId ? 'Edit Cluster Perumahan' : 'Tambah Cluster Perumahan Baru'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEditingClusterId ? 'Ubah informasi perumahan, lokasi, deskripsi, atau unggah peta SVG baru.' : 'Daftarkan perumahan baru lengkap dengan lokasi, deskripsi, dan upload denah peta SVG.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <form onSubmit={handleCreateCluster} className="lg:col-span-2 flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Perumahan / Cluster *</label>
                      <input
                        type="text"
                        required
                        placeholder="cth: Cluster Rosewood"
                        value={clName}
                        onChange={e => setClName(e.target.value)}
                        className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Lokasi *</label>
                      <input
                        type="text"
                        required
                        placeholder="cth: Arcamanik, Bandung"
                        value={clLocation}
                        onChange={e => setClLocation(e.target.value)}
                        className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Logo Perumahan / Cluster (URL / Unggah Gambar)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={clLogo}
                          onChange={e => setClLogo(e.target.value)}
                          placeholder="https://link-logo-perumahan.png"
                          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                        />
                        <label className="px-3.5 py-2.5 border border-dashed border-gray-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-center font-bold transition-all whitespace-nowrap gap-1">
                          <span>Pilih Gambar</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleClusterLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Alamat Lengkap Perumahan</label>
                      <textarea
                        value={clAddress}
                        onChange={e => setClAddress(e.target.value)}
                        placeholder="Masukkan alamat proyek lengkap..."
                        rows={2}
                        className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-wider text-[9px]">Email Perumahan</label>
                        <input
                          type="email"
                          placeholder="cth: clusterrosewood@domus.com"
                          value={clEmail}
                          onChange={e => setClEmail(e.target.value)}
                          className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-wider text-[9px]">Telepon Perumahan</label>
                        <input
                          type="text"
                          placeholder="cth: 0812-3456-7890"
                          value={clPhone}
                          onChange={e => setClPhone(e.target.value)}
                          className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Rekening Bank Perumahan (Kop/Kwitansi/Invoice)</label>
                      <input
                        type="text"
                        placeholder="cth: Bank Mandiri 123-45-67890 a/n PT Rosewood Land"
                        value={clBankAccount}
                        onChange={e => setClBankAccount(e.target.value)}
                        className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Deskripsi Perumahan</label>
                      <textarea
                        placeholder="Tuliskan spesifikasi umum perumahan, kelebihan lokasi, dll..."
                        value={clDesc}
                        onChange={e => setClDesc(e.target.value)}
                        rows={3}
                        className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-wider text-[9px]">Status Penjualan</label>
                        <select
                          value={clStatus}
                          onChange={e => setClStatus(e.target.value as any)}
                          className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none bg-white font-medium"
                        >
                          <option value="active">Aktif (Active)</option>
                          <option value="pre_launch">Pre-Launch</option>
                          <option value="sold_out">Habis Terjual (Sold Out)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-wider text-[9px]">Peta Site Plan (File .svg) *</label>
                        <label className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-center gap-1.5 font-bold transition-all border-dashed">
                          <span>{selectedSvgFileName ? `Terpilih: ${selectedSvgFileName.substring(0, 15)}...` : "Pilih File SVG"}</span>
                          <input
                            type="file"
                            accept=".svg,image/svg+xml"
                            onChange={handleSvgFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {clSvgContent && (
                      <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl text-[10px]">
                        Peta SVG berhasil diproses ({Math.round(clSvgContent.length / 1024)} KB).
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs"
                      >
                        {isEditingClusterId ? 'Simpan Perubahan' : 'Simpan Perumahan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCluster(false);
                          setIsEditingClusterId('');
                          setClName('');
                          setClLocation('');
                          setClDesc('');
                          setClSvgContent('');
                          setSelectedSvgFileName('');
                          setClLogo('');
                          setClAddress('');
                          setClEmail('');
                          setClPhone('');
                          setClBankAccount('');
                        }}
                        className="flex-1 py-3 bg-gray-100 border text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  </form>

                  {/* Visual Preview Card for Cluster */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 flex flex-col gap-6 h-fit text-left">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block border-b border-slate-200/50 pb-2">Pratinjau Kop Surat Perumahan</span>
                    
                    <div className="bg-white border border-gray-300 shadow-lg rounded-xl p-5 flex flex-col gap-4 font-sans text-[11px] text-gray-800">
                      <div className="flex justify-between items-start border-b border-gray-800 pb-3 mb-1">
                        <div className="flex items-center gap-2 text-left">
                          {clLogo ? (
                            <img src={clLogo} alt="Logo" className="w-10 h-10 object-cover rounded-lg border border-gray-150 shadow" />
                          ) : orgLogo ? (
                            <img src={orgLogo} alt="Logo" className="w-10 h-10 object-cover rounded-lg border border-gray-150 shadow opacity-50" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg">
                              {clName ? clName.charAt(0) : 'P'}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs text-gray-900 tracking-tight leading-none uppercase">{clName || 'NAMA CLUSTER PERUMAHAN'}</span>
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Housing Project Branding</span>
                          </div>
                        </div>
                        <div className="flex flex-col text-right text-[8px] text-gray-500 font-semibold leading-relaxed max-w-[130px]">
                          <span className="truncate block" title={clAddress || orgAddress}>{clAddress || orgAddress || 'Alamat Proyek'}</span>
                          <span>Telp: {clPhone || orgPhone || 'Telepon Proyek'}</span>
                          <span>Email: {clEmail || orgEmail || 'Email Proyek'}</span>
                        </div>
                      </div>

                      <div className="py-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex flex-col gap-1 items-center justify-center">
                        <span className="text-[8px] text-gray-400 font-bold uppercase">Pembayaran Booking/DP via Transfer:</span>
                        <span className="font-extrabold text-xs text-purple-700 text-center px-1">{clBankAccount || orgBankAccount || 'Rekening Bank Perumahan'}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal italic">* Nilai abu-abu menandakan fallback otomatis menggunakan profil perusahaan global karena nilai perumahan ini belum diisi.</p>
                  </div>
                </div>
              </div>
            ) : selectedClusterId ? (
              // VIEW 2: Inspected Cluster Detail Page (Unit Types & Kavlings list)
              (() => {
                const cluster = clusters.find(c => c.id === selectedClusterId);
                const clusterTypes = unitTypes.filter(t => t.cluster_id === selectedClusterId);
                const clusterUnits = units.filter(u => u.cluster_id === selectedClusterId);
                
                return (
                  <div className="flex flex-col gap-6 w-full">
                    {/* Detail Header & Back button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Detail Perumahan</span>
                        <h2 className="text-xl font-extrabold text-gray-950">{cluster?.name}</h2>
                        <span className="text-xs text-gray-500 font-semibold">{cluster?.location} · {clusterUnits.length} Kavling Terdaftar</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClusterId('');
                          setIsAddingUnit(false);
                          setIsAddingUnitType(false);
                        }}
                        className="px-4 py-2 border rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors"
                      >
                        KEMBALI KE DAFTAR
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left Column: Tipe Unit List & Form */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 self-start">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <h3 className="font-extrabold text-sm text-gray-950">Tipe Unit ({clusterTypes.length})</h3>
                          {!isAddingUnitType && (
                            <button
                              onClick={() => setIsAddingUnitType(true)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-[10px] transition-colors border border-indigo-100"
                            >
                              + TAMBAH
                            </button>
                          )}
                        </div>

                        {isAddingUnitType ? (
                          <form onSubmit={handleCreateUnitType} className="flex flex-col gap-3.5 text-xs font-semibold">
                            <div className="flex justify-between items-center pb-1.5 border-b border-gray-100">
                              <span className="font-extrabold text-xs text-gray-800">{isEditingUnitTypeId ? 'Edit Tipe Unit' : 'Tambah Tipe Unit Baru'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Tipe *</label>
                              <input
                                type="text"
                                required
                                placeholder="cth: Tipe 36/72"
                                value={utName}
                                onChange={e => setUtName(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Luas Bangunan (m²) *</label>
                                <input
                                  type="number"
                                  required
                                  placeholder="cth: 36"
                                  value={utBuildingArea}
                                  onChange={e => setUtBuildingArea(e.target.value)}
                                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Luas Tanah (m²) *</label>
                                <input
                                  type="number"
                                  required
                                  placeholder="cth: 72"
                                  value={utLandArea}
                                  onChange={e => setUtLandArea(e.target.value)}
                                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-gray-400 uppercase tracking-wider text-[9px]">Harga Dasar (Rp) *</label>
                              <input
                                type="number"
                                required
                                placeholder="cth: 350000000"
                                value={utBasePrice}
                                onChange={e => setUtBasePrice(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Kamar Tidur *</label>
                                <input
                                  type="number"
                                  required
                                  value={utBedrooms}
                                  onChange={e => setUtBedrooms(e.target.value)}
                                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Kamar Mandi *</label>
                                <input
                                  type="number"
                                  required
                                  value={utBathrooms}
                                  onChange={e => setUtBathrooms(e.target.value)}
                                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 py-1">
                              <input
                                type="checkbox"
                                id="has_carport"
                                checked={utHasCarport}
                                onChange={e => setUtHasCarport(e.target.checked)}
                                className="rounded"
                              />
                              <label htmlFor="has_carport" className="text-gray-700 font-bold">Memiliki Carport</label>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-gray-400 uppercase tracking-wider text-[9px]">Keterangan Detail</label>
                              <textarea
                                placeholder="Detail spesifikasi..."
                                value={utDesc}
                                onChange={e => setUtDesc(e.target.value)}
                                rows={2}
                                className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                              />
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-50">
                              <button
                                type="submit"
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors text-[11px]"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingUnitType(false);
                                  setIsEditingUnitTypeId('');
                                  setUtName('');
                                  setUtBuildingArea('');
                                  setUtLandArea('');
                                  setUtBasePrice('');
                                  setUtBedrooms('2');
                                  setUtBathrooms('1');
                                  setUtHasCarport(true);
                                  setUtDesc('');
                                }}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors text-[11px]"
                              >
                                Batal
                              </button>
                            </div>
                          </form>
                        ) : (
                          // Render list of unit types
                          <div className="flex flex-col gap-2.5">
                            {clusterTypes.length === 0 ? (
                              <div className="text-center py-6 border border-dashed border-gray-100 rounded-xl text-gray-400 italic text-[11px]">
                                Belum ada spesifikasi tipe unit terdaftar.
                              </div>
                            ) : (
                              clusterTypes.map((type) => (
                                <div key={type.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col text-left gap-1 group/type relative">
                                  <div className="flex justify-between items-start">
                                    <span className="font-extrabold text-gray-900 text-xs">{type.name}</span>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover/type:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditUnitType(type)}
                                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                        title="Edit Tipe Unit"
                                      >
                                        <Edit3 size={11} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUnitType(type.id)}
                                        className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600 transition-colors"
                                        title="Hapus Tipe Unit"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-semibold">
                                    LB: {type.building_area} m² · LT: {type.land_area} m² · KT: {type.bedrooms} / KM: {type.bathrooms}
                                  </span>
                                  <span className="font-extrabold text-blue-600 text-[11px] mt-1">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(type.base_price)}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right 2 Columns: Kavling / Plots List & Form */}
                      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <h3 className="font-extrabold text-sm text-gray-950">Daftar Kavling & Plot ({clusterUnits.length})</h3>
                          {!isAddingUnit && clusterTypes.length > 0 && (
                            <button
                              onClick={() => {
                                setUUnitTypeId(clusterTypes[0].id);
                                setIsAddingUnit(true);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-[10px] transition-colors border border-indigo-100"
                            >
                              + TAMBAH KAVLING
                            </button>
                          )}
                        </div>

                         {/* Add Kavling Form */}
                        {isAddingUnit ? (
                          <form onSubmit={handleCreateUnit} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-4 text-xs font-semibold text-left">
                            <div>
                              <h4 className="font-extrabold text-xs text-gray-900">{isEditingUnitId ? 'Edit Data Kavling' : 'Tambah Kavling Baru'}</h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                {isEditingUnitId ? 'Perbarui nomor blok, tipe unit, harga, orientasi, atau status kavling ini.' : 'Kavling ini otomatis akan dipetakan ke site plan SVG jika id element SVG cocok.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nomor Blok * (Cth: A-15)</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Blok & Nomor"
                                  value={uBlockNumber}
                                  onChange={e => setUBlockNumber(e.target.value)}
                                  className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-medium text-xs"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Tipe Unit Properti *</label>
                                <select
                                  value={uUnitTypeId}
                                  onChange={e => setUUnitTypeId(e.target.value)}
                                  className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium text-xs"
                                >
                                  {clusterTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Harga Jual (Rp) *</label>
                                <input
                                  type="number"
                                  required
                                  placeholder="Harga jual unit"
                                  value={uSellPrice}
                                  onChange={e => setUSellPrice(e.target.value)}
                                  className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-medium text-xs"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Orientasi Kavling</label>
                                <select
                                  value={uOrientation}
                                  onChange={e => setUOrientation(e.target.value as any)}
                                  className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium text-xs"
                                >
                                  <option value="middle">Tengah (Middle)</option>
                                  <option value="hook">Sudut Jalan (Hook)</option>
                                  <option value="corner">Pojok (Corner)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Status Ketersediaan</label>
                                <select
                                  value={uStatus}
                                  onChange={e => {
                                    setUStatus(e.target.value);
                                    if (e.target.value !== 'available') {
                                      setUConstructionStatus('belum_terbangun');
                                    }
                                  }}
                                  className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium text-xs"
                                >
                                  <option value="available">Tersedia / Kosong (Available)</option>
                                  <option value="reserved">Minat (Reserved)</option>
                                  <option value="booking">Booking Fee Paid</option>
                                  <option value="kpr_process">Proses KPR</option>
                                  <option value="sold">Terjual (Sold)</option>
                                  <option value="unavailable">Tidak Tersedia</option>
                                </select>
                              </div>

                              {uStatus === 'available' ? (
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Tahap Pembangunan *</label>
                                  <select
                                    value={uConstructionStatus}
                                    onChange={e => setUConstructionStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-bold text-xs text-indigo-700"
                                  >
                                    <option value="belum_terbangun">Belum Terbangun</option>
                                    <option value="proses_pembangunan">Proses Pembangunan</option>
                                    <option value="finishing">Finishing</option>
                                    <option value="ready">Ready (Siap Huni)</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Catatan Unit</label>
                                  <input
                                    type="text"
                                    placeholder="Dekat fasilitas umum, dll..."
                                    value={uNotes}
                                    onChange={e => setUNotes(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-medium text-xs"
                                  />
                                </div>
                              )}
                            </div>

                            {uStatus === 'available' && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Catatan Unit</label>
                                <input
                                  type="text"
                                  placeholder="Dekat fasilitas umum, dll..."
                                  value={uNotes}
                                  onChange={e => setUNotes(e.target.value)}
                                  className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-medium text-xs"
                                />
                              </div>
                            )}

                            {/* Legalitas & Perpajakan */}
                            <div className="border-t border-dashed border-gray-200 pt-3.5 mt-1 flex flex-col gap-3.5">
                              <h5 className="font-extrabold text-[10px] text-indigo-600 uppercase tracking-widest">⚖️ Legalitas & Perpajakan</h5>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Status Sertifikat Tanah</label>
                                  <select
                                    value={uLegalStatus}
                                    onChange={e => setULegalStatus(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium text-xs text-slate-800"
                                  >
                                    <option value="shm">SHM (Sertifikat Hak Milik)</option>
                                    <option value="shgb">SHGB (Sertifikat Hak Guna Bangunan)</option>
                                    <option value="ajb">AJB (Akta Jual Beli)</option>
                                    <option value="other">Lainnya (HGB / Girik / Surat)</option>
                                  </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Status Pajak PBB</label>
                                  <select
                                    value={uPbbStatus}
                                    onChange={e => setUPbbStatus(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium text-xs text-slate-800"
                                  >
                                    <option value="paid">Lunas (Paid)</option>
                                    <option value="unpaid">Belum Bayar (Unpaid)</option>
                                    <option value="not_registered">Belum Terdaftar</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                                {/* Dokumen Pertanahan Uploader */}
                                <div className="flex flex-col gap-2 p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-xl">
                                  <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wide flex items-center gap-1">📁 Dokumen Pertanahan</span>
                                  <label className="px-3 py-1.5 border border-dashed border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400 rounded-lg cursor-pointer flex items-center justify-center gap-1 font-bold text-[10px] text-indigo-700 bg-white transition-all">
                                    <span>+ Unggah Sertifikat/AJB</span>
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          const url = event.target?.result as string;
                                          const newDoc = {
                                            id: 'land-' + Math.random().toString(36).substr(2, 9),
                                            name: file.name,
                                            url,
                                            uploaded_at: new Date().toLocaleDateString('id-ID')
                                          };
                                          setULandDocuments(prev => [...prev, newDoc]);
                                        };
                                        reader.readAsDataURL(file);
                                      }}
                                      className="hidden"
                                    />
                                  </label>

                                  {/* List of land documents */}
                                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-32">
                                    {uLandDocuments.length === 0 ? (
                                      <span className="text-[9px] text-gray-400 italic text-center py-2">Belum ada berkas pertanahan.</span>
                                    ) : (
                                      uLandDocuments.map((doc, idx) => (
                                        <div key={doc.id || idx} className="flex justify-between items-center bg-white p-1.5 border border-gray-100 rounded-lg shadow-sm">
                                          <div className="flex items-center gap-1 min-w-0">
                                            <span className="text-[10px]">📄</span>
                                            <a href={doc.url} download={doc.name} className="text-[9px] font-bold text-slate-700 hover:text-indigo-600 hover:underline truncate" title={doc.name}>
                                              {doc.name}
                                            </a>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setULandDocuments(prev => prev.filter(d => d.id !== doc.id))}
                                            className="text-gray-400 hover:text-red-600 font-black text-[9px] px-1"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Dokumen Perpajakan Uploader */}
                                <div className="flex flex-col gap-2 p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl">
                                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide flex items-center gap-1">📁 Dokumen Perpajakan (PBB)</span>
                                  
                                  {/* NOP & Atas Nama inputs */}
                                  <div className="flex flex-col gap-1.5 mt-1 border-b border-emerald-100/50 pb-2">
                                    <div>
                                      <label className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Nomor Objek Pajak (NOP)</label>
                                      <input
                                        type="text"
                                        placeholder="NOP PBB (18 digit)"
                                        value={uPbbNop}
                                        onChange={e => setUPbbNop(e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-200 bg-white rounded-md focus:outline-none text-[10px] font-medium text-slate-800"
                                      />
                                    </div>
                                    <div className="mt-1">
                                      <label className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Atas Nama Wajib Pajak</label>
                                      <input
                                        type="text"
                                        placeholder="Atas nama di PBB"
                                        value={uPbbOwnerName}
                                        onChange={e => setUPbbOwnerName(e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-200 bg-white rounded-md focus:outline-none text-[10px] font-medium text-slate-800"
                                      />
                                    </div>
                                  </div>
                                  <label className="px-3 py-1.5 border border-dashed border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 rounded-lg cursor-pointer flex items-center justify-center gap-1 font-bold text-[10px] text-emerald-700 bg-white transition-all">
                                    <span>+ Unggah Bukti PBB</span>
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          const url = event.target?.result as string;
                                          const newDoc = {
                                            id: 'tax-' + Math.random().toString(36).substr(2, 9),
                                            name: file.name,
                                            url,
                                            uploaded_at: new Date().toLocaleDateString('id-ID')
                                          };
                                          setUTaxDocuments(prev => [...prev, newDoc]);
                                        };
                                        reader.readAsDataURL(file);
                                      }}
                                      className="hidden"
                                    />
                                  </label>

                                  {/* List of tax documents */}
                                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-32">
                                    {uTaxDocuments.length === 0 ? (
                                      <span className="text-[9px] text-gray-400 italic text-center py-2">Belum ada bukti PBB.</span>
                                    ) : (
                                      uTaxDocuments.map((doc, idx) => (
                                        <div key={doc.id || idx} className="flex justify-between items-center bg-white p-1.5 border border-gray-100 rounded-lg shadow-sm">
                                          <div className="flex items-center gap-1 min-w-0">
                                            <span className="text-[10px]">📄</span>
                                            <a href={doc.url} download={doc.name} className="text-[9px] font-bold text-slate-700 hover:text-emerald-600 hover:underline truncate" title={doc.name}>
                                              {doc.name}
                                            </a>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setUTaxDocuments(prev => prev.filter(d => d.id !== doc.id))}
                                            className="text-gray-400 hover:text-red-600 font-black text-[9px] px-1"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-200 mt-1">
                              <button
                                type="submit"
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors text-xs"
                              >
                                Simpan Kavling
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingUnit(false);
                                  setIsEditingUnitId('');
                                  setUBlockNumber('');
                                  setUSellPrice('');
                                  setUNotes('');
                                }}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 border rounded-lg font-bold hover:bg-gray-300 transition-colors text-xs"
                              >
                                Batal
                              </button>
                            </div>
                          </form>
                        ) : null}

                        {/* Kavling list table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-wider text-[9px]">
                                <th className="p-3">Blok</th>
                                <th className="p-3">Tipe</th>
                                <th className="p-3">Harga</th>
                                <th className="p-3">Legalitas</th>
                                <th className="p-3">PBB</th>
                                <th className="p-3">Orientasi</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clusterUnits.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-4 text-center text-gray-400 italic text-[11px]">
                                    Belum ada unit kavling terdaftar untuk perumahan ini.
                                  </td>
                                </tr>
                              ) : (
                                clusterUnits.map(unit => {
                                  const type = clusterTypes.find(t => t.id === unit.unit_type_id);
                                  return (
                                    <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                      <td className="p-3 font-black text-gray-900">{unit.block_number}</td>
                                      <td className="p-3 font-semibold text-gray-600">{type?.name || "N/A"}</td>
                                      <td className="p-3 font-bold text-gray-800">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(unit.sell_price)}
                                      </td>
                                      <td className="p-3 font-extrabold text-[10px] text-indigo-600 uppercase">
                                        {unit.legal_status ? unit.legal_status.toUpperCase() : 'SHM'}
                                        {unit.land_documents && unit.land_documents.length > 0 && (
                                          <span className="ml-1 text-[8px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded border border-indigo-100">
                                            {unit.land_documents.length} berkas
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 text-[10px] font-bold">
                                        <div className="flex flex-col items-start gap-1">
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] border ${
                                            unit.pbb_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            unit.pbb_status === 'unpaid' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                          }`}>
                                            {unit.pbb_status === 'paid' ? 'LUNAS' : unit.pbb_status === 'unpaid' ? 'BELUM BAYAR' : 'BELUM DAFTAR'}
                                          </span>
                                          {unit.tax_documents && unit.tax_documents.length > 0 && (
                                            <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-100 font-extrabold">
                                              {unit.tax_documents.length} berkas
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3 capitalize font-medium text-gray-500">{unit.orientation}</td>
                                      <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                          unit.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' :
                                          unit.status === 'sold' ? 'bg-red-50 text-red-700 border-red-200' :
                                          'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                          {unit.status.replace('_', ' ')}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditUnit(unit)}
                                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                            title="Edit Kavling"
                                          >
                                            <Edit3 size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUnit(unit.id)}
                                            className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                                            title="Hapus Kavling"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()
            ) : (
              // VIEW 3: Main list of Perumahan / Clusters
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-extrabold text-base text-gray-900">Cluster Perumahan & Site Plan</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Kelola data perumahan, spesifikasi bangunan, dan denah site plan SVG.</p>
                  </div>
                  <button
                    onClick={() => setIsAddingCluster(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus size={16} /> Tambah Perumahan
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {clusters.map(cluster => (
                    <div
                      key={cluster.id}
                      onClick={() => {
                        setSelectedClusterId(cluster.id);
                        setIsAddingUnit(false);
                        setIsAddingUnitType(false);
                      }}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col gap-3 group text-left"
                    >
                      <div className="flex justify-between items-start gap-3">
                        {cluster.logo_url && (
                          <img src={cluster.logo_url} alt="Logo" className="w-12 h-12 object-cover rounded-xl border border-gray-150 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-100 rounded px-2 py-0.5 uppercase tracking-wide">
                              {cluster.status.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditCluster(cluster);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                title="Edit Perumahan"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteCluster(cluster.id, e)}
                                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                                title="Hapus Perumahan"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <h3 className="font-black text-sm text-gray-900 mt-2 truncate group-hover:text-indigo-600 transition-colors">
                            {cluster.name}
                          </h3>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{cluster.location}</p>
                          {cluster.address && (
                            <p className="text-[9px] text-gray-400 font-medium truncate mt-0.5" title={cluster.address}>{cluster.address}</p>
                          )}
                          <p className="text-[10px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                            {cluster.description || "Tidak ada deskripsi perumahan."}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-[10px] font-bold text-gray-500">
                        <span>{cluster.total_units || 0} Kavling Terdaftar</span>
                        <span className="text-indigo-600 group-hover:underline">Kelola Perumahan ➔</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Access Modal */}
      {selectedUserForAccess && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setSelectedUserForAccess(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-150 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-base text-gray-950">Edit Akses & Role Karyawan</h3>
                <p className="text-xs text-gray-500 mt-0.5">Kelola konfigurasi akun: <strong>{selectedUserForAccess.email}</strong></p>
              </div>
              <button 
                onClick={() => setSelectedUserForAccess(null)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 text-left space-y-5">
              {/* Personal Data Sync */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 flex flex-col text-left">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Nama Karyawan</label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800"
                  />
                </div>
                <div className="space-y-1.5 flex flex-col text-left">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">ID Karyawan</label>
                  <input
                    type="text"
                    value={tempEmployeeId}
                    onChange={(e) => setTempEmployeeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 flex flex-col text-left">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Departemen</label>
                  <input
                    type="text"
                    value={tempDepartment}
                    onChange={(e) => setTempDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800"
                  />
                </div>
                <div className="space-y-1.5 flex flex-col text-left">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Saldo Cuti (Hari)</label>
                  <input
                    type="number"
                    value={tempLeaveBalance}
                    onChange={(e) => setTempLeaveBalance(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5 flex flex-col text-left">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Role Hak Akses Sistem *</label>
                <select
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800"
                >
                  <option value="admin">Admin (Akses Penuh Seluruh Sistem)</option>
                  <option value="manager">Manager (Akses Manajemen Properti & CRM)</option>
                  <option value="staff">Staff (Akses Operasional Lapangan & Sales)</option>
                </select>
              </div>
              
              {/* Cluster Access Restriction */}
              <div className="space-y-2.5">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Pembatasan Proyek Perumahan</label>
                
                {tempRole === 'admin' ? (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-xs text-red-800 font-medium leading-relaxed">
                    Pengguna dengan role <strong>Admin</strong> secara otomatis memiliki hak akses penuh ke <strong>semua</strong> proyek perumahan secara permanen.
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800 font-medium leading-relaxed">
                      Pilih proyek perumahan yang dapat diakses, dikelola, dan dilihat oleh staf ini. Jika tidak ada yang dipilih, staf akan memiliki akses ke <strong>semua</strong> perumahan.
                    </div>
                    
                    <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden bg-gray-50/20 max-h-48 overflow-y-auto">
                      {clusters.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 italic text-xs">Belum ada proyek perumahan.</div>
                      ) : (
                        clusters.map((c) => {
                          const isChecked = tempSelectedClusters.includes(c.id);
                          return (
                            <label key={c.id} className="flex items-center gap-3.5 px-4 py-3 hover:bg-gray-50/50 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTempSelectedClusters([...tempSelectedClusters, c.id]);
                                  } else {
                                    setTempSelectedClusters(tempSelectedClusters.filter(id => id !== c.id));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-gray-800 truncate">{c.name}</span>
                                <span className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{c.location}</span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedUserForAccess(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveUserAccess}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-100 transition-colors cursor-pointer"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Edit Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setSelectedEmployee(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-150 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-base text-gray-950">Edit Data Kepegawaian (HR)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Karyawan: <strong>{selectedEmployee.name}</strong></p>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-left space-y-4">
              <div className="space-y-1.5 flex flex-col text-left">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Nama Lengkap</label>
                <input type="text" value={empName} onChange={e => setEmpName(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800" />
              </div>
              
              <div className="space-y-1.5 flex flex-col text-left">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Departemen</label>
                <input type="text" value={empDepartment} onChange={e => setEmpDepartment(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800" />
              </div>
              
              <div className="space-y-1.5 flex flex-col text-left">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">ID Karyawan</label>
                <input type="text" value={empIdString} onChange={e => setEmpIdString(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800" />
              </div>
              
              <div className="space-y-1.5 flex flex-col text-left">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Saldo Cuti Tahunan (Hari)</label>
                <input type="number" value={empLeaveBalance} onChange={e => setEmpLeaveBalance(Number(e.target.value))} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800" />
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button onClick={() => setSelectedEmployee(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors cursor-pointer">
                Batal
              </button>
              <button onClick={handleSaveEmployee} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-100 transition-colors cursor-pointer">
                Simpan Karyawan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Add Modal */}
      {isAddingEmployee && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setIsAddingEmployee(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-150 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-base text-gray-950">Daftarkan Karyawan Baru</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tambah catatan kepegawaian baru</p>
              </div>
              <button onClick={() => setIsAddingEmployee(false)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-left space-y-4">
              <div className="space-y-1.5 flex flex-col text-left">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Nama Lengkap *</label>
                <input type="text" value={empName} onChange={e => setEmpName(e.target.value)} placeholder="Nama karyawan baru" className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800" />
              </div>
              
              <div className="space-y-1.5 flex flex-col text-left">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Departemen *</label>
                <input type="text" value={empDepartment} onChange={e => setEmpDepartment(e.target.value)} placeholder="Contoh: Pemasaran, Keuangan" className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800" />
              </div>
              
              <div className="space-y-1.5 flex flex-col text-left">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">ID Karyawan *</label>
                <input type="text" value={empIdString} onChange={e => setEmpIdString(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800" />
              </div>
              
              <div className="space-y-1.5 flex flex-col text-left">
                <label className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">Saldo Cuti Tahunan (Hari)</label>
                <input type="number" value={empLeaveBalance} onChange={e => setEmpLeaveBalance(Number(e.target.value))} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-xs text-gray-800" />
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button onClick={() => setIsAddingEmployee(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors cursor-pointer">
                Batal
              </button>
              <button onClick={handleCreateEmployee} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-100 transition-colors cursor-pointer">
                Daftarkan
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
