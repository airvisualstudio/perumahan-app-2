import fs from 'fs';
import path from 'path';

// Define DB File Path (outside src/ to prevent Next.js from rebuilding/re-triggering dev mode on file changes)
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Interface Declarations
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'staff';
  department: string;
  employee_id: string;
  join_date: string;
  annual_leave_balance: number;
  is_active: boolean;
  google_id?: string;
  created_at: string;
}

export interface Cluster {
  id: string;
  name: string;
  location: string;
  description: string;
  total_units: number;
  status: 'pre_launch' | 'active' | 'sold_out';
  created_by: string;
  created_at: string;
  svg_content?: string;
}

export interface UnitType {
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
  photos: string[];
}

export interface PropertyUnit {
  id: string;
  cluster_id: string;
  unit_type_id: string;
  block_number: string;
  sell_price: number;
  orientation: 'hook' | 'middle' | 'corner';
  status: 'available' | 'reserved' | 'booking' | 'kpr_process' | 'sold' | 'unavailable';
  reserved_for?: string; // Prospect ID
  notes?: string;
  updated_at: string;
  bank_name?: string;
  akad_date?: string;
  loan_amount?: number;
  interest_rate?: number;
}

export interface UnitStatusHistory {
  id: string;
  unit_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  prospect_id?: string;
  notes?: string;
  created_at: string;
}

export interface Prospect {
  id: string;
  full_name: string;
  nik?: string;
  phone: string;
  email?: string;
  occupation?: string;
  company_name?: string;
  estimated_income?: number;
  lead_source: string;
  referral_name?: string;
  pipeline_stage: 'prospect_baru' | 'dihubungi' | 'survei' | 'penawaran' | 'booking' | 'kpr_process' | 'akad' | 'stk' | 'batal';
  assigned_to: string; // User ID
  interested_cluster_id?: string;
  interested_type_id?: string;
  booked_unit_id?: string;
  tags: string[];
  notes?: string;
  last_followup_at?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  attachments?: { id: string; url: string; file_name: string; file_size_bytes: number }[];
}

export interface FollowupComment {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  content: string;
  created_at: string;
}

export interface FollowupRecord {
  id: string;
  prospect_id: string;
  conducted_by: string;
  followup_type: 'telepon' | 'whatsapp' | 'kunjungan' | 'email' | 'meeting' | 'video_call';
  followup_at: string;
  notes: string;
  prospect_response: 'very_interested' | 'interested' | 'considering' | 'not_interested';
  next_followup_at?: string;
  next_followup_note?: string;
  attachments: { id: string; url: string; file_name: string; file_size_bytes: number }[];
  created_at: string;
  comments?: FollowupComment[];
}


export interface ProspectHistory {
  id: string;
  prospect_id: string;
  event_type: string;
  actor_id?: string;
  metadata?: any;
  description: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee_id: string;
  created_by: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'done';
  due_date?: string;
  comments: { id: string; user_id: string; content: string; created_at: string }[];
  created_at: string;
  updated_at: string;
}

export interface OfficeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  clock_in_at?: string;
  clock_out_at?: string;
  clock_in_lat?: number;
  clock_in_lng?: number;
  clock_out_lat?: number;
  clock_out_lng?: number;
  office_id?: string;
  status: 'present' | 'late' | 'absent' | 'leave' | 'permission' | 'sick';
  work_mode: 'onsite' | 'wfh';
  is_offline_sync: boolean;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: 'Cuti Tahunan' | 'Izin' | 'Sakit' | 'Cuti Khusus';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export interface ApprovalChainStep {
  level: number;
  role?: string;
  user_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  decided_by?: string;
  decided_at?: string;
  remarks?: string;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  doc_type: 'Invoice' | 'Kwitansi' | 'Surat';
  chain: { level: number; role?: string; user_id?: string }[];
}

export type TemplateBlockType =
  | 'heading'
  | 'paragraph'
  | 'field'
  | 'data_field'
  | 'table'
  | 'divider'
  | 'spacer'
  | 'signature'
  | 'qr';

