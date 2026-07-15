"use client";

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import KavlingMap from '@/components/KavlingMap';
import { useAuth } from '@/context/AuthContext';
import { 
  Home as HomeIcon, 
  MapPin, 
  Layers, 
  Info, 
  Check, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  AlertCircle, 
  MessageSquare,
  DollarSign,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Grid,
  List
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Cluster {
  id: string;
  name: string;
  location: string;
  description: string;
  total_units: number;
  status: string;
  svg_content?: string;
  logo_url?: string;
  address?: string;
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
  notes?: string;
  bank_name?: string;
  akad_date?: string;
  loan_amount?: number;
  interest_rate?: number;
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

const statusConfig = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  reserved: { label: 'Reserved', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  booking: { label: 'Booking Fee', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  kpr_process: { label: 'Proses KPR/Cash', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  sold: { label: 'Terjual (Akad)', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  unavailable: { label: 'Tidak Tersedia', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-500' }
};

const pipelineStages = [
  { key: 'prospect_baru', label: 'Prospect Baru', color: 'border-blue-500 text-blue-700 bg-blue-50/50' },
  { key: 'dihubungi', label: 'Dihubungi', color: 'border-indigo-500 text-indigo-700 bg-indigo-50/50' },
  { key: 'survei', label: 'Survei Lokasi', color: 'border-purple-500 text-purple-700 bg-purple-50/50' },
  { key: 'penawaran', label: 'Penawaran', color: 'border-pink-500 text-pink-700 bg-pink-50/50' },
  { key: 'booking', label: 'Booking Fee', color: 'border-amber-500 text-amber-700 bg-amber-50/50' },
  { key: 'kpr_process', label: 'Proses KPR/Cash', color: 'border-orange-500 text-orange-700 bg-orange-50/50' },
  { key: 'akad', label: 'Akad', color: 'border-emerald-500 text-emerald-700 bg-emerald-50/50' },
  { key: 'stk', label: 'Serah Terima', color: 'border-teal-500 text-teal-700 bg-teal-50/50' },
  { key: 'batal', label: 'Batal', color: 'border-red-500 text-red-700 bg-red-50/50' }
];

export default function CRMModulePage() {
  const { user, availableUsers } = useAuth();
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, prospectId: string) => {
    e.dataTransfer.setData('text/plain', prospectId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (draggedOverStage !== stageKey) {
      setDraggedOverStage(stageKey);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const prospectId = e.dataTransfer.getData('text/plain');
    if (!prospectId) return;

    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return;

    if (prospect.pipeline_stage === targetStageKey) return;

    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_prospect_stage',
          prospect_id: prospectId,
          new_stage: targetStageKey,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        const oldStage = prospect.pipeline_stage;
        const message = `Sales Agent ${user?.name} memindahkan prospek *${prospect.full_name}* dari *${oldStage}* ke *${targetStageKey}* via drag-and-drop`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'marketing-notif', message }
        }));
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tabs: 'units' | 'pipeline' | 'prospects'
  const [activeTab, setActiveTab] = useState<'units' | 'pipeline' | 'prospects'>('units');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
  
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [activeClusterId, setActiveClusterId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters for Table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('');

  // Modals state
  const [isAddProspectOpen, setIsAddProspectOpen] = useState(false);
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');

  // Form states for new prospect
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formOccupation, setFormOccupation] = useState('');
  const [formIncome, setFormIncome] = useState('');
  const [formSource, setFormSource] = useState('instagram');
  const [formCluster, setFormCluster] = useState('');
  const [formType, setFormType] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // View mode and modal states for Prospects Tab
  const [prospectViewMode, setProspectViewMode] = useState<'table' | 'card'>('table');
  const [selectedProspectDetail, setSelectedProspectDetail] = useState<Prospect | null>(null);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);

  // Edit form states
  const [editFormName, setEditFormName] = useState('');
  const [editFormPhone, setEditFormPhone] = useState('');
  const [editFormEmail, setEditFormEmail] = useState('');
  const [editFormOccupation, setEditFormOccupation] = useState('');
  const [editFormCompany, setEditFormCompany] = useState('');
  const [editFormIncome, setEditFormIncome] = useState('');
  const [editFormNotes, setEditFormNotes] = useState('');

  const startEditProspect = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setEditFormName(prospect.full_name || '');
    setEditFormPhone(prospect.phone || '');
    setEditFormEmail(prospect.email || '');
    setEditFormOccupation(prospect.occupation || '');
    setEditFormCompany(prospect.company_name || '');
    setEditFormIncome(prospect.estimated_income ? String(prospect.estimated_income) : '');
    setEditFormNotes(prospect.notes || '');
  };

  const handleUpdateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProspect) return;

    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_prospect',
          prospect_id: editingProspect.id,
          full_name: editFormName,
          phone: editFormPhone,
          email: editFormEmail,
          occupation: editFormOccupation,
          company_name: editFormCompany,
          estimated_income: editFormIncome ? Number(editFormIncome) : undefined,
          notes: editFormNotes,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        // Slack webhook log
        const message = `Sales Agent ${user?.name} memperbarui data prospek *${editFormName}*`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'marketing-notif', message }
        }));

        setEditingProspect(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProspect = async (prospectId: string, prospectName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus prospek "${prospectName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_prospect',
          prospect_id: prospectId,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        // Slack webhook log
        const message = `Sales Agent ${user?.name} menghapus prospek *${prospectName}*`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'marketing-notif', message }
        }));

        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/crm');
      const json = await res.json();
      if (json.success) {
        let loadedClusters = json.clusters || [];
        let loadedUnits = json.units || [];
        let loadedUnitTypes = json.unitTypes || [];
        let loadedProspects = json.prospects || [];

        // Apply housing project access filtering
        const accessClusters = user?.accessible_clusters;
        if (user && user.role !== 'admin' && accessClusters && accessClusters.length > 0) {
          loadedClusters = loadedClusters.filter((c: any) => accessClusters.includes(c.id));
          loadedUnits = loadedUnits.filter((u: any) => accessClusters.includes(u.cluster_id));
          loadedUnitTypes = loadedUnitTypes.filter((ut: any) => accessClusters.includes(ut.cluster_id));
          loadedProspects = loadedProspects.filter((p: any) => !p.interested_cluster_id || accessClusters.includes(p.interested_cluster_id));
        }

        setClusters(loadedClusters);
        setUnits(loadedUnits);
        setUnitTypes(loadedUnitTypes);
        setProspects(loadedProspects);

        if (loadedClusters.length > 0 && !activeClusterId) {
          setActiveClusterId(loadedClusters[0].id);
          setFormCluster(loadedClusters[0].id);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeClusterId) {
      const filteredTypes = unitTypes.filter(t => t.cluster_id === activeClusterId);
      if (filteredTypes.length > 0) {
        setFormType(filteredTypes[0].id);
      }
    }
  }, [activeClusterId, unitTypes]);

  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_prospect',
          full_name: formName,
          phone: formPhone,
          email: formEmail,
          occupation: formOccupation,
          estimated_income: formIncome,
          lead_source: formSource,
          interested_cluster_id: formCluster,
          interested_type_id: formType,
          notes: formNotes,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        // Slack webhook log
        const message = `Sales Agent ${user?.name} menambahkan prospek baru: *${formName}* via lead source *${formSource}*`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'marketing-notif', message }
        }));

        setIsAddProspectOpen(false);
        // Reset form
        setFormName('');
        setFormPhone('');
        setFormEmail('');
        setFormOccupation('');
        setFormIncome('');
        setFormNotes('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };



  // Helper to determine follow-up indicator color (PRD 2B)
  const getFollowupIndicator = (lastFUStr?: string) => {
    if (!lastFUStr) return { color: 'bg-zinc-800', label: 'Belum di-follow-up' };
    const diffTime = Math.abs(Date.now() - new Date(lastFUStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) return { color: 'bg-green-500', label: 'Follow-up segar' };
    if (diffDays <= 7) return { color: 'bg-yellow-500', label: 'Perlu follow-up' };
    return { color: 'bg-red-500', label: 'Follow-up terlambat' };
  };

  const activeCluster = clusters.find(c => c.id === activeClusterId);
  const filteredUnits = units.filter(u => u.cluster_id === activeClusterId);

  // Search & Filter Prospects
  const filteredProspects = prospects.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.phone.includes(searchQuery);
    const matchesStage = filterStage ? p.pipeline_stage === filterStage : true;
    return matchesSearch && matchesStage;
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="w-full animate-pulse gap-6 flex flex-col">
          <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </AppShell>
    );
  }

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full">
        {/* Module Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">CRM Properti & Prospek</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola data unit kavling perumahan, pipeline prospek, dan status follow-up marketing.</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setIsAddProspectOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg font-bold text-xs transition-all"
            >
              <Plus size={16} />
              PROSPEK BARU
            </button>
          </div>
        </div>

        {/* CRM Module Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('units')}
            className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'units' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Peta Kavling & Unit
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'pipeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Pipeline Kanban
          </button>
          <button
            onClick={() => setActiveTab('prospects')}
            className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'prospects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Tabel Prospek ({filteredProspects.length})
          </button>
        </div>

        {/* ==================== TAB 1: UNITS GRID ==================== */}
        {activeTab === 'units' && (
          <div className="flex flex-col gap-6">
            {/* Toolbar: Cluster selectors & View Mode Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Cluster selectors */}
              <div className="flex bg-gray-100 p-1 rounded-xl self-start gap-1">
                {clusters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveClusterId(c.id)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                      activeClusterId === c.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-xl self-start gap-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                    viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Peta Site Plan
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Daftar Grid
                </button>
              </div>
            </div>

            {activeCluster && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                <div className="flex gap-4 items-start max-w-xl text-left">
                  {activeCluster.logo_url && (
                    <img src={activeCluster.logo_url} alt="Logo" className="w-14 h-14 object-cover rounded-2xl border border-gray-150 flex-shrink-0" />
                  )}
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-sm font-extrabold text-gray-950 flex items-center gap-1.5">
                      <Layers className="text-blue-600" size={16} />
                      Detail {activeCluster.name}
                    </h2>
                    <p className="text-xs text-gray-500 leading-relaxed">{activeCluster.description}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 font-bold mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        Lokasi: {activeCluster.location}
                      </div>
                      {activeCluster.address && (
                        <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                          <MapPin size={12} />
                          Alamat: {activeCluster.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center md:justify-end">
                  {Object.entries(statusConfig).map(([key, value]) => {
                    const count = filteredUnits.filter(u => u.status === key).length;
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold">
                        <span className={`w-2 h-2 rounded-full ${value.dot}`}></span>
                        <span className="text-gray-500">{value.label}:</span>
                        <span className="text-gray-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'map' ? (
              <KavlingMap
                units={units}
                unitTypes={unitTypes}
                prospects={prospects}
                activeClusterId={activeClusterId}
                clusters={clusters}
                onUnitSelect={(unit) => {
                  setSelectedUnit(unit);
                  setNewStatus(unit.status);
                  setEditNotes('');
                  setIsEditUnitOpen(true);
                }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredUnits.map((unit) => {
                    const config = statusConfig[unit.status];
                    const type = unitTypes.find(t => t.id === unit.unit_type_id);
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.2 }}
                        key={unit.id}
                        onClick={() => {
                          setSelectedUnit(unit);
                          setNewStatus(unit.status);
                          setEditNotes('');
                          setIsEditUnitOpen(true);
                        }}
                        className="border rounded-2xl p-4 bg-white cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col gap-2 border-gray-200 hover:-translate-y-0.5 premium-card"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-lg text-gray-950">{unit.block_number}</span>
                          {unit.orientation !== 'middle' && (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 uppercase">
                              {unit.orientation}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-gray-400 font-bold">{type?.name}</span>
                          <span className="text-xs font-extrabold text-gray-800">{formatIDR(unit.sell_price)}</span>
                        </div>
                        <div className={`mt-2 py-1 px-2.5 rounded-lg border text-[10px] font-bold text-center flex items-center justify-center gap-1.5 ${config.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                          {config.label}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: PIPELINE KANBAN ==================== */}
        {activeTab === 'pipeline' && (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {pipelineStages.map((stage) => {
              const stageProspects = prospects.filter(p => p.pipeline_stage === stage.key);
              const isDraggedOver = draggedOverStage === stage.key;
              return (
                <div
                  key={stage.key}
                  onDragOver={(e) => handleDragOver(e, stage.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.key)}
                  className={`flex-shrink-0 w-80 bg-gray-100/70 border rounded-2xl p-4 flex flex-col gap-4 max-h-[70vh] transition-all duration-200 ${
                    isDraggedOver 
                      ? 'border-blue-500 bg-blue-50/15 scale-[1.01] ring-2 ring-blue-500/10' 
                      : 'border-gray-200/50'
                  }`}
                >
                  {/* Column Header */}
                  <div className={`border-b-2 pb-2 flex justify-between items-center px-1 font-bold text-xs ${stage.color.split(' ')[1]}`}>
                    <span>{stage.label}</span>
                    <span className="bg-white/80 border px-2 py-0.5 rounded-full text-[10px] font-black">{stageProspects.length}</span>
                  </div>

                  {/* Prospects list inside Stage */}
                  <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar flex-1 min-h-[150px]">
                    <AnimatePresence mode="popLayout">
                      {stageProspects.length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-gray-400 italic">Kolom kosong</div>
                      ) : (
                        stageProspects.map((prospect) => {
                          const fu = getFollowupIndicator(prospect.last_followup_at);
                           const cluster = clusters.find(c => c.id === prospect.interested_cluster_id);
                          return (
                            <motion.div
                              layout
                              key={prospect.id}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              whileHover={{ scale: 1.02 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, prospect.id)}
                                className="active:cursor-grabbing cursor-grab"
                              >
                                <Link
                                  href={`/prospects/${prospect.id}`}
                                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-2 block text-left"
                                  draggable={false}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-extrabold text-sm text-gray-900 truncate max-w-[75%]">{prospect.full_name}</span>
                                    <div className="relative group/indicator">
                                      <span className={`w-2.5 h-2.5 rounded-full block cursor-help ${fu.color}`}></span>
                                      <div className="absolute right-0 top-full mt-1 hidden group-hover/indicator:block z-50 bg-gray-800 text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap">
                                        {fu.label}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-bold">{prospect.phone}</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-bold">
                                      {cluster?.name || 'Cluster'}
                                    </span>
                                    <span className="text-[9px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100 font-semibold truncate capitalize">
                                      Source: {prospect.lead_source}
                                    </span>
                                  </div>
                                </Link>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== TAB 3: PROSPECTS TABLE ==================== */}
        {activeTab === 'prospects' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            {/* Table search controls */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-stretch md:items-center">
                <div className="relative w-full md:max-w-xs">
                  <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari prospek (nama/telepon)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="">Semua Tahapan Pipeline</option>
                  {pipelineStages.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* View Mode Switcher */}
              <div className="flex bg-gray-100 p-1 rounded-xl self-stretch md:self-auto gap-1">
                <button
                  onClick={() => setProspectViewMode('table')}
                  className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    prospectViewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <List size={14} />
                  Tabel
                </button>
                <button
                  onClick={() => setProspectViewMode('card')}
                  className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    prospectViewMode === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Grid size={14} />
                  Kartu
                </button>
              </div>
            </div>

            {/* Layout depending on view mode */}
            {prospectViewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Nama Prospek</th>
                      <th className="p-4">Telepon</th>
                      <th className="p-4">Cluster Minat</th>
                      <th className="p-4">Sumber Lead</th>
                      <th className="p-4">Tahapan Pipeline</th>
                      <th className="p-4">Kesegaran Follow-up</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProspects.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400 italic">Tidak ada data prospek ditemukan</td>
                      </tr>
                    ) : (
                      filteredProspects.map((p) => {
                        const cluster = clusters.find(c => c.id === p.interested_cluster_id);
                        const stage = pipelineStages.find(s => s.key === p.pipeline_stage);
                        const fu = getFollowupIndicator(p.last_followup_at);
                        return (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-4 font-bold text-gray-900 whitespace-nowrap">
                              <button 
                                onClick={() => setSelectedProspectDetail(p)}
                                className="text-left font-bold text-gray-900 hover:text-blue-600 transition-colors"
                              >
                                {p.full_name}
                              </button>
                            </td>
                            <td className="p-4 font-semibold text-gray-500 whitespace-nowrap">{p.phone}</td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-bold whitespace-nowrap">{cluster?.name || '-'}</span>
                            </td>
                            <td className="p-4 capitalize font-medium text-gray-600 whitespace-nowrap">{p.lead_source.replace('_', ' ')}</td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-black whitespace-nowrap ${stage?.color}`}>
                                {stage?.label}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${fu.color}`}></span>
                                <span className="font-semibold text-gray-700">{fu.label}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setSelectedProspectDetail(p)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Lihat Detail"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => startEditProspect(p)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                  title="Edit Prospek"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProspect(p.id, p.full_name)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Hapus Prospek"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <Link 
                                  href={`/prospects/${p.id}`} 
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                  title="Kelola Follow-up"
                                >
                                  <ChevronRight size={16} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 bg-gray-50/50">
                {filteredProspects.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 italic">Tidak ada data prospek ditemukan</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredProspects.map((p) => {
                      const cluster = clusters.find(c => c.id === p.interested_cluster_id);
                      const stage = pipelineStages.find(s => s.key === p.pipeline_stage);
                      const fu = getFollowupIndicator(p.last_followup_at);
                      const initials = p.full_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div 
                          key={p.id}
                          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group hover:-translate-y-0.5 premium-card relative overflow-hidden text-left"
                        >
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 text-[9px] font-bold">
                            <span className={`w-2 h-2 rounded-full ${fu.color}`}></span>
                            <span className="text-gray-500">{fu.label}</span>
                          </div>

                          <div className="flex gap-3.5 items-center">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-inner flex-shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0 pr-24">
                              <h4 
                                onClick={() => setSelectedProspectDetail(p)}
                                className="font-extrabold text-sm text-gray-950 hover:text-blue-600 cursor-pointer transition-colors truncate"
                              >
                                {p.full_name}
                              </h4>
                              <p className="text-[11px] text-gray-400 font-bold mt-0.5">{p.phone}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3.5 text-[11px]">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-gray-400 font-semibold text-[10px]">Cluster Minat</span>
                              <span className="font-bold text-slate-800 truncate">{cluster?.name || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-gray-400 font-semibold text-[10px]">Sumber Lead</span>
                              <span className="font-bold text-slate-800 capitalize truncate">{p.lead_source.replace('_', ' ')}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3.5 mt-auto">
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-black tracking-wide uppercase ${stage?.color}`}>
                              {stage?.label}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedProspectDetail(p)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Lihat Detail"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => startEditProspect(p)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Edit Prospek"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteProspect(p.id, p.full_name)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Hapus Prospek"
                              >
                                <Trash2 size={14} />
                              </button>
                              <Link 
                                href={`/prospects/${p.id}`}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="Kelola Follow-up"
                              >
                                <ChevronRight size={14} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD PROSPECT */}
        {isAddProspectOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  Tambah Prospek Baru
                </h3>
                <button 
                  onClick={() => setIsAddProspectOpen(false)} 
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 text-xs font-bold"
                >
                  BATAL
                </button>
              </div>

              <form onSubmit={handleCreateProspect} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama calon pembeli..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Nomor Telepon (WA) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890..."
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Email (Opsional)</label>
                    <input
                      type="email"
                      placeholder="pembeli@domain.com..."
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Pekerjaan (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Pekerjaan pembeli..."
                      value={formOccupation}
                      onChange={(e) => setFormOccupation(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Estimasi Penghasilan (IDR/Bulan)</label>
                    <input
                      type="number"
                      placeholder="Estimasi penghasilan..."
                      value={formIncome}
                      onChange={(e) => setFormIncome(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Sumber Lead</label>
                    <select
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    >
                      <option value="instagram">Instagram Ads</option>
                      <option value="facebook_ads">Facebook Ads</option>
                      <option value="walk_in">Walk-in (Kantor)</option>
                      <option value="referral">Referral</option>
                      <option value="pameran">Pameran</option>
                      <option value="website">Website</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Cluster Minat</label>
                    <select
                      value={formCluster}
                      onChange={(e) => setFormCluster(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    >
                      {clusters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Tipe Unit Minat</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    >
                      {unitTypes.filter(t => t.cluster_id === formCluster).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-wider text-[10px]">Catatan Awal (Notes)</label>
                  <textarea
                    placeholder="Masukkan deskripsi awal ketertarikan, catatan KPR, dll..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  BUAT PROSPEK BARU
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DETAIL KAVLING */}
        {isEditUnitOpen && selectedUnit && (() => {
          const type = unitTypes.find(t => t.id === selectedUnit.unit_type_id);
          const prospect = selectedUnit.reserved_for 
            ? prospects.find(p => p.id === selectedUnit.reserved_for) 
            : null;
          const salesAgent = prospect 
            ? availableUsers.find(u => u.id === prospect.assigned_to) 
            : null;
          const config = statusConfig[selectedUnit.status];
          
          return (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
                {/* Visual Header Image */}
                {type?.photos && type.photos.length > 0 ? (
                  <div className="w-full h-48 relative border-b border-gray-100">
                    <img 
                      src={type.photos[0]} 
                      alt={type.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200/50 py-1.5 px-3 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
                      <span className="text-slate-800">{config.label}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex justify-between items-center border-b border-gray-100">
                    <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                      <HomeIcon size={20} className="text-blue-600" />
                      Detail Kavling Blok {selectedUnit.block_number}
                    </h3>
                    <div className={`py-1 px-2.5 rounded-lg border text-[10px] font-bold ${config.color}`}>
                      {config.label}
                    </div>
                  </div>
                )}

                {/* Content body */}
                <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs">
                  {type?.photos && type.photos.length > 0 && (
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-extrabold text-lg text-slate-900">
                        Kavling Blok {selectedUnit.block_number}
                      </h3>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 uppercase">
                        Kavling {selectedUnit.orientation}
                      </span>
                    </div>
                  )}

                  {/* Section: Unit Specs */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Tipe Unit</span>
                      <span className="font-extrabold text-slate-800 text-sm">{type?.name}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Harga Jual</span>
                      <span className="font-black text-blue-600 text-sm">{formatIDR(selectedUnit.sell_price)}</span>
                    </div>
                    {type && (
                      <>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Luas Bangunan / Tanah</span>
                          <span className="font-bold text-slate-700">{type.building_area} m² / {type.land_area} m²</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Spesifikasi</span>
                          <span className="font-bold text-slate-700">{type.bedrooms} KT / {type.bathrooms} KM</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Section: Consumer info */}
                  {prospect ? (
                    <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-4">
                      <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-[9px] text-blue-600">Informasi Konsumen</h4>
                      <div className="grid grid-cols-2 gap-3.5 bg-blue-50/20 p-4 border border-blue-100/30 rounded-2xl">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Nama Lengkap</span>
                          <span className="font-extrabold text-slate-800">{prospect.full_name}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Telepon</span>
                          <span className="font-bold text-slate-700">{prospect.phone}</span>
                        </div>
                        {prospect.email && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Email</span>
                            <span className="font-bold text-slate-700 truncate">{prospect.email}</span>
                          </div>
                        )}
                        {prospect.occupation && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Pekerjaan</span>
                            <span className="font-bold text-slate-700">
                              {prospect.occupation} {prospect.company_name ? `di ${prospect.company_name}` : ''}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5 col-span-2 border-t border-blue-100/10 pt-2 mt-1">
                          <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Status Pipeline</span>
                          <span className="font-black text-indigo-600 uppercase tracking-wide text-[10px]">
                            {prospect.pipeline_stage.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 border border-dashed border-gray-200 rounded-2xl text-gray-400 font-semibold italic">
                      Kavling ini belum dihubungkan dengan konsumen (Status Available).
                    </div>
                  )}

                  {/* Section: Sales Agent */}
                  {salesAgent && (
                    <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-4">
                      <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-[9px] text-teal-600">Sales Yang Menangani</h4>
                      <div className="flex items-center gap-3 bg-teal-50/20 p-4 border border-teal-100/30 rounded-2xl">
                        <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-black text-sm uppercase">
                          {salesAgent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800 text-sm">{salesAgent.name}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                            {salesAgent.role} · {salesAgent.department}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section: Mortgage (KPR / Akad) details */}
                  {['kpr_process', 'sold'].includes(selectedUnit.status) && selectedUnit.bank_name && (
                    <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-4">
                      <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-[9px] text-orange-600">
                        Detail Akad & KPR Bank
                      </h4>
                      <div className="grid grid-cols-2 gap-3.5 bg-orange-50/20 p-4 border border-orange-100/30 rounded-2xl">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Bank Akad</span>
                          <span className="font-black text-slate-800">{selectedUnit.bank_name}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Tanggal Akad</span>
                          <span className="font-extrabold text-slate-700">{selectedUnit.akad_date}</span>
                        </div>
                        {selectedUnit.loan_amount && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Jumlah Pinjaman (Plafond)</span>
                            <span className="font-extrabold text-orange-600">{formatIDR(selectedUnit.loan_amount)}</span>
                          </div>
                        )}
                        {selectedUnit.interest_rate && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Suku Bunga KPR</span>
                            <span className="font-bold text-slate-700">{selectedUnit.interest_rate} %</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section: Notes */}
                  {selectedUnit.notes && (
                    <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-4">
                      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Catatan Unit</span>
                      <p className="text-slate-600 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                        {selectedUnit.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer action button */}
                <div className="bg-slate-50 border-t border-gray-100 p-4 flex justify-end">
                  <button
                    onClick={() => setIsEditUnitOpen(false)}
                    className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md hover:bg-slate-800 transition-colors uppercase tracking-wider"
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL: DETAIL PROSPEK */}
        {selectedProspectDetail && (() => {
          const p = selectedProspectDetail;
          const cluster = clusters.find(c => c.id === p.interested_cluster_id);
          const type = unitTypes.find(t => t.id === p.interested_type_id);
          const stage = pipelineStages.find(s => s.key === p.pipeline_stage);
          const fu = getFollowupIndicator(p.last_followup_at);
          const salesAgent = availableUsers.find(u => u.id === p.assigned_to);

          return (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp text-left">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex justify-between items-center border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                      {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                        {p.full_name}
                      </h3>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{p.phone}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedProspectDetail(null)} 
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-wider p-1"
                  >
                    Tutup
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs">
                  {/* Pipeline & Follow-up status */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex flex-col gap-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex-1 min-w-[120px]">
                      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Tahapan Pipeline</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-black self-start mt-0.5 ${stage?.color}`}>
                        {stage?.label}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex-1 min-w-[120px]">
                      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Kesegaran Follow-up</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${fu.color}`}></span>
                        <span className="font-bold text-gray-800">{fu.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="flex flex-col gap-2.5">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-[9px] text-blue-600">Rincian Kontak & Pekerjaan</h4>
                    <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl text-left">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Email</span>
                        <span className="font-bold text-slate-700 truncate">{p.email || '-'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Sumber Lead</span>
                        <span className="font-bold text-slate-700 capitalize">{p.lead_source.replace('_', ' ')}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Pekerjaan</span>
                        <span className="font-bold text-slate-700 truncate">{p.occupation || '-'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Perusahaan</span>
                        <span className="font-bold text-slate-700 truncate">{p.company_name || '-'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 col-span-2">
                        <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Estimasi Pendapatan Bulanan</span>
                        <span className="font-black text-slate-800 text-sm">
                          {p.estimated_income ? formatIDR(p.estimated_income) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interested Property */}
                  <div className="flex flex-col gap-2.5">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-[9px] text-indigo-600">Properti Yang Diminati</h4>
                    <div className="grid grid-cols-2 gap-3.5 bg-indigo-50/10 p-4 border border-indigo-100/30 rounded-2xl text-left">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Cluster</span>
                        <span className="font-extrabold text-slate-800">{cluster?.name || '-'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Tipe Unit</span>
                        <span className="font-bold text-slate-700">{type?.name || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sales Agent handling */}
                  {salesAgent && (
                    <div className="flex flex-col gap-2.5">
                      <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-[9px] text-teal-600">Sales Agent Pengampu</h4>
                      <div className="flex items-center gap-3 bg-teal-50/20 p-4 border border-teal-100/30 rounded-2xl text-left">
                        <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-black text-xs uppercase">
                          {salesAgent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800">{salesAgent.name}</span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">
                            {salesAgent.role} · {salesAgent.department}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Initial Notes */}
                  {p.notes && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Catatan Prospek</span>
                      <p className="text-slate-600 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed text-left">
                        {p.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 border-t border-gray-100 p-4 flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setSelectedProspectDetail(null);
                      startEditProspect(p);
                    }}
                    className="px-4 py-2 border border-gray-200 text-gray-700 bg-white font-bold text-xs rounded-xl shadow-sm hover:bg-gray-50 transition-colors uppercase tracking-wider"
                  >
                    Edit Data
                  </button>
                  <Link
                    href={`/prospects/${p.id}`}
                    onClick={() => setSelectedProspectDetail(null)}
                    className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700 transition-colors uppercase tracking-wider flex items-center gap-1.5 text-center justify-center"
                  >
                    Kelola Follow-up
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL: EDIT PROSPEK */}
        {editingProspect && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-left">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-lg flex items-center gap-2 text-slate-800">
                  <Edit2 size={20} className="text-amber-600" />
                  Edit Data Prospek
                </h3>
                <button 
                  onClick={() => setEditingProspect(null)} 
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 text-xs font-bold"
                >
                  BATAL
                </button>
              </div>

              <form onSubmit={handleUpdateProspect} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap..."
                      value={editFormName}
                      onChange={(e) => setEditFormName(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Nomor Telepon (WA) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Nomor telepon..."
                      value={editFormPhone}
                      onChange={(e) => setEditFormPhone(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Email</label>
                    <input
                      type="email"
                      placeholder="Email..."
                      value={editFormEmail}
                      onChange={(e) => setEditFormEmail(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Pekerjaan</label>
                    <input
                      type="text"
                      placeholder="Pekerjaan..."
                      value={editFormOccupation}
                      onChange={(e) => setEditFormOccupation(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Nama Perusahaan</label>
                    <input
                      type="text"
                      placeholder="Nama perusahaan..."
                      value={editFormCompany}
                      onChange={(e) => setEditFormCompany(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-500 uppercase tracking-wider text-[10px]">Estimasi Penghasilan (IDR/Bulan)</label>
                    <input
                      type="number"
                      placeholder="Estimasi penghasilan..."
                      value={editFormIncome}
                      onChange={(e) => setEditFormIncome(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-wider text-[10px]">Catatan Prospek</label>
                  <textarea
                    placeholder="Masukkan catatan prospek..."
                    value={editFormNotes}
                    onChange={(e) => setEditFormNotes(e.target.value)}
                    rows={3}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  SIMPAN PERUBAHAN
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
