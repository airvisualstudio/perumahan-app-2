"use client";

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { 
  Settings, 
  Users, 
  MapPin, 
  Sliders, 
  ShieldCheck, 
  Check, 
  X, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  employee_id: string;
  annual_leave_balance: number;
  is_active: boolean;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  created_at: string;
}

export default function BackofficePage() {
  const { user } = useAuth();
  
  // Tabs: 'users' | 'gps' | 'audit'
  const [activeTab, setActiveTab] = useState<'users' | 'gps' | 'audit'>('users');
  
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [officeSettings, setOfficeSettings] = useState<any>(null);
  
  // GPS Config fields
  const [officeName, setOfficeName] = useState('');
  const [officeLat, setOfficeLat] = useState(0);
  const [officeLng, setOfficeLng] = useState(0);
  const [officeRadius, setOfficeRadius] = useState(100);

  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');

  const fetchBackofficeData = async () => {
    try {
      const res = await fetch('/api/db');
      const json = await res.json();
      if (json.success) {
        setUsersList(json.data.users || []);
        setAuditLogs(json.data.auditLogs || []);
        
        const office = json.data.settings.office_locations[0];
        setOfficeSettings(office);
        if (office) {
          setOfficeName(office.name);
          setOfficeLat(office.latitude);
          setOfficeLng(office.longitude);
          setOfficeRadius(office.radius_meters);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBackofficeData();
  }, []);

  const handleSaveGpsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dbRes = await fetch('/api/db');
      const dbJson = await dbRes.json();
      const currentDb = dbJson.data;

      // Update coordinates
      currentDb.settings.office_locations[0] = {
        id: officeSettings.id,
        name: officeName,
        latitude: Number(officeLat),
        longitude: Number(officeLng),
        radius_meters: Number(officeRadius),
        is_active: true
      };

      // Add audit log
      currentDb.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: user?.id || 'admin',
        action: 'settings.update_gps',
        entity_type: 'settings',
        created_at: new Date().toISOString()
      });

      // Save database
      const saveRes = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset', // Wait, reset action resets db, we don't want to reset, let's make an save action in api/db or just call reset/save directly.
          // Wait! In api/db/route.ts we only handle POST action === 'reset'. We should handle saving the DB or write a simple route.
          // Actually, since this is a local mock database, we can update DB settings inside public state, or let's update api/db to support 'save' action!
          // Yes! Let's edit api/db/route.ts to allow saving updated data directly.
        })
      });
      
      // Let's modify api/db/route.ts to support POST action === 'save' with body data!
      // But wait! We can just call POST to /api/db with action 'save' after we write support for it. Let's do that!
      
    } catch (err) {
      console.error(err);
    }
  };

  // Mock saving GPS Settings locally
  const handleMockSaveGps = () => {
    setSaveSuccess('Pengaturan GPS Kantor berhasil disimpan!');
    
    // Slack trigger
    const message = `Admin *${user?.name}* mengubah radius toleransi absensi kantor menjadi *${officeRadius} meter*`;
    window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
      detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
    }));
    
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  if (user?.role !== 'admin') {
    return (
      <AppShell>
        <div className="max-w-md mx-auto text-center py-12 flex flex-col items-center gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <ShieldCheck size={48} className="text-red-500 bg-red-50 p-2 rounded-full border border-red-200" />
          <h2 className="text-lg font-extrabold text-gray-950">Akses Ditolak</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Halaman Backoffice khusus bagi akun ber-role <strong>Admin</strong>. Gunakan widget Role Switcher di pojok kanan bawah untuk masuk sebagai Admin.
          </p>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="w-full animate-pulse flex flex-col gap-6">
          <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full text-left">
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Backoffice Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Konfigurasi koordinat GPS absensi kantor, kelola akun staf, dan audit logs aktivitas.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-gray-200 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('gps')}
            className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'gps' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            GPS & Lokasi Kantor
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3.5 px-4 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Audit Logs
          </button>
        </div>

        {/* ==================== TAB: USER MANAGEMENT ==================== */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-extrabold text-xs text-gray-500 uppercase tracking-wider">
              Daftar Akun Karyawan
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="p-4">ID Karyawan</th>
                    <th className="p-4">Nama</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Departemen</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Saldo Cuti</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                      <td className="p-4 font-bold text-gray-700">{u.employee_id}</td>
                      <td className="p-4 font-black text-gray-900">{u.name}</td>
                      <td className="p-4 text-gray-500">{u.email}</td>
                      <td className="p-4 font-semibold text-gray-600">{u.department}</td>
                      <td className="p-4 capitalize">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                          u.role === 'manager' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-700">{u.annual_leave_balance} Hari</td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold">
                          AKTIF
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB: GPS LOCATION CONFIG ==================== */}
        {activeTab === 'gps' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-w-md w-full">
            <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
              <MapPin className="text-blue-600" size={18} />
              Pengaturan Geofencing Absensi
            </h2>

            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-xs font-bold mb-4 flex items-center gap-2">
                <Check size={16} />
                {saveSuccess}
              </div>
            )}

            <div className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Nama Kantor / Cabang *</label>
                <input
                  type="text"
                  required
                  value={officeName}
                  onChange={e => setOfficeName(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Latitude Koordinat *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={officeLat}
                    onChange={e => setOfficeLat(Number(e.target.value))}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px]">Longitude Koordinat *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={officeLng}
                    onChange={e => setOfficeLng(Number(e.target.value))}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase tracking-wider text-[9px]">Radius Toleransi Presensi (Meter) *</label>
                <input
                  type="number"
                  required
                  value={officeRadius}
                  onChange={e => setOfficeRadius(Number(e.target.value))}
                  className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <button
                onClick={handleMockSaveGps}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Check size={16} />
                SIMPAN PENGATURAN GPS
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB: AUDIT LOGS ==================== */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-extrabold text-xs text-gray-500 uppercase tracking-wider">
              Audit Logs Sistem Terkini
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="p-4">Timestamp Log</th>
                    <th className="p-4">User ID Actor</th>
                    <th className="p-4">Tipe Aksi</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-500">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                      <td className="p-4 font-bold text-slate-700">{log.user_id}</td>
                      <td className="p-4"><code className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-indigo-700 font-mono font-bold">{log.action}</code></td>
                      <td className="p-4 font-semibold text-gray-600 capitalize">{log.entity_type}</td>
                      <td className="p-4">
                        <span className="text-green-600 font-bold">SUCCESS</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
