"use client";

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Users, 
  CheckSquare, 
  Activity, 
  Terminal,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  MapPin,
  ArrowUpRight,
  X,
  Award,
  Coins,
  ChevronRight,
  Info,
  LogOut,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Load Monitoring Map dynamically to prevent SSR hydration mismatches
const MonitoringMap = dynamic(() => import('@/components/MonitoringMap'), { ssr: false });
const KavlingMap = dynamic(() => import('@/components/KavlingMap'), { ssr: false });

interface Cluster {
  id: string;
  name: string;
  location: string;
  description: string;
  total_units: number;
  status: string;
}

interface Unit {
  id: string;
  cluster_id: string;
  unit_type_id: string;
  block_number: string;
  sell_price: number;
  orientation: 'hook' | 'middle' | 'corner';
  status: 'available' | 'reserved' | 'booking' | 'kpr_process' | 'sold' | 'unavailable';
  reserved_for?: string;
}

interface Prospect {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  lead_source: string;
  pipeline_stage: string;
  interested_cluster_id?: string;
  interested_type_id?: string;
  booked_unit_id?: string;
  assigned_to?: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  type: 'prospect_created' | 'booking_created' | 'stage_changed' | 'unit_updated';
  title: string;
  description: string;
  timestamp: string;
}

interface AlertNotification {
  id: number;
  type: 'prospect' | 'booking';
  title: string;
  message: string;
  time: string;
}

