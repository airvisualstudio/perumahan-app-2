"use client";

import React, { useEffect, useState, use } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  DollarSign, 
  MapPin, 
  Tag, 
  Plus, 
  Clock, 
  Check, 
  AlertTriangle, 
  Camera, 
  Paperclip,
  ArrowLeft,
  X,
  Eye,
  MessageSquare,
  Download,
  ExternalLink,
  Image,
  FileText,
  File,
  Trash2,
  Home as HomeIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

interface Company {
  id: string;
  name: string;
  code: string;
  legal_name?: string;
}

interface Cluster {
  id: string;
  name: string;
  company_id?: string;
}

interface UnitType {
  id: string;
  name: string;
  building_area: number;
  land_area: number;
}

interface Unit {
  id: string;
  cluster_id: string;
  unit_type_id: string;
  block_number: string;
  sell_price: number;
  orientation: string;
  status: string;
  reserved_for?: string;
  bank_name?: string;
  akad_date?: string;
  loan_amount?: number;
  interest_rate?: number;
}

interface Prospect {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  occupation?: string;
  company_name?: string;
  estimated_income?: number;
  lead_source: string;
  pipeline_stage: 'prospect_baru' | 'dihubungi' | 'survei' | 'penawaran' | 'booking' | 'kpr_process' | 'akad' | 'stk' | 'batal';
  assigned_to: string;
  interested_cluster_id?: string;
  interested_type_id?: string;
  booked_unit_id?: string;
  tags: string[];
  notes?: string;
  last_followup_at?: string;
  created_by?: string;
  created_at: string;
  attachments?: { id: string; url: string; file_name: string; file_size_bytes: number }[];
}

interface Document {
  id: string;
  doc_type: string;
  doc_number: string;
  status: string;
  created_at: string;
  data: any;
}

interface FollowupComment {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  content: string;
  created_at: string;
}

interface Followup {
  id: string;
  prospect_id: string;
  conducted_by: string;
  followup_type: string;
  followup_at: string;
  notes: string;
  prospect_response: string;
  next_followup_at?: string;
  next_followup_note?: string;
  attachments: { id: string; url: string; file_name: string; file_size_bytes: number }[];
  created_at: string;
  comments?: FollowupComment[];
}

interface HistoryLog {
  id: string;
  prospect_id: string;
  event_type: string;
  actor_id?: string;
  metadata?: any;
  description: string;
  created_at: string;
}

