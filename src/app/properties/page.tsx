"use client";

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { 
  Layers, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  ShieldCheck, 
  Building2, 
  UploadCloud, 
  Check, 
  Info, 
  AlertCircle,
  FolderOpen,
  DollarSign
} from 'lucide-react';

const docCategories = [
  { key: 'sertifikat_induk', label: 'SHM / SHGB Induk', desc: 'Sertifikat tanah induk proyek sebelum dipecah' },
  { key: 'pbg_induk', label: 'IMB / PBG Induk', desc: 'Persetujuan Bangunan Gedung tingkat proyek' },
  { key: 'kkpr', label: 'KKPR / Izin Lokasi', desc: 'Kesesuaian Kegiatan Pemanfaatan Ruang' },
  { key: 'site_plan_legal', label: 'Pengesahan Site Plan', desc: 'Site plan tata ruang resmi yang disetujui Pemda' },
  { key: 'izin_lingkungan', label: 'Izin Lingkungan (UKL/UPL/AMDAL)', desc: 'Dokumen analisis dampak lingkungan hidup' },
  { key: 'pbb_induk', label: 'PBB Induk', desc: 'Kwitansi/Bukti bayar Pajak Bumi & Bangunan Induk' },
  { key: 'npwp_proyek', label: 'NPWP Proyek', desc: 'Nomor Pokok Wajib Pajak khusus kantor/proyek cabang' },
] as const;

