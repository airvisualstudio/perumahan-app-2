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
  Building,
  UploadCloud, 
  Check, 
  Info, 
  AlertCircle,
  FolderOpen,
  DollarSign,
  Briefcase,
  Phone,
  Mail,
  Search,
  UserCheck
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

interface Company {
  id: string;
  name: string;
  code?: string;
  legal_name?: string;
  npwp?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  bank_account?: string;
  director_name?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

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
  company_id?: string;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'companies' | 'clusters'>('companies');
  const [searchCompany, setSearchCompany] = useState('');

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

  // Company Form State
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [isEditingCompanyId, setIsEditingCompanyId] = useState('');
  const [coName, setCoName] = useState('');
  const [coCode, setCoCode] = useState('');
  const [coLegalName, setCoLegalName] = useState('');
  const [coNpwp, setCoNpwp] = useState('');
  const [coAddress, setCoAddress] = useState('');
  const [coPhone, setCoPhone] = useState('');
  const [coEmail, setCoEmail] = useState('');
  const [coLogo, setCoLogo] = useState('');
  const [coBankAccount, setCoBankAccount] = useState('');
  const [coDirectorName, setCoDirectorName] = useState('');

  // Cluster Form State
  const [clCompanyId, setClCompanyId] = useState('');
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
        let loadedCompanies = json.data.companies || [];
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

        setCompanies(loadedCompanies);
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

