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
      let prospects = dbData.prospects || [];
      let units = dbData.units || [];
      
      // Filter based on user housing access
      const accessClusters = user?.accessible_clusters;
      if (user && user.role !== 'admin' && accessClusters && accessClusters.length > 0) {
        prospects = prospects.filter((p: any) => !p.interested_cluster_id || accessClusters.includes(p.interested_cluster_id));
        units = units.filter((u: any) => accessClusters.includes(u.cluster_id));
      }

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
          <div className="h-10 bg-slate-200 rounded-xl w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl"></div>
            <div className="h-72 bg-slate-200 rounded-2xl"></div>
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
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
        
        {/* Sub-header Controls Bar (SalesX Style) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Left: Overview Dropdown Segment */}
          <div className="flex items-center gap-2 bg-white border border-slate-200/70 p-1 rounded-xl shadow-xs">
            <button className="px-3 py-1.5 bg-slate-100/80 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <span>Overview</span>
            </button>
          </div>

          {/* Right: Date Indicator & Purple Export Button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200/70 text-slate-600 rounded-xl text-xs font-medium shadow-xs">
              <span className="text-slate-400">📅</span>
              <span>Valuation data as of Sep 18, 2024</span>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer">
              <span>⤓ Export</span>
            </button>
          </div>
        </div>

        {/* Top 4 SalesX Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Revenue / Pipeline Value */}
          <div className="salesx-card p-4.5 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 text-sm font-bold">
                💳
              </div>
              <span className="text-xs text-slate-500 font-medium">Total Revenue</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{formatIDR(data.pipelineValue || 2189000000)}</span>
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 7.52%
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
              <span>+$3,256 from last month</span>
              <span className="text-slate-400 font-bold hover:text-purple-600 cursor-pointer">→</span>
            </div>
          </div>

          {/* Card 2: Total Visitor / Active Prospects */}
          <div className="salesx-card p-4.5 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-bold">
                👁
              </div>
              <span className="text-xs text-slate-500 font-medium">Total Visitor</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{data.prospectsCount || 611}</span>
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 6.20%
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
              <span>+27 from last month</span>
              <span className="text-slate-400 font-bold hover:text-purple-600 cursor-pointer">→</span>
            </div>
          </div>

          {/* Card 3: Total Transitions / Sales Deals */}
          <div className="salesx-card p-4.5 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 text-sm font-bold">
                💲
              </div>
              <span className="text-xs text-slate-500 font-medium">Total Transitions</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">3,250</span>
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 3.56%
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
              <span>+$365 from last month</span>
              <span className="text-slate-400 font-bold hover:text-purple-600 cursor-pointer">→</span>
            </div>
          </div>

          {/* Card 4: Total Products / Unit Inventory */}
          <div className="salesx-card p-4.5 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-bold">
                📦
              </div>
              <span className="text-xs text-slate-500 font-medium">Total Products</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{data.totalUnits || 980}</span>
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 3.72%
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
              <span>+70 from last month</span>
              <span className="text-slate-400 font-bold hover:text-purple-600 cursor-pointer">→</span>
            </div>
          </div>

        </div>

        {/* Middle Section: Sales Analytics Curve Chart + Traffic breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Sales Analytics SVG Area Chart (2/3 width) */}
          <div className="lg:col-span-2 salesx-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-900 tracking-tight">Sales Analytics</h2>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-500 rounded-xl text-xs font-medium">
                <span>📅</span>
                <span>Valuation data as of Sep 18, 2024</span>
              </div>
            </div>

            {/* Interactive Purple Gradient Curve Area Chart */}
            <div className="relative w-full h-56 pt-6">
              {/* Tooltip callout (Floating SalesX Callout) */}
              <div className="absolute left-[54%] top-1 z-10 -translate-x-1/2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-md flex flex-col text-center">
                <span className="text-[10px] text-slate-400 font-semibold">12 April</span>
                <span className="text-xs font-bold text-slate-900">$8,200</span>
              </div>

              {/* Chart SVG */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Vertical Grid Lines */}
                {[50, 137, 225, 312, 400, 487, 575, 662].map((x, i) => (
                  <line key={i} x1={x} y1="10" x2={x} y2="150" stroke="#f1f5f9" strokeDasharray="3 3" strokeWidth="1" />
                ))}

                {/* Area path */}
                <path 
                  d="M 50,110 C 90,60 110,80 137,70 C 170,60 190,40 225,45 C 260,50 280,75 312,60 C 350,40 370,15 400,20 C 430,25 450,70 487,65 C 525,60 550,90 575,85 C 610,80 635,35 662,40 L 662,150 L 50,150 Z" 
                  fill="url(#purpleAreaGradient)" 
                />

                {/* Smooth Curve Stroke */}
                <path 
                  d="M 50,110 C 90,60 110,80 137,70 C 170,60 190,40 225,45 C 260,50 280,75 312,60 C 350,40 370,15 400,20 C 430,25 450,70 487,65 C 525,60 550,90 575,85 C 610,80 635,35 662,40" 
                  fill="none" 
                  stroke="#7c3aed" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />

                {/* Active Tooltip Dot */}
                <circle cx="400" cy="20" r="4.5" fill="#7c3aed" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* Y-Axis Labels */}
              <div className="absolute left-0 top-6 bottom-8 flex flex-col justify-between text-[10px] text-slate-400 font-medium pointer-events-none">
                <span>$30K</span>
                <span>$25K</span>
                <span>$20K</span>
                <span>$15K</span>
                <span>$10K</span>
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between px-10 text-[11px] text-slate-400 font-medium mt-1">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apl</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
              </div>
            </div>
          </div>

          {/* Traffic / Lead Source Breakdown (1/3 width) */}
          <div className="salesx-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-900 tracking-tight">Traffic</h2>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
                  <button className="px-3 py-1 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow-2xs">Week</button>
                  <button className="px-3 py-1 text-slate-400 hover:text-slate-700 text-xs font-medium">Month</button>
                </div>
                <span className="text-slate-400 text-xs cursor-pointer hover:text-slate-700">•••</span>
              </div>
            </div>

            {/* Horizontal Bar Stack */}
            <div className="flex flex-col gap-3 py-2">
              <div className="w-full bg-purple-600 h-8 rounded-xl flex items-center justify-end px-3 text-white text-[11px] font-bold shadow-xs">
                17%
              </div>
              <div className="w-full bg-amber-400 h-8 rounded-xl flex items-center justify-end px-3 text-white text-[11px] font-bold shadow-xs">
                17%
              </div>
              <div className="w-full bg-sky-400 h-8 rounded-xl flex items-center justify-end px-3 text-white text-[11px] font-bold shadow-xs">
                17%
              </div>
            </div>

            {/* Legend Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span>Google</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Shopify</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>Facebook</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section: Top Selling Table + Product Sales Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Top Selling Data Table (2/3 width) */}
          <div className="lg:col-span-2 salesx-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-base text-slate-900 tracking-tight">Top Selling</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200/70 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer shadow-2xs">
                  <span>⇅ Sort by</span>
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200/70 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer shadow-2xs">
                  <span>⤓ Export</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-8"><input type="checkbox" className="rounded text-purple-600" /></th>
                    <th className="py-2.5 px-3">Product info</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Sold</th>
                    <th className="py-2.5 px-3">Total Earning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3"><input type="checkbox" className="rounded text-purple-600" /></td>
                    <td className="py-3 px-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">👡</div>
                      <span className="font-semibold text-slate-900">Leather Flat Sandals</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">$220.2</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">In Stock</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">206 Pcs</td>
                    <td className="py-3 px-3 font-bold text-slate-900">$5,361.20</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3"><input type="checkbox" className="rounded text-purple-600" /></td>
                    <td className="py-3 px-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm flex-shrink-0">👕</div>
                      <span className="font-semibold text-slate-900">Modern T Shirt</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">$50.00</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100">Out Of Stock</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">103 Pcs</td>
                    <td className="py-3 px-3 font-bold text-slate-900">$4,235.20</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3"><input type="checkbox" className="rounded text-purple-600" /></td>
                    <td className="py-3 px-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">🧢</div>
                      <span className="font-semibold text-slate-900">Stylish Head Cap</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">$99.00</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">In Stock</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">169 Pcs</td>
                    <td className="py-3 px-3 font-bold text-slate-900">$2,234.20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Sales Vertical Bar Chart (1/3 width) */}
          <div className="salesx-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-900 tracking-tight">Product Sales</h2>
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-xl cursor-pointer">
                <span>Last Month</span>
                <span>˅</span>
              </div>
            </div>

            {/* Metrics Header */}
            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3 text-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">Packed</span>
                <span className="text-sm font-bold text-slate-900">756</span>
                <span className="text-[10px] font-semibold text-emerald-500">↑ 5.7%</span>
              </div>
              <div className="flex flex-col border-x border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium">Delivered</span>
                <span className="text-sm font-bold text-slate-900">1052</span>
                <span className="text-[10px] font-semibold text-emerald-500">↑ 7.3%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">Shipped</span>
                <span className="text-sm font-bold text-slate-900">1564</span>
                <span className="text-[10px] font-semibold text-emerald-500">↑ 11.7%</span>
              </div>
            </div>

            {/* Vertical Bar Chart */}
            <div className="flex items-end justify-around h-36 pt-4 gap-4">
              <div className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 h-24 rounded-t-xl shadow-xs"></div>
              <div className="flex-1 bg-gradient-to-t from-amber-400 to-amber-200 h-32 rounded-t-xl shadow-xs"></div>
              <div className="flex-1 bg-gradient-to-t from-sky-400 to-sky-200 h-36 rounded-t-xl shadow-xs"></div>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
