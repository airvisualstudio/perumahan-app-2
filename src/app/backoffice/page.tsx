"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';
import { DocumentTemplate, DocumentTemplateBlock, TemplateBlockType } from '@/lib/db';

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

  // Drag & Drop reorder
  const onDragStart = (idx: number) => { dragSrcIdx.current = idx; };
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const onDrop = (idx: number) => {
    if (dragSrcIdx.current === null || dragSrcIdx.current === idx) return;
    const blocks = [...tpl.blocks];
    const [moved] = blocks.splice(dragSrcIdx.current, 1);
    blocks.splice(idx, 0, moved);
    setTpl(t => ({ ...t, blocks }));
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
            disabled={tpl.is_builtin}
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
          disabled={saving || tpl.is_builtin}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={14} />
          {saving ? 'Menyimpan...' : tpl.is_builtin ? 'Built-in' : 'Simpan Template'}
        </button>
      </div>

      <div className={`flex flex-1 gap-0 overflow-hidden ${showPreview ? 'flex-row' : 'flex-col'}`}>

        {/* ── Left: Metadata + Block Editor ── */}
        <div className={`flex flex-col gap-0 overflow-y-auto ${showPreview ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
          {/* Metadata Row */}
          <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-200">
            {tpl.is_builtin && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-3">
                <Lock size={11} /> Template bawaan sistem tidak dapat diubah — hanya bisa dilihat.
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kode Tipe Dokumen *</label>
                <input
                  value={tpl.doc_type_key}
                  onChange={e => setTpl(t => ({ ...t, doc_type_key: e.target.value.toUpperCase() }))}
                  placeholder="cth: PKS"
                  disabled={tpl.is_builtin}
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono uppercase disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Prefix Nomor *</label>
                <input
                  value={tpl.prefix}
                  onChange={e => setTpl(t => ({ ...t, prefix: e.target.value.toUpperCase() }))}
                  placeholder="cth: PKS"
                  disabled={tpl.is_builtin}
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono uppercase disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Rantai Approval (role, pisah koma)</label>
                <input
                  value={chainRoles}
                  onChange={e => setTpl(t => ({ ...t, approval_chain_roles: e.target.value.split(',').map(r => r.trim()).filter(Boolean) }))}
                  placeholder="manager, admin"
                  disabled={tpl.is_builtin}
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Deskripsi (opsional)</label>
              <input
                value={tpl.description || ''}
                onChange={e => setTpl(t => ({ ...t, description: e.target.value }))}
                placeholder="Keterangan singkat template..."
                disabled={tpl.is_builtin}
                className="mt-0.5 w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Block Palette */}
          {!tpl.is_builtin && (
            <div className="px-5 py-3 border-b border-gray-200 bg-white">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tambah Blok</p>
              <div className="flex flex-wrap gap-1.5">
                {BLOCK_PALETTE.map(p => (
                  <button
                    key={p.type}
                    onClick={() => addBlock(p)}
                    title={p.desc}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all bg-white text-gray-600"
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Block Canvas */}
          <div className="px-5 py-4 flex flex-col gap-2">
            {tpl.blocks.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-xl">
                <LayoutTemplate size={28} className="mx-auto mb-2 opacity-40" />
                Belum ada blok. Klik tombol di atas untuk menambahkan konten.
              </div>
            )}
            {tpl.blocks.map((block, idx) => (
              <div
                key={block.id}
                draggable={!tpl.is_builtin}
                onDragStart={() => onDragStart(idx)}
                onDragOver={e => onDragOver(e, idx)}
                onDrop={() => onDrop(idx)}
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
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-3">Preview A4 — {tpl.name || 'Untitled'}</p>
            <div className="bg-white shadow-xl" style={{ width: '595px', minHeight: '842px', padding: '48px 56px', fontFamily: "'Google Sans', sans-serif" }}>
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
  
  const [activeTab, setActiveTab] = useState<'users' | 'gps' | 'audit' | 'templates' | 'properties'>('users');
  
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [officeSettings, setOfficeSettings] = useState<any>(null);
  
  // GPS Config fields
  const [officeName, setOfficeName] = useState('');
  const [officeLat, setOfficeLat] = useState(0);
  const [officeLng, setOfficeLng] = useState(0);
  const [officeRadius, setOfficeRadius] = useState(100);

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

  const fetchBackofficeData = async () => {
    try {
      const res = await fetch('/api/db');
      const json = await res.json();
      if (json.success) {
        setUsersList(json.data.users || []);
        setAuditLogs(json.data.auditLogs || []);
        setClusters(json.data.clusters || []);
        setUnits(json.data.units || []);
        setUnitTypes(json.data.unitTypes || []);
        
        const office = json.data.settings.office_locations[0];
        setOfficeSettings(office);
        if (office) {
          setOfficeName(office.name);
          setOfficeLat(office.latitude);
          setOfficeLng(office.longitude);
          setOfficeRadius(office.radius_meters);
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
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab]);

  const handleMockSaveGps = () => {
    setSaveSuccess('Pengaturan GPS Kantor berhasil disimpan!');
    const message = `Admin *${user?.name}* mengubah radius toleransi absensi kantor menjadi *${officeRadius} meter*`;
    window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
      detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
    }));
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Hapus template ini? Dokumen yang sudah dibuat tidak akan terpengaruh.')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_template', actor_id: user?.id || 'usr-admin', template_id: id })
      });
      const json = await res.json();
      if (json.success) setTemplates(json.templates || []);
    } catch (e) {
      console.error(e);
    }
    setDeletingId(null);
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
    setIsAddingUnit(true);
  };

  const handleDeleteCluster = async (clusterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus perumahan ini? Seluruh data tipe unit dan kavling di dalamnya juga akan terhapus.')) return;
    try {
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
        alert('Cluster perumahan berhasil dihapus.');
        if (selectedClusterId === clusterId) {
          setSelectedClusterId('');
        }
        fetchBackofficeData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUnitType = async (typeId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tipe unit ini? Kavling yang terkait dengan tipe ini juga akan dihapus.')) return;
    try {
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
        alert('Tipe unit berhasil dihapus.');
        fetchBackofficeData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kavling ini?')) return;
    try {
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
        alert('Kavling berhasil dihapus.');
        fetchBackofficeData();
      }
    } catch (err) {
      console.error(err);
    }
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
        <div className="flex border-b border-gray-200 gap-2">
          {([
            ['users', 'User Management', <Users size={14} />],
            ['gps', 'GPS & Lokasi', <MapPin size={14} />],
            ['audit', 'Audit Logs', <Settings size={14} />],
            ['templates', 'Template Dokumen', <LayoutTemplate size={14} />],
            ['properties', 'Perumahan & Kavling', <Home size={14} />],
          ] as const).map(([tab, label, icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── USER MANAGEMENT ── */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-extrabold text-xs text-gray-500 uppercase tracking-wider">
              Daftar Akun Karyawan
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="p-4">ID Karyawan</th>
                    <th className="p-4">Nama</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Departemen</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Saldo Cuti</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                      <td className="p-4 font-bold text-gray-700">{u.employee_id}</td>
                      <td className="p-4 font-black text-gray-900">{u.name}</td>
                      <td className="p-4 text-gray-500">{u.email}</td>
                      <td className="p-4 font-semibold text-gray-600">{u.department}</td>
                      <td className="p-4 capitalize">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                          u.role === 'manager' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-700">{u.annual_leave_balance} Hari</td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold">AKTIF</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── GPS CONFIG ── */}
        {activeTab === 'gps' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-w-md w-full">
            <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
              <MapPin className="text-indigo-600" size={18} />
              Pengaturan Geofencing Absensi
            </h2>

            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-xs font-bold mb-4 flex items-center gap-2">
                <Check size={16} />{saveSuccess}
              </div>
            )}

            <div className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Kantor / Cabang *</label>
                <input type="text" required value={officeName} onChange={e => setOfficeName(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Latitude *</label>
                  <input type="number" step="any" required value={officeLat} onChange={e => setOfficeLat(Number(e.target.value))}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Longitude *</label>
                  <input type="number" step="any" required value={officeLng} onChange={e => setOfficeLng(Number(e.target.value))}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Radius Toleransi (Meter) *</label>
                <input type="number" required value={officeRadius} onChange={e => setOfficeRadius(Number(e.target.value))}
                  className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
              </div>
              <button onClick={handleMockSaveGps}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5">
                <Check size={16} /> SIMPAN PENGATURAN GPS
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
                        <Eye size={12} /> {tpl.is_builtin ? 'Lihat' : 'Edit'}
                      </button>
                      {!tpl.is_builtin && (
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          disabled={deletingId === tpl.id}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={12} /> Hapus
                        </button>
                      )}
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
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 max-w-xl">
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">{isEditingClusterId ? 'Edit Cluster Perumahan' : 'Tambah Cluster Perumahan Baru'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEditingClusterId ? 'Ubah informasi perumahan, lokasi, deskripsi, atau unggah peta SVG baru.' : 'Daftarkan perumahan baru lengkap dengan lokasi, deskripsi, dan upload denah peta SVG.'}
                  </p>
                </div>

                <form onSubmit={handleCreateCluster} className="flex flex-col gap-4 text-xs font-semibold">
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
                      }}
                      className="flex-1 py-3 bg-gray-100 border text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-xs"
                    >
                      Batal
                    </button>
                  </div>
                </form>
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
                                  onChange={e => setUStatus(e.target.value)}
                                  className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium text-xs"
                                >
                                  <option value="available">Tersedia (Available)</option>
                                  <option value="reserved">Minat (Reserved)</option>
                                  <option value="booking">Booking Fee Paid</option>
                                  <option value="kpr_process">Proses KPR</option>
                                  <option value="sold">Terjual (Sold)</option>
                                  <option value="unavailable">Tidak Tersedia</option>
                                </select>
                              </div>

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
                                <th className="p-3">Orientasi</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clusterUnits.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-4 text-center text-gray-400 italic text-[11px]">
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
                      <div className="flex justify-between items-start gap-2">
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
    </AppShell>
  );
}