const pipelineStages = [
  { key: 'prospect_baru', label: 'Prospect Baru', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'dihubungi', label: 'Dihubungi', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'survei', label: 'Survei Lokasi', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'penawaran', label: 'Penawaran', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { key: 'booking', label: 'Booking Fee', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'kpr_process', label: 'Proses KPR/Cash', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'akad', label: 'Akad', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'stk', label: 'Serah Terima', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { key: 'batal', label: 'Batal', color: 'bg-red-100 text-red-700 border-red-200' }
];

export default function ProspectDetailPage({ params }: Props) {
  const unwrappedParams = use(params);
  const prospectId = unwrappedParams.id;
  const { user } = useAuth();
  const router = useRouter();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for Followup Details and Comment Thread Modal
  const [selectedFollowupForModal, setSelectedFollowupForModal] = useState<Followup | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  // Follow-up Form state
  const [fuType, setFuType] = useState<'telepon' | 'whatsapp' | 'kunjungan' | 'email' | 'meeting' | 'video_call'>('whatsapp');
  const [fuNotes, setFuNotes] = useState('');
  const [fuResponse, setFuResponse] = useState<'very_interested' | 'interested' | 'considering' | 'not_interested'>('interested');
  const [fuNextDate, setFuNextDate] = useState('');
  const [fuNextNote, setFuNextNote] = useState('');
  const [uploadedImages, setUploadedImages] = useState<{ url: string; name: string }[]>([]);

  // Lightbox Image
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  
  // Document / PDF Preview Modal State
  const [docPreviewModal, setDocPreviewModal] = useState<{
    url: string;
    fileName: string;
    isPdf: boolean;
  } | null>(null);

  const getFileBlobUrl = (url: string, mimeType?: string): string => {
    if (!url || !url.startsWith('data:')) return url;
    try {
      const parts = url.split(';base64,');
      const contentType = mimeType || parts[0].replace('data:', '');
      const base64Str = parts[1];
      if (!base64Str) return url;

      const byteCharacters = atob(base64Str);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("Error converting Data URL to Blob:", err);
      return url;
    }
  };

  const handleOpenFile = (att: { url: string; file_name: string }) => {
    if (!att || !att.url) return;
    const url = att.url;
    const fileName = att.file_name || 'berkas';

    const isImg = url.startsWith('data:image/') || 
                  url.includes('images.unsplash.com') || 
                  /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);

    if (isImg) {
      setLightboxImg(url);
      return;
    }

    const isPdf = url.startsWith('data:application/pdf') || /\.pdf$/i.test(fileName);
    const viewUrl = getFileBlobUrl(url, isPdf ? 'application/pdf' : undefined);

    if (isPdf) {
      setDocPreviewModal({
        url: viewUrl,
        fileName,
        isPdf: true
      });
      return;
    }

    // For other document types (DOCX, XLSX, TXT, etc.), trigger download
    triggerFileDownload(att);
  };

  const triggerFileDownload = (att: { url: string; file_name: string }) => {
    if (!att || !att.url) return;
    const url = att.url;
    const fileName = att.file_name || 'berkas';
    const downloadUrl = getFileBlobUrl(url);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // State & Handler Hapus Berkas Lampiran (RBAC Role-Based)
  const [attachmentToDelete, setAttachmentToDelete] = useState<{ id: string; file_name: string } | null>(null);
  const [isDeletingAtt, setIsDeletingAtt] = useState(false);

  const handleConfirmDeleteAttachment = async () => {
    if (!attachmentToDelete || !prospect || !user) return;
    setIsDeletingAtt(true);
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_prospect_attachment',
          prospect_id: prospect.id,
          attachment_id: attachmentToDelete.id,
          actor_id: user.id
        })
      });
      const result = await res.json();
      if (result.success) {
        setAttachmentToDelete(null);
        fetchDetails();
      } else {
        alert(result.error || 'Gagal menghapus berkas.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat menghapus berkas.');
    } finally {
      setIsDeletingAtt(false);
    }
  };
  
  // Transition confirm warning
  const [isTransitionWarningOpen, setIsTransitionWarningOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<string>('');

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/crm`);
      const crmJson = await res.json();
      
      const dbRes = await fetch(`/api/db`);
      const dbJson = await dbRes.json();
      
      const dbData = dbJson.data;

      const p = dbData.prospects.find((item: any) => item.id === prospectId);
      if (!p) {
        router.push('/crm');
        return;
      }
      
      setProspect(p);
      setClusters(dbData.clusters || []);
      setUnits(dbData.units || []);
      setUnitTypes(dbData.unitTypes || []);
      setCompanies(dbData.companies || []);
      
      // Filter followups and histories
      const filteredFUs = dbData.followups.filter((f: any) => f.prospect_id === prospectId);
      const filteredHist = dbData.prospectHistory.filter((h: any) => h.prospect_id === prospectId);
      
      setFollowups(filteredFUs);
      setHistory(filteredHist);

      // Fetch and filter official documents
      const docsRes = await fetch(`/api/documents`);
      const docsJson = await docsRes.json();
      if (docsJson.success) {
        const filteredDocs = (docsJson.documents || []).filter(
          (doc: any) => doc.data?.prospect_id === prospectId
        );
        setDocuments(filteredDocs);
      }

      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [prospectId]);

  const handleStageChangeAttempt = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextVal = e.target.value;
    if (nextVal === 'akad' && user?.role === 'staff') {
      // Prompt warning that Supervisor/Manager role is required
      setTargetStage(nextVal);
      setIsTransitionWarningOpen(true);
    } else {
      updateStage(nextVal);
    }
  };

  const updateStage = async (stage: string) => {
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_prospect_stage',
          prospect_id: prospectId,
          new_stage: stage,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        // Trigger simulated Slack alert
        const message = `Sales Rina Wijaya memindahkan prospek *${prospect?.full_name}* ke stage *${stage.toUpperCase()}*`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'marketing-notif', message }
        }));
        
        setIsTransitionWarningOpen(false);
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Convert uploaded image file to base64 for mockup saving
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => [...prev, {
          url: reader.result as string,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const attachments = uploadedImages.map(img => ({
        id: 'att-' + Math.random().toString(36).substr(2, 9),
        url: img.url,
        file_name: img.name,
        file_size_bytes: Math.round(img.url.length * 0.75) // Rough byte size estimate
      }));

      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_followup',
          prospect_id: prospectId,
          followup_type: fuType,
          notes: fuNotes,
          prospect_response: fuResponse,
          next_followup_at: fuNextDate || undefined,
          next_followup_note: fuNextNote || undefined,
          attachments,
          actor_id: user?.id
        })
      });

      const result = await res.json();
      if (result.success) {
        const message = `Follow-up baru ditambahkan oleh ${user?.name} untuk *${prospect?.full_name}* via *${fuType}*`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'marketing-notif', message }
        }));

        setFuNotes('');
        setFuNextDate('');
        setFuNextNote('');
        setUploadedImages([]);
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDossier = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !prospect) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_prospect_attachment',
            prospect_id: prospect.id,
            attachment: {
              url: reader.result as string,
              file_name: file.name,
              file_size_bytes: file.size
            },
            actor_id: user?.id
          })
        });
        const result = await res.json();
        if (result.success) {
          const message = `Sales Rina Wijaya mengunggah berkas dokumen konsumen *${prospect.full_name}*: *${file.name}*`;
          window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
            detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'marketing-notif', message }
          }));
          fetchDetails();
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddFollowupComment = async (followupId: string) => {
    if (!newCommentText.trim() || !user || !prospect) return;
    
    const canComment = user.role === 'manager' || user.role === 'admin' || prospect.assigned_to === user.id;
    if (!canComment) {
      alert("Anda tidak memiliki izin untuk memberikan komentar pada prospek ini.");
      return;
    }

    setIsCommentSubmitting(true);
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_followup_comment',
          followup_id: followupId,
          content: newCommentText,
          actor_id: user.id
        })
      });
      const result = await res.json();
      if (result.success) {
        const message = `User ${user.name} (${user.role}) mengomentari follow-up prospek *${prospect?.full_name}*: "${newCommentText.substring(0, 40)}${newCommentText.length > 40 ? '...' : ''}"`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'marketing-notif', message }
        }));
        
        setNewCommentText('');
        const updatedFollowup = result.followup;
        
        // Update both local state list and local modal state
        setFollowups(prev => prev.map(f => f.id === followupId ? updatedFollowup : f));
        setSelectedFollowupForModal(updatedFollowup);
        
        // Refresh details (history, etc)
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading || !prospect) {
    return (
      <AppShell>
        <div className="animate-pulse gap-6 flex flex-col w-full">
          <div className="h-6 bg-gray-200 rounded-lg w-16"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-96 bg-gray-200 rounded-xl"></div>
            <div className="md:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const unitStatusLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    available: { label: 'Tersedia', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    reserved: { label: 'Reserved', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    booking: { label: 'Booking Fee', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    kpr_process: { label: 'Proses KPR/Cash', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    sold: { label: 'Terjual (Akad PPJB)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    unavailable: { label: 'Tidak Tersedia', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  };

  const selectedCluster = clusters.find(c => c.id === prospect.interested_cluster_id);
  const activeStageConfig = pipelineStages.find(s => s.key === prospect.pipeline_stage);

  // Find booked / purchased unit for this prospect
  const bookedUnit = units.find(u => u.id === prospect.booked_unit_id || u.reserved_for === prospect.id);
  const bookedCluster = clusters.find(c => c.id === (bookedUnit ? bookedUnit.cluster_id : prospect.interested_cluster_id));
  const bookedType = unitTypes.find(t => t.id === (bookedUnit ? bookedUnit.unit_type_id : prospect.interested_type_id));
  const bookedCompany = companies.find(comp => comp.id === bookedCluster?.company_id);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full">
        {/* Back Link */}
        <Link href="/crm" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors self-start">
          <ArrowLeft size={16} />
          KEMBALI KE CRM
        </Link>

        {/* Prospect Banner Profile */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl">
              {prospect.full_name[0].toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-2xl font-black text-gray-950 leading-tight">{prospect.full_name}</h1>
              <span className="text-xs text-gray-400 font-semibold mt-0.5">Assigned Agent: Rina Wijaya (Sales)</span>
            </div>
          </div>

          {/* Select dropdown stage switcher */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">Tahapan:</span>
            <select
              value={prospect.pipeline_stage}
              onChange={handleStageChangeAttempt}
              className={`px-3 py-2 border rounded-xl text-xs font-extrabold focus:outline-none ${activeStageConfig?.color}`}
            >
              {pipelineStages.map((stage) => (
                <option key={stage.key} value={stage.key} className="bg-white text-gray-800 font-semibold">
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Details and Timeline Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Profile Card Info & Unit Details */}
          <div className="flex flex-col gap-6">
            
            {/* Unit Kavling Dipilih / Diproses Akad Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="font-extrabold text-base flex items-center gap-2 text-gray-900">
                  <HomeIcon size={18} className="text-emerald-600" />
                  Detail Unit Dibeli / Diproses
                </h2>
                {bookedUnit && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${unitStatusLabels[bookedUnit.status]?.bg || 'bg-blue-50'} ${unitStatusLabels[bookedUnit.status]?.text || 'text-blue-700'} ${unitStatusLabels[bookedUnit.status]?.border || 'border-blue-200'}`}>
                    {unitStatusLabels[bookedUnit.status]?.label || bookedUnit.status}
                  </span>
                )}
              </div>

              {bookedUnit ? (
                <div className="flex flex-col gap-4">
                  {/* Block Number & Price Banner */}
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4.5 rounded-2xl text-white flex justify-between items-center shadow-md border border-slate-800">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Unit Kavling</span>
                      <span className="text-2xl font-black text-white tracking-tight">{bookedUnit.block_number}</span>
                      <span className="text-xs text-indigo-200 font-bold mt-0.5">
                        {bookedCluster?.name || 'Cluster Properti'} 
                        {bookedCompany ? ` · ${bookedCompany.name}` : ''}
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Harga Jual</span>
                      <span className="text-lg font-black text-emerald-400">
                        {formatIDR(bookedUnit.sell_price)}
                      </span>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-0.5">
                        Orientasi: {bookedUnit.orientation?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Unit Technical & KPR Specification Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tipe Bangunan</span>
                      <span className="text-gray-800 font-extrabold">{bookedType?.name || 'Tipe Standar'}</span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        LB {bookedType?.building_area || 0}m² / LT {bookedType?.land_area || 0}m²
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Bank Pembiayaan</span>
                      <span className="text-gray-800 font-extrabold">{bookedUnit.bank_name || 'Bank KPR / Cash'}</span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        Suku Bunga: {bookedUnit.interest_rate ? `${bookedUnit.interest_rate}%` : '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Estimasi Plafon KPR</span>
                      <span className="text-emerald-700 font-extrabold">
                        {bookedUnit.loan_amount ? formatIDR(bookedUnit.loan_amount) : '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Jadwal / Tanggal Akad</span>
                      <span className="text-indigo-700 font-extrabold">
                        {bookedUnit.akad_date ? new Date(bookedUnit.akad_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Direct Link Button to Siteplan Map */}
                  <Link
                    href={`/crm?clusterId=${bookedUnit.cluster_id}&unitId=${bookedUnit.id}`}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all group cursor-pointer"
                  >
                    <MapPin size={16} className="group-hover:scale-110 transition-transform" />
                    <span>LIHAT POSISI UNIT DI SITEPLAN MAPS ➔</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3 text-center py-2">
                  <p className="text-xs text-gray-500 font-medium">Prospek ini belum memiliki record pemesanan/booking unit kavling tertentu.</p>
                  <Link
                    href={`/crm?clusterId=${prospect.interested_cluster_id || ''}`}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MapPin size={14} className="text-emerald-400" />
                    <span>Buka Peta Siteplan Untuk Pilih Unit ➔</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                Informasi Kontak
              </h2>

              <div className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Telepon</span>
                    <span className="text-gray-800 font-bold">{prospect.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Email</span>
                    <span className="text-gray-800 font-bold">{prospect.email || '-'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Pekerjaan</span>
                    <span className="text-gray-800 font-bold">{prospect.occupation || '-'} {prospect.company_name ? `di ${prospect.company_name}` : ''}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Estimasi Penghasilan</span>
                    <span className="text-gray-800 font-bold">{prospect.estimated_income ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prospect.estimated_income) : '-'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Cluster Minat</span>
                    <span className="text-gray-800 font-bold">{selectedCluster?.name || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dossier and Documents Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h2 className="font-extrabold text-sm flex items-center gap-2">
                  <Paperclip size={18} className="text-blue-600" />
                  Berkas & Dokumen
                </h2>
                
                {/* Upload Button */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl cursor-pointer font-bold text-[11px] transition-colors border border-blue-100 shadow-2xs">
                  <Plus size={13} />
                  UNGGAH BERKAS
                  <input
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={handleUploadDossier}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Dossier Files (Pre-seeded & Uploaded) */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Berkas Lampiran Konsumen</h3>
                {prospect.attachments && prospect.attachments.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {prospect.attachments.map((att) => {
                      const isImg = att.url.startsWith('data:image/') || 
                                    att.url.includes('images.unsplash.com') || 
                                    /\.(png|jpe?g|webp|gif|svg)$/i.test(att.file_name);
                      const isPdf = att.url.startsWith('data:application/pdf') || /\.pdf$/i.test(att.file_name);
                      
                      const canDeleteAttachment = user?.role === 'admin' || 
                                                  user?.role === 'manager' || 
                                                  prospect?.assigned_to === user?.id || 
                                                  prospect?.created_by === user?.id;

                      return (
                        <div 
                          key={att.id}
                          className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200/70 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl transition-all group"
                        >
                          <div 
                            onClick={() => handleOpenFile(att)}
                            className="flex items-center gap-2.5 truncate max-w-[55%] cursor-pointer flex-1"
                            title={`Klik untuk melihat: ${att.file_name}`}
                          >
                            {isImg ? (
                              <Image size={16} className="text-purple-600 flex-shrink-0" />
                            ) : isPdf ? (
                              <FileText size={16} className="text-red-600 flex-shrink-0" />
                            ) : (
                              <Paperclip size={16} className="text-blue-600 flex-shrink-0" />
                            )}
                            <div className="flex flex-col truncate text-left">
                              <span className="font-bold text-slate-800 text-xs truncate group-hover:text-blue-700 transition-colors">
                                {att.file_name}
                              </span>
                              <span className="text-[9px] text-gray-400 font-semibold">
                                {formatBytes(att.file_size_bytes)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFile(att);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white border border-gray-200 text-blue-700 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                              title="Buka / Pratinjau Berkas"
                            >
                              <Eye size={12} />
                              <span>Buka</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerFileDownload(att);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-gray-800 hover:text-white border border-gray-200 text-gray-700 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                              title="Unduh Berkas"
                            >
                              <Download size={12} />
                              <span>Unduh</span>
                            </button>

                            {canDeleteAttachment ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAttachmentToDelete(att);
                                }}
                                className="px-2 py-1 bg-white hover:bg-red-600 hover:text-white border border-red-200 text-red-600 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                                title="Hapus Berkas (Hak Akses Sesuai Role)"
                              >
                                <Trash2 size={12} />
                                <span>Hapus</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-not-allowed"
                                title="Hanya Admin/Manager atau Sales penanggung jawab yang dapat menghapus berkas ini"
                              >
                                <Trash2 size={12} />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-gray-100 rounded-xl text-gray-400 italic text-[11px]">
                    Belum ada berkas lampiran diunggah.
                  </div>
                )}
              </div>

              {/* Official Web Documents List */}
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Dokumen Resmi Platform</h3>
                {documents.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {documents.map((doc) => {
                      let badgeColor = 'bg-gray-100 text-gray-700 border-gray-200';
                      if (doc.status === 'approved') badgeColor = 'bg-green-50 text-green-700 border-green-100';
                      else if (doc.status === 'pending_approval') badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                      else if (doc.status === 'rejected') badgeColor = 'bg-red-50 text-red-700 border-red-100';

                      return (
                        <Link
                          key={doc.id}
                          href={`/documents?docId=${doc.id}`}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 rounded-xl transition-all"
                        >
                          <div className="flex flex-col text-left gap-0.5 truncate max-w-[65%]">
                            <span className="font-bold text-slate-800 text-[11px] truncate">{doc.doc_number}</span>
                            <span className="text-[9px] text-gray-400 font-bold">{doc.doc_type}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase flex-shrink-0 ${badgeColor}`}>
                            {doc.status.replace('_', ' ')}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-gray-100 rounded-xl text-gray-400 italic text-[11px]">
                    Belum ada dokumen resmi dibuat.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Timeline History and Follow-up logger */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Form logger Follow-up */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 flex items-center gap-2">
                <MessageSquare size={18} className="text-indigo-600" />
                Catat Follow-up Baru
              </h2>

              <form onSubmit={handleAddFollowup} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tipe Follow-up</label>
                    <select
                      value={fuType}
                      onChange={(e) => setFuType(e.target.value as any)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    >
                      <option value="whatsapp">WhatsApp Chat</option>
                      <option value="telepon">Panggilan Telepon</option>
                      <option value="kunjungan">Kunjungan Lapangan</option>
                      <option value="meeting">Meeting Kantor</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px]">Respon Prospek</label>
                    <select
                      value={fuResponse}
                      onChange={(e) => setFuResponse(e.target.value as any)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    >
                      <option value="very_interested">Sangat Tertarik (Very Interested)</option>
                      <option value="interested">Tertarik (Interested)</option>
                      <option value="considering">Pikir-Pikir (Considering)</option>
                      <option value="not_interested">Tidak Berminat (Not Interested)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Catatan Detail Pembahasan *</label>
                  <textarea
                    required
                    placeholder="Tuliskan detail hasil interaksi / follow-up calon pembeli..."
                    value={fuNotes}
                    onChange={(e) => setFuNotes(e.target.value)}
                    rows={3}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                  ></textarea>
                </div>

                {/* Upload Image Proofs */}
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Bukti Dokumentasi (Maks 5 Gambar)</label>
                  <div className="flex flex-wrap gap-3 items-center">
                    <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors text-gray-400">
                      <Camera size={20} />
                      <span className="text-[8px] font-bold mt-1">CAMERA</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 border rounded-xl relative overflow-hidden bg-gray-50">
                        <img src={img.url} className="w-full h-full object-cover" alt="upload" />
                        <button
                          type="button"
                          onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black text-white p-0.5 rounded-full"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Scheduled follow-up */}
                <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Clock size={12} className="text-blue-500" />
                      Rencana Follow-up Berikutnya
                    </label>
                    <input
                      type="date"
                      value={fuNextDate}
                      onChange={(e) => setFuNextDate(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px]">Catatan Rencana Rencana</label>
                    <input
                      type="text"
                      placeholder="Simulasi KPR BCA, dll..."
                      value={fuNextNote}
                      onChange={(e) => setFuNextNote(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-3 mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  SIMPAN RECORD FOLLOW-UP
                </button>
              </form>
            </div>

            {/* Timeline Activities List */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h2 className="font-extrabold text-base border-b border-gray-100 pb-3">Riwayat Aktivitas & Timeline</h2>

              <div className="flex flex-col gap-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gray-100">
                {history.map((log) => {
                  const matchingFU = log.event_type === 'followup_added' 
                    ? followups.find(f => log.description.includes(f.followup_type) && new Date(f.created_at).getTime() - new Date(log.created_at).getTime() < 10000)
                    : null;
                  
                  const commentFU = log.event_type === 'followup_comment_added' && log.metadata?.followup_id
                    ? followups.find(f => f.id === log.metadata.followup_id)
                    : null;
                  
                  return (
                    <div key={log.id} className="flex gap-4 items-start relative text-xs">
                      {/* Timeline Dot */}
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 z-10 flex-shrink-0">
                        {log.event_type === 'stage_changed' ? '🔄' : log.event_type === 'followup_added' ? '📸' : log.event_type === 'followup_comment_added' ? '💬' : '🟢'}
                      </div>
                      
                      <div className="flex flex-col gap-1.5 bg-gray-50/50 border border-gray-200/50 p-4 rounded-xl flex-1 text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-gray-950">{log.description}</span>
                          <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleDateString('id-ID')} {new Date(log.created_at).toLocaleTimeString('id-ID')}</span>
                        </div>

                        {matchingFU && (
                          <div className="flex flex-col gap-2.5 mt-2 bg-white border border-gray-100 p-3 rounded-lg">
                            <p className="text-gray-600 font-semibold italic">&quot;{matchingFU.notes}&quot;</p>
                            
                            {matchingFU.attachments && matchingFU.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {matchingFU.attachments.map((att) => (
                                  <div 
                                    key={att.id}
                                    onClick={() => setLightboxImg(att.url)}
                                    className="w-14 h-14 border rounded-lg overflow-hidden cursor-zoom-in relative group"
                                  >
                                    <img src={att.url} className="w-full h-full object-cover" alt="att" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Eye size={12} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {matchingFU.next_followup_at && (
                              <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded mt-1">
                                Rencana FU: {new Date(matchingFU.next_followup_at).toLocaleDateString('id-ID')} · {matchingFU.next_followup_note}
                              </div>
                            )}

                            <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                              <button
                                onClick={() => setSelectedFollowupForModal(matchingFU)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline transition-all"
                              >
                                💬 Lihat Diskusi Thread & Komentar ({matchingFU.comments?.length || 0})
                              </button>
                            </div>
                          </div>
                        )}

                        {commentFU && (
                          <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                            <button
                              onClick={() => setSelectedFollowupForModal(commentFU)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline transition-all"
                            >
                              💬 Buka Thread Diskusi Follow-up
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* TRANSITION WARNING MODAL (Staff to Akad requires Supervisor) */}
        {isTransitionWarningOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-950">Persetujuan Diperlukan</h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">
                  Sebagai <strong>Sales Agent</strong>, perpindahan status pipeline ke <strong>Akad PPJB</strong> membutuhkan verifikasi dari Supervisor atau Manager. 
                  Apakah Anda ingin mengirimkan request notifikasi untuk diproses?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Send to manager alert list
                    const message = `Sales Agent ${user?.name} meminta persetujuan pemindahan stage *Akad* untuk prospek *${prospect.full_name}*`;
                    window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
                      detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'marketing-notif', message }
                    }));
                    setIsTransitionWarningOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow hover:bg-blue-700 transition-colors"
                >
                  Minta Persetujuan
                </button>
                <button
                  onClick={() => setIsTransitionWarningOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 border rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX FOR IMAGES */}
        {lightboxImg && (
          <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
              <img src={lightboxImg} className="max-w-full max-h-full object-contain rounded" alt="lightbox" />
              <button 
                onClick={() => setLightboxImg(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full border border-white/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* DOCUMENT / PDF PREVIEW MODAL */}
        {docPreviewModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setDocPreviewModal(null)}>
            <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <h3 className="font-extrabold text-sm text-gray-900 truncate">{docPreviewModal.fileName}</h3>
                    <span className="text-[10px] text-gray-500 font-medium">Pratinjau Berkas PDF / Dokumen Konsumen</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={docPreviewModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <ExternalLink size={13} />
                    <span>Tab Baru</span>
                  </a>

                  <button
                    onClick={() => triggerFileDownload({ url: docPreviewModal.url, file_name: docPreviewModal.fileName })}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Unduh</span>
                  </button>

                  <button
                    onClick={() => setDocPreviewModal(null)}
                    className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-900 transition-colors ml-1 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full bg-slate-100 p-2 relative">
                <object
                  data={docPreviewModal.url}
                  type="application/pdf"
                  className="w-full h-full rounded-xl border border-gray-200 bg-white"
                >
                  <iframe
                    src={docPreviewModal.url}
                    className="w-full h-full rounded-xl border border-gray-200 bg-white"
                    title={docPreviewModal.fileName}
                  />
                </object>
              </div>
            </div>
          </div>
        )}

        {/* DELETE ATTACHMENT CONFIRMATION MODAL */}
        {attachmentToDelete && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-950">Hapus Berkas Konsumen?</h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">
                  Apakah Anda yakin ingin menghapus berkas <strong className="text-gray-800">&quot;{attachmentToDelete.file_name}&quot;</strong> dari data konsumen ini? 
                  Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[10px] text-slate-600 text-left flex items-center gap-2">
                  <span className="font-extrabold text-blue-600">Hak Akses:</span>
                  <span>Diizinkan untuk role <strong>{user?.role?.toUpperCase()}</strong></span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={isDeletingAtt}
                  onClick={handleConfirmDeleteAttachment}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>{isDeletingAtt ? 'Menghapus...' : 'Ya, Hapus'}</span>
                </button>
                <button
                  disabled={isDeletingAtt}
                  onClick={() => setAttachmentToDelete(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DETAIL FOLLOW-UP & THREAD DISCUSSION MODAL */}
        {selectedFollowupForModal && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 bg-gray-50/50">
                <div className="flex flex-col text-left">
                  <h3 className="font-extrabold text-base text-gray-950 flex items-center gap-2">
                    💬 Thread Diskusi Follow-up
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    Prospek: {prospect.full_name} · Tipe: {selectedFollowupForModal.followup_type.toUpperCase()}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedFollowupForModal(null);
                    setNewCommentText('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs font-semibold">
                {/* Follow-up Main Card */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Detail Record Follow-up</span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(selectedFollowupForModal.followup_at).toLocaleDateString('id-ID')} · {new Date(selectedFollowupForModal.followup_at).toLocaleTimeString('id-ID')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200/60 pb-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Dilakukan Oleh</span>
                      <span className="text-gray-800 font-bold">
                        {selectedFollowupForModal.conducted_by === 'usr-sales' ? 'Rina Wijaya (Sales)' : selectedFollowupForModal.conducted_by === 'usr-manager' ? 'Budi Purnomo (Manager)' : selectedFollowupForModal.conducted_by}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Respon Prospek</span>
                      <span className="text-gray-800 font-bold capitalize">
                        {selectedFollowupForModal.prospect_response.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Catatan Hasil Follow-up</span>
                    <p className="text-gray-700 font-medium whitespace-pre-wrap bg-white border border-slate-100 p-3 rounded-lg leading-relaxed">
                      {selectedFollowupForModal.notes}
                    </p>
                  </div>

                  {selectedFollowupForModal.attachments && selectedFollowupForModal.attachments.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Dokumentasi</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFollowupForModal.attachments.map((att) => (
                          <div 
                            key={att.id}
                            onClick={() => setLightboxImg(att.url)}
                            className="w-16 h-16 border rounded-lg overflow-hidden cursor-zoom-in relative group bg-white flex-shrink-0"
                          >
                            <img src={att.url} className="w-full h-full object-cover" alt="att" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye size={14} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFollowupForModal.next_followup_at && (
                    <div className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg mt-1">
                      Rencana Follow-up Berikutnya: {new Date(selectedFollowupForModal.next_followup_at).toLocaleDateString('id-ID')} · {selectedFollowupForModal.next_followup_note}
                    </div>
                  )}
                </div>

                {/* Comment Section Header */}
                <div className="border-t border-gray-100 pt-4 flex flex-col gap-4 text-left">
                  <h4 className="font-extrabold text-sm text-gray-950 flex items-center gap-1.5">
                    💬 Diskusi Thread ({selectedFollowupForModal.comments?.length || 0})
                  </h4>

                  {/* Comments List */}
                  <div className="flex flex-col gap-4 max-h-[30vh] overflow-y-auto pr-1 no-scrollbar">
                    {selectedFollowupForModal.comments && selectedFollowupForModal.comments.length > 0 ? (
                      selectedFollowupForModal.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 items-start relative text-xs">
                          {/* Avatar Initials */}
                          <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px] flex-shrink-0">
                            {comment.user_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>

                          <div className="flex flex-col gap-1 bg-slate-50 border border-slate-100/80 px-3.5 py-2.5 rounded-2xl flex-1">
                            <div className="flex justify-between items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-gray-950">{comment.user_name}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                  comment.user_role === 'manager' 
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                    : comment.user_role === 'admin' 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}>
                                  {comment.user_role}
                                </span>
                              </div>
                              <span className="text-[9px] text-gray-400 font-medium">
                                {new Date(comment.created_at).toLocaleDateString('id-ID')} {new Date(comment.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-gray-700 font-medium leading-relaxed mt-1">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border border-dashed border-gray-100 rounded-xl text-gray-400 italic text-[11px]">
                        Belum ada tanggapan atau komentar dari manager/admin.
                      </div>
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                    {user?.role === 'manager' || user?.role === 'admin' || prospect.assigned_to === user?.id ? (
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                          Berikan Tanggapan (sebagai {user.role === 'staff' ? 'Sales Ditugaskan' : user.role})
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            placeholder="Tuliskan komentar, instruksi, atau tanggapan..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            rows={2}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium resize-none text-xs"
                          />
                          <button
                            onClick={() => handleAddFollowupComment(selectedFollowupForModal.id)}
                            disabled={isCommentSubmitting || !newCommentText.trim()}
                            className="px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-bold transition-all flex items-center justify-center text-xs shadow-md"
                          >
                            {isCommentSubmitting ? '...' : 'KIRIM'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-[11px] font-medium leading-relaxed">
                        Hanya Manager, Admin, IT, atau Sales Agent yang ditugaskan ke konsumen ini yang dapat memberikan komentar pada follow-up ini.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
