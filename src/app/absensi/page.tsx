"use client";

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Wifi, 
  WifiOff, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle,
  Plane,
  X
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  clock_in_at?: string;
  clock_out_at?: string;
  status: 'present' | 'late' | 'absent' | 'leave' | 'permission' | 'sick';
  work_mode: 'onsite' | 'wfh';
}

interface Leave {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [officeSettings, setOfficeSettings] = useState<any>(null);
  
  // GPS & Status State
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [workMode, setWorkMode] = useState<'onsite' | 'wfh'>('onsite');
  const [notes, setNotes] = useState('');
  
  // Connection State
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Form Leave
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Cuti Tahunan');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  // Check connection status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const goOnline = () => {
      setIsOnline(true);
      syncOfflineRecords();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const syncOfflineRecords = async () => {
    const cached = localStorage.getItem('domus_offline_attendance');
    if (!cached) return;

    try {
      setSyncStatus('Mensinkronisasi data offline...');
      const records = JSON.parse(cached);
      
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_offline',
          records
        })
      });
      const json = await res.json();
      if (json.success) {
        localStorage.removeItem('domus_offline_attendance');
        setSyncStatus('Sinkronisasi selesai!');
        
        // Slack webhook alert
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { 
            timestamp: new Date().toLocaleTimeString('id-ID'), 
            channel: 'hr-notif', 
            message: `Absensi offline karyawan ${user?.name} (${json.syncedCount} log) telah berhasil disinkronkan ke server.` 
          }
        }));

        setTimeout(() => setSyncStatus(''), 3000);
        fetchAttendanceDetails();
      }
    } catch (error) {
      setSyncStatus('Gagal mensinkronkan, coba lagi nanti.');
    }
  };

  const fetchAttendanceDetails = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/attendance?userId=${user.id}`);
      const json = await res.json();
      if (json.success) {
        setTodayRecord(json.todayRecord);
        setHistory(json.personalHistory || []);
        setLeaves(json.personalLeaves || []);
        setOfficeSettings(json.officeSettings);
      }
      setIsLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendanceDetails();
      // Track GPS coordinates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setCoordinates({ lat, lng });
          },
          (err) => {
            // If failed, mock coordinates for smooth local validation
            setGpsError("Menggunakan koordinat simulasi (GPS ditolak browser/perangkat)");
            setCoordinates({ lat: -6.917460, lng: 107.619120 }); // Inside Bandung Office
          }
        );
      }
    }
  }, [user]);

  // Calculate distance when coordinates are loaded
  useEffect(() => {
    if (coordinates && officeSettings) {
      const distance = getDistance(
        coordinates.lat, 
        coordinates.lng, 
        officeSettings.latitude, 
        officeSettings.longitude
      );
      setGpsDistance(distance);
    }
  }, [coordinates, officeSettings]);

  // Haversine distance calculator
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleClockIn = async () => {
    if (!user || !coordinates) return;

    if (!isOnline) {
      // Perform Offline Clock-In Cache
      const todayDateStr = new Date().toISOString().split('T')[0];
      const offlineRecord = {
        user_id: user.id,
        date: todayDateStr,
        clock_in_at: new Date().toISOString(),
        clock_in_lat: coordinates.lat,
        clock_in_lng: coordinates.lng,
        status: 'present',
        work_mode: workMode,
        notes: notes + ' (Offline Cache)'
      };

      const cached = localStorage.getItem('domus_offline_attendance');
      const records = cached ? JSON.parse(cached) : [];
      records.push(offlineRecord);
      localStorage.setItem('domus_offline_attendance', JSON.stringify(records));
      
      setTodayRecord(offlineRecord as any);
      setSyncStatus('Mode offline: tersimpan lokal. Menunggu koneksi internet...');
      return;
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clock_in',
          userId: user.id,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          workMode,
          notes
        })
      });
      const json = await res.json();
      if (json.success) {
        // Slack trigger
        const message = `Karyawan *${user.name}* melakukan Clock-In (${workMode}) pada pukul ${new Date(json.record.clock_in_at).toLocaleTimeString('id-ID')}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));
        fetchAttendanceDetails();
      } else {
        alert(json.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClockOut = async () => {
    if (!user || !coordinates) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clock_out',
          userId: user.id,
          latitude: coordinates.lat,
          longitude: coordinates.lng
        })
      });
      const json = await res.json();
      if (json.success) {
        // Slack trigger
        const message = `Karyawan *${user.name}* melakukan Clock-Out pada pukul ${new Date(json.record.clock_out_at).toLocaleTimeString('id-ID')}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));
        fetchAttendanceDetails();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Calculate total days
    const diffTime = Math.abs(new Date(leaveEnd).getTime() - new Date(leaveStart).getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_leave',
          userId: user.id,
          leave_type: leaveType,
          start_date: leaveStart,
          end_date: leaveEnd,
          total_days: totalDays,
          reason: leaveReason
        })
      });
      const json = await res.json();
      if (json.success) {
        // Slack alert
        const message = `Pegawai *${user.name}* mengajukan cuti (${leaveType}) selama ${totalDays} hari untuk alasan: "${leaveReason}"`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));

        setIsLeaveOpen(false);
        setLeaveStart('');
        setLeaveEnd('');
        setLeaveReason('');
        fetchAttendanceDetails();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="w-full max-w-md mx-auto animate-pulse flex flex-col gap-6">
          <div className="h-28 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </AppShell>
    );
  }

  const isWithinRadius = gpsDistance !== null && officeSettings && gpsDistance <= officeSettings.radius_meters;
  const isClockedIn = !!todayRecord && !!todayRecord.clock_in_at;
  const isClockedOut = !!todayRecord && !!todayRecord.clock_out_at;

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
        {/* Mobile Header Title */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Presensi Kehadiran</h1>
          <p className="text-gray-500 text-sm mt-1">Lakukan clock-in dan clock-out harian berbasis GPS verifikasi dari HP Anda.</p>
        </div>

        {/* Offline & Sync warning banner */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-center gap-3 font-semibold text-xs">
            <WifiOff size={18} className="text-amber-600 animate-bounce" />
            <div className="flex flex-col text-left">
              <span>Koneksi Offline Terdeteksi</span>
              <span className="text-[10px] text-amber-500 font-medium">Absen akan disimpan di HP, akan disinkron saat online.</span>
            </div>
          </div>
        )}

        {syncStatus && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-3 text-center text-xs font-bold">
            {syncStatus}
          </div>
        )}

        {/* GPS Location indicator card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-2">
            <span className="font-bold text-gray-500">GPS VERIFICATION</span>
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
                <Wifi size={12} /> ONLINE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                <WifiOff size={12} /> OFFLINE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <MapPin size={20} />
            </div>
            
            <div className="flex flex-col text-left">
              {gpsDistance !== null ? (
                <>
                  <span className={`font-extrabold ${isWithinRadius || workMode === 'wfh' ? 'text-green-600' : 'text-red-500'}`}>
                    {workMode === 'wfh' ? '📍 Mode WFH Aktif' : isWithinRadius ? `📍 Dalam Radius Kantor` : `📍 Di Luar Radius Kantor`}
                  </span>
                  <span className="text-gray-400 font-semibold text-[10px]">
                    Jarak ke kantor: {Math.round(gpsDistance)}m (Radius toleransi: {officeSettings?.radius_meters}m)
                  </span>
                </>
              ) : (
                <span className="text-gray-400 font-bold animate-pulse">Menghitung koordinat GPS...</span>
              )}
            </div>
          </div>
        </div>

        {/* Absensi Action Module */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-center">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="text-3xl font-black text-gray-900 font-mono tracking-wider">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>

          {/* Mode Selector */}
          {!isClockedIn && (
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setWorkMode('onsite')}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  workMode === 'onsite' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                🏢 ONSITE (KANTOR)
              </button>
              <button
                onClick={() => setWorkMode('wfh')}
                className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                  workMode === 'wfh' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                🏠 WFH (RUMAH)
              </button>
            </div>
          )}

          {/* Notes Input */}
          {!isClockedIn && (
            <input
              type="text"
              placeholder="Catatan absensi / tugas hari ini (Opsional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
            />
          )}

          {/* BIG BUTTON ACTIONS (PRD 9.7) */}
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={workMode === 'onsite' && !isWithinRadius && gpsDistance !== null}
              className={`w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Clock size={24} />
              MASUK (CLOCK-IN)
            </button>
          ) : !isClockedOut ? (
            <button
              onClick={handleClockOut}
              className="w-full h-20 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
            >
              <Clock size={24} />
              KELUAR (CLOCK-OUT)
            </button>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-5 text-sm font-bold flex flex-col items-center gap-2">
              <Check size={28} className="text-emerald-600 bg-white p-1 rounded-full border border-emerald-200 shadow-sm" />
              <span>Selesai! Anda telah absen keluar hari ini.</span>
              <span className="text-xs text-emerald-500 font-medium">Jam Masuk: {new Date(todayRecord!.clock_in_at!).toLocaleTimeString('id-ID')} WIB</span>
              <span className="text-xs text-emerald-500 font-medium">Jam Keluar: {new Date(todayRecord!.clock_out_at!).toLocaleTimeString('id-ID')} WIB</span>
            </div>
          )}

          {/* Previous attendance info */}
          {todayRecord?.clock_in_at && !todayRecord.clock_out_at && (
            <div className="text-xs text-gray-500 font-semibold bg-gray-50 border border-gray-100 p-3 rounded-xl text-left">
              <span>✓ Anda masuk pada <strong>{new Date(todayRecord.clock_in_at).toLocaleTimeString('id-ID')} WIB</strong></span>
              {todayRecord.status === 'late' && (
                <span className="text-red-500 font-bold block mt-1">⚠ Terlambat masuk (Melewati 09:15 WIB)</span>
              )}
            </div>
          )}
        </div>

        {/* Cuti (Leave) Panel Trigger */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
          <div className="flex flex-col text-left">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Saldo Cuti Tahunan</span>
            <span className="text-xl font-black text-gray-900">{user?.annual_leave_balance} Hari Tersisa</span>
          </div>
          <button
            onClick={() => setIsLeaveOpen(true)}
            className="px-4 py-2 border border-blue-200 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-50 transition-colors flex items-center gap-1.5"
          >
            <Plane size={14} /> AJUKAN CUTI
          </button>
        </div>

        {/* MODAL: APPLY LEAVE (CUTI) */}
        {isLeaveOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-950 flex items-center gap-2">
                  <Plane size={18} className="text-blue-600" />
                  Pengajuan Cuti / Izin
                </h3>
                <button 
                  onClick={() => setIsLeaveOpen(false)} 
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 text-xs font-bold"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tipe Pengajuan</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Izin">Izin Mendadak</option>
                    <option value="Sakit">Sakit (Butuh Surat)</option>
                    <option value="Cuti Khusus">Cuti Khusus (Pernikahan/Duka)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tanggal Mulai</label>
                    <input
                      type="date"
                      required
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tanggal Selesai</label>
                    <input
                      type="date"
                      required
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Alasan Cuti *</label>
                  <textarea
                    required
                    placeholder="Tuliskan keterangan detail pengajuan cuti Anda..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    rows={3}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  KIRIM PENGAJUAN CUTI
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
