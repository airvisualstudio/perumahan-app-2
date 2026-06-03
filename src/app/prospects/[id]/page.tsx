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
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
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

interface Cluster {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  block_number: string;
  status: string;
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
  const [isLoading, setIsLoading] = useState(true);

  // Follow-up Form state
  const [fuType, setFuType] = useState<'telepon' | 'whatsapp' | 'kunjungan' | 'email' | 'meeting' | 'video_call'>('whatsapp');
  const [fuNotes, setFuNotes] = useState('');
  const [fuResponse, setFuResponse] = useState<'very_interested' | 'interested' | 'considering' | 'not_interested'>('interested');
  const [fuNextDate, setFuNextDate] = useState('');
  const [fuNextNote, setFuNextNote] = useState('');
  const [uploadedImages, setUploadedImages] = useState<{ url: string; name: string }[]>([]);

  // Lightbox Image
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  
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
      
      // Filter followups and histories
      const filteredFUs = dbData.followups.filter((f: any) => f.prospect_id === prospectId);
      const filteredHist = dbData.prospectHistory.filter((h: any) => h.prospect_id === prospectId);
      
      setFollowups(filteredFUs);
      setHistory(filteredHist);
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

  const selectedCluster = clusters.find(c => c.id === prospect.interested_cluster_id);
  const activeStageConfig = pipelineStages.find(s => s.key === prospect.pipeline_stage);

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
          
          {/* Left Column: Profile Card Info */}
          <div className="flex flex-col gap-6">
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
                  
                  return (
                    <div key={log.id} className="flex gap-4 items-start relative text-xs">
                      {/* Timeline Dot */}
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 z-10 flex-shrink-0">
                        {log.event_type === 'stage_changed' ? '🔄' : log.event_type === 'followup_added' ? '📸' : '🟢'}
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

      </div>
    </AppShell>
  );
}
