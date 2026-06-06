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
  X,
  AlertCircle,
  FileText,
  Award,
  Coffee,
  UserCheck,
  Image as ImageIcon
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
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [officeSettings, setOfficeSettings] = useState<any>(null);
  const [fullSettings, setFullSettings] = useState<any>(null);
  const [permissionTypes, setPermissionTypes] = useState<any[]>([]);
  
  // GPS & Status State
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [workMode, setWorkMode] = useState<'onsite' | 'wfh'>('onsite');
  const [notes, setNotes] = useState('');
  
  // Connection State
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Lateness check state
  const [isLateToday, setIsLateToday] = useState(false);

  // Form Cuti
  const [isCutiOpen, setIsCutiOpen] = useState(false);
  const [cutiType, setCutiType] = useState('Cuti Tahunan');
  const [cutiStart, setCutiStart] = useState('');
  const [cutiEnd, setCutiEnd] = useState('');
  const [cutiReason, setCutiReason] = useState('');

  // Form Izin
  const [isIzinOpen, setIsIzinOpen] = useState(false);
  const [izinType, setIzinType] = useState('');
  const [izinStart, setIzinStart] = useState('');
  const [izinEnd, setIzinEnd] = useState('');
  const [izinReason, setIzinReason] = useState('');
  const [izinAttachment, setIzinAttachment] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

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
        setFullSettings(json.settings);
        if (json.settings) {
          const pTypes = json.settings.permission_types || [];
          setPermissionTypes(pTypes);
          if (pTypes.length > 0) {
            setIzinType(pTypes[0].name);
          }
        }
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

  // Real-time lateness verification
  useEffect(() => {
    if (fullSettings) {
      const checkLateness = () => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        
        const workStartStr = fullSettings.work_hours_start || '09:00';
        const [startHour, startMinute] = workStartStr.split(':').map(Number);
        const thresholdMinutes = startHour * 60 + startMinute + (fullSettings.late_threshold_minutes || 0);
        
        const currentMinutesToday = currentHours * 60 + currentMinutes;
        setIsLateToday(workMode === 'onsite' && currentMinutesToday > thresholdMinutes);
      };
      
      checkLateness();
      const interval = setInterval(checkLateness, 10000);
      return () => clearInterval(interval);
    }
  }, [fullSettings, workMode]);

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

    if (isLateToday && (!notes || notes.trim() === '')) {
      alert("Alasan terlambat wajib diisi untuk melakukan clock-in.");
      return;
    }

    if (!isOnline) {
      const todayDateStr = new Date().toISOString().split('T')[0];
      const offlineRecord = {
        user_id: user.id,
        date: todayDateStr,
        clock_in_at: new Date().toISOString(),
        clock_in_lat: coordinates.lat,
        clock_in_lng: coordinates.lng,
        status: isLateToday ? 'late' : 'present',
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
        const message = `Karyawan *${user.name}* melakukan Clock-In (${workMode}) pada pukul ${new Date(json.record.clock_in_at).toLocaleTimeString('id-ID')}. Status: ${isLateToday ? '*TERLAMBAT* (Alasan: "' + notes + '")' : '*TEPAT WAKTU*'}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));
        setNotes('');
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
        const overtimeText = json.record.overtime_hours > 0 ? `dengan jam lembur otomatis: *${json.record.overtime_hours} jam*` : '';
        const message = `Karyawan *${user.name}* melakukan Clock-Out pada pukul ${new Date(json.record.clock_out_at).toLocaleTimeString('id-ID')} ${overtimeText}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));
        fetchAttendanceDetails();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleApplyCuti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const diffTime = Math.abs(new Date(cutiEnd).getTime() - new Date(cutiStart).getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_leave',
          category: 'cuti',
          userId: user.id,
          leave_type: cutiType,
          start_date: cutiStart,
          end_date: cutiEnd,
          total_days: totalDays,
          reason: cutiReason
        })
      });
      const json = await res.json();
      if (json.success) {
        const message = `Pegawai *${user.name}* mengajukan cuti (${cutiType}) selama ${totalDays} hari (${cutiStart} s/d ${cutiEnd}) untuk alasan: "${cutiReason}"`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));

        setIsCutiOpen(false);
        setCutiStart('');
        setCutiEnd('');
        setCutiReason('');
        fetchAttendanceDetails();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const matchedType = permissionTypes.find(pt => pt.name === izinType);
    if (matchedType?.requires_attachment && !izinAttachment) {
      alert("Tipe izin ini wajib melampirkan bukti gambar.");
      return;
    }

    const diffTime = Math.abs(new Date(izinEnd).getTime() - new Date(izinStart).getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_leave',
          category: 'izin',
          userId: user.id,
          leave_type: izinType,
          start_date: izinStart,
          end_date: izinEnd,
          total_days: totalDays,
          reason: izinReason,
          attachment_url: izinAttachment || undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        const attachmentMsg = izinAttachment ? ' (dengan bukti lampiran gambar)' : '';
        const message = `Pegawai *${user.name}* mengajukan izin/sakit (${izinType}) selama ${totalDays} hari (${izinStart} s/d ${izinEnd}) untuk alasan: "${izinReason}"${attachmentMsg}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));

        setIsIzinOpen(false);
        setIzinStart('');
        setIzinEnd('');
        setIzinReason('');
        setIzinAttachment('');
        fetchAttendanceDetails();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        // Base64 simulation
        setIzinAttachment(event.target.result as string);
      }
      setUploadingAttachment(false);
    };
    reader.onerror = () => {
      alert("Gagal membaca file gambar.");
      setUploadingAttachment(false);
    };
    reader.readAsDataURL(file);
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

  // Recap statistics calculations
  const totalHadir = history.filter(h => h.status === 'present').length;
  const totalTerlambat = history.filter(h => h.status === 'late').length;
  const totalIzinSakit = leaves.filter(l => l.status === 'approved' && l.category === 'izin').length;
  const totalLemburHours = history.reduce((sum, h) => sum + (h.overtime_hours || 0), 0);

  // Dynamic attachment checking
  const selectedTypeRequiresAttachment = permissionTypes.find(pt => pt.name === izinType)?.requires_attachment;

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
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

          {/* Lateness warning */}
          {!isClockedIn && isLateToday && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-left text-xs font-semibold text-red-800">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span>Pemberitahuan Keterlambatan</span>
                <span className="text-[10px] text-red-600 font-medium">Anda telah melewati batas toleransi masuk kerja ({fullSettings?.work_hours_start} + {fullSettings?.late_threshold_minutes}m). Alasan terlambat wajib diisi sebelum Clock-In.</span>
              </div>
            </div>
          )}

          {/* Notes Input */}
          {!isClockedIn && (
            <div className="flex flex-col gap-1 text-left">
              {isLateToday && (
                <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Alasan Terlambat Masuk *</label>
              )}
              <input
                type="text"
                placeholder={isLateToday ? "Tulis alasan keterlambatan Anda di sini (Wajib)..." : "Catatan absensi / tugas hari ini (Opsional)..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none ${
                  isLateToday 
                    ? 'bg-red-50/30 border-red-200 focus:border-red-500 text-red-900 placeholder-red-300' 
                    : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                }`}
              />
            </div>
          )}

          {/* BIG BUTTON ACTIONS */}
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={(workMode === 'onsite' && !isWithinRadius && gpsDistance !== null) || (isLateToday && !notes.trim())}
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
              {todayRecord?.overtime_hours > 0 && (
                <span className="text-xs text-emerald-600 bg-white border border-emerald-100 rounded px-2 py-0.5 mt-1 font-bold">Lembur: {todayRecord.overtime_hours} jam</span>
              )}
            </div>
          )}

          {/* Previous attendance info */}
          {todayRecord?.clock_in_at && !todayRecord.clock_out_at && (
            <div className="text-xs text-gray-500 font-semibold bg-gray-50 border border-gray-100 p-3 rounded-xl text-left">
              <span>✓ Anda masuk pada <strong>{new Date(todayRecord.clock_in_at).toLocaleTimeString('id-ID')} WIB</strong></span>
              {todayRecord.status === 'late' && (
                <span className="text-red-500 font-bold block mt-1">⚠ Terlambat masuk (Alasan: &quot;{todayRecord.notes}&quot;)</span>
              )}
            </div>
          )}
        </div>

        {/* Separated Cuti & Izin Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cuti (Leave) Panel */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 text-left justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Saldo Cuti Tahunan</span>
              <span className="text-xl font-black text-gray-900">{user?.annual_leave_balance} Hari Tersisa</span>
              <span className="text-[10px] text-gray-400 font-semibold mt-1">Gunakan untuk liburan, duka, atau keperluan pribadi jangka panjang.</span>
            </div>
            <button
              onClick={() => setIsCutiOpen(true)}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Plane size={14} /> AJUKAN CUTI TAHUNAN
            </button>
          </div>

          {/* Izin / Sakit (Excuse) Panel */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 text-left justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Izin & Sakit Dinamis</span>
              <span className="text-xl font-black text-gray-900">{permissionTypes.length} Tipe Izin Aktif</span>
              <span className="text-[10px] text-gray-400 font-semibold mt-1">Gunakan untuk sakit dokter, izin keluarga, atau kedinasan luar kantor.</span>
            </div>
            <button
              onClick={() => setIsIzinOpen(true)}
              disabled={permissionTypes.length === 0}
              className="w-full py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <FileText size={14} /> AJUKAN IZIN / SAKIT
            </button>
          </div>
        </div>

        {/* Rekap Kehadiran (Attendance Recap) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 text-left">
          <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 text-slate-800 flex items-center gap-2">
            <Award size={18} className="text-indigo-600" />
            Rekap Kehadiran Saya
          </h2>
          
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Hadir</span>
              <span className="text-lg font-black text-green-700">{totalHadir}</span>
              <span className="text-[8px] text-green-400 font-semibold">Tepat Waktu</span>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Terlambat</span>
              <span className="text-lg font-black text-red-700">{totalTerlambat}</span>
              <span className="text-[8px] text-red-400 font-semibold">Hari</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Izin/Sakit</span>
              <span className="text-lg font-black text-amber-700">{totalIzinSakit}</span>
              <span className="text-[8px] text-amber-400 font-semibold">Approved</span>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">Lembur</span>
              <span className="text-lg font-black text-purple-700">{totalLemburHours}</span>
              <span className="text-[8px] text-purple-400 font-semibold">Jam</span>
            </div>
          </div>
        </div>

        {/* History Logs */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 text-left">
          <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 text-slate-800 flex items-center gap-2">
            <Coffee size={18} className="text-indigo-600" />
            Riwayat Kehadiran Harian
          </h2>
          
          <div className="max-h-60 overflow-y-auto flex flex-col gap-2.5 pr-1">
            {history.length === 0 ? (
              <span className="text-xs text-gray-400 italic text-center py-4">Belum ada riwayat presensi harian.</span>
            ) : (
              history.map((h) => {
                const clockInTime = h.clock_in_at ? new Date(h.clock_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';
                const clockOutTime = h.clock_out_at ? new Date(h.clock_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';
                return (
                  <div key={h.id} className="p-3 border border-gray-100 rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-gray-800">{new Date(h.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <div className="flex gap-2 text-[10px] text-gray-400 font-semibold">
                        <span>Mode: <strong className="text-indigo-600 uppercase">{h.work_mode}</strong></span>
                        {h.overtime_hours > 0 && (
                          <span className="text-purple-600 bg-purple-50 px-1 rounded">Lembur: {h.overtime_hours} jam</span>
                        )}
                      </div>
                      {h.notes && (
                        <span className="text-[10px] text-amber-600 font-medium italic block max-w-xs truncate">Catatan: &quot;{h.notes}&quot;</span>
                      )}
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      <span className="font-mono font-bold text-gray-700">{clockInTime} - {clockOutTime}</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] self-end uppercase ${
                        h.status === 'present' ? 'bg-green-50 text-green-700' :
                        h.status === 'late' ? 'bg-red-50 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {h.status === 'present' ? 'Hadir' : h.status === 'late' ? 'Terlambat' : h.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* History Cuti & Izin Requests */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 text-left">
          <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 text-slate-800 flex items-center gap-2">
            <UserCheck size={18} className="text-indigo-600" />
            Riwayat Pengajuan Cuti & Izin
          </h2>
          
          <div className="max-h-60 overflow-y-auto flex flex-col gap-2.5 pr-1">
            {leaves.length === 0 ? (
              <span className="text-xs text-gray-400 italic text-center py-4">Belum ada riwayat pengajuan cuti atau izin.</span>
            ) : (
              leaves.map((l) => (
                <div key={l.id} className="p-3 border border-gray-100 rounded-xl bg-slate-50 flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{l.leave_type}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{l.start_date} s/d {l.end_date} ({l.total_days} hari)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                      l.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                      l.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-gray-500 italic bg-white p-2 rounded border border-gray-100/50">&quot;{l.reason}&quot;</p>
                  
                  {l.attachment_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Lampiran Bukti:</span>
                      {l.attachment_url.startsWith('data:image/') ? (
                        <a href={l.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline font-bold">
                          <ImageIcon size={12} /> Lihat Gambar Upload
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-500">File Dokumen Tersedia</span>
                      )}
                    </div>
                  )}

                  {l.review_notes && (
                    <div className="bg-slate-100/80 p-2 rounded border-l-2 border-indigo-500 text-[10px] text-slate-600">
                      <strong>Catatan HR/Manager:</strong> &quot;{l.review_notes}&quot;
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* MODAL: APPLY CUTI */}
        {isCutiOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-950 flex items-center gap-2">
                  <Plane size={18} className="text-blue-600" />
                  Pengajuan Cuti Tahunan / Khusus
                </h3>
                <button 
                  onClick={() => setIsCutiOpen(false)} 
                  className="p-1 hover:bg-gray-100 rounded text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleApplyCuti} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tipe Cuti</label>
                  <select
                    value={cutiType}
                    onChange={(e) => setCutiType(e.target.value)}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="Cuti Tahunan">Cuti Tahunan (Potong Saldo)</option>
                    <option value="Cuti Khusus">Cuti Khusus (Menikah, Duka, Melahirkan)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tanggal Mulai</label>
                    <input
                      type="date"
                      required
                      value={cutiStart}
                      onChange={(e) => setCutiStart(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tanggal Selesai</label>
                    <input
                      type="date"
                      required
                      value={cutiEnd}
                      onChange={(e) => setCutiEnd(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Alasan Cuti *</label>
                  <textarea
                    required
                    placeholder="Tuliskan keterangan detail pengajuan cuti Anda..."
                    value={cutiReason}
                    onChange={(e) => setCutiReason(e.target.value)}
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

        {/* MODAL: APPLY IZIN */}
        {isIzinOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-950 flex items-center gap-2">
                  <FileText size={18} className="text-slate-800" />
                  Pengajuan Izin / Sakit
                </h3>
                <button 
                  onClick={() => setIsIzinOpen(false)} 
                  className="p-1 hover:bg-gray-100 rounded text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleApplyIzin} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tipe Izin</label>
                  <select
                    value={izinType}
                    onChange={(e) => setIzinType(e.target.value)}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-500"
                  >
                    {permissionTypes.map((pt) => (
                      <option key={pt.id} value={pt.name}>
                        {pt.name} {pt.requires_attachment ? '(Wajib Bukti Gambar)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tanggal Mulai</label>
                    <input
                      type="date"
                      required
                      value={izinStart}
                      onChange={(e) => setIzinStart(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tanggal Selesai</label>
                    <input
                      type="date"
                      required
                      value={izinEnd}
                      onChange={(e) => setIzinEnd(e.target.value)}
                      className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Alasan Izin / Keterangan *</label>
                  <textarea
                    required
                    placeholder="Tuliskan alasan lengkap permohonan izin Anda..."
                    value={izinReason}
                    onChange={(e) => setIzinReason(e.target.value)}
                    rows={3}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-500 resize-none font-medium"
                  ></textarea>
                </div>

                {/* Conditional Attachment Upload */}
                {selectedTypeRequiresAttachment && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-red-500 uppercase tracking-wider text-[10px]">Unggah Bukti Gambar / Surat Sakit *</label>
                    <label className="px-3.5 py-2.5 border border-dashed border-red-200 rounded-xl bg-red-50/20 hover:bg-red-50/50 cursor-pointer flex items-center justify-center gap-1.5 font-bold transition-all text-red-600">
                      <span>{izinAttachment ? 'Gambar Terpilih (Klik ganti)' : (uploadingAttachment ? 'Membaca gambar...' : 'Pilih File Gambar')}</span>
                      <input 
                        type="file" 
                        required={!izinAttachment}
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                    </label>
                    {izinAttachment && (
                      <div className="relative w-full h-24 mt-2 border border-gray-100 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={izinAttachment} alt="Preview" className="h-full object-contain" />
                        <button 
                          type="button" 
                          onClick={() => setIzinAttachment('')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploadingAttachment || (selectedTypeRequiresAttachment && !izinAttachment)}
                  className="w-full py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={16} />
                  KIRIM PENGAJUAN IZIN
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
