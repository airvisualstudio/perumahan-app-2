"use client";

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { 
  FileText, 
  Plus, 
  Check, 
  X, 
  Printer, 
  Trash2, 
  AlertTriangle,
  User as UserIcon,
  Layers,
  FileCheck,
  Eye,
  Edit3
} from 'lucide-react';

interface Document {
  id: string;
  doc_type: string;
  doc_number: string;
  doc_token: string;
  requester_id: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'revoked';
  revoked_reason?: string;
  created_at: string;
  data: any;
  approval_chain: {
    level: number;
    role?: string;
    user_id?: string;
    status: 'pending' | 'approved' | 'rejected';
    decided_by?: string;
    decided_at?: string;
    remarks?: string;
  }[];
  template_id?: string;
  cluster_id?: string;
}

interface Prospect {
  id: string;
  full_name: string;
  booked_unit_id?: string;
  interested_cluster_id?: string;
}

interface DocTemplate {
  id: string;
  name: string;
  description?: string;
  doc_type_key: string;
  prefix: string;
  is_builtin: boolean;
  approval_chain_roles: string[];
  paper_size?: 'A4' | 'Letter' | 'Legal' | 'F4';
  blocks: {
    id: string;
    type: string;
    content?: string;
    label?: string;
    value?: string;
    variable_key?: string;
    variable_label?: string;
    variable_required?: boolean;
    table_headers?: string[];
    table_rows?: number;
    align?: string;
    bold?: boolean;
    size?: string;
  }[];
}

// Terbilang function in Indonesian
function terbilang(nominal: number): string {
  const angka = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (nominal < 12) return angka[nominal];
  if (nominal < 20) return terbilang(nominal - 10) + " belas";
  if (nominal < 100) return terbilang(Math.floor(nominal / 10)) + " puluh " + terbilang(nominal % 10);
  if (nominal < 200) return "seratus " + terbilang(nominal - 100);
  if (nominal < 1000) return terbilang(Math.floor(nominal / 100)) + " ratus " + terbilang(nominal % 100);
  if (nominal < 2000) return "seribu " + terbilang(nominal - 1000);
  if (nominal < 1000000) return terbilang(Math.floor(nominal / 1000)) + " ribu " + terbilang(nominal % 1000);
  if (nominal < 1000000000) return terbilang(Math.floor(nominal / 1000000)) + " juta " + terbilang(nominal % 1000000);
  return String(nominal);
}

