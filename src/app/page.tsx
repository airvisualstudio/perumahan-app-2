"use client";

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { 
  TrendingUp, 
  Home as HomeIcon, 
  Users as UsersIcon, 
  ClipboardList, 
  Clock, 
  CheckCircle,
  FileCheck,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  prospectsCount: number;
  pipelineValue: number;
  totalUnits: number;
  availableUnits: number;
  attendanceRate: number;
  lateCount: number;
  activeTasks: number;
  pendingLeaves: any[];
  pipelineStages: { stage: string; count: number }[];
  unitStatuses: { status: string; count: number; color: string }[];
  recentLogs: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch CRM details
      const crmRes = await fetch('/api/crm');
      const crmData = await crmRes.json();
      
      // Fetch attendance details
      const attRes = await fetch(`/api/attendance?userId=${user?.id || 'usr-sales'}`);
      const attData = await attRes.json();

      // Fetch tasks details
      const tskRes = await fetch('/api/tasks');
      const tskData = await tskRes.json();

      // Fetch documents (for audit log)
      const docRes = await fetch('/api/db');
      const fullDb = await docRes.json();

      const dbData = fullDb.data;

      // Calculations
      const prospects = dbData.prospects || [];
      const units = dbData.units || [];
      const attendance = dbData.attendance || [];
      const leaves = dbData.leaves || [];
      const tasks = dbData.tasks || [];
      const auditLogs = dbData.auditLogs || [];

      const activeProspects = prospects.filter((p: any) => p.pipeline_stage !== 'batal' && p.pipeline_stage !== 'stk');
      
      // Calculate active pipeline value
      const bookedUnitIds = prospects
        .filter((p: any) => ['booking', 'kpr_process', 'akad'].includes(p.pipeline_stage))
        .map((p: any) => p.booked_unit_id);
      
      const pipelineValue = units
        .filter((u: any) => bookedUnitIds.includes(u.id))
        .reduce((sum: number, u: any) => sum + (u.sell_price || 0), 0);

      // Attendance Rate for today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecords = attendance.filter((a: any) => a.date === todayStr);
      const totalStaff = dbData.users.filter((u: any) => u.role !== 'admin').length;
      const presentToday = todayRecords.filter((r: any) => ['present', 'late'].includes(r.status)).length;
      const attendanceRate = totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0;
      const lateToday = todayRecords.filter((r: any) => r.status === 'late').length;

      // Pipeline Stages Count
      const stageKeys = [
        { key: 'prospect_baru', label: 'Prospect Baru' },
        { key: 'dihubungi', label: 'Dihubungi' },
        { key: 'survei', label: 'Survei Lokasi' },
        { key: 'penawaran', label: 'Penawaran' },
        { key: 'booking', label: 'Booking Fee' },
        { key: 'kpr_process', label: 'KPR/Cash' },
        { key: 'akad', label: 'Akad' },
        { key: 'stk', label: 'Serah Terima' }
      ];
      
      const pipelineStages = stageKeys.map(sk => ({
        stage: sk.label,
        count: prospects.filter((p: any) => p.pipeline_stage === sk.key).length
      }));

      // Unit status breakdown
      const unitStatuses = [
        { status: 'Tersedia (Available)', count: units.filter((u: any) => u.status === 'available').length, color: 'bg-green-500' },
        { status: 'Reserved (Minat)', count: units.filter((u: any) => u.status === 'reserved').length, color: 'bg-yellow-500' },
        { status: 'Booking Fee Paid', count: units.filter((u: any) => u.status === 'booking').length, color: 'bg-blue-500' },
        { status: 'Proses KPR / Cash', count: units.filter((u: any) => u.status === 'kpr_process').length, color: 'bg-orange-500' },
        { status: 'Terjual (Akad)', count: units.filter((u: any) => u.status === 'sold').length, color: 'bg-red-500' }
      ];

      setData({
        prospectsCount: activeProspects.length,
        pipelineValue,
        totalUnits: units.length,
        availableUnits: units.filter((u: any) => u.status === 'available').length,
        attendanceRate,
        lateCount: lateToday,
        activeTasks: tasks.filter((t: any) => t.status !== 'done').length,
        pendingLeaves: leaves.filter((l: any) => l.status === 'pending'),
        pipelineStages,
        unitStatuses,
        recentLogs: auditLogs.slice(0, 5)
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleReviewLeave = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_leave',
          leave_id: leaveId,
          status,
          review_notes: 'Reviewed from Executive Dashboard',
          reviewer_id: user?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        // Trigger simulated Slack alert
        const leaveRequest = data?.pendingLeaves.find(l => l.id === leaveId);
        if (leaveRequest) {
          const message = `Manager ${user?.name} menyetujui pengajuan cuti pegawai (ID: ${leaveRequest.user_id}) untuk tanggal ${leaveRequest.start_date}`;
          window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
            detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
          }));
        }
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !data) {
    return (
      <AppShell>
        <div className="flex flex-col gap-6 w-full animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Formatting helper IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8 w-full">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Dashboard Utama</h1>
            <p className="text-gray-500 text-sm mt-1">Selamat datang kembali, <span className="font-semibold text-gray-800">{user?.name}</span>. Monitor operasional dan marketing di sini.</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/absensi" 
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg font-bold text-xs transition-all"
            >
              <Clock size={16} />
              CLOCK-IN/OUT ABSENSI
            </Link>
          </div>
        </div>

        {/* KPI Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Prospects */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 premium-card flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Prospek Aktif</span>
              <span className="text-2xl font-extrabold text-gray-900">{data.prospectsCount} Orang</span>
              <Link href="/crm" className="text-xs text-blue-600 font-semibold mt-1 hover:underline">Kelola prospek ➔</Link>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <UsersIcon size={24} />
            </div>
          </div>

          {/* Card 2: Sales Pipeline Value */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 premium-card flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Nilai Pipeline</span>
              <span className="text-2xl font-extrabold text-gray-900">{formatIDR(data.pipelineValue)}</span>
              <span className="text-[10px] text-gray-500 mt-1">Status booking s/d akad</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign size={24} />
            </div>
          </div>

          {/* Card 3: Kavling Availability */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 premium-card flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ketersediaan Unit</span>
              <span className="text-2xl font-extrabold text-gray-900">{data.availableUnits} / {data.totalUnits} Kavling</span>
              <Link href="/crm" className="text-xs text-indigo-600 font-semibold mt-1 hover:underline">Lihat peta unit ➔</Link>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <HomeIcon size={24} />
            </div>
          </div>

          {/* Card 4: Attendance Today */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 premium-card flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Kehadiran Hari Ini</span>
              <span className="text-2xl font-extrabold text-gray-900">{data.attendanceRate}% Staff</span>
              <span className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {data.lateCount} Orang terlambat
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        {/* Charts & Interactive Breakdown section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Col 1 & 2: Pipeline stages and inventory breakdown */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Sales Pipeline Funnel Widget */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="font-extrabold text-base flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  Corong Pipeline Penjualan (CRM)
                </span>
                <span className="text-[11px] text-gray-400 font-bold">REAL-TIME</span>
              </div>
              <div className="flex flex-col gap-3.5">
                {data.pipelineStages.map((ps, idx) => {
                  const maxCount = Math.max(...data.pipelineStages.map(s => s.count)) || 1;
                  const percent = Math.max(8, (ps.count / maxCount) * 100);
                  return (
                    <div key={idx} className="flex items-center gap-4 text-xs">
                      <span className="w-24 text-gray-500 font-semibold text-right truncate">{ps.stage}</span>
                      <div className="flex-1 bg-gray-100 h-6 rounded-lg overflow-hidden relative border border-gray-200/50">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-r-md transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                        <span className="absolute left-2.5 top-1 font-bold text-gray-700">{ps.count} Lead</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inventory occupancy breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="border-b border-gray-100 pb-3">
                <span className="font-extrabold text-base flex items-center gap-2">
                  <HomeIcon size={18} className="text-indigo-600" />
                  Status Kavling & Unit Properti
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
                {data.unitStatuses.map((us, idx) => (
                  <div key={idx} className="flex flex-col gap-1 p-3 border border-gray-100 rounded-xl bg-gray-50/50 text-center">
                    <span className="text-[10px] text-gray-400 font-bold truncate uppercase">{us.status.split(' ')[0]}</span>
                    <span className="text-2xl font-black text-gray-800">{us.count}</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${us.color}`}></span>
                      <span className="text-[9px] text-gray-500 font-semibold truncate">Unit</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Col 3: HR Leaves approvals & Recent Logs */}
          <div className="flex flex-col gap-6">
            {/* HR Attendance Approval Widget */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="font-extrabold text-base flex items-center gap-2 text-purple-700">
                  <FileCheck size={18} />
                  Persetujuan Cuti HR ({data.pendingLeaves.length})
                </span>
                <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">Supervisor/Admin</span>
              </div>

              {/* Leave Requests Queue */}
              {['admin', 'manager'].includes(user?.role || '') ? (
                <div className="flex flex-col gap-3 max-h-56 overflow-y-auto no-scrollbar">
                  {data.pendingLeaves.length === 0 ? (
                    <div className="text-center py-6 flex flex-col items-center gap-2">
                      <CheckCircle size={24} className="text-green-500" />
                      <span className="text-xs text-gray-400 font-medium">Semua permohonan cuti diproses</span>
                    </div>
                  ) : (
                    data.pendingLeaves.map((leave: any) => (
                      <div key={leave.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col gap-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-gray-800 block">Karyawan: {leave.user_id === 'usr-staff' ? 'Dendi Staff' : 'Staff'}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{leave.leave_type} · {leave.total_days} Hari</span>
                          </div>
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">PENDING</span>
                        </div>
                        <p className="text-[11px] text-gray-500 italic bg-white p-2 rounded border border-gray-100">&quot;{leave.reason}&quot;</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleReviewLeave(leave.id, 'approved')}
                            className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold shadow-sm hover:bg-green-700 transition-colors"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => handleReviewLeave(leave.id, 'rejected')}
                            className="flex-1 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-gray-400 italic">
                  Akses supervisor atau admin diperlukan untuk melihat antrean persetujuan cuti.
                </div>
              )}
            </div>

            {/* Recent Audit / Event logs */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="border-b border-gray-100 pb-3">
                <span className="font-extrabold text-base flex items-center gap-2 text-slate-800">
                  <ClipboardList size={18} />
                  Aktivitas Audit Terkini
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {data.recentLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <div className="flex flex-col">
                      <span className="text-gray-800 font-medium">Aksi: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">{log.action}</code> oleh user: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">{log.user_id}</code></span>
                      <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