  // Company Form Handlers
  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedToMutate) return;
    if (!coName) {
      alert('Nama perusahaan wajib diisi!');
      return;
    }
    try {
      const isEditing = !!isEditingCompanyId;
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEditing ? 'update_company' : 'create_company',
          company_id: isEditing ? isEditingCompanyId : undefined,
          name: coName,
          code: coCode,
          legal_name: coLegalName,
          npwp: coNpwp,
          address: coAddress,
          phone: coPhone,
          email: coEmail,
          logo_url: coLogo,
          bank_account: coBankAccount,
          director_name: coDirectorName,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(isEditing ? 'Data Perusahaan berhasil diperbarui!' : 'Perusahaan baru berhasil ditambahkan!');
        setIsAddingCompany(false);
        setIsEditingCompanyId('');
        resetCompanyForm();
        fetchPropertiesData();
      } else {
        alert(result.error || 'Gagal menyimpan perusahaan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetCompanyForm = () => {
    setCoName('');
    setCoCode('');
    setCoLegalName('');
    setCoNpwp('');
    setCoAddress('');
    setCoPhone('');
    setCoEmail('');
    setCoLogo('');
    setCoBankAccount('');
    setCoDirectorName('');
    setIsEditingCompanyId('');
  };

  const handleStartEditCompany = (comp: Company) => {
    setIsEditingCompanyId(comp.id);
    setCoName(comp.name);
    setCoCode(comp.code || '');
    setCoLegalName(comp.legal_name || '');
    setCoNpwp(comp.npwp || '');
    setCoAddress(comp.address || '');
    setCoPhone(comp.phone || '');
    setCoEmail(comp.email || '');
    setCoLogo(comp.logo_url || '');
    setCoBankAccount(comp.bank_account || '');
    setCoDirectorName(comp.director_name || '');
    setIsAddingCompany(true);
  };

  const handleDeleteCompany = async (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAllowedToMutate) return;
    const comp = companies.find(c => c.id === companyId);
    const linkedClusters = clusters.filter(c => c.company_id === companyId);
    const confirmMsg = linkedClusters.length > 0
      ? `Perusahaan "${comp?.name}" membawahi ${linkedClusters.length} perumahan. Menghapus perusahaan ini akan melepas relasi perumahan tersebut. Yakin ingin menghapus?`
      : `Yakin ingin menghapus perusahaan "${comp?.name}"?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_company',
          company_id: companyId,
          actor_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Perusahaan berhasil dihapus.');
        fetchPropertiesData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cluster Form Handlers
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
          company_id: clCompanyId || undefined,
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
    setClCompanyId('');
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
    setClCompanyId(cluster.company_id || '');
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

        {/* ── TOP TAB NAVIGATION BAR ── */}
        {!selectedClusterId && (
          <div className="flex border-b border-gray-200/80 gap-2 sm:gap-6 text-xs sm:text-sm font-bold text-gray-500 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => { setActiveTab('companies'); setIsAddingCompany(false); setIsAddingCluster(false); }}
              className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'companies'
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              <Building size={17} />
              <span>Perusahaan / Developer ({companies.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('clusters'); setIsAddingCluster(false); setIsAddingCompany(false); }}
              className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'clusters'
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              <Layers size={17} />
              <span>Perumahan / Cluster ({clusters.length})</span>
            </button>
          </div>
        )}

        {/* ── MAIN CONTENT SWITCHER ── */}
        
        {/* VIEW 1: Adding/Editing a Cluster/Housing Project */}
        {isAddingCluster && isAllowedToMutate ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">{isEditingClusterId ? 'Edit Cluster Perumahan' : 'Tambah Cluster Perumahan Baru'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isEditingClusterId ? 'Ubah informasi perumahan, lokasi, deskripsi, atau unggah peta SVG baru.' : 'Daftarkan perumahan baru lengkap dengan perusahaan induk, lokasi, deskripsi, dan denah peta SVG.'}
                </p>
              </div>
              <button
                onClick={() => { setIsAddingCluster(false); setIsEditingClusterId(''); resetClusterForm(); }}
                className="px-3.5 py-1.5 border border-gray-200 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleCreateCluster} className="lg:col-span-2 flex flex-col gap-4 text-xs font-semibold">
                
                {/* Perusahaan Induk Dropdown */}
                <div className="flex flex-col gap-1.5 p-3.5 bg-blue-50/40 border border-blue-100 rounded-xl">
                  <label className="text-blue-700 uppercase tracking-wider text-[9px] font-black flex items-center gap-1.5">
                    <Building size={12} /> Perusahaan Induk (Developer PT)
                  </label>
                  <select
                    value={clCompanyId}
                    onChange={e => setClCompanyId(e.target.value)}
                    className="px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-bold text-xs text-gray-800"
                  >
                    <option value="">-- Tanpa Perusahaan Induk (Independen) --</option>
                    {companies.map(comp => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name} {comp.code ? `(${comp.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-500 italic">Pilih entitas PT yang menaungi proyek perumahan ini.</span>
                </div>

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
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Unggah Peta Site Plan (SVG)</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 px-3.5 py-2 border border-dashed border-blue-300 rounded-xl bg-blue-50/50 hover:bg-blue-50 cursor-pointer flex items-center justify-center font-bold text-blue-700 transition-all gap-1.5">
                        <UploadCloud size={16} />
                        <span className="truncate">{selectedSvgFileName || 'Unggah berkas .svg'}</span>
                        <input
                          type="file"
                          accept=".svg"
                          onChange={handleSvgFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
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

                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all text-xs"
                  >
                    {isEditingClusterId ? 'Simpan Perubahan Cluster' : 'Buat Cluster Perumahan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCluster(false);
                      setIsEditingClusterId('');
                      resetClusterForm();
                    }}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-xs"
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
                        {clCompanyId && (
                          <span className="text-[9px] text-purple-600 font-bold uppercase mt-1">
                            {companies.find(c => c.id === clCompanyId)?.name}
                          </span>
                        )}
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
            const parentComp = companies.find(c => c.id === cluster?.company_id);
            const clusterTypes = unitTypes.filter(t => t.cluster_id === selectedClusterId);
            const clusterUnits = units.filter(u => u.cluster_id === selectedClusterId);
            
            return (
              <div className="flex flex-col gap-6 w-full text-left">
                {/* Detail Header & Back button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Detail Perumahan</span>
                      {parentComp && (
                        <span className="text-[9px] font-extrabold bg-purple-50 text-purple-700 border border-purple-100 rounded px-2 py-0.5 flex items-center gap-1">
                          <Building size={10} /> {parentComp.name}
                        </span>
                      )}
                    </div>
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
                      <div className="flex flex-col gap-3">
                        {clusterTypes.length === 0 ? (
                          <span className="text-xs text-gray-400 italic py-2">Belum ada tipe unit.</span>
                        ) : (
                          clusterTypes.map(type => (
                            <div key={type.id} className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex justify-between items-start">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-extrabold text-xs text-gray-900">{type.name}</span>
                                <span className="text-[10px] text-gray-500">LB: {type.building_area} m² · LT: {type.land_area} m²</span>
                                <span className="text-[11px] font-bold text-blue-600 mt-1">{formatIDR(type.base_price)}</span>
                              </div>
                              {isAllowedToMutate && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleStartEditUnitType(type)}
                                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUnitType(type.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Kavling / Units Table & Add Form */}
                  <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-extrabold text-sm text-gray-950">Daftar Kavling & Unit ({clusterUnits.length})</h3>
                      {!isAddingUnit && isAllowedToMutate && (
                        <button
                          onClick={() => setIsAddingUnit(true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                        >
                          + TAMBAH KAVLING
                        </button>
                      )}
                    </div>

                    {isAddingUnit && isAllowedToMutate ? (
                      <form onSubmit={handleCreateUnit} className="flex flex-col gap-4 text-xs font-semibold p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                          <span className="font-extrabold text-xs text-gray-900">{isEditingUnitId ? 'Edit Data Kavling' : 'Tambah Kavling Baru'}</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nomor Blok *</label>
                            <input
                              type="text"
                              required
                              placeholder="cth: A-01"
                              value={uBlockNumber}
                              onChange={e => setUBlockNumber(e.target.value)}
                              className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 uppercase tracking-wider text-[9px]">Pilih Tipe Unit *</label>
                            <select
                              value={uUnitTypeId}
                              onChange={e => setUUnitTypeId(e.target.value)}
                              required
                              className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium"
                            >
                              <option value="">-- Pilih Tipe --</option>
                              {clusterTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.name} (LB {t.building_area}/LT {t.land_area})</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 uppercase tracking-wider text-[9px]">Harga Jual (Rp) *</label>
                            <input
                              type="number"
                              required
                              placeholder="cth: 475000000"
                              value={uSellPrice}
                              onChange={e => setUSellPrice(e.target.value)}
                              className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 uppercase tracking-wider text-[9px]">Orientasi</label>
                            <select
                              value={uOrientation}
                              onChange={e => setUOrientation(e.target.value as any)}
                              className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium"
                            >
                              <option value="middle">Tengah (Standard)</option>
                              <option value="hook">Hook (Pojok)</option>
                              <option value="corner">Corner</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 uppercase tracking-wider text-[9px]">Status Ketersediaan</label>
                            <select
                              value={uStatus}
                              onChange={e => setUStatus(e.target.value)}
                              className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium"
                            >
                              <option value="available">Tersedia (Available)</option>
                              <option value="reserved">Reserved / NUP</option>
                              <option value="booking">Booking Fee</option>
                              <option value="kpr_process">Proses KPR/Cash</option>
                              <option value="sold">Terjual (Sold)</option>
                              <option value="unavailable">Hold / Tidak Dijual</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 uppercase tracking-wider text-[9px]">Progres Fisik Bangunan</label>
                            <select
                              value={uConstructionStatus}
                              onChange={e => setUConstructionStatus(e.target.value)}
                              className="px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none font-medium"
                            >
                              <option value="belum_terbangun">Belum Terbangun (Kavling Siap Bangun)</option>
                              <option value="proses_pembangunan">Proses Pembangunan</option>
                              <option value="finishing">Finishing / Tahap Akhir</option>
                              <option value="ready">Ready Stock (Siap Huni)</option>
                            </select>
                          </div>
                        </div>

                        {/* Administrasi Legalitas & Pajak Kavling */}
                        <div className="flex flex-col gap-3 p-3.5 bg-white border border-gray-200 rounded-xl mt-1">
                          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1 border-b border-gray-100 pb-2">
                            🏛️ Legalitas & Perpajakan Kavling Spesiﬁk
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-gray-400 uppercase tracking-wider text-[9px]">Status Sertifikat</label>
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
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-gray-200 mt-1">
                          <button
                            type="submit"
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-xs"
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
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors text-xs"
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
                                  </td>
                                  <td className="p-3 text-[10px] font-bold">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] border ${
                                      unit.pbb_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      unit.pbb_status === 'unpaid' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                      {unit.pbb_status === 'paid' ? 'LUNAS' : unit.pbb_status === 'unpaid' ? 'BELUM BAYAR' : 'BELUM DAFTAR'}
                                    </span>
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
        ) : activeTab === 'companies' ? (
          // VIEW 3: Main Management of Companies (Multi-Perusahaan)
          <div className="flex flex-col gap-6 text-left">
            
            {/* Top Metric Cards for Companies */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Perusahaan (PT)</span>
                  <div className="text-2xl font-black text-gray-900 mt-1">{companies.length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building size={20} />
                </div>
              </div>

              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Perumahan / Cluster</span>
                  <div className="text-2xl font-black text-gray-900 mt-1">{clusters.length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
              </div>

              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Unit Kavling</span>
                  <div className="text-2xl font-black text-gray-900 mt-1">{units.length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers size={20} />
                </div>
              </div>
            </div>

            {/* Header & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-base text-gray-900">Entitas Perusahaan Developer</h2>
                <p className="text-xs text-gray-500 mt-0.5">Kelola PT/Developer induk yang membawahi beberapa proyek perumahan.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari perusahaan..."
                    value={searchCompany}
                    onChange={e => setSearchCompany(e.target.value)}
                    className="pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {!isAddingCompany && isAllowedToMutate && (
                  <button
                    onClick={() => { resetCompanyForm(); setIsAddingCompany(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus size={15} /> Tambah Perusahaan
                  </button>
                )}
              </div>
            </div>

            {/* Form Tambah / Edit Perusahaan */}
            {isAddingCompany && isAllowedToMutate && (
              <form onSubmit={handleCreateCompany} className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-xs font-semibold text-left">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="font-extrabold text-sm text-gray-900">{isEditingCompanyId ? 'Edit Data Perusahaan (PT)' : 'Tambah Perusahaan (PT) Baru'}</h3>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCompany(false); resetCompanyForm(); }}
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    Batal ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Perusahaan (PT) *</label>
                    <input
                      type="text"
                      required
                      placeholder="cth: PT Domus Somnia Utama"
                      value={coName}
                      onChange={e => setCoName(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Kode Singkat Perusahaan</label>
                    <input
                      type="text"
                      placeholder="cth: DSU"
                      value={coCode}
                      onChange={e => setCoCode(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Resmi Badan Hukum</label>
                    <input
                      type="text"
                      placeholder="cth: PT Domus Somnia Utama Tbk"
                      value={coLegalName}
                      onChange={e => setCoLegalName(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">NPWP Perusahaan</label>
                    <input
                      type="text"
                      placeholder="cth: 01.234.567.8-901.000"
                      value={coNpwp}
                      onChange={e => setCoNpwp(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Direktur / Penanggung Jawab</label>
                    <input
                      type="text"
                      placeholder="cth: Ir. Ahmad Somnia"
                      value={coDirectorName}
                      onChange={e => setCoDirectorName(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nomor Telepon</label>
                    <input
                      type="text"
                      placeholder="cth: (022) 1234567"
                      value={coPhone}
                      onChange={e => setCoPhone(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Email Perusahaan</label>
                    <input
                      type="email"
                      placeholder="cth: info@domus.com"
                      value={coEmail}
                      onChange={e => setCoEmail(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Alamat Kantor Pusat</label>
                    <textarea
                      placeholder="Alamat domisili PT..."
                      value={coAddress}
                      onChange={e => setCoAddress(e.target.value)}
                      rows={2}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[9px]">Rekening Bank Perusahaan</label>
                    <textarea
                      placeholder="cth: Mandiri 131-00-1234567-8 a/n PT Domus Somnia"
                      value={coBankAccount}
                      onChange={e => setCoBankAccount(e.target.value)}
                      rows={2}
                      className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-xs"
                  >
                    {isEditingCompanyId ? 'Simpan Perubahan PT' : 'Tambah Perusahaan Baru'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCompany(false); resetCompanyForm(); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-xs"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* List Grid of Companies */}
            {(() => {
              const filteredCompanies = companies.filter(c => 
                c.name.toLowerCase().includes(searchCompany.toLowerCase()) ||
                (c.code && c.code.toLowerCase().includes(searchCompany.toLowerCase()))
              );

              if (filteredCompanies.length === 0) {
                return (
                  <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
                    <Building size={48} className="text-gray-300" />
                    <span className="text-sm font-bold text-gray-800">Tidak ada data Perusahaan</span>
                    <span className="text-xs text-gray-400 max-w-sm">Gunakan tombol Tambah Perusahaan di atas untuk menambah entitas PT baru.</span>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredCompanies.map(comp => {
                    const linkedClusters = clusters.filter(cl => cl.company_id === comp.id);
                    const totalCompanyUnits = linkedClusters.reduce((sum, cl) => {
                      return sum + units.filter(u => u.cluster_id === cl.id).length;
                    }, 0);

                    return (
                      <div key={comp.id} className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 text-left">
                        {/* Company Card Header */}
                        <div className="flex justify-between items-start gap-3 border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm">
                              {comp.code ? comp.code.substring(0, 3) : comp.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-gray-900 truncate">{comp.name}</h3>
                                {comp.code && (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-extrabold text-[9px] rounded border border-blue-100">
                                    {comp.code}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-400 font-medium truncate">{comp.legal_name || comp.name}</span>
                            </div>
                          </div>

                          {isAllowedToMutate && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleStartEditCompany(comp)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                                title="Edit Perusahaan"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteCompany(comp.id, e)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                title="Hapus Perusahaan"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Company Info Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {comp.npwp && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-gray-400 font-bold uppercase">NPWP PT</span>
                              <span className="font-semibold text-gray-700 truncate">{comp.npwp}</span>
                            </div>
                          )}

                          {comp.director_name && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-gray-400 font-bold uppercase">Direktur</span>
                              <span className="font-semibold text-gray-700 truncate">{comp.director_name}</span>
                            </div>
                          )}

                          {(comp.phone || comp.email) && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-gray-400 font-bold uppercase">Kontak</span>
                              <span className="font-semibold text-gray-700 truncate">{comp.phone || comp.email}</span>
                            </div>
                          )}

                          {comp.bank_account && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-gray-400 font-bold uppercase">Rekening Bank</span>
                              <span className="font-semibold text-purple-700 truncate">{comp.bank_account}</span>
                            </div>
                          )}
                        </div>

                        {comp.address && (
                          <div className="text-[11px] text-gray-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                            <span className="text-gray-400 font-bold">Alamat: </span>{comp.address}
                          </div>
                        )}

                        {/* Linked Clusters List / Chips Section */}
                        <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5 flex flex-col gap-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Building2 size={12} className="text-purple-600" />
                              Perumahan Terdaftar ({linkedClusters.length})
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">{totalCompanyUnits} Unit Kavling</span>
                          </div>

                          {linkedClusters.length === 0 ? (
                            <span className="text-[11px] text-gray-400 italic py-1">Belum ada perumahan di bawah PT ini.</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {linkedClusters.map(cl => {
                                const clUnitsCount = units.filter(u => u.cluster_id === cl.id).length;
                                return (
                                  <button
                                    key={cl.id}
                                    onClick={() => setSelectedClusterId(cl.id)}
                                    className="px-2.5 py-1 bg-white border border-gray-200 hover:border-purple-300 rounded-lg text-xs font-bold text-gray-800 hover:text-purple-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>{cl.name}</span>
                                    <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded-full font-black">
                                      {clUnitsCount} unit
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {isAllowedToMutate && (
                            <button
                              onClick={() => {
                                setClCompanyId(comp.id);
                                setIsAddingCluster(true);
                              }}
                              className="mt-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 w-fit cursor-pointer"
                            >
                              + Tambah Perumahan untuk {comp.code || 'PT ini'} ➔
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>
        ) : (
          // VIEW 4: Main list of Perumahan / Clusters
          <div className="flex flex-col gap-5 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-base text-gray-900">Cluster Perumahan & Site Plan</h2>
                <p className="text-xs text-gray-500 mt-0.5">Kelola data perumahan, spesifikasi bangunan, dan denah site plan SVG.</p>
              </div>
              {isAllowedToMutate && (
                <button
                  onClick={() => setIsAddingCluster(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
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
                  const parentCompany = companies.find(c => c.id === cluster.company_id);

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
                          <div className="flex justify-between items-center w-full gap-2">
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

                          {parentCompany && (
                            <span className="text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-100 rounded px-2 py-0.5 mt-1 inline-flex items-center gap-1 max-w-full truncate">
                              <Building size={10} /> {parentCompany.name}
                            </span>
                          )}

                          <p className="text-[10px] text-gray-400 font-semibold mt-1">{cluster.location}</p>
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