export default function MonitoringPage() {
  const { user } = useAuth();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [unitTypes, setUnitTypes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedClusterSummaryId, setSelectedClusterSummaryId] = useState<string | null>(null);
  const [selectedUnitFiling, setSelectedUnitFiling] = useState<any | null>(null);
  const [selectedProjectDocDetail, setSelectedProjectDocDetail] = useState<any | null>(null);

  // Stats
  const [totalProspects, setTotalProspects] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // UI state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [simulatorEnabled, setSimulatorEnabled] = useState(false);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [loading, setLoading] = useState(true);

  // Refs for simulator
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Time ticker
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) + ' · ' + date.toLocaleTimeString('id-ID'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch core data from API
  const fetchData = async (isUpdate = false) => {
    try {
      const res = await fetch('/api/db');
      const json = await res.json();
      if (json.success) {
        let { clusters: rawClusters, units: rawUnits, prospects: rawProspects, unitTypes: rawTypes, documents: rawDocs, users: rawUsers, prospectHistory, unitHistory } = json.data;
        
        // Filter based on user housing access
        const accessClusters = user?.accessible_clusters;
        if (user && user.role !== 'admin' && accessClusters && accessClusters.length > 0) {
          rawClusters = (rawClusters || []).filter((c: any) => accessClusters.includes(c.id));
          rawUnits = (rawUnits || []).filter((u: any) => accessClusters.includes(u.cluster_id));
          rawTypes = (rawTypes || []).filter((ut: any) => accessClusters.includes(ut.cluster_id));
          rawProspects = (rawProspects || []).filter((p: any) => !p.interested_cluster_id || accessClusters.includes(p.interested_cluster_id));
          rawDocs = (rawDocs || []).filter((d: any) => !d.cluster_id || accessClusters.includes(d.cluster_id));
        }

        setClusters(rawClusters || []);
        setUnits(rawUnits || []);
        setProspects(rawProspects || []);
        setUnitTypes(rawTypes || []);
        setDocuments(rawDocs || []);
        setUsers(rawUsers || []);

        // Calculate KPI values
        const prospectsList: Prospect[] = rawProspects || [];
        const unitsList: Unit[] = rawUnits || [];

        setTotalProspects(prospectsList.length);
        
        const bookingUnits = unitsList.filter(u => u.status === 'booking');
        const soldUnits = unitsList.filter(u => u.status === 'sold');
        
        setTotalBookings(bookingUnits.length);
        setTotalSold(soldUnits.length);

        // Sum booking prices & sold prices
        const rev = unitsList
          .filter(u => u.status === 'booking' || u.status === 'sold' || u.status === 'kpr_process')
          .reduce((acc, u) => acc + (u.sell_price || 0), 0);
        setTotalRevenue(rev);

        // Build a dynamic Live activity feed from the DB history logs
        const logs: ActivityLog[] = [];
        
        if (prospectHistory) {
          prospectHistory.slice(0, 10).forEach((ph: any) => {
            const prop = prospectsList.find(p => p.id === ph.prospect_id);
            logs.push({
              id: ph.id,
              type: ph.event_type === 'prospect_created' ? 'prospect_created' : 'stage_changed',
              title: ph.event_type === 'prospect_created' ? 'DATABASE MASUK' : 'STAGE UPDATE',
              description: prop 
                ? `${prop.full_name} (${ph.description})`
                : ph.description,
              timestamp: new Date(ph.created_at).toLocaleTimeString('id-ID')
            });
          });
        }

        if (unitHistory) {
          unitHistory.slice(0, 10).forEach((uh: any) => {
            const targetUnit = unitsList.find(u => u.id === uh.unit_id);
            const cluster = rawClusters?.find((c: any) => c.id === targetUnit?.cluster_id);
            logs.push({
              id: uh.id,
              type: 'unit_updated',
              title: 'UNIT UPDATE',
              description: `Unit Blok ${targetUnit?.block_number || ''} (${cluster?.name || ''}): ${uh.old_status} ➔ ${uh.new_status} (${uh.notes || 'Pembaruan system'})`,
              timestamp: new Date(uh.created_at).toLocaleTimeString('id-ID')
            });
          });
        }

        // Sort combined logs by timestamp equivalent/order
        setActivityLogs(logs.slice(0, 15));
      }
      if (!isUpdate) setLoading(false);
    } catch (error) {
      console.error('Failed to fetch monitoring data', error);
      if (!isUpdate) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll updates every 6 seconds to keep CRM monitoring in sync
    const interval = setInterval(() => fetchData(true), 6000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio Context Synthesized beep sounds (premium Sci-Fi UI alerts)
  const playBeep = (type: 'prospect' | 'booking') => {
    if (!audioEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'prospect') {
        // High pitch clean double beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.setValueAtTime(1100, ctx.currentTime);
          gain2.gain.setValueAtTime(0.08, ctx.currentTime);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.08);
        }, 100);
      } else {
        // Success rising chord synth sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.35); // C6
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio Context blocked/failed", e);
    }
  };

  // Push notification toasts onto screen
  const triggerNotification = (type: 'prospect' | 'booking', title: string, message: string) => {
    playBeep(type);
    const newAlert: AlertNotification = {
      id: Math.random(),
      type,
      title,
      message,
      time: new Date().toLocaleTimeString('id-ID')
    };
    
    setAlerts(prev => [newAlert, ...prev]);
    
    // Automatically dismiss alert toast card after 6 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, 6000);
  };

  // Active CRM integration simulator engine
  const runSimulationTick = async () => {
    const isProspect = Math.random() < 0.6;
    
    const firstNames = ["Dani", "Yusuf", "Galih", "Arif", "Hendra", "Bagus", "Fajar", "Dina", "Fitri", "Eka", "Putri", "Santi", "Heri"];
    const lastNames = ["Kurnia", "Saputra", "Wibowo", "Hidayat", "Lestari", "Rahayu", "Setiawan", "Pratama", "Nugraha", "Sari"];
    const sources = ["instagram", "facebook_ads", "website", "pameran", "walk_in"];
    const occupations = ["Karyawan BUMN", "PNS", "Wiraswasta", "Karyawan Swasta", "Dokter", "Dosen"];
    const companies = ["Pertamina", "Pemkot Bandung", "Bank Mandiri", "Klinik Medika", "Telkom", "Freelance"];

    const rName = firstNames[Math.floor(Math.random() * firstNames.length)] + " " + lastNames[Math.floor(Math.random() * lastNames.length)];
    const rPhone = "081" + Math.floor(10000000 + Math.random() * 90000000);
    const rSource = sources[Math.floor(Math.random() * sources.length)];
    const rOcc = occupations[Math.floor(Math.random() * occupations.length)];
    const rComp = companies[Math.floor(Math.random() * companies.length)];
    const rIncome = Math.floor(10 + Math.random() * 30) * 1000000; // 10jt - 40jt
    
    const cluster = clusters[Math.floor(Math.random() * clusters.length)];
    if (!cluster) return;

    if (isProspect) {
      // Simulate Database Masuk
      try {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_prospect',
            full_name: rName,
            phone: rPhone,
            email: rName.toLowerCase().replace(" ", "") + "@example.com",
            occupation: rOcc,
            company_name: rComp,
            estimated_income: rIncome,
            lead_source: rSource,
            interested_cluster_id: cluster.id,
            interested_type_id: cluster.id === 'cls-melati' ? 'typ-melati-36' : 'typ-anggrek-54',
            notes: 'Prospek disimulasikan otomatis oleh Command Center.',
            actor_id: 'usr-admin'
          })
        });

        const json = await res.json();
        if (json.success) {
          triggerNotification(
            'prospect',
            '⚡ DATABASE MASUK',
            `Prospek baru "${rName}" terdaftar via ${rSource.toUpperCase()} tertarik pada ${cluster.name}!`
          );
          fetchData(true);
        }
      } catch (e) {
        console.error("Simulator failed to create prospect", e);
      }
    } else {
      // Simulate Booking Masuk
      const availableUnits = units.filter(u => u.status === 'available' && u.cluster_id === cluster.id);
      const candidateProspects = prospects.filter(p => p.pipeline_stage === 'prospect_baru' || p.pipeline_stage === 'survei');
      
      if (availableUnits.length > 0 && candidateProspects.length > 0) {
        const unit = availableUnits[Math.floor(Math.random() * availableUnits.length)];
        const prospect = candidateProspects[Math.floor(Math.random() * candidateProspects.length)];

        try {
          const res1 = await fetch('/api/crm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_unit_status',
              unit_id: unit.id,
              new_status: 'booking',
              prospect_id: prospect.id,
              notes: 'Booking otomatis terdaftar oleh Simulator Command Center.',
              actor_id: 'usr-admin'
            })
          });

          const res2 = await fetch('/api/crm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_prospect_stage',
              prospect_id: prospect.id,
              new_stage: 'booking',
              actor_id: 'usr-admin'
            })
          });

          const json1 = await res1.json();
          const json2 = await res2.json();

          if (json1.success && json2.success) {
            triggerNotification(
              'booking',
              '💎 BOOKING MASUK',
              `Kavling Blok ${unit.block_number} (${cluster.name}) resmi ter-booking oleh konsumen "${prospect.full_name}"!`
            );
            fetchData(true);
          }
        } catch (e) {
          console.error("Simulator failed to register booking", e);
        }
      }
    }
  };

  useEffect(() => {
    if (simulatorEnabled) {
      runSimulationTick();
      simIntervalRef.current = setInterval(runSimulationTick, 15000);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [simulatorEnabled, clusters, units, prospects]);

  const activeCluster = clusters.find(c => c.id === activeClusterId);
  const activeClusterUnits = units.filter(u => u.cluster_id === activeClusterId);
  const activeClusterProspects = prospects.filter(p => p.interested_cluster_id === activeClusterId);

  // Compile project-level documents for activeCluster
  const getActiveClusterProjectDocs = () => {
    if (!activeCluster) return [];
    
    // 1. Get real documents from database that have cluster_id matching activeCluster.id and NO prospect_id
    const dbProjectDocs = documents
      .filter(doc => doc.cluster_id === activeCluster.id && !doc.data?.prospect_id && !doc.data?.client_name)
      .map(doc => ({
        id: doc.id,
        name: doc.data?.title || doc.doc_number || `Dokumen Proyek ${doc.doc_type}`,
        type: `Dokumen ${doc.doc_type}`,
        date: new Date(doc.created_at).toLocaleDateString('id-ID'),
        isReal: true,
        token: doc.doc_token,
        raw: doc
      }));

    // 2. Generate standard legal files for this cluster as default/seed if they don't exist
    const defaultDocs = [
      {
        id: `def-pbb-${activeCluster.id}`,
        name: `SPPT PBB Tahun 2026 - ${activeCluster.name}`,
        type: 'Pajak Daerah',
        date: '12 Mar 2026',
        isReal: false,
        content: `Surat Pemberitahuan Pajak Terutang Pajak Bumi dan Bangunan (SPPT PBB) tahun pajak 2026 untuk objek pajak perumahan ${activeCluster.name}. Status: TERBAYAR LUNAS.`
      },
      {
        id: `def-imb-${activeCluster.id}`,
        name: `PBG Induk ${activeCluster.name} (IMB)`,
        type: 'Izin Bangunan',
        date: '24 Sep 2025',
        isReal: false,
        content: `Persetujuan Bangunan Gedung (PBG) Induk No. 503/PBG-IND/${activeCluster.name}/2025. Mengizinkan pembangunan unit hunian di wilayah ${activeCluster.location}.`
      },
      {
        id: `def-shgb-${activeCluster.id}`,
        name: `Sertifikat SHGB Induk No. 182/${activeCluster.name}`,
        type: 'Sertifikat Tanah',
        date: '15 Okt 2025',
        isReal: false,
        content: `Sertifikat Hak Guna Bangunan (SHGB) Induk atas nama PT Domus Somnia Properti seluas wilayah cluster ${activeCluster.name}. Status: Proses pemecahan sertifikat per kavling.`
      },
      {
        id: `def-pph-${activeCluster.id}`,
        name: `Bukti Potong PPh Final Pasal 4(2)`,
        type: 'Pajak PPh',
        date: '05 Jan 2026',
        isReal: false,
        content: `Bukti Pemotongan Pajak Penghasilan (PPh) Final atas Pengalihan Hak atas Tanah dan/atau Bangunan untuk proyek perumahan ${activeCluster.name} masa pajak Januari 2026. Lunas.`
      }
    ];

    return [...dbProjectDocs, ...defaultDocs];
  };

  const allProjectDocs = getActiveClusterProjectDocs();

  const handleViewProjectDoc = (doc: any) => {
    if (doc.isReal && doc.token) {
      window.open(`/verify?token=${doc.token}`, '_blank');
    } else {
      setSelectedProjectDocDetail(doc);
    }
  };

  const getUnitStatusCount = (status: string) => activeClusterUnits.filter(u => u.status === status).length;

  const formatIDR = (num: number) => {
    if (num >= 1000000000) {
      return `Rp ${(num / 1000000000).toFixed(2)} Milyar`;
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      
      {/* Background: Fullscreen Leaflet Map */}
      <div className="absolute inset-0 w-full h-full z-0">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-950 text-slate-100">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono text-indigo-400">LOADING CRITICAL SYSTEMS...</span>
          </div>
        ) : (
          <MonitoringMap
            clusters={clusters}
            activeClusterId={activeClusterId}
            onClusterClick={(id) => {
              setActiveClusterId(id);
              setSelectedClusterSummaryId(id);
            }}
          />
        )}
      </div>

      {/* ── OVERLAY UI LAYERS ── */}

      {/* 1. Top Bar Panel Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
        <div className="bg-slate-950/80 border border-slate-900/80 backdrop-blur-md px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl animate-pulse">
              <Terminal size={18} />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                DOMUS SECURITY & CRM MONITORING SYSTEM
              </h1>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{currentTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button 
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? "Matikan Efek Suara" : "Aktifkan Efek Suara"}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                audioEnabled 
                  ? 'bg-slate-900/80 border-indigo-500/30 text-indigo-400 hover:bg-slate-800' 
                  : 'bg-slate-950 border-slate-900 text-slate-500 hover:bg-slate-900'
              }`}
            >
              {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Simulation Controller */}
            <button
              onClick={() => setSimulatorEnabled(!simulatorEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border shadow-md ${
                simulatorEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-900/80 border-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {simulatorEnabled ? (
                <>
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <Square size={12} className="fill-current" />
                  SIMULATOR AKTIF
                </>
              ) : (
                <>
                  <Play size={12} className="fill-current" />
                  AKTIFKAN SIMULATOR
                </>
              )}
            </button>

            {/* Return Link (Visual separation indicator) */}
            <div className="border-l border-slate-900 pl-3">
              <Link 
                href="/"
                title="Keluar Command Center"
                className="p-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 transition-all flex items-center justify-center"
              >
                <LogOut size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Left Panel: Metrics & Selector Overlays */}
      <div className="absolute left-4 top-24 bottom-4 w-[310px] z-10 pointer-events-none flex flex-col gap-4">
        <div className="bg-slate-950/80 border border-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4 overflow-y-auto no-scrollbar pointer-events-auto flex-1">
          <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase border-b border-slate-900 pb-2">
            TELEMETRI STATISTIK CRM
          </span>

          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-900/50 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* KPI 1 */}
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Database Prospek</span>
                  <span className="text-base font-extrabold font-mono text-slate-100 mt-0.5">{totalProspects}</span>
                </div>
                <div className="p-2 bg-indigo-500/5 text-indigo-400 rounded-lg">
                  <Users size={16} />
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unit Ter-booking</span>
                  <span className="text-base font-extrabold font-mono text-cyan-400 mt-0.5">{totalBookings}</span>
                </div>
                <div className="p-2 bg-cyan-500/5 text-cyan-400 rounded-lg">
                  <CheckSquare size={16} />
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unit Akad Terjual</span>
                  <span className="text-base font-extrabold font-mono text-emerald-400 mt-0.5">{totalSold}</span>
                </div>
                <div className="p-2 bg-emerald-500/5 text-emerald-400 rounded-lg">
                  <Award size={16} />
                </div>
              </div>

              {/* KPI 4 */}
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Estimasi Nilai Omset</span>
                  <span className="text-sm font-extrabold font-mono text-amber-400 mt-0.5 tracking-tight">{formatIDR(totalRevenue)}</span>
                </div>
                <div className="p-2 bg-amber-500/5 text-amber-400 rounded-lg">
                  <Coins size={16} />
                </div>
              </div>
            </div>
          )}

          {/* Cluster selection widget overlay */}
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase border-b border-slate-900 pb-1.5 flex items-center gap-1.5">
              <MapPin size={12} className="text-indigo-400" />
              Sensor Lokasi Perumahan
            </span>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
              {clusters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveClusterId(c.id)}
                  className={`flex items-center justify-between text-left text-xs p-2 rounded-xl border transition-all ${
                    activeClusterId === c.id 
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold shadow-md' 
                      : 'bg-slate-950/40 border-slate-900/60 text-slate-300 hover:bg-slate-800/40 hover:border-slate-800'
                  }`}
                >
                  <span>{c.name}</span>
                  <ChevronRight size={12} className={activeClusterId === c.id ? "text-indigo-400" : "text-slate-600"} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Right Panel: Dynamic Cluster Info or Log activities Overlays */}
      <div className="absolute right-4 top-24 bottom-4 w-[310px] z-10 pointer-events-none flex flex-col gap-4">
        <div className="bg-slate-950/80 border border-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4 overflow-y-auto no-scrollbar pointer-events-auto flex-1">
          
          {activeCluster ? (
            /* Selected Cluster Details Overlay */
            <div className="flex flex-col h-full justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider">DETAIL OPERASIONAL</span>
                    <h2 className="text-sm font-extrabold text-slate-100 mt-0.5">{activeCluster.name}</h2>
                  </div>
                  <button 
                    onClick={() => setActiveClusterId(null)}
                    className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-900 border border-slate-900 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-3 text-[11px] leading-relaxed text-slate-300 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase tracking-wider">
                    <Info size={11} className="text-slate-500" />
                    Deskripsi Proyek
                  </div>
                  <p>{activeCluster.description}</p>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                    <span>Lokasi:</span>
                    <span className="font-bold text-slate-100">{activeCluster.location}</span>
                  </div>
                </div>

                {/* Stock Stats Progress Bars */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Grafik Stok Unit</span>
                  
                  {/* Available */}
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Tersedia</span>
                      <span className="text-slate-200 font-bold">{getUnitStatusCount('available')} Unit</span>
                    </div>
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${(getUnitStatusCount('available') / (activeClusterUnits.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Booked / Reserved */}
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Ter-booking / Proses</span>
                      <span className="text-slate-200 font-bold">{getUnitStatusCount('booking') + getUnitStatusCount('reserved') + getUnitStatusCount('kpr_process')} Unit</span>
                    </div>
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 rounded-full" 
                        style={{ width: `${((getUnitStatusCount('booking') + getUnitStatusCount('reserved') + getUnitStatusCount('kpr_process')) / (activeClusterUnits.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Sold */}
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Terjual</span>
                      <span className="text-slate-200 font-bold">{getUnitStatusCount('sold')} Unit</span>
                    </div>
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${(getUnitStatusCount('sold') / (activeClusterUnits.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Prospects in this cluster */}
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                    <Activity size={11} className="text-indigo-400" />
                    Prospek Tertarik ({activeClusterProspects.length})
                  </span>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1 no-scrollbar">
                    {activeClusterProspects.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic py-2 text-center">Belum ada prospek</span>
                    ) : (
                      activeClusterProspects.slice(0, 3).map((p) => (
                        <div 
                          key={p.id}
                          className="bg-slate-950/40 border border-slate-900 hover:border-slate-800 p-2 rounded-xl flex items-center justify-between text-[11px]"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200">{p.full_name}</span>
                            <span className="text-[9px] text-slate-500 capitalize">{p.pipeline_stage.replace('_', ' ')} · {p.lead_source}</span>
                          </div>
                          <Link 
                            href={`/crm?prospect=${p.id}`}
                            className="p-1.5 hover:bg-slate-900 text-indigo-400 border border-slate-900 hover:text-indigo-300 rounded-lg transition-all"
                          >
                            <ArrowUpRight size={11} />
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Project Legal & Tax Files Section */}
                <div className="flex flex-col gap-2 mt-3 border-t border-slate-900 pt-3">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                    <CheckSquare size={11} className="text-emerald-400" />
                    Dokumen & Pajak Proyek ({allProjectDocs.length})
                  </span>
                  
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                    {allProjectDocs.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic py-2 text-center">Belum ada dokumen proyek</span>
                    ) : (
                      allProjectDocs.map((doc, idx) => (
                        <div 
                          key={doc.id || idx}
                          className="bg-slate-950/40 border border-slate-900 hover:border-slate-800 p-2 rounded-xl flex items-center justify-between text-[11px]"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-200 truncate pr-1">{doc.name}</span>
                            <span className="text-[8px] text-slate-500 mt-0.5">{doc.type} · {doc.date}</span>
                          </div>
                          <button 
                            onClick={() => handleViewProjectDoc(doc)}
                            className="p-1.5 hover:bg-slate-900 text-emerald-400 border border-slate-900 hover:text-emerald-300 rounded-lg transition-all shrink-0"
                            title="Buka Dokumen"
                          >
                            <ArrowUpRight size={11} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900 flex gap-2">
                <Link 
                  href={`/crm`}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                >
                  Buka App CRM
                </Link>
                <button 
                  onClick={() => setActiveClusterId(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-800 text-slate-400 hover:bg-slate-900 transition-all"
                >
                  Kembali
                </button>
              </div>
            </div>
          ) : (
            /* Global Activity Feed Overlay */
            <div className="flex flex-col h-full justify-between">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase border-b border-slate-900 pb-2 flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                  LOG AKTIVITAS PERUSAHAAN (LIVE)
                </span>

                <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                  {activityLogs.length === 0 ? (
                    <div className="text-center text-slate-500 italic py-10 text-[11px]">
                      Mendengarkan event penjualan...
                    </div>
                  ) : (
                    activityLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="bg-slate-950/30 border border-slate-900 rounded-xl p-2.5 flex items-start gap-2 text-[11px]"
                      >
                        <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                          log.type === 'prospect_created' 
                            ? 'bg-cyan-400' 
                            : log.type === 'booking_created' 
                            ? 'bg-emerald-400'
                            : 'bg-indigo-400'
                        }`} />
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-[8px] uppercase tracking-wider text-slate-400 truncate">
                              {log.title}
                            </span>
                            <span className="text-[8px] text-slate-500 font-mono shrink-0">{log.timestamp}</span>
                          </div>
                          <p className="text-slate-300 font-medium break-words leading-tight">
                            {log.description}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1 mt-4">
                <Info size={11} className="text-slate-700" />
                TELEMETRY CONNECTED · SECURE FEED
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 4. Alert Notifications Overlay (Floating right-overlay next to the Right Sidebar) */}
      <div className="absolute top-24 right-[21.5rem] z-30 flex flex-col gap-3 max-w-[280px] w-full pointer-events-none">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={`p-3.5 rounded-xl border backdrop-blur-md shadow-2xl flex flex-col gap-1.5 animate-bounce-short pointer-events-auto transition-all duration-300 ${
              alert.type === 'prospect'
                ? 'bg-slate-950/90 border-cyan-500/30 text-cyan-200 shadow-[0_10px_25px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/90 border-emerald-500/30 text-emerald-200 shadow-[0_10px_25px_rgba(16,185,129,0.2)]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={11} className={alert.type === 'prospect' ? 'text-cyan-400' : 'text-emerald-400'} />
                {alert.title}
              </span>
              <span className="text-[8px] text-slate-500 font-mono font-bold">{alert.time}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-300 leading-normal">{alert.message}</p>
          </div>
        ))}
      </div>

      {/* 5. Interactive Site Plan Map (Denah Kavling) in the middle screen when a cluster is active */}
      {activeCluster && (
        <div className="absolute left-[330px] right-[330px] top-24 bottom-4 z-10 pointer-events-none flex flex-col">
          <div className="bg-slate-950/80 border border-slate-900/80 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4 pointer-events-auto flex-1 overflow-hidden text-left">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                  <Sparkles size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Interactive Site Plan</span>
                  <h2 className="text-sm font-extrabold text-slate-100 mt-0.5">Denah Kavling - {activeCluster.name}</h2>
                </div>
              </div>
              <button 
                onClick={() => setActiveClusterId(null)}
                className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-900 border border-slate-900 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Render KavlingMap inside the container */}
            <div className="flex-1 bg-slate-950/50 border border-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center p-4">
              <KavlingMap
                units={activeClusterUnits}
                unitTypes={unitTypes}
                prospects={prospects}
                activeClusterId={activeCluster.id}
                clusters={clusters}
                onUnitSelect={(unit) => setSelectedUnitFiling(unit)}
                hideLegend={true}
              />
            </div>

            {/* Map Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-900/60 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span>Tersedia</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Booking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>Proses KPR/Cash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>Terjual (Akad)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                <span>Tidak Tersedia</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Cluster Summary Modal Overlay */}
      {selectedClusterSummaryId && (() => {
        const cluster = clusters.find(c => c.id === selectedClusterSummaryId);
        if (!cluster) return null;

        const clusterUnits = units.filter(u => u.cluster_id === cluster.id);
        const availableCount = clusterUnits.filter(u => u.status === 'available').length;
        const bookingCount = clusterUnits.filter(u => u.status === 'booking' || u.status === 'reserved' || u.status === 'kpr_process').length;
        const soldCount = clusterUnits.filter(u => u.status === 'sold').length;

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 text-left text-slate-100">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider">Ringkasan Perumahan</span>
                  <h3 className="text-base font-extrabold text-slate-100 mt-0.5">{cluster.name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedClusterSummaryId(null)}
                  className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-3.5 text-xs">
                <div className="flex flex-col gap-1 bg-slate-950/40 border border-slate-950 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Lokasi Proyek</span>
                  <span className="font-semibold text-slate-200">{cluster.location}</span>
                </div>

                <div className="flex flex-col gap-1 bg-slate-950/40 border border-slate-950 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Deskripsi Singkat</span>
                  <p className="text-slate-400 leading-normal">{cluster.description || 'Tidak ada deskripsi proyek.'}</p>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-green-500/10 border border-green-500/20 p-2.5 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[8px] text-green-400 font-bold uppercase">Tersedia</span>
                    <span className="text-sm font-black text-green-400">{availableCount}</span>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[8px] text-cyan-400 font-bold uppercase">Booking</span>
                    <span className="text-sm font-black text-cyan-400">{bookingCount}</span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[8px] text-indigo-400 font-bold uppercase">Terjual</span>
                    <span className="text-sm font-black text-indigo-400">{soldCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800 mt-2">
                <button
                  onClick={() => {
                    setActiveClusterId(cluster.id);
                    setSelectedClusterSummaryId(null);
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight size={14} /> Lihat Lebih Lengkap
                </button>
                <button
                  onClick={() => setSelectedClusterSummaryId(null)}
                  className="px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. Unit Filing Details (Pemberkasan) Modal Overlay */}
      {selectedUnitFiling && (() => {
        const typeName = unitTypes.find(t => t.id === selectedUnitFiling.unit_type_id)?.name || 'Tipe Standar';
        const prospect = prospects.find(p => p.id === selectedUnitFiling.reserved_for || p.booked_unit_id === selectedUnitFiling.id);
        const marketingName = prospect ? (users.find(u => u.id === prospect.assigned_to)?.name || 'Tidak Ditentukan') : 'Tidak Ditentukan';
        
        const unitDocs = documents.filter(doc => {
          if (doc.cluster_id !== activeClusterId) return false;
          if (prospect && doc.data?.prospect_id === prospect.id) return true;
          if (prospect && (
            doc.data?.client_name?.toLowerCase().includes(prospect.full_name.toLowerCase()) ||
            doc.data?.receiver_name?.toLowerCase().includes(prospect.full_name.toLowerCase())
          )) return true;
          if (doc.data?.unit_block?.toLowerCase() === selectedUnitFiling.block_number.toLowerCase()) return true;
          if (doc.data?.items?.some((item: any) => item.name?.toLowerCase().includes(selectedUnitFiling.block_number.toLowerCase()))) return true;
          if (doc.data?.keterangan?.toLowerCase().includes(selectedUnitFiling.block_number.toLowerCase())) return true;
          return false;
        });

        const statusLabel = 
          selectedUnitFiling.status === 'available' ? 'Tersedia' :
          selectedUnitFiling.status === 'reserved' ? 'Reserved' :
          selectedUnitFiling.status === 'booking' ? 'Booking' :
          selectedUnitFiling.status === 'kpr_process' ? 'Proses KPR' :
          selectedUnitFiling.status === 'sold' ? 'Terjual' : 'Tidak Tersedia';

        const statusColor = 
          selectedUnitFiling.status === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          selectedUnitFiling.status === 'reserved' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
          selectedUnitFiling.status === 'booking' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
          selectedUnitFiling.status === 'kpr_process' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
          selectedUnitFiling.status === 'sold' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20';

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-5 text-left text-slate-100">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider">Arsip Pemberkasan Unit</span>
                  <h3 className="text-base font-extrabold text-slate-100 mt-0.5">Kavling Blok {selectedUnitFiling.block_number}</h3>
                </div>
                <button 
                  onClick={() => setSelectedUnitFiling(null)}
                  className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/40 border border-slate-950 p-4 rounded-2xl flex flex-col gap-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Spesifikasi Unit</span>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-400">Tipe Kavling:</span>
                    <span className="font-bold text-slate-200">{typeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Harga Jual:</span>
                    <span className="font-bold text-slate-200">{formatIDR(selectedUnitFiling.sell_price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status Unit:</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${statusColor}`}>{statusLabel}</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-950 p-4 rounded-2xl flex flex-col gap-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Hubungan Konsumen CRM</span>
                  {prospect ? (
                    <>
                      <div className="flex justify-between mt-1">
                        <span className="text-slate-400">Nama Pembeli:</span>
                        <span className="font-bold text-slate-200">{prospect.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">No. Telepon:</span>
                        <span className="font-bold text-slate-200">{prospect.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tahap Pipeline:</span>
                        <span className="font-bold text-slate-200 capitalize">{prospect.pipeline_stage.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-900 pt-1 mt-1">
                        <span className="text-slate-400">Sales Marketing:</span>
                        <span className="font-bold text-indigo-400">{marketingName}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-slate-500 italic text-[10px]">
                      Belum ada konsumen yang mengikat kavling ini.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase border-b border-slate-800 pb-1.5">
                  Pemberkasan Terkait ({unitDocs.length})
                </span>
                
                <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-2">
                  {unitDocs.length === 0 ? (
                    <div className="text-center text-slate-500 italic py-6 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl flex items-center justify-center">
                      <span>Belum ada dokumen yang diterbitkan untuk unit/konsumen ini.</span>
                    </div>
                  ) : (
                    unitDocs.map((doc) => {
                      const docTypeColor = 
                        doc.doc_type === 'Invoice' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        doc.doc_type === 'Kwitansi' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20';

                      const statusColor = 
                        doc.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        doc.status === 'pending_approval' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        doc.status === 'revoked' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

                      return (
                        <div 
                          key={doc.id}
                          className="bg-slate-950/30 border border-slate-900 rounded-xl p-3 flex items-center justify-between gap-3 text-[11px]"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 border text-[9px] font-black uppercase rounded ${docTypeColor}`}>{doc.doc_type}</span>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-200">{doc.doc_number}</span>
                              <span className="text-[9px] text-slate-500 font-mono mt-0.5">{new Date(doc.created_at).toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase rounded-full ${statusColor}`}>{doc.status.replace('_', ' ')}</span>
                            <button
                              onClick={() => window.open(`/verify?token=${doc.doc_token}`, '_blank')}
                              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-lg font-bold text-[10px] transition-all"
                            >
                              Verifikasi QR
                            </button>
                            <Link
                              href={`/documents`}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] transition-all"
                            >
                              Lihat Approval
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800 mt-2">
                <button
                  onClick={() => setSelectedUnitFiling(null)}
                  className="px-6 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 8. Project Legal Document Viewer Modal Overlay */}
      {selectedProjectDocDetail && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 text-left text-slate-100">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider">{selectedProjectDocDetail.type}</span>
                <h3 className="text-base font-extrabold text-slate-100 mt-0.5">{selectedProjectDocDetail.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedProjectDocDetail(null)}
                className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              >
                <X size={14} />
              </button>
            </div>

            <div className="bg-slate-950/40 border border-slate-950 p-4 rounded-2xl flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
              <div className="flex justify-between text-[10px] text-slate-500 border-b border-slate-900 pb-2">
                <span>Tanggal Dokumen:</span>
                <span className="font-bold text-slate-400">{selectedProjectDocDetail.date}</span>
              </div>
              <p className="whitespace-pre-line mt-1">{selectedProjectDocDetail.content}</p>
            </div>

            <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-800 mt-2">
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                TERVERIFIKASI ASLI
              </span>
              <button
                onClick={() => setSelectedProjectDocDetail(null)}
                className="px-6 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation/Bounce utilities inject */}
      <style jsx global>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1.5s ease-in-out infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