export default function DocumentHubPage() {
  const { user } = useAuth();
  
  // Tabs: 'list' | 'create' | 'queue'
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'queue'>('list');
  const [docType, setDocType] = useState<string>('Invoice');
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [docTemplates, setDocTemplates] = useState<DocTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [docClusterId, setDocClusterId] = useState('');

  // Selected document for preview
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Form states Invoice
  const [invProspectId, setInvProspectId] = useState('');
  const [invItemName, setInvItemName] = useState('');
  const [invPrice, setInvPrice] = useState(0);
  const [invNotes, setInvNotes] = useState('');
  const [invTax, setInvTax] = useState(true);

  // Form states Kwitansi
  const [kwtInvoiceId, setKwtInvoiceId] = useState('');
  const [kwtPenerima, setKwtPenerima] = useState('');
  const [kwtNominal, setKwtNominal] = useState(0);
  const [kwtKeterangan, setKwtKeterangan] = useState('');

  // Form states Surat
  const [srtTemplate, setSrtTemplate] = useState('Surat Tugas');
  const [srtPenerima, setSrtPenerima] = useState('');
  const [srtJabatan, setSrtJabatan] = useState('');
  const [srtTanggal, setSrtTanggal] = useState('');
  const [srtIsi, setSrtIsi] = useState('');

  // Approval remarks
  const [appRemarks, setAppRemarks] = useState('');
  
  // Revoke states
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const fetchDocumentsData = async () => {
    try {
      const [docsRes, crmRes, tplRes, settingsRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/crm'),
        fetch('/api/documents?templates=1'),
        fetch('/api/settings'),
      ]);
      const json = await docsRes.json();
      if (json.success) {
        setDocuments(json.documents || []);
        if (json.documents.length > 0 && !selectedDoc) {
          setSelectedDoc(json.documents[0]);
        }
      }
      const crmJson = await crmRes.json();
      if (crmJson.success) {
        setProspects(crmJson.prospects || []);
        setClusters(crmJson.clusters || []);
        setUnits(crmJson.units || []);
        if (crmJson.prospects.length > 0) {
          setInvProspectId(crmJson.prospects[0].id);
        }
      }
      const tplJson = await tplRes.json();
      if (tplJson.success && tplJson.templates?.length > 0) {
        setDocTemplates(tplJson.templates);
        const firstTpl = tplJson.templates[0];
        setSelectedTemplate(firstTpl);
        setDocType(firstTpl.doc_type_key);
      }
      const settingsJson = await settingsRes.json();
      if (settingsJson.success) {
        setSettings(settingsJson.settings);
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Hapus template ini? Dokumen yang sudah dibuat tidak akan terpengaruh.')) return;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_template',
          actor_id: user?.id || 'usr-admin',
          template_id: templateId
        })
      });
      const json = await res.json();
      if (json.success) {
        setDocTemplates(json.templates || []);
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
          setDocType('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDocumentsData();
  }, []);

  // Auto-select cluster based on the selected prospect's booking or interest
  useEffect(() => {
    if (docType === 'Invoice' && invProspectId) {
      const selectedProspect = prospects.find(p => p.id === invProspectId);
      if (selectedProspect) {
        let clusterId = '';
        if (selectedProspect.booked_unit_id) {
          const unit = units.find(u => u.id === selectedProspect.booked_unit_id);
          if (unit) {
            clusterId = unit.cluster_id;
          }
        }
        if (!clusterId && selectedProspect.interested_cluster_id) {
          clusterId = selectedProspect.interested_cluster_id;
        }
        if (clusterId) {
          setDocClusterId(clusterId);
        }
      }
    }
  }, [invProspectId, docType, prospects, units]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    let doc_data: Record<string, any> = {};
    let template_id: string | undefined;

    // Determine if this is a custom (non-builtin or custom template) type
    const isCustomTemplate = selectedTemplate && !['Invoice', 'Kwitansi', 'Surat'].includes(selectedTemplate.doc_type_key);

    if (isCustomTemplate && selectedTemplate) {
      // Custom template: collect customFieldValues
      doc_data = { ...customFieldValues };
      template_id = selectedTemplate.id;
    } else if (docType === 'Invoice') {
      const selectedProspect = prospects.find(p => p.id === invProspectId);
      const subtotal = invPrice;
      const tax_amount = invTax ? Math.round(subtotal * 0.11) : 0;
      const total_amount = subtotal + tax_amount;

      const chosenCluster = docClusterId ? clusters.find(c => c.id === docClusterId) : null;
      const targetBankAccount = chosenCluster?.bank_account || settings?.org_bank_account || '131-00-1234567-8 a/n PT Domus Somnia';

      let paymentMethod = 'Transfer Bank';
      const cleanBankText = targetBankAccount.trim();
      const firstWord = cleanBankText.split(' ')[0];
      if (firstWord) {
        if (firstWord.toLowerCase() === 'bank') {
          const secondWord = cleanBankText.split(' ')[1];
          paymentMethod = `Transfer Bank ${secondWord || ''}`.trim();
        } else {
          paymentMethod = `Transfer Bank ${firstWord}`;
        }
      }

      doc_data = {
        prospect_id: invProspectId,
        client_name: selectedProspect?.full_name || 'Klien Properti',
        items: [{ name: invItemName || 'Pembayaran Properti', qty: 1, price: subtotal }],
        tax_applied: invTax,
        subtotal,
        tax_amount,
        total_amount,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_method: paymentMethod,
        bank_account: targetBankAccount,
        notes: invNotes
      };
    } else if (docType === 'Kwitansi') {
      doc_data = {
        receiver_name: kwtPenerima,
        nominal_amount: kwtNominal,
        nominal_words: terbilang(kwtNominal) + " rupiah",
        keterangan: kwtKeterangan
      };
    } else {
      doc_data = {
        template_name: srtTemplate,
        receiver_name: srtPenerima,
        receiver_role: srtJabatan,
        date_effective: srtTanggal,
        content: srtIsi
      };
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_document',
          doc_type: docType,
          doc_data,
          template_id,
          cluster_id: docClusterId || undefined,
          actor_id: user?.id
        })
      });
      const json = await res.json();
      if (json.success) {
        const message = `Dokumen ${docType} baru dibuat oleh ${user?.name} dengan status DRAFT`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'finance-notif', message }
        }));
        
        setActiveTab('list');
        setDocClusterId('');
        fetchDocumentsData();
        if (json.document) {
          setSelectedDoc(json.document);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Submit for approval chain
  const handleSubmitForApproval = async (docId: string) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_for_approval',
          doc_id: docId,
          actor_id: user?.id
        })
      });
      const json = await res.json();
      if (json.success) {
        const message = `Dokumen ${selectedDoc?.doc_type} (${selectedDoc?.doc_number}) diajukan untuk proses approval oleh ${user?.name}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'finance-notif', message }
        }));
        
        fetchDocumentsData();
        setSelectedDoc(json.document);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Approve
  const handleApprove = async (docId: string) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_document',
          doc_id: docId,
          remarks: appRemarks || 'Approved',
          actor_id: user?.id
        })
      });
      const json = await res.json();
      if (json.success) {
        const message = `Dokumen ${selectedDoc?.doc_type} (${selectedDoc?.doc_number}) disetujui di Level ${selectedDoc?.approval_chain.find(c => c.status === 'pending')?.level} oleh ${user?.name}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'finance-notif', message }
        }));

        setAppRemarks('');
        fetchDocumentsData();
        setSelectedDoc(json.document);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Reject
  const handleReject = async (docId: string) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_document',
          doc_id: docId,
          remarks: appRemarks || 'Rejected',
          actor_id: user?.id
        })
      });
      const json = await res.json();
      if (json.success) {
        const message = `Dokumen ${selectedDoc?.doc_type} (${selectedDoc?.doc_number}) ditolak oleh ${user?.name}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'finance-notif', message }
        }));

        setAppRemarks('');
        fetchDocumentsData();
        setSelectedDoc(json.document);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Revoke
  const handleRevoke = async () => {
    if (!selectedDoc) return;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_document',
          doc_id: selectedDoc.id,
          reason: revokeReason,
          actor_id: user?.id
        })
      });
      const json = await res.json();
      if (json.success) {
        const message = `PENTING: Dokumen approved ${selectedDoc.doc_type} (${selectedDoc.doc_number}) dicabut/direvoke oleh Admin ${user?.name}. Alasan: "${revokeReason}"`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'finance-notif', message }
        }));

        setIsRevokeOpen(false);
        setRevokeReason('');
        fetchDocumentsData();
        setSelectedDoc(json.document);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter queue of pending approvals for current user role
  const approvalQueue = documents.filter(doc => {
    if (doc.status !== 'pending_approval') return false;
    const activeStep = doc.approval_chain.find(c => c.status === 'pending');
    if (!activeStep) return false;
    
    // Admin can see and approve ALL steps in the chain (including bypasses)
    if ((user?.role as string) === 'admin') return true;
    
    // Staff Pemasaran role matches marketing staff (Rina Sales)
    if (activeStep.role === 'Staff Pemasaran' && user?.role === 'staff' && user?.department === 'Pemasaran') return true;
    
    // Manager Pemasaran role matches marketing manager (Budi Manager)
    if (activeStep.role === 'Manager Pemasaran' && user?.role === 'manager' && user?.department === 'Pemasaran') return true;
    
    // Backward compatibility for legacy roles in templates
    if (activeStep.role === 'Keuangan' && user?.department === 'Keuangan') return true;
    if (activeStep.role === 'manager' && (user?.role as string) === 'manager') return true;
    if (activeStep.role === 'admin' && (user?.role as string) === 'admin') return true;
    return false;
  });

  const handlePrint = () => {
    window.print();
  };

  // Auto-fill Kwitansi fields when Invoice is selected
  const handleKwtInvoiceChange = (id: string) => {
    setKwtInvoiceId(id);
    const invoice = documents.find(d => d.id === id);
    if (invoice) {
      setKwtPenerima(invoice.data.client_name);
      setKwtNominal(invoice.data.total_amount);
      setKwtKeterangan(`Pelunasan tagihan Invoice ${invoice.doc_number}`);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse gap-6 flex flex-col w-full">
          <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-[500px] bg-gray-200 rounded-2xl col-span-1"></div>
            <div className="h-[500px] bg-gray-200 rounded-2xl col-span-2"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Generate URL for QR verification
  const qrVerificationUrl = selectedDoc 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${selectedDoc.doc_token}`
    : '';

  // QR Code generator API (using qrserver which is fast, open, and reliable)
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrVerificationUrl)}`;

  // Resolve paper size from template
  const docTemplate = docTemplates.find(t => t.id === selectedDoc?.template_id || t.doc_type_key === selectedDoc?.doc_type);
  const paperSize = (docTemplate?.paper_size || 'A4') as 'A4' | 'Letter' | 'Legal' | 'F4';

  const paperSizes = {
    A4: { name: 'A4', width: '210mm', height: '297mm', sizeSpec: 'A4' },
    Letter: { name: 'Letter', width: '215.9mm', height: '279.4mm', sizeSpec: 'letter' },
    Legal: { name: 'Legal', width: '215.9mm', height: '355.6mm', sizeSpec: 'legal' },
    F4: { name: 'F4 / Folio', width: '215mm', height: '330mm', sizeSpec: '215mm 330mm' }
  };

  const paperSpec = paperSizes[paperSize] || paperSizes.A4;

  // Resolve cluster-specific branding for selectedDoc
  const docCluster = selectedDoc?.cluster_id ? clusters.find(c => c.id === selectedDoc.cluster_id) : null;
  const docLogo = docCluster?.logo_url || settings?.org_logo;
  const docName = docCluster?.name || settings?.org_name || 'PT DOMUS SOMNIA PROPERTI';
  const docAddress = docCluster?.address || settings?.org_address || 'Grand Surapati Core Blok B-03, Jl. Phh. Mustofa No.39, Bandung';
  const docPhone = docCluster?.phone || settings?.org_phone || '(022) 1234567';
  const docEmail = docCluster?.email || settings?.org_email || 'info@domus.com';
  const docBankAccount = docCluster?.bank_account || selectedDoc?.data?.bank_account || settings?.org_bank_account || '131-00-1234567-8 a/n PT Domus Somnia';

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full no-print">
        {/* Header Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dokumen & Persetujuan</h1>
            <p className="text-gray-500 text-sm mt-1">Buat Invoice, Kwitansi lunas, Surat Resmi, dan pantau persetujuan berjenjang (chain approvals).</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-gray-200 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Daftar Dokumen
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'create' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Buat Dokumen Baru
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'queue' ? 'border-blue-600 text-blue-600 animate-pulse' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Antrean Approval ({approvalQueue.length})
          </button>
        </div>

        {/* ==================== TAB: LIST & PREVIEW ==================== */}
        {activeTab === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* List side */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-gray-50 border-b border-gray-100 font-extrabold text-xs text-gray-500 uppercase tracking-wider text-left">
                Daftar Dokumen
              </div>
              <div className="flex flex-col max-h-[60vh] overflow-y-auto no-scrollbar">
                {documents.length === 0 ? (
                  <span className="text-gray-400 text-center py-8 italic font-semibold">Belum ada dokumen dibuat</span>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-4 border-b border-gray-100 cursor-pointer flex flex-col gap-1 text-left transition-all ${
                        selectedDoc?.id === doc.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600 pl-3' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-gray-950 text-xs">{doc.doc_number}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                          doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                          doc.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                          doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          doc.status === 'revoked' ? 'bg-gray-100 text-gray-700 line-through' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {doc.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-1">
                        <span>Tipe: {doc.doc_type}</span>
                        <span>{new Date(doc.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* A4 Preview side */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {selectedDoc ? (
                <>
                  {/* Action Bar for Preview */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap justify-between items-center gap-3">
                    <div className="flex gap-2">
                      {selectedDoc.status === 'draft' && (
                        <button
                          onClick={() => handleSubmitForApproval(selectedDoc.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                        >
                          Submit Approval Chain
                        </button>
                      )}
                      
                      {selectedDoc.status === 'approved' && (
                        <button
                          onClick={handlePrint}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          <Printer size={14} /> Cetak / Save PDF
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {user?.role === 'admin' && selectedDoc.status === 'approved' && (
                        <button
                          onClick={() => setIsRevokeOpen(true)}
                          className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cabut Dokumen (Revoke)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Document Approval visual workflow */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-left">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase block mb-3.5">Approval Hierarchy Trail</span>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                      {selectedDoc.approval_chain.map((c, idx) => (
                        <React.Fragment key={idx}>
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              c.status === 'approved' ? 'bg-green-100 text-green-700' :
                              c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {c.status === 'approved' ? '✓' : c.status === 'rejected' ? '✗' : idx + 1}
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-bold text-gray-800">{c.role} Level {c.level}</span>
                              <span className="text-[9px] text-gray-400 font-semibold uppercase">
                                {c.status === 'approved' ? `Approve: ${c.decided_by}` : c.status === 'rejected' ? `Ditolak` : 'Pending'}
                              </span>
                            </div>
                          </div>
                          {idx < selectedDoc.approval_chain.length - 1 && (
                            <div className="hidden sm:block text-gray-300 font-bold">➔</div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Print layout CSS Injection */}
                  <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                      @page {
                        size: ${paperSpec.sizeSpec};
                        margin: 0;
                      }
                      .print-container {
                        width: ${paperSpec.width} !important;
                        height: ${paperSpec.height} !important;
                        max-height: ${paperSpec.height} !important;
                      }
                    }
                  `}} />

                  {/* PRINT CONTAINER (RENDERED AS HTML PIXEL PERFECT SHEET) */}
                  <div 
                    id="print-area" 
                    className="print-container bg-white border border-gray-200 rounded-2xl shadow-xl p-10 mx-auto text-left relative flex flex-col font-sans text-gray-800 transition-all duration-300"
                    style={{
                      width: paperSpec.width,
                      minHeight: paperSpec.height,
                      maxWidth: '105%'
                    }}
                  >
                    
                    {/* Watermark status */}
                    {selectedDoc.status === 'revoked' && (
                      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-8 border-red-500/30 text-red-500/30 px-10 py-4 font-black text-5xl rounded-2xl pointer-events-none select-none tracking-widest uppercase">
                        TIDAK BERLAKU
                      </div>
                    )}
                    {selectedDoc.status === 'approved' && selectedDoc.doc_type === 'Invoice' && (
                      <div className="absolute top-1/4 right-8 border-4 border-green-500/20 text-green-500/20 px-4 py-1.5 font-black text-xl rounded-lg pointer-events-none select-none uppercase">
                        APPROVED
                      </div>
                    )}

                    {/* Logo & Company Letterhead header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-900 pb-5 mb-6 print:pb-3 print:mb-4 text-left">
                      <div className="flex items-center gap-3">
                        {docLogo ? (
                          <img src={docLogo} alt="Logo" className="w-12 h-12 object-cover rounded-xl border border-gray-150 shadow" />
                        ) : (
                          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-3xl shadow">
                            {docName ? docName.charAt(0) : 'D'}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-extrabold text-xl text-gray-900 tracking-tight uppercase leading-none">{docName}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Property Developer & Management</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right text-[10px] text-gray-500 font-semibold leading-relaxed max-w-[200px]">
                        <span>{docAddress}</span>
                        <span>Telp: {docPhone} | {docEmail}</span>
                      </div>
                    </div>

                    {/* Doc Title & Meta details */}
                    <div className="text-center flex flex-col gap-1.5 mb-8 print:mb-4">
                      <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">{selectedDoc.doc_type} RESMI</h2>
                      <span className="text-xs font-bold text-gray-500">Nomor: {selectedDoc.doc_number}</span>
                      <span className="text-[10px] text-gray-400">Tanggal Diterbitkan: {new Date(selectedDoc.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    {/* Document specific content body */}
                    {selectedDoc.doc_type === 'Invoice' && (
                      <div className="flex-1 flex flex-col gap-6 print:gap-3 text-xs font-semibold">
                        <div className="grid grid-cols-2 gap-4 print:gap-2 border-b border-gray-100 pb-4 print:pb-2">
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] text-gray-400 uppercase font-bold">Ditagihkan Kepada:</span>
                            <span className="text-gray-900 font-extrabold text-sm mt-0.5">{selectedDoc.data.client_name}</span>
                            <span className="text-gray-500 mt-1">Calon Pembeli Cluster Perumahan</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] text-gray-400 uppercase font-bold">Jatuh Tempo:</span>
                            <span className="text-gray-800 mt-0.5">{new Date(selectedDoc.data.due_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* Invoice items table */}
                        <div className="flex flex-col mt-2">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-gray-200 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                                <th className="pb-2">Rincian Deskripsi Item Pembayaran</th>
                                <th className="pb-2 text-center w-12">Qty</th>
                                <th className="pb-2 text-right w-32">Harga Satuan</th>
                                <th className="pb-2 text-right w-32">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedDoc.data.items?.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-50 py-3 print:py-1 text-gray-800 font-medium">
                                  <td className="py-2.5 print:py-1">{item.name}</td>
                                  <td className="py-2.5 print:py-1 text-center">{item.qty}</td>
                                  <td className="py-2.5 print:py-1 text-right">{formatIDR(item.price)}</td>
                                  <td className="py-2.5 print:py-1 text-right font-bold">{formatIDR(item.price * item.qty)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Totals side calculation */}
                        <div className="flex flex-col items-end gap-2 print:gap-1 border-t border-gray-100 pt-4 print:pt-2 mt-auto">
                          <div className="flex w-64 justify-between text-xs text-gray-500 font-semibold">
                            <span>Subtotal:</span>
                            <span className="text-gray-800">{formatIDR(selectedDoc.data.subtotal)}</span>
                          </div>
                          {selectedDoc.data.tax_applied && (
                            <div className="flex w-64 justify-between text-xs text-gray-500 font-semibold">
                              <span>PPN (11%):</span>
                              <span className="text-gray-800">{formatIDR(selectedDoc.data.tax_amount)}</span>
                            </div>
                          )}
                          <div className="flex w-64 justify-between text-sm font-black border-t border-gray-200 pt-2.5 mt-1 text-gray-900">
                            <span>Total Tagihan:</span>
                            <span className="text-blue-700">{formatIDR(selectedDoc.data.total_amount)}</span>
                          </div>
                        </div>

                        {/* Payment Instructions footer */}
                        <div className="bg-gray-50 border border-gray-200/50 p-4 print:p-2.5 rounded-xl text-[10px] text-gray-500 font-semibold mt-6 print:mt-3 leading-relaxed">
                          <span className="font-extrabold text-gray-800 uppercase block mb-1">Metode Instruksi Pembayaran:</span>
                          <span>Silakan melakukan transfer penuh ke rekening virtual berikut:</span>
                          <span className="block mt-1 font-bold text-gray-800">{selectedDoc.data.payment_method}</span>
                          <span className="font-extrabold text-blue-700 text-xs block mt-0.5">{selectedDoc.data.bank_account || docBankAccount}</span>
                          <span className="block mt-2 italic">* Bukti transfer pembayaran wajib dilampirkan dan diverifikasi oleh keuangan developer.</span>
                        </div>
                      </div>
                    )}

                    {selectedDoc.doc_type === 'Kwitansi' && (
                      <div className="flex-1 flex flex-col gap-6 print:gap-3 text-xs font-semibold leading-relaxed">
                        <div className="flex flex-col gap-4 print:gap-2 border border-gray-200 rounded-xl p-6 print:p-4 bg-gray-50/30">
                          <div className="flex border-b border-gray-100 pb-3 print:pb-2 items-center">
                            <span className="w-32 text-gray-400 font-bold uppercase tracking-wider text-[9px]">Telah Diterima Dari:</span>
                            <span className="font-black text-gray-800 text-sm">{selectedDoc.data.receiver_name}</span>
                          </div>

                          <div className="flex border-b border-gray-100 pb-3 print:pb-2 items-center">
                            <span className="w-32 text-gray-400 font-bold uppercase tracking-wider text-[9px]">Jumlah Uang:</span>
                            <span className="font-bold text-gray-600 bg-white border border-gray-100 px-3 py-1.5 rounded-lg flex-1 italic">&quot;{selectedDoc.data.nominal_words}&quot;</span>
                          </div>

                          <div className="flex items-start">
                            <span className="w-32 text-gray-400 font-bold uppercase tracking-wider text-[9px] mt-1">Untuk Pembayaran:</span>
                            <span className="font-bold text-gray-800 flex-1">{selectedDoc.data.keterangan}</span>
                          </div>
                        </div>

                        <div className="mt-8 print:mt-4 flex justify-between items-center bg-blue-50/50 border border-blue-100 px-6 py-4 print:py-2.5 print:px-4 rounded-xl">
                          <span className="text-[10px] text-blue-500 uppercase font-bold tracking-widest">JUMLAH NOMINAL TERBILANG:</span>
                          <span className="text-xl font-black text-blue-700">{formatIDR(selectedDoc.data.nominal_amount)}</span>
                        </div>
                      </div>
                    )}

                    {selectedDoc.doc_type === 'Surat' && (
                      <div className="flex-1 flex flex-col gap-6 print:gap-3 text-xs font-semibold leading-relaxed text-gray-800">
                        <div className="flex flex-col gap-4 print:gap-2">
                          <p className="font-medium text-justify">
                            Yang bertanda tangan di bawah ini mewakili manajemen <strong>{docName}</strong>, menerangkan dengan sebenarnya bahwasanya:
                          </p>

                          <div className="flex flex-col gap-2 bg-gray-50 border border-gray-100 p-4 print:p-3 rounded-xl">
                            <div className="flex">
                              <span className="w-24 text-gray-400 font-bold uppercase tracking-wider text-[9px]">Nama Pegawai:</span>
                              <span className="font-black text-gray-900">{selectedDoc.data.receiver_name}</span>
                            </div>
                            <div className="flex">
                              <span className="w-24 text-gray-400 font-bold uppercase tracking-wider text-[9px]">Jabatan / Role:</span>
                              <span className="font-bold text-gray-700">{selectedDoc.data.receiver_role}</span>
                            </div>
                            <div className="flex">
                              <span className="w-24 text-gray-400 font-bold uppercase tracking-wider text-[9px]">Mulai Berlaku:</span>
                              <span className="font-bold text-gray-700">{new Date(selectedDoc.data.date_effective).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                          </div>

                          <p className="font-medium text-justify whitespace-pre-wrap mt-2 print:mt-1">
                            {selectedDoc.data.content || 'Diberikan wewenang penuh untuk melaksanakan tugas operasional lapangan sesuai ketetapan manajemen.'}
                          </p>

                          <p className="font-medium text-justify mt-4 print:mt-2">
                            Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya dengan penuh tanggung jawab.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* QR Code and signatures section */}
                    <div className="mt-12 print:mt-6 pt-6 print:pt-4 border-t border-gray-100 flex justify-between items-end">
                      <div className="flex flex-col text-left gap-1">
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase">Tanda Tangan Elektronik</span>
                        {selectedDoc.status === 'approved' ? (
                          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200/50 p-2 rounded-xl">
                            <img src={qrImageSrc} className="w-16 h-16 bg-white p-1 border border-gray-100 rounded" alt="verify qr" />
                            <div className="flex flex-col text-[8px] font-bold text-gray-400 leading-tight">
                              <span className="text-green-600 text-[10px] font-black uppercase mb-0.5">DOKUMEN VALID</span>
                              <span>Scan QR Code untuk verifikasi keaslian dokumen publik.</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-500 font-bold italic bg-amber-50 border border-amber-100 px-3 py-1 rounded">MENUNGGU APPROVAL RESMI</span>
                        )}
                      </div>

                      <div className="flex flex-col text-right font-bold gap-0.5">
                        <span className="text-gray-400 text-[9px] uppercase tracking-wider mb-12 print:mb-6">Authorized Signature</span>
                        <span className="text-gray-900 underline text-xs">Ahmad Admin</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">HR & IT Department Head</span>
                      </div>
                    </div>

                  </div>
                </>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 italic font-semibold shadow-sm">
                  Pilih dokumen dari daftar untuk melihat detail preview dan approval trail.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: CREATE DOCUMENT ==================== */}
        {activeTab === 'create' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-w-xl mx-auto w-full text-left">
            <h2 className="font-extrabold text-lg flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
              <Plus size={20} className="text-indigo-600" />
              Buat Dokumen Baru
            </h2>

            {/* Template Selector */}
            <div className="mb-5">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Pilih Jenis / Template Dokumen *</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                {docTemplates.map(tpl => (
                  <div
                    key={tpl.id}
                    className="relative group/tpl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(tpl);
                        setDocType(tpl.doc_type_key);
                        setCustomFieldValues({});
                      }}
                      className={`w-full flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        selectedTemplate?.id === tpl.id
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400 pr-12'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 pr-12'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <FileText size={12} className="text-indigo-500" />
                        <span className="text-[10px] font-mono font-bold text-gray-500">{tpl.prefix}</span>
                        {tpl.is_builtin && <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">built-in</span>}
                      </div>
                      <span className="text-xs font-extrabold text-gray-800 leading-snug">{tpl.name}</span>
                      {tpl.description && <span className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{tpl.description}</span>}
                    </button>
                    
                    {user?.role === 'admin' && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/tpl:opacity-100 transition-opacity">
                        <button
                          type="button"
                          title="Edit Template"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/backoffice?tab=templates&edit=${tpl.id}`;
                          }}
                          className="p-1 rounded bg-white hover:bg-indigo-50 text-indigo-600 border border-gray-200 shadow-sm transition-all"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          type="button"
                          title="Hapus Template"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(tpl.id);
                          }}
                          className="p-1 rounded bg-white hover:bg-red-50 text-red-600 border border-gray-200 shadow-sm transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateDocument} className="flex flex-col gap-4 text-xs font-semibold">
              
              <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200/50 p-4 rounded-2xl mb-2">
                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Pemberkasan untuk Proyek Perumahan *</label>
                <select
                  value={docClusterId}
                  onChange={e => setDocClusterId(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none bg-white font-bold text-gray-800 focus:border-blue-500"
                  required
                >
                  <option value="">-- PILIH PROYEK PERUMAHAN --</option>
                  {clusters.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 font-medium">Dokumen dan Kop Surat akan otomatis disesuaikan dengan profil perumahan yang dipilih.</p>
              </div>

              {/* Form: INVOICE (builtin) */}
              {selectedTemplate?.doc_type_key === 'Invoice' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Hubungkan Prospek Klien *</label>
                    <select
                      value={invProspectId}
                      onChange={e => setInvProspectId(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                    >
                      {prospects.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Rincian Item Pembayaran *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Booking Fee Kavling Melati A-04..."
                      value={invItemName}
                      onChange={e => setInvItemName(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nominal (IDR) *</label>
                      <input
                        type="number"
                        required
                        placeholder="Masukkan harga satuan..."
                        value={invPrice || ''}
                        onChange={e => setInvPrice(Number(e.target.value))}
                        className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div className="border border-gray-200 rounded-xl px-4 h-10 flex items-center justify-between">
                      <span className="text-gray-400 text-[10px] uppercase font-bold">Kenakan PPN (11%)</span>
                      <input type="checkbox" checked={invTax} onChange={e => setInvTax(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Catatan / Remarks Invoice</label>
                    <textarea
                      placeholder="Contoh: Pembayaran DP Tahap 1 wajib dilunasi sebelum..."
                      value={invNotes}
                      onChange={e => setInvNotes(e.target.value)}
                      rows={2}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none resize-none"
                    ></textarea>
                  </div>
                </>
              )}

              {/* Form: KWITANSI (builtin) */}
              {selectedTemplate?.doc_type_key === 'Kwitansi' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Hubungkan Invoice Approved (Salin Data)</label>
                    <select
                      value={kwtInvoiceId}
                      onChange={e => handleKwtInvoiceChange(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                    >
                      <option value="">-- PILIH INVOICE JIKA ADA --</option>
                      {documents.filter(d => d.doc_type === 'Invoice').map(d => (
                        <option key={d.id} value={d.id}>{d.doc_number} ({d.data.client_name} - {formatIDR(d.data.total_amount)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Telah Diterima Dari (Nama) *</label>
                    <input type="text" required placeholder="Masukkan nama pembayar..." value={kwtPenerima}
                      onChange={e => setKwtPenerima(e.target.value)} className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Jumlah Uang (Nominal IDR) *</label>
                    <input type="number" required placeholder="Masukkan jumlah nominal..." value={kwtNominal || ''}
                      onChange={e => setKwtNominal(Number(e.target.value))} className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
                    {kwtNominal > 0 && (
                      <span className="text-[10px] text-gray-500 italic mt-0.5">
                        Terbilang: &quot;{terbilang(kwtNominal)} rupiah&quot;
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Keterangan Pembayaran *</label>
                    <input type="text" required placeholder="Contoh: Pembayaran Pelunasan Down Payment Kavling..." value={kwtKeterangan}
                      onChange={e => setKwtKeterangan(e.target.value)} className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
                  </div>
                </>
              )}

              {/* Form: SURAT RESMI (builtin) */}
              {selectedTemplate?.doc_type_key === 'Surat' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Pilih Template Surat</label>
                      <select value={srtTemplate} onChange={e => setSrtTemplate(e.target.value)}
                        className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none">
                        <option value="Surat Tugas">Surat Tugas Lapangan</option>
                        <option value="Surat Pengantar">Surat Pengantar Proyek</option>
                        <option value="Surat Keterangan">Surat Keterangan Kerja</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Tanggal Berlaku *</label>
                      <input type="date" required value={srtTanggal} onChange={e => setSrtTanggal(e.target.value)}
                        className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Penerima Surat *</label>
                      <input type="text" required placeholder="Nama pegawai / staf..." value={srtPenerima}
                        onChange={e => setSrtPenerima(e.target.value)} className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-gray-400 uppercase tracking-wider text-[9px]">Jabatan / Divisi *</label>
                      <input type="text" required placeholder="Contoh: Sales Marketing..." value={srtJabatan}
                        onChange={e => setSrtJabatan(e.target.value)} className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Isi Konten Surat Wewenang *</label>
                    <textarea required placeholder="Masukkan deskripsi tugas wewenang atau isi lengkap surat..."
                      value={srtIsi} onChange={e => setSrtIsi(e.target.value)} rows={4}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none resize-none font-medium"></textarea>
                  </div>
                </>
              )}

              {/* Form: CUSTOM TEMPLATE — dynamic fields from data_field blocks */}
              {selectedTemplate && !['Invoice', 'Kwitansi', 'Surat'].includes(selectedTemplate.doc_type_key) && (
                <>
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                    <FileText size={14} className="text-indigo-500" />
                    <div>
                      <p className="text-xs font-extrabold text-indigo-800">{selectedTemplate.name}</p>
                      <p className="text-[9px] text-indigo-500">{selectedTemplate.description || 'Template kustom'} · Nomor: {selectedTemplate.prefix}/YYYY/MM/####</p>
                    </div>
                  </div>

                  {/* Render data_field blocks as form inputs */}
                  {selectedTemplate.blocks
                    .filter(b => b.type === 'data_field' && b.variable_key)
                    .map(b => (
                      <div key={b.id} className="flex flex-col gap-1.5">
                        <label className="text-gray-400 uppercase tracking-wider text-[9px]">
                          {b.variable_label || b.variable_key} {b.variable_required && <span className="text-red-400">*</span>}
                        </label>
                        <input
                          type="text"
                          required={b.variable_required}
                          placeholder={`Isi ${b.variable_label || b.variable_key}...`}
                          value={customFieldValues[b.variable_key!] || ''}
                          onChange={e => setCustomFieldValues(prev => ({ ...prev, [b.variable_key!]: e.target.value }))}
                          className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                    ))
                  }

                  {selectedTemplate.blocks.filter(b => b.type === 'data_field').length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                      Template ini tidak memiliki field data. Langsung buat dokumen.
                    </div>
                  )}
                </>
              )}

              {!selectedTemplate && (
                <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                  Pilih jenis dokumen / template di atas untuk memulai.
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedTemplate}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={16} />
                BUAT DOKUMEN RESMI (DRAFT)
              </button>
            </form>
          </div>
        )}

        {/* ==================== TAB: QUEUE PERSUB/APPROVALS ==================== */}
        {activeTab === 'queue' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-left max-w-xl mx-auto w-full">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-extrabold text-xs text-gray-500 uppercase tracking-wider flex justify-between items-center">
              <span>Antrean Menunggu Approval Anda</span>
              <span className="text-[10px] text-blue-600 font-black bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                Role: {user?.role} · {user?.department}
              </span>
            </div>

            <div className="flex flex-col max-h-[60vh] overflow-y-auto no-scrollbar">
              {approvalQueue.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-2 text-gray-400 italic">
                  <FileCheck size={36} className="text-gray-300 animate-bounce" style={{ animationDuration: '4s' }} />
                  <span className="text-xs font-semibold">Semua antrean approval bersih!</span>
                </div>
              ) : (
                approvalQueue.map((doc) => (
                  <div key={doc.id} className="p-5 border-b border-gray-100 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-sm text-gray-900 block">{doc.doc_number} ({doc.doc_type})</span>
                        <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">Pemohon: Staff Keuangan / Sales</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 border border-amber-100 rounded">
                        MENUNGGU LEVEL {doc.approval_chain.find(c => c.status === 'pending')?.level}
                      </span>
                    </div>

                    {/* Quick description info */}
                    <div className="bg-gray-50 border border-gray-200/50 p-3.5 rounded-xl text-xs flex flex-col gap-1 font-semibold text-gray-700">
                      {doc.doc_type === 'Invoice' && (
                        <>
                          <div>Client: <span className="text-gray-900 font-extrabold">{doc.data.client_name}</span></div>
                          <div>Total Tagihan: <span className="text-blue-600 font-extrabold">{formatIDR(doc.data.total_amount)}</span></div>
                        </>
                      )}
                      {doc.doc_type === 'Kwitansi' && (
                        <>
                          <div>Diterima Dari: <span className="text-gray-900 font-extrabold">{doc.data.receiver_name}</span></div>
                          <div>Total Diterima: <span className="text-blue-600 font-extrabold">{formatIDR(doc.data.nominal_amount)}</span></div>
                        </>
                      )}
                      {doc.doc_type === 'Surat' && (
                        <>
                          <div>Pegawai: <span className="text-gray-900 font-extrabold">{doc.data.receiver_name}</span></div>
                          <div>Tujuan: <span className="text-gray-800 font-bold">{doc.data.template_name}</span></div>
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2.5">
                      <input
                        type="text"
                        placeholder="Tuliskan catatan / disposisi persetujuan (Opsional)..."
                        value={appRemarks}
                        onChange={e => setAppRemarks(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            handleApprove(doc.id);
                          }}
                          className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Check size={14} /> Setujui Dokumen
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            handleReject(doc.id);
                          }}
                          className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <X size={14} /> Tolak / Kembalikan
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODAL: REVOKE DOCUMENT WARNING */}
        {isRevokeOpen && selectedDoc && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto animate-bounce">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-950">Cabut Dokumen Resmi</h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">
                  Apakah Anda yakin ingin mencabut dokumen <strong>{selectedDoc.doc_number}</strong>? 
                  Aksi ini bersifat permanen. Status verifikasi publik akan berubah menjadi <strong>TIDAK BERLAKU</strong>.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 text-left text-xs font-bold">
                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Alasan Pencabutan *</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan alasan pembatalan dokumen..."
                  value={revokeReason}
                  onChange={e => setRevokeReason(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRevoke}
                  disabled={!revokeReason}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Ya, Cabut Dokumen
                </button>
                <button
                  onClick={() => setIsRevokeOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 border rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