export interface DocumentTemplateBlock {
  id: string;
  type: TemplateBlockType;
  // For heading/paragraph: static text content
  content?: string;
  // For field: a static label-value pair
  label?: string;
  value?: string;
  // For data_field: merge variable key shown as {{variable_key}}
  variable_key?: string;
  variable_label?: string; // Human-readable label for the form input
  variable_required?: boolean;
  // For table: column headers + rows placeholder count
  table_headers?: string[];
  table_rows?: number;
  // Style options
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  size?: 'sm' | 'base' | 'lg' | 'xl';
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  doc_type_key: string;       // Unique key used as doc_type, e.g. 'PKS', 'SPK'
  prefix: string;             // Number prefix, e.g. 'PKS', 'SPK'
  is_builtin: boolean;        // If true, cannot be deleted
  approval_chain_roles: string[]; // e.g. ['manager','admin']
  blocks: DocumentTemplateBlock[];
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface Document {
  id: string;
  doc_type: string; // 'Invoice' | 'Kwitansi' | 'Surat' | any custom key
  doc_number: string;
  doc_token: string;
  requester_id: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'revoked';
  revoked_reason?: string;
  revoked_at?: string;
  revoked_by?: string;
  created_at: string;
  approved_at?: string;
  data: any; // Dynamic document fields
  approval_chain: ApprovalChainStep[];
  template_id?: string; // Reference to DocumentTemplate used
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  created_at: string;
}

export interface SystemSettings {
  org_name: string;
  org_logo: string;
  timezone: string;
  office_locations: OfficeLocation[];
  late_threshold_minutes: number;
  work_hours_start: string;
  work_hours_end: string;
}

// Full Database Schema
export interface DatabaseSchema {
  users: User[];
  clusters: Cluster[];
  unitTypes: UnitType[];
  units: PropertyUnit[];
  unitHistory: UnitStatusHistory[];
  prospects: Prospect[];
  followups: FollowupRecord[];
  prospectHistory: ProspectHistory[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  approvalTemplates: ApprovalTemplate[];
  documents: Document[];
  documentTemplates: DocumentTemplate[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

// Initial Seed Data
const generateSeedData = (): DatabaseSchema => {
  const users: User[] = [
    {
      id: 'usr-admin',
      email: 'admin@domus.com',
      name: 'Ahmad Admin',
      role: 'admin',
      department: 'HR & IT',
      employee_id: 'EMP-001',
      join_date: '2024-01-15',
      annual_leave_balance: 12,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-manager',
      email: 'manager@domus.com',
      name: 'Budi Purnomo',
      role: 'manager',
      department: 'Pemasaran',
      employee_id: 'EMP-002',
      join_date: '2024-02-10',
      annual_leave_balance: 10,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-finance',
      email: 'finance@domus.com',
      name: 'Chika Olivia',
      role: 'staff',
      department: 'Keuangan',
      employee_id: 'EMP-003',
      join_date: '2024-03-01',
      annual_leave_balance: 12,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-sales',
      email: 'sales@domus.com',
      name: 'Rina Wijaya',
      role: 'staff',
      department: 'Pemasaran',
      employee_id: 'EMP-004',
      join_date: '2024-04-01',
      annual_leave_balance: 12,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-staff',
      email: 'staff@domus.com',
      name: 'Dendi Pratama',
      role: 'staff',
      department: 'Umum',
      employee_id: 'EMP-005',
      join_date: '2024-05-01',
      annual_leave_balance: 12,
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];

  const clusters: Cluster[] = [
    {
      id: 'cls-melati',
      name: 'Cluster Melati',
      location: 'Bandung Utara',
      description: 'Hunian asri dengan konsep modern tropis di perbukitan Bandung Utara.',
      total_units: 30,
      status: 'active',
      created_by: 'usr-admin',
      created_at: new Date().toISOString()
    },
    {
      id: 'cls-anggrek',
      name: 'Cluster Anggrek',
      location: 'Bandung Timur',
      description: 'Kawasan mandiri strategis dekat akses tol, ideal untuk keluarga muda.',
      total_units: 20,
      status: 'active',
      created_by: 'usr-admin',
      created_at: new Date().toISOString()
    }
  ];

  const unitTypes: UnitType[] = [
    {
      id: 'typ-melati-36',
      cluster_id: 'cls-melati',
      name: 'Tipe 36/72',
      building_area: 36,
      land_area: 72,
      base_price: 450000000,
      bedrooms: 2,
      bathrooms: 1,
      has_carport: true,
      description: 'Tipe ekonomis dengan efisiensi ruang optimal.',
      photos: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=600&auto=format&fit=crop']
    },
    {
      id: 'typ-melati-45',
      cluster_id: 'cls-melati',
      name: 'Tipe 45/90',
      building_area: 45,
      land_area: 90,
      base_price: 600000000,
      bedrooms: 2,
      bathrooms: 1,
      has_carport: true,
      description: 'Tipe standar keluarga kecil dengan halaman luas.',
      photos: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=600&auto=format&fit=crop']
    },
    {
      id: 'typ-anggrek-54',
      cluster_id: 'cls-anggrek',
      name: 'Tipe 54/120',
      building_area: 54,
      land_area: 120,
      base_price: 850000000,
      bedrooms: 3,
      bathrooms: 2,
      has_carport: true,
      description: 'Hunian premium 2 lantai dengan carport 2 mobil.',
      photos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop']
    }
  ];

  const units: PropertyUnit[] = [
    {
      id: 'unt-m01',
      cluster_id: 'cls-melati',
      unit_type_id: 'typ-melati-36',
      block_number: 'A-01',
      sell_price: 475000000,
      orientation: 'hook',
      status: 'available',
      updated_at: new Date().toISOString()
    },
    {
      id: 'unt-m02',
      cluster_id: 'cls-melati',
      unit_type_id: 'typ-melati-36',
      block_number: 'A-02',
      sell_price: 450000000,
      orientation: 'middle',
      status: 'available',
      updated_at: new Date().toISOString()
    },
    {
      id: 'unt-m03',
      cluster_id: 'cls-melati',
      unit_type_id: 'typ-melati-45',
      block_number: 'A-03',
      sell_price: 600000000,
      orientation: 'middle',
      status: 'reserved',
      reserved_for: 'pr-02',
      updated_at: new Date().toISOString()
    },
    {
      id: 'unt-m04',
      cluster_id: 'cls-melati',
      unit_type_id: 'typ-melati-45',
      block_number: 'A-04',
      sell_price: 620000000,
      orientation: 'corner',
      status: 'booking',
      reserved_for: 'pr-03',
      updated_at: new Date().toISOString()
    },
    {
      id: 'unt-m05',
      cluster_id: 'cls-melati',
      unit_type_id: 'typ-melati-45',
      block_number: 'A-05',
      sell_price: 600000000,
      orientation: 'middle',
      status: 'kpr_process',
      reserved_for: 'pr-06',
      bank_name: 'Bank BCA',
      akad_date: '2026-06-18',
      loan_amount: 450000000,
      interest_rate: 5.75,
      updated_at: new Date().toISOString()
    },
    {
      id: 'unt-m06',
      cluster_id: 'cls-melati',
      unit_type_id: 'typ-melati-45',
      block_number: 'A-06',
      sell_price: 600000000,
      orientation: 'middle',
      status: 'sold',
      reserved_for: 'pr-07',
      bank_name: 'Bank Mandiri',
      akad_date: '2026-05-24',
      loan_amount: 480000000,
      interest_rate: 6.25,
      updated_at: new Date().toISOString()
    },
    {
      id: 'unt-a01',
      cluster_id: 'cls-anggrek',
      unit_type_id: 'typ-anggrek-54',
      block_number: 'B-01',
      sell_price: 880000000,
      orientation: 'hook',
      status: 'kpr_process',
      reserved_for: 'pr-04',
      bank_name: 'Bank BTN',
      akad_date: '2026-06-25',
      loan_amount: 750000000,
      interest_rate: 6.5,
      updated_at: new Date().toISOString()
    },
    {
      id: 'unt-a02',
      cluster_id: 'cls-anggrek',
      unit_type_id: 'typ-anggrek-54',
      block_number: 'B-02',
      sell_price: 850000000,
      orientation: 'middle',
      status: 'sold',
      reserved_for: 'pr-05',
      bank_name: 'Bank BNI',
      akad_date: '2026-05-15',
      loan_amount: 700000000,
      interest_rate: 5.9,
      updated_at: new Date().toISOString()
    }
  ];

  const unitHistory: UnitStatusHistory[] = [
    {
      id: 'uh-1',
      unit_id: 'unt-m03',
      old_status: 'available',
      new_status: 'reserved',
      changed_by: 'usr-sales',
      prospect_id: 'pr-02',
      notes: 'Bapak Hendra tertarik setelah survei unit Melati A-03.',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'uh-2',
      unit_id: 'unt-m04',
      old_status: 'reserved',
      new_status: 'booking',
      changed_by: 'usr-sales',
      prospect_id: 'pr-03',
      notes: 'Booking fee sebesar Rp 5.000.000 terverifikasi.',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const prospects: Prospect[] = [
    {
      id: 'pr-01',
      full_name: 'Budi Santoso',
      phone: '081234567890',
      email: 'budi@gmail.com',
      occupation: 'Developer',
      company_name: 'Tech Inc',
      estimated_income: 15000000,
      lead_source: 'instagram',
      pipeline_stage: 'prospect_baru',
      assigned_to: 'usr-sales',
      interested_cluster_id: 'cls-melati',
      interested_type_id: 'typ-melati-36',
      tags: ['urgent', 'KPR BCA'],
      notes: 'Tanya brosur tipe 36 via DM Instagram.',
      created_by: 'usr-sales',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pr-02',
      full_name: 'Hendra Wijaya',
      phone: '081398765432',
      email: 'hendra.w@gmail.com',
      occupation: 'PNS',
      company_name: 'Pemprov Jabar',
      estimated_income: 12000000,
      lead_source: 'walk_in',
      pipeline_stage: 'survei',
      assigned_to: 'usr-sales',
      interested_cluster_id: 'cls-melati',
      interested_type_id: 'typ-melati-45',
      tags: ['KPR Mandiri'],
      notes: 'Sudah survei lokasi dan suka layout hook.',
      last_followup_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'usr-sales',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pr-03',
      full_name: 'Siti Rahma',
      phone: '087855551212',
      email: 'siti.rahma@yahoo.com',
      occupation: 'Wiraswasta',
      company_name: 'Catering Berkah',
      estimated_income: 25000000,
      lead_source: 'facebook_ads',
      pipeline_stage: 'booking',
      assigned_to: 'usr-sales',
      interested_cluster_id: 'cls-melati',
      interested_type_id: 'typ-melati-45',
      booked_unit_id: 'unt-m04',
      tags: ['cash keras'],
      notes: 'Mengirimkan booking fee unit A-04.',
      last_followup_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'usr-sales',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [
        { id: 'da-01', url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=200', file_name: 'KTP_Siti_Rahma.pdf', file_size_bytes: 145000 },
        { id: 'da-02', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=200', file_name: 'Bukti_Transfer_Booking.jpg', file_size_bytes: 284000 }
      ]
    },
    {
      id: 'pr-04',
      full_name: 'Dr. Gunawan',
      phone: '081122223333',
      email: 'gunawan@clinic.com',
      occupation: 'Dokter',
      company_name: 'RS Santosa',
      estimated_income: 45000000,
      lead_source: 'referral',
      referral_name: 'Dr. Anton',
      pipeline_stage: 'kpr_process',
      assigned_to: 'usr-sales',
      interested_cluster_id: 'cls-anggrek',
      interested_type_id: 'typ-anggrek-54',
      booked_unit_id: 'unt-a01',
      tags: ['premium'],
      notes: 'Proses appraisal bank untuk unit B-01.',
      last_followup_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'usr-sales',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [
        { id: 'da-03', url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=200', file_name: 'KTP_Dr_Gunawan.pdf', file_size_bytes: 156000 },
        { id: 'da-04', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=200', file_name: 'Slip_Gaji_Klinik.pdf', file_size_bytes: 312000 }
      ]
    },
    {
      id: 'pr-05',
      full_name: 'Ibu Ratna',
      phone: '085288889999',
      email: 'ratna@rt.com',
      occupation: 'Ibu Rumah Tangga',
      estimated_income: 30000000,
      lead_source: 'pameran',
      pipeline_stage: 'akad',
      assigned_to: 'usr-sales',
      interested_cluster_id: 'cls-anggrek',
      interested_type_id: 'typ-anggrek-54',
      booked_unit_id: 'unt-a02',
      tags: ['cash bertahap'],
      notes: 'Akad PPJB dijadwalkan minggu ini.',
      last_followup_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'usr-sales',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [
        { id: 'da-05', url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=200', file_name: 'KTP_Ibu_Ratna.pdf', file_size_bytes: 148000 }
      ]
    },
    {
      id: 'pr-06',
      full_name: 'Rudi Hermawan',
      phone: '081277778888',
      email: 'rudi.hermawan@outlook.com',
      occupation: 'Manager IT',
      company_name: 'Solusi Digital PT',
      estimated_income: 22000000,
      lead_source: 'website',
      pipeline_stage: 'kpr_process',
      assigned_to: 'usr-sales',
      interested_cluster_id: 'cls-melati',
      interested_type_id: 'typ-melati-45',
      booked_unit_id: 'unt-m05',
      tags: ['premium', 'KPR BCA'],
      notes: 'KPR disetujui oleh BCA, menunggu jadwal akad.',
      created_by: 'usr-sales',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [
        { id: 'da-06', url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=200', file_name: 'KTP_Rudi.pdf', file_size_bytes: 139000 },
        { id: 'da-07', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=200', file_name: 'Slip_Gaji_Maret_Mei.pdf', file_size_bytes: 425000 },
        { id: 'da-08', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=200', file_name: 'NPWP_Rudi.pdf', file_size_bytes: 198000 }
      ]
    },
    {
      id: 'pr-07',
      full_name: 'Diana Putri',
      phone: '081912345678',
      email: 'diana.putri@gmail.com',
      occupation: 'Arsitek',
      company_name: 'Design Kreasi',
      estimated_income: 18000000,
      lead_source: 'instagram',
      pipeline_stage: 'akad',
      assigned_to: 'usr-sales',
      interested_cluster_id: 'cls-melati',
      interested_type_id: 'typ-melati-45',
      booked_unit_id: 'unt-m06',
      tags: ['cash keras', 'PPJB'],
      notes: 'Berkas PPJB dan Akad Kredit Mandiri selesai.',
      created_by: 'usr-sales',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [
        { id: 'da-09', url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=200', file_name: 'KTP_Diana.pdf', file_size_bytes: 142000 },
        { id: 'da-10', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=200', file_name: 'Kwitansi_Akad_Lunas.pdf', file_size_bytes: 275000 }
      ]
    }
  ];

  const followups: FollowupRecord[] = [
    {
      id: 'fl-1',
      prospect_id: 'pr-02',
      conducted_by: 'usr-sales',
      followup_type: 'kunjungan',
      followup_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Bapak Hendra survei unit B-08, suka karena hook.',
      prospect_response: 'very_interested',
      next_followup_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      next_followup_note: 'Kirim simulasi KPR BCA',
      attachments: [
        { id: 'att-1', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=400&auto=format&fit=crop', file_name: 'survei_lokasi.jpg', file_size_bytes: 1200000 }
      ],
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [
        {
          id: 'cm-01',
          user_id: 'usr-manager',
          user_name: 'Budi Purnomo',
          user_role: 'manager',
          content: 'Lokasi B-08 memang sangat bagus dan diminati. Segera tindak lanjuti untuk penawaran KPR.',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'fl-2',
      prospect_id: 'pr-02',
      conducted_by: 'usr-sales',
      followup_type: 'telepon',
      followup_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Sudah dihubungi, mau survei hari Senin.',
      prospect_response: 'interested',
      attachments: [],
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const prospectHistory: ProspectHistory[] = [
    {
      id: 'ph-1',
      prospect_id: 'pr-02',
      event_type: 'prospect_created',
      actor_id: 'usr-sales',
      description: 'Prospek dibuat · Sumber: Walk-in',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ph-2',
      prospect_id: 'pr-02',
      event_type: 'stage_changed',
      actor_id: 'usr-sales',
      metadata: { from: 'prospect_baru', to: 'survei' },
      description: 'Stage berubah: Prospect Baru → Survei Lokasi',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ph-3',
      prospect_id: 'pr-02',
      event_type: 'unit_reserved',
      actor_id: 'usr-sales',
      metadata: { unit_id: 'unt-m03' },
      description: 'Unit Melati A-03 di-reserve untuk prospek ini',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const tasks: Task[] = [
    {
      id: 'tsk-1',
      title: 'Follow-up Budi Santoso',
      description: 'Kirim e-brochure tipe 36 dan tanyakan waktu luang untuk kunjungan lokasi.',
      assignee_id: 'usr-sales',
      created_by: 'usr-manager',
      priority: 'high',
      status: 'open',
      due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      comments: [
        { id: 'com-1', user_id: 'usr-manager', content: 'Lead ini potensial dari ad campaign.', created_at: new Date().toISOString() }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'tsk-2',
      title: 'Validasi berkas KPR Budi Santoso',
      description: 'Cek kelengkapan slip gaji, SPT 1721, dan rekening koran 3 bulan terakhir.',
      assignee_id: 'usr-finance',
      created_by: 'usr-manager',
      priority: 'medium',
      status: 'in_progress',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      comments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const attendance: AttendanceRecord[] = [
    {
      id: 'att-1',
      user_id: 'usr-sales',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clock_in_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T08:52:12Z',
      clock_out_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T18:04:30Z',
      clock_in_lat: -6.917460,
      clock_in_lng: 107.619120,
      clock_out_lat: -6.917465,
      clock_out_lng: 107.619125,
      office_id: 'loc-main',
      status: 'present',
      work_mode: 'onsite',
      is_offline_sync: false
    }
  ];

  const leaves: LeaveRequest[] = [
    {
      id: 'lv-1',
      user_id: 'usr-staff',
      leave_type: 'Cuti Tahunan',
      start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total_days: 3,
      reason: 'Acara keluarga di luar kota.',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  const approvalTemplates: ApprovalTemplate[] = [
    {
      id: 'tpl-invoice',
      name: 'Standard Invoice Chain',
      doc_type: 'Invoice',
      chain: [
        { level: 1, role: 'Keuangan' },
        { level: 2, role: 'manager' }
      ]
    },
    {
      id: 'tpl-receipt',
      name: 'Standard Receipt Chain',
      doc_type: 'Kwitansi',
      chain: [
        { level: 1, role: 'Keuangan' }
      ]
    },
    {
      id: 'tpl-letter',
      name: 'Standard Letter Chain',
      doc_type: 'Surat',
      chain: [
        { level: 1, role: 'manager' },
        { level: 2, role: 'admin' }
      ]
    }
  ];

  const documents: Document[] = [
    {
      id: 'doc-inv-1',
      doc_type: 'Invoice',
      doc_number: 'INV/2026/06/0001',
      doc_token: 'd8c8942a781b4d8bb8fe11ad50ccfe01',
      requester_id: 'usr-sales',
      status: 'approved',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      approved_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      data: {
        prospect_id: 'pr-03',
        client_name: 'Siti Rahma',
        client_phone: '087855551212',
        unit_block: 'Melati A-04',
        items: [
          { name: 'Uang Muka (Down Payment) Tahap 1 - Cluster Melati A-04', qty: 1, price: 50000000 }
        ],
        tax_applied: true,
        discount_amount: 0,
        subtotal: 50000000,
        tax_amount: 5500000,
        total_amount: 55500000,
        due_date: '2026-06-15',
        payment_method: 'Transfer Bank Mandiri',
        bank_account: '131-00-1234567-8 a/n PT Domus Somnia',
        notes: 'DP Tahap 1 dari total rencana 3 tahap.'
      },
      approval_chain: [
        { level: 1, role: 'Keuangan', status: 'approved', decided_by: 'usr-finance', decided_at: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(), remarks: 'Berkas sesuai.' },
        { level: 2, role: 'manager', status: 'approved', decided_by: 'usr-manager', decided_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), remarks: 'Approved.' }
      ]
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      user_id: 'usr-admin',
      action: 'system.seed',
      entity_type: 'system',
      created_at: new Date().toISOString()
    }
  ];

  const settings: SystemSettings = {
    org_name: 'PT Domus Somnia Properti',
    org_logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=200&auto=format&fit=crop',
    timezone: 'Asia/Jakarta',
    office_locations: [
      {
        id: 'loc-main',
        name: 'Kantor Pusat Bandung',
        latitude: -6.917464,
        longitude: 107.619122,
        radius_meters: 100,
        is_active: true
      }
    ],
    late_threshold_minutes: 15,
    work_hours_start: '09:00',
    work_hours_end: '18:00'
  };

  const documentTemplates: DocumentTemplate[] = [
    {
      id: 'tpl-invoice',
      name: 'Invoice Pembayaran',
      description: 'Template invoice tagihan unit properti kepada klien.',
      doc_type_key: 'Invoice',
      prefix: 'INV',
      is_builtin: true,
      approval_chain_roles: ['manager', 'admin'],
      created_by: 'usr-admin',
      created_at: new Date().toISOString(),
      blocks: [
        { id: 'b1', type: 'heading', content: 'INVOICE RESMI', align: 'center', size: 'xl', bold: true },
        { id: 'b2', type: 'divider' },
        { id: 'b3', type: 'data_field', variable_key: 'client_name', variable_label: 'Nama Klien', variable_required: true },
        { id: 'b4', type: 'data_field', variable_key: 'due_date', variable_label: 'Tanggal Jatuh Tempo', variable_required: true },
        { id: 'b5', type: 'table', table_headers: ['Deskripsi', 'Qty', 'Harga Satuan', 'Total'], table_rows: 3 },
        { id: 'b6', type: 'divider' },
        { id: 'b7', type: 'signature', align: 'right' },
        { id: 'b8', type: 'qr' }
      ]
    },
    {
      id: 'tpl-kwitansi',
      name: 'Kwitansi Pembayaran',
      description: 'Template kwitansi bukti penerimaan pembayaran.',
      doc_type_key: 'Kwitansi',
      prefix: 'KWT',
      is_builtin: true,
      approval_chain_roles: ['manager', 'admin'],
      created_by: 'usr-admin',
      created_at: new Date().toISOString(),
      blocks: [
        { id: 'b1', type: 'heading', content: 'KWITANSI RESMI', align: 'center', size: 'xl', bold: true },
        { id: 'b2', type: 'divider' },
        { id: 'b3', type: 'data_field', variable_key: 'receiver_name', variable_label: 'Diterima Dari', variable_required: true },
        { id: 'b4', type: 'data_field', variable_key: 'nominal_amount', variable_label: 'Jumlah Nominal (Rp)', variable_required: true },
        { id: 'b5', type: 'data_field', variable_key: 'nominal_words', variable_label: 'Terbilang', variable_required: true },
        { id: 'b6', type: 'data_field', variable_key: 'keterangan', variable_label: 'Keterangan Pembayaran', variable_required: true },
        { id: 'b7', type: 'divider' },
        { id: 'b8', type: 'signature', align: 'right' },
        { id: 'b9', type: 'qr' }
      ]
    },
    {
      id: 'tpl-surat',
      name: 'Surat Resmi',
      description: 'Template surat tugas atau keterangan internal.',
      doc_type_key: 'Surat',
      prefix: 'SRT',
      is_builtin: true,
      approval_chain_roles: ['manager', 'admin'],
      created_by: 'usr-admin',
      created_at: new Date().toISOString(),
      blocks: [
        { id: 'b1', type: 'heading', content: 'SURAT RESMI', align: 'center', size: 'xl', bold: true },
        { id: 'b2', type: 'divider' },
        { id: 'b3', type: 'data_field', variable_key: 'receiver_name', variable_label: 'Nama Penerima', variable_required: true },
        { id: 'b4', type: 'data_field', variable_key: 'receiver_role', variable_label: 'Jabatan / Role', variable_required: true },
        { id: 'b5', type: 'data_field', variable_key: 'date_effective', variable_label: 'Tanggal Berlaku', variable_required: true },
        { id: 'b6', type: 'data_field', variable_key: 'content', variable_label: 'Isi Surat', variable_required: false },
        { id: 'b7', type: 'divider' },
        { id: 'b8', type: 'signature', align: 'right' },
        { id: 'b9', type: 'qr' }
      ]
    }
  ];

  return {
    users,
    clusters,
    unitTypes,
    units,
    unitHistory,
    prospects,
    followups,
    prospectHistory,
    tasks,
    attendance,
    leaves,
    approvalTemplates,
    documents,
    documentTemplates,
    auditLogs,
    settings
  };
};

// Database class manager
class JsonDatabase {
  private schema: DatabaseSchema | null = null;

  constructor() {
    this.ensureDbDirectory();
  }

  private ensureDbDirectory() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Load database from file, or seed it if not present
  public get(): DatabaseSchema {
    if (this.schema) return this.schema;

    try {
      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        this.schema = JSON.parse(fileContent);
        return this.schema!;
      }
    } catch (error) {
      console.error("Error reading database file, re-seeding...", error);
    }

    // Initialize with seed data if file doesn't exist or has error
    const seedData = generateSeedData();
    this.save(seedData);
    this.schema = seedData;
    return this.schema;
  }

  // Save database to file
  public save(data: DatabaseSchema) {
    this.ensureDbDirectory();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    this.schema = data;
  }

  // Reset database to initial seed data
  public reset(): DatabaseSchema {
    const seedData = generateSeedData();
    this.save(seedData);
    return seedData;
  }
}

export const db = new JsonDatabase();