interface ClusterDoc {
  id: string;
  category: 'sertifikat_induk' | 'pbg_induk' | 'kkpr' | 'site_plan_legal' | 'izin_lingkungan' | 'pbb_induk' | 'npwp_proyek';
  doc_number?: string;
  issued_date?: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

interface Cluster {
  id: string;
  name: string;
  location: string;
  description: string;
  total_units: number;
  status: 'pre_launch' | 'active' | 'sold_out';
  svg_content?: string;
  logo_url?: string;
  address?: string;
  email?: string;
  phone?: string;
  bank_account?: string;
  documents?: ClusterDoc[];
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
  has_carport: boolean;
  description: string;
}

interface PropertyUnit {
  id: string;
  cluster_id: string;
  unit_type_id: string;
  block_number: string;
  sell_price: number;
  orientation: 'hook' | 'middle' | 'corner';
  status: 'available' | 'reserved' | 'booking' | 'kpr_process' | 'sold' | 'unavailable';
  notes?: string;
  construction_status?: 'belum_terbangun' | 'proses_pembangunan' | 'finishing' | 'ready';
  legal_status?: 'shm' | 'shgb' | 'ajb' | 'other';
  pbb_status?: 'paid' | 'unpaid' | 'not_registered';
  pbb_nop?: string;
  pbb_owner_name?: string;
  land_documents?: Array<{ id: string; name: string; url: string; uploaded_at: string }>;
  tax_documents?: Array<{ id: string; name: string; url: string; uploaded_at: string }>;
}

export default function PropertiesManagementPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Data Lists
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  
  // Settings fallbacks
  const [orgLogo, setOrgLogo] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgBankAccount, setOrgBankAccount] = useState('');
  
  // View states
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');
  const [isAddingCluster, setIsAddingCluster] = useState(false);
  const [isEditingClusterId, setIsEditingClusterId] = useState<string>('');
  
  // RBAC Permission check
  const isAllowedToMutate = user?.role === 'admin' || user?.role === 'manager';

  // Cluster Form State
  const [clName, setClName] = useState('');
  const [clLocation, setClLocation] = useState('');
  const [clDesc, setClDesc] = useState('');
  const [clSvgContent, setClSvgContent] = useState('');
  const [selectedSvgFileName, setSelectedSvgFileName] = useState('');
  const [clLogo, setClLogo] = useState('');
  const [clAddress, setClAddress] = useState('');
  const [clEmail, setClEmail] = useState('');
  const [clPhone, setClPhone] = useState('');
  const [clBankAccount, setClBankAccount] = useState('');
  const [clStatus, setClStatus] = useState<'active' | 'pre_launch' | 'sold_out'>('active');
  const [clDocuments, setClDocuments] = useState<ClusterDoc[]>([]);

  // Unit Type Form State
  const [isAddingUnitType, setIsAddingUnitType] = useState(false);
  const [isEditingUnitTypeId, setIsEditingUnitTypeId] = useState('');
  const [utName, setUtName] = useState('');
  const [utBuildingArea, setUtBuildingArea] = useState('');
  const [utLandArea, setUtLandArea] = useState('');
  const [utBasePrice, setUtBasePrice] = useState('');
  const [utBedrooms, setUtBedrooms] = useState('2');
  const [utBathrooms, setUtBathrooms] = useState('1');
  const [utHasCarport, setUtHasCarport] = useState(true);
  const [utDesc, setUtDesc] = useState('');

  // Unit / Kavling Form State
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [isEditingUnitId, setIsEditingUnitId] = useState('');
  const [uUnitTypeId, setUUnitTypeId] = useState('');
  const [uBlockNumber, setUBlockNumber] = useState('');
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

  const fetchPropertiesData = async () => {
    try {
      const res = await fetch('/api/db');
      const json = await res.json();
      if (json.success) {
        let loadedClusters = json.data.clusters || [];
        let loadedUnits = json.data.units || [];
        let loadedUnitTypes = json.data.unitTypes || [];

        // Apply housing project access filtering
        const accessClusters = user?.accessible_clusters;
        if (user && user.role !== 'admin' && accessClusters && accessClusters.length > 0) {
          loadedClusters = loadedClusters.filter((c: any) => accessClusters.includes(c.id));
          loadedUnits = loadedUnits.filter((u: any) => accessClusters.includes(u.cluster_id));
          loadedUnitTypes = loadedUnitTypes.filter((ut: any) => accessClusters.includes(ut.cluster_id));
        }

        setClusters(loadedClusters);
        setUnits(loadedUnits);
        setUnitTypes(loadedUnitTypes);
        
        const settings = json.data.settings;
        if (settings) {
          setOrgLogo(settings.org_logo ?? '');
          setOrgAddress(settings.org_address ?? '');
          setOrgEmail(settings.org_email ?? '');
          setOrgPhone(settings.org_phone ?? '');
          setOrgBankAccount(settings.org_bank_account ?? '');
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch properties data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPropertiesData();
    }
  }, [user]);

  // Form Handlers
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

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedToMutate) return;
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
          documents: clDocuments,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(isEditing ? 'Cluster perumahan berhasil diperbarui!' : 'Cluster perumahan baru berhasil dibuat!');
        setIsAddingCluster(false);
        setIsEditingClusterId('');
        resetClusterForm();
        fetchPropertiesData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetClusterForm = () => {
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
    setClStatus('active');
    setClDocuments([]);
  };

  const handleStartEditCluster = (cluster: Cluster) => {
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
    setClDocuments(cluster.documents || []);
    setIsAddingCluster(true);
  };

  const handleDeleteCluster = async (clusterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAllowedToMutate) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus perumahan ini? Seluruh tipe unit dan kavling di dalamnya juga akan terhapus.')) {
      return;
    }
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
        fetchPropertiesData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Unit Type Handlers
  const handleCreateUnitType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedToMutate) return;
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
        resetUnitTypeForm();
        fetchPropertiesData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetUnitTypeForm = () => {
    setUtName('');
    setUtBuildingArea('');
    setUtLandArea('');
    setUtBasePrice('');
    setUtBedrooms('2');
    setUtBathrooms('1');
    setUtHasCarport(true);
    setUtDesc('');
  };

  const handleStartEditUnitType = (type: UnitType) => {
    setIsEditingUnitTypeId(type.id);
    setUtName(type.name);
    setUtBuildingArea(String(type.building_area));
    setUtLandArea(String(type.land_area));
    setUtBasePrice(String(type.base_price));
    setUtBedrooms(String(type.bedrooms));
    setUtBathrooms(String(type.bathrooms));
    setUtHasCarport(type.has_carport);
    setUtDesc(type.description || '');
    setIsAddingUnitType(true);
  };

  const handleDeleteUnitType = async (typeId: string) => {
    if (!isAllowedToMutate) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus tipe unit ini? Semua kavling dengan tipe ini juga akan terhapus.')) {
      return;
    }
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
        fetchPropertiesData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Kavling / Unit Handlers
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedToMutate) return;
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
        resetUnitForm();
        fetchPropertiesData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetUnitForm = () => {
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
  };

  const handleStartEditUnit = (unit: PropertyUnit) => {
    setIsEditingUnitId(unit.id);
    setUUnitTypeId(unit.unit_type_id);
    setUBlockNumber(unit.block_number);
    setUSellPrice(String(unit.sell_price));
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

  const handleDeleteUnit = async (unitId: string) => {
    if (!isAllowedToMutate) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus kavling ini?')) {
      return;
    }
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
        fetchPropertiesData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex flex-col gap-6 w-full animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-64 bg-gray-200 rounded-2xl md:col-span-2"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8 w-full">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/50 pb-5 text-left">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2.5">
              <Building2 className="text-blue-600" size={32} />
              Manajemen Properti & Kavling
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola data perumahan, spesifikasi bangunan tipe unit, serta administrasi legalitas & progres kavling.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isAllowedToMutate ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                <ShieldCheck size={14} /> Mode Pengedit (Admin/Manager)
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                <Info size={14} /> Akses Hanya Baca (Staff)
              </span>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT SWITCHER ── */}
        
        {/* VIEW 1: Adding a new Cluster/Housing Project */}
        {isAddingCluster && isAllowedToMutate ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-left">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">{isEditingClusterId ? 'Edit Cluster Perumahan' : 'Tambah Cluster Perumahan Baru'}</h2>
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
                      <UploadCloud size={14} />
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
                  <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl text-[10px] flex items-center gap-2 mb-2">
                    <Check size={14} className="text-green-600" />
                    Peta SVG berhasil diproses ({Math.round(clSvgContent.length / 1024)} KB).
                  </div>
                )}

                {/* ── PEMBERKASAN & PERIZINAN PROYEK ── */}
                <div className="border-t border-gray-200/50 pt-5 mt-2 flex flex-col gap-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                      📁 Pemberkasan & Perizinan Proyek
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">Legalitas & Perpajakan Tingkat Perumahan</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docCategories.map(cat => {
                      const existingDoc = clDocuments.find(d => d.category === cat.key);
                      return (
                        <div key={cat.key} className="p-4 border border-gray-200 rounded-2xl bg-slate-50/50 flex flex-col gap-3">
                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-gray-900 text-xs">{cat.label}</span>
                            <span className="text-[10px] text-gray-400 font-medium leading-normal">{cat.desc}</span>
                          </div>

                          {existingDoc ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm text-left">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-base flex-shrink-0">📄</span>
                                  <a 
                                    href={existingDoc.file_url} 
                                    download={existingDoc.file_name} 
                                    className="text-[11px] font-bold text-blue-600 hover:underline truncate" 
                                    title={existingDoc.file_name}
                                  >
                                    {existingDoc.file_name}
                                  </a>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setClDocuments(prev => prev.filter(d => d.id !== existingDoc.id))}
                                  className="text-gray-400 hover:text-red-600 font-black text-xs px-1 hover:bg-slate-100 rounded transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 border-t border-gray-100 pt-2 font-medium">
                                <div>
                                  <span className="text-[8px] text-gray-400 font-bold block uppercase">No. Dokumen:</span>
                                  <span className="font-bold text-gray-800">{existingDoc.doc_number || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-gray-400 font-bold block uppercase">Tgl Terbit:</span>
                                  <span className="font-bold text-gray-800">{existingDoc.issued_date || '-'}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              <div className="grid grid-cols-2 gap-2 text-left">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[8px] text-gray-400 font-bold uppercase">No. Dokumen</span>
                                  <input
                                    type="text"
                                    id={`doc-num-${cat.key}`}
                                    placeholder="Nomor dokumen..."
                                    className="px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none text-[10px] font-medium"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[8px] text-gray-400 font-bold uppercase">Tanggal Terbit</span>
                                  <input
                                    type="date"
                                    id={`doc-date-${cat.key}`}
                                    className="px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none text-[10px] font-medium"
                                  />
                                </div>
                              </div>

                              <label className="px-3 py-2 border border-dashed border-gray-300 hover:bg-slate-100 hover:border-gray-400 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 font-bold text-[10px] text-gray-500 bg-white transition-all">
                                <UploadCloud size={14} className="text-gray-400" />
                                <span>Unggah Berkas</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const numInput = document.getElementById(`doc-num-${cat.key}`) as HTMLInputElement;
                                    const dateInput = document.getElementById(`doc-date-${cat.key}`) as HTMLInputElement;
                                    
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const url = event.target?.result as string;
                                      const newDoc = {
                                        id: 'doc-' + Math.random().toString(36).substr(2, 9),
                                        category: cat.key,
                                        doc_number: numInput?.value || undefined,
                                        issued_date: dateInput?.value || undefined,
                                        file_name: file.name,
                                        file_url: url,
                                        uploaded_at: new Date().toLocaleDateString('id-ID')
                                      };
                                      setClDocuments(prev => [...prev.filter(d => d.category !== cat.key), newDoc]);
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs"
                  >
                    {isEditingClusterId ? 'Simpan Perubahan' : 'Simpan Perumahan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCluster(false);
                      setIsEditingClusterId('');
                      resetClusterForm();
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
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">
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
              <div className="flex flex-col gap-6 w-full text-left">
                {/* Detail Header & Back button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Detail Perumahan</span>
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
                      {!isAddingUnitType && isAllowedToMutate && (
                        <button
                          onClick={() => setIsAddingUnitType(true)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-[10px] transition-colors border border-blue-100"
                        >
                          + TAMBAH
                        </button>
                      )}
                    </div>

                    {isAddingUnitType && isAllowedToMutate ? (
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
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-[11px]"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingUnitType(false);
                              setIsEditingUnitTypeId('');
                              resetUnitTypeForm();
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
                                {isAllowedToMutate && (
                                  <div className="flex items-center gap-1.5 opacity-0 group-hover/type:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditUnitType(type)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 transition-colors"
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
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 font-semibold">
                                LB: {type.building_area} m² · LT: {type.land_area} m² · KT: {type.bedrooms} / KM: {type.bathrooms}
                              </span>
                              <span className="font-extrabold text-blue-600 text-[11px] mt-1">
                                {formatIDR(type.base_price)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Legalitas & Dokumen Perizinan Perumahan */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 self-start">
                    <div className="border-b border-gray-100 pb-3 flex justify-between items-center text-left">
                      <h3 className="font-extrabold text-sm text-gray-950 flex items-center gap-1.5">
                        <FolderOpen size={16} className="text-blue-600" />
                        Legalitas & Perizinan Proyek
                      </h3>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 text-left">
                      {(!cluster?.documents || cluster.documents.length === 0) ? (
                        <div className="text-center py-6 border border-dashed border-gray-150 rounded-xl text-gray-400 italic text-[11px] flex flex-col items-center justify-center gap-1.5">
                          <Info size={16} className="text-gray-300" />
                          <span>Belum ada berkas perizinan diunggah.</span>
                        </div>
                      ) : (
                        cluster.documents.map((doc) => {
                          const matchingCategory = docCategories.find(c => c.key === doc.category);
                          return (
                            <div key={doc.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5">
                              <div className="flex justify-between items-start">
                                <span className="font-extrabold text-gray-950 text-xs leading-normal">{matchingCategory?.label || doc.category.replace('_', ' ')}</span>
                              </div>
                              {doc.doc_number && (
                                <span className="text-[10px] text-gray-600 font-semibold leading-none">
                                  No: <span className="text-gray-900 font-extrabold">{doc.doc_number}</span>
                                </span>
                              )}
                              {doc.issued_date && (
                                <span className="text-[9px] text-gray-400 font-bold leading-none">
                                  Terbit: {doc.issued_date}
                                </span>
                              )}
                              <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-0.5">
                                <span className="text-[8px] text-gray-400 font-bold">Upload: {doc.uploaded_at}</span>
                                <a
                                  href={doc.file_url}
                                  download={doc.file_name}
                                  className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                  Unduh Berkas ➔
                                </a>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right 2 Columns: Kavling / Plots List & Form */}
                  <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-extrabold text-sm text-gray-950">Daftar Kavling & Plot ({clusterUnits.length})</h3>
                      {!isAddingUnit && clusterTypes.length > 0 && isAllowedToMutate && (
                        <button
                          onClick={() => {
                            setUUnitTypeId(clusterTypes[0].id);
                            setIsAddingUnit(true);
                          }}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-[10px] transition-colors border border-blue-100"
                        >
                          + TAMBAH KAVLING
                        </button>
                      )}
                    </div>

                    {/* Add Kavling Form */}
                    {isAddingUnit && isAllowedToMutate ? (
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
                          <h5 className="font-extrabold text-[10px] text-blue-600 uppercase tracking-widest">⚖️ Legalitas & Perpajakan</h5>
                          
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
                            <div className="flex flex-col gap-2 p-3 bg-blue-50/20 border border-blue-100/50 rounded-xl">
                              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wide flex items-center gap-1">📁 Dokumen Pertanahan</span>
                              <label className="px-3 py-1.5 border border-dashed border-blue-300 hover:bg-blue-50 hover:border-blue-400 rounded-lg cursor-pointer flex items-center justify-center gap-1 font-bold text-[10px] text-blue-700 bg-white transition-all">
                                <UploadCloud size={12} />
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
                                        <a href={doc.url} download={doc.name} className="text-[9px] font-bold text-slate-700 hover:text-blue-600 hover:underline truncate" title={doc.name}>
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
                                <UploadCloud size={12} />
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
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-xs"
                          >
                            Simpan Kavling
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingUnit(false);
                              setIsEditingUnitId('');
                              resetUnitForm();
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
                            {isAllowedToMutate && <th className="p-3 text-center">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {clusterUnits.length === 0 ? (
                            <tr>
                              <td colSpan={isAllowedToMutate ? 8 : 7} className="p-4 text-center text-gray-400 italic text-[11px]">
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
                                    {formatIDR(unit.sell_price)}
                                  </td>
                                  <td className="p-3 font-extrabold text-[10px] text-blue-600 uppercase">
                                    {unit.legal_status ? unit.legal_status.toUpperCase() : 'SHM'}
                                    {unit.land_documents && unit.land_documents.length > 0 && (
                                      <span className="ml-1 text-[8px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-100">
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
                                  {isAllowedToMutate && (
                                    <td className="p-3 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleStartEditUnit(unit)}
                                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors"
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
                                  )}
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
          <div className="flex flex-col gap-5 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-base text-gray-900">Cluster Perumahan & Site Plan</h2>
                <p className="text-xs text-gray-500 mt-0.5">Kelola data perumahan, spesifikasi bangunan, dan denah site plan SVG.</p>
              </div>
              {isAllowedToMutate && (
                <button
                  onClick={() => setIsAddingCluster(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Plus size={16} /> Tambah Perumahan
                </button>
              )}
            </div>

            {clusters.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
                <FolderOpen size={48} className="text-gray-300" />
                <span className="text-sm font-bold text-gray-800">Belum ada Cluster Terdaftar</span>
                <span className="text-xs text-gray-400 max-w-sm">Mulai daftarkan cluster perumahan Anda dengan menekan tombol Tambah Perumahan di atas.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {clusters.map(cluster => {
                  const clusterUnits = units.filter(u => u.cluster_id === cluster.id);
                  return (
                    <div
                      key={cluster.id}
                      onClick={() => {
                        setSelectedClusterId(cluster.id);
                        setIsAddingUnit(false);
                        setIsAddingUnitType(false);
                      }}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col gap-3 group text-left"
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
                            {isAllowedToMutate && (
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditCluster(cluster);
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors"
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
                            )}
                          </div>
                          <h3 className="font-black text-sm text-gray-900 mt-2 truncate group-hover:text-blue-600 transition-colors">
                            {cluster.name}
                          </h3>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{cluster.location}</p>
                          {cluster.address && (
                            <p className="text-[9px] text-gray-400 font-medium truncate mt-0.5" title={cluster.address}>{cluster.address}</p>
                          )}
                          <p className="text-[10px] text-gray-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                            {cluster.description || "Tidak ada deskripsi perumahan."}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-[10px] font-bold text-gray-500">
                        <span>{clusterUnits.length || 0} Kavling Terdaftar</span>
                        <span className="text-blue-600 group-hover:underline">Kelola Perumahan ➔</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
