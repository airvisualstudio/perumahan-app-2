"use client";

import React, { useEffect, useState, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useCrudModal } from '@/context/CrudModalContext';
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
  const { showSuccess, showError, showConfirm } = useCrudModal();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [officeSettings, setOfficeSettings] = useState<any>(null);
  const [fullSettings, setFullSettings] = useState<any>(null);
  const [permissionTypes, setPermissionTypes] = useState<any[]>([]);
  
  // Tab & Team States
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal');
  const [teamSubTab, setTeamSubTab] = useState<'logs' | 'settings'>('logs');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Locations CRUD states
  const [locations, setLocations] = useState<any[]>([]);
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [locName, setLocName] = useState('');
  const [locLat, setLocLat] = useState(0);
  const [locLng, setLocLng] = useState(0);
  const [locRadius, setLocRadius] = useState(100);

  // Holidays CRUD states
  const [holidaysState, setHolidaysState] = useState<any[]>([]);
  const [editingHolId, setEditingHolId] = useState<string | null>(null);
  const [holDate, setHolDate] = useState('');
  const [holName, setHolName] = useState('');

  // Settings Edit states
  const [lateThreshold, setLateThreshold] = useState(15);
  const [whStart, setWhStart] = useState('09:00');
  const [whEnd, setWhEnd] = useState('18:00');

  // Log CRUD states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLogRecord, setEditingLogRecord] = useState<any | null>(null); 
  const [logUserId, setLogUserId] = useState('');
  const [logDate, setLogDate] = useState('');
  const [logClockIn, setLogClockIn] = useState('');
  const [logClockOut, setLogClockOut] = useState('');
  const [logStatus, setLogStatus] = useState<'present' | 'late'>('present');
  const [logWorkMode, setLogWorkMode] = useState<'onsite' | 'wfh'>('onsite');
  const [logNotes, setLogNotes] = useState('');

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

  // Calendar View State
  const [calendarViewMode, setCalendarViewMode] = useState<'list' | 'calendar'>('list');
  const [currentCalendarYear, setCurrentCalendarYear] = useState<number>(new Date().getFullYear());
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<number>(new Date().getMonth());
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    record?: any;
    leave?: any;
  } | null>(null);

  const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const generateCalendarDays = () => {
    const year = currentCalendarYear;
    const month = currentCalendarMonth;
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const calendarDays = [];

    // Leading days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      calendarDays.push({
        date: d,
        isCurrentMonth: false,
        dateStr: getLocalDateString(d)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      calendarDays.push({
        date: d,
        isCurrentMonth: true,
        dateStr: getLocalDateString(d)
      });
    }

    // Trailing days from next month
    const totalSlots = 42; // standard 6 rows
    const remainingSlots = totalSlots - calendarDays.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      calendarDays.push({
        date: d,
        isCurrentMonth: false,
        dateStr: getLocalDateString(d)
      });
    }

    return calendarDays;
  };

  const handlePrevMonth = () => {
    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11);
      setCurrentCalendarYear(prev => prev - 1);
    } else {
      setCurrentCalendarMonth(prev => prev - 1);
    }
    setSelectedDayDetail(null);
  };

  const handleNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0);
      setCurrentCalendarYear(prev => prev + 1);
    } else {
      setCurrentCalendarMonth(prev => prev + 1);
    }
    setSelectedDayDetail(null);
  };

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
        setAllLeaves(json.allLeaves || []);
        setAllRecords(json.allRecords || []);
        setAllUsers(json.users || []);
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

  // Dynamic Leaflet map loader and coordinate syncer
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  // Initialize and sync map picker when tab is settings and leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || typeof window === 'undefined' || teamSubTab !== 'settings') return;
    const L = (window as any).L;
    if (!L) return;

    const mapContainer = document.getElementById('map-picker');
    if (!mapContainer) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const startLat = locLat || -6.9174;
    const startLng = locLng || 107.6191;

    const map = L.map('map-picker').setView([startLat, startLng], 14);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const latlng = marker.getLatLng();
      setLocLat(Number(latlng.lat.toFixed(6)));
      setLocLng(Number(latlng.lng.toFixed(6)));
    });

    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setLocLat(Number(lat.toFixed(6)));
      setLocLng(Number(lng.toFixed(6)));
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, teamSubTab, editingLocId]);

  // Sync inputs to map marker position
  useEffect(() => {
    if (!leafletLoaded || typeof window === 'undefined' || teamSubTab !== 'settings') return;
    const L = (window as any).L;
    if (!L) return;

    if (mapRef.current && markerRef.current) {
      const currentMarkerLatLng = markerRef.current.getLatLng();
      if (
        Math.abs(currentMarkerLatLng.lat - (locLat || -6.9174)) > 0.0001 ||
        Math.abs(currentMarkerLatLng.lng - (locLng || 107.6191)) > 0.0001
      ) {
        markerRef.current.setLatLng([locLat || -6.9174, locLng || 107.6191]);
        mapRef.current.panTo([locLat || -6.9174, locLng || 107.6191]);
      }
    }
  }, [locLat, locLng]);

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
      showError("Validasi Clock-In", "Alasan terlambat wajib diisi untuk melakukan clock-in.");
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
        showSuccess(
          'Clock-In Berhasil',
          `Clock-in berhasil dicatat (${workMode}) pada pukul ${new Date(json.record.clock_in_at).toLocaleTimeString('id-ID')}. Status: ${isLateToday ? 'TERLAMBAT' : 'TEPAT WAKTU'}`,
          'CREATE'
        );
        setNotes('');
        fetchAttendanceDetails();
      } else {
        showError('Gagal Clock-In', json.error || 'Terjadi kesalahan saat clock-in.');
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
        showSuccess(
          'Clock-Out Berhasil',
          `Clock-out berhasil dicatat pada pukul ${new Date(json.record.clock_out_at).toLocaleTimeString('id-ID')}. Terima kasih atas kerja keras Anda hari ini!`,
          'CREATE'
        );
        fetchAttendanceDetails();
      } else {
        showError('Gagal Clock-Out', json.error || 'Terjadi kesalahan saat clock-out.');
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

        showSuccess('Pengajuan Cuti Terkirim', `Pengajuan cuti (${cutiType}) selama ${totalDays} hari berhasil dikirimkan.`, 'CREATE');
        setIsCutiOpen(false);
        setCutiStart('');
        setCutiEnd('');
        setCutiReason('');
        fetchAttendanceDetails();
      } else {
        showError('Gagal Pengajuan Cuti', json.error);
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

  const handleReviewLeave = async (leaveId: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_leave',
          leave_id: leaveId,
          status,
          review_notes: reviewNotes || (status === 'approved' ? 'Disetujui oleh Atasan' : 'Ditolak oleh Atasan'),
          reviewer_id: user.id
        })
      });
      const json = await res.json();
      if (json.success) {
        // Trigger simulated Slack alert
        const leaveRequest = allLeaves.find(l => l.id === leaveId);
        const employeeName = allUsers.find(u => u.id === leaveRequest?.user_id)?.name || 'Karyawan';
        const message = `Atasan *${user.name}* telah *${status.toUpperCase()}* pengajuan cuti *${leaveRequest?.leave_type}* oleh *${employeeName}*. Catatan: "${reviewNotes || '-'}"`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'hr-notif', message }
        }));
        
        setReviewNotes('');
        fetchAttendanceDetails();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (updatedSettings: any) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_settings',
          ...updatedSettings
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("Pengaturan berhasil disimpan!");
        fetchAttendanceDetails();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLocation = () => {
    const newLoc = {
      id: 'loc-' + Math.random().toString(36).substr(2, 9),
      name: locName || 'Lokasi Baru',
      latitude: Number(locLat),
      longitude: Number(locLng),
      radius_meters: Number(locRadius),
      is_active: true
    };
    const newLocations = [...locations, newLoc];
    setLocations(newLocations);
    handleSaveSettings({ office_locations: newLocations });
    setLocName('');
    setLocLat(0);
    setLocLng(0);
    setLocRadius(100);
  };

  const handleEditLocation = (loc: any) => {
    setEditingLocId(loc.id);
    setLocName(loc.name);
    setLocLat(loc.latitude);
    setLocLng(loc.longitude);
    setLocRadius(loc.radius_meters);
  };

  const handleUpdateLocation = () => {
    const newLocations = locations.map(l => {
      if (l.id === editingLocId) {
        return {
          ...l,
          name: locName,
          latitude: Number(locLat),
          longitude: Number(locLng),
          radius_meters: Number(locRadius)
        };
      }
      return l;
    });
    setLocations(newLocations);
    handleSaveSettings({ office_locations: newLocations });
    setEditingLocId(null);
    setLocName('');
    setLocLat(0);
    setLocLng(0);
    setLocRadius(100);
  };

  const handleDeleteLocation = (id: string) => {
    if (locations.length <= 1) {
      alert("Minimal harus ada satu lokasi absensi.");
      return;
    }
    const newLocations = locations.filter(l => l.id !== id);
    setLocations(newLocations);
    handleSaveSettings({ office_locations: newLocations });
  };

  // Holidays handlers
  const handleAddHoliday = () => {
    const newHol = {
      id: 'hol-' + Math.random().toString(36).substr(2, 9),
      date: holDate,
      name: holName
    };
    const newHols = [...holidaysState, newHol];
    setHolidaysState(newHols);
    handleSaveSettings({ holidays: newHols });
    setHolDate('');
    setHolName('');
  };

  const handleDeleteHoliday = (id: string) => {
    const newHols = holidaysState.filter(h => h.id !== id);
    setHolidaysState(newHols);
    handleSaveSettings({ holidays: newHols });
  };

  // Attendance log CRUD handlers
  const handleSaveAttendanceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const action = editingLogRecord ? 'edit_attendance_log' : 'add_attendance_log';
      
      let parsedClockIn = '';
      let parsedClockOut = '';
      
      if (logClockIn) {
        parsedClockIn = `${logDate}T${logClockIn}:00Z`;
      }
      if (logClockOut) {
        parsedClockOut = `${logDate}T${logClockOut}:00Z`;
      }

      const body: any = {
        action,
        clock_in_at: parsedClockIn,
        clock_out_at: parsedClockOut,
        work_mode: logWorkMode,
        status: logStatus,
        notes: logNotes
      };
      
      if (editingLogRecord) {
        body.id = editingLogRecord.id;
      } else {
        body.user_id = logUserId;
        body.date = logDate;
      }

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        showSuccess(
          editingLogRecord ? 'Log Absensi Diperbarui' : 'Log Absensi Ditambahkan',
          editingLogRecord ? 'Log absensi karyawan berhasil diperbarui!' : 'Log absensi karyawan baru berhasil ditambahkan!',
          editingLogRecord ? 'UPDATE' : 'CREATE'
        );
        setIsLogModalOpen(false);
        setEditingLogRecord(null);
        fetchAttendanceDetails();
      } else {
        showError('Gagal Menyimpan Log', json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttendanceLog = (id: string) => {
    showConfirm(
      'Konfirmasi Hapus Log Absensi',
      'Apakah Anda yakin ingin menghapus log absensi ini?',
      async () => {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_attendance_log',
            id
          })
        });
        const json = await res.json();
        if (json.success) {
          showSuccess('Log Absensi Dihapus', 'Log absensi berhasil dihapus.', 'DELETE');
          fetchAttendanceDetails();
        } else {
          showError('Gagal Hapus', json.error || 'Gagal menghapus log absensi.');
        }
      },
      'DELETE',
      'Hapus Log Absensi'
    );
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
      <div className={`flex flex-col gap-6 w-full ${activeTab === 'team' ? 'max-w-6xl' : 'max-w-2xl'} mx-auto transition-all duration-300`}>
        {/* Mobile Header Title */}
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Presensi Kehadiran</h1>
          <p className="text-gray-500 text-[13px] mt-0.5">Lakukan clock-in dan clock-out harian berbasis verifikasi lokasi GPS.</p>
        </div>

        {/* Tab switcher for Manager & Admin */}
        {['admin', 'manager'].includes(user?.role || '') && (
          <div className="flex border-b border-gray-200/80 gap-2 mb-1 no-print">
            <button
              onClick={() => setActiveTab('personal')}
              className={`pb-2.5 px-3 font-semibold text-[13px] border-b-2 transition-all cursor-pointer ${
                activeTab === 'personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Presensi Saya
            </button>
            <button
              onClick={() => {
                setActiveTab('team');
                if (allUsers.length > 0 && !selectedEmployeeId) {
                  const firstEmp = allUsers.find(u => u.role !== 'admin');
                  if (firstEmp) setSelectedEmployeeId(firstEmp.id);
                }
              }}
              className={`pb-2.5 px-3 font-semibold text-[13px] border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'team' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Dashboard Tim / Approval Cuti
              {allLeaves.filter(l => l.status === 'pending').length > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                  {allLeaves.filter(l => l.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        )}

        {activeTab === 'personal' ? (
          <>
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
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
              <Coffee size={18} className="text-indigo-600" />
              Riwayat Kehadiran Harian
            </h2>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg text-[10px]">
              <button
                type="button"
                onClick={() => setCalendarViewMode('list')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  calendarViewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Daftar
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode('calendar')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  calendarViewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Kalender
              </button>
            </div>
          </div>

          {calendarViewMode === 'list' ? (
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
          ) : (
            <div className="flex flex-col gap-4">
              {/* Calendar Controls */}
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-200/50">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="px-3 py-1.5 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all"
                >
                  &larr; Prev
                </button>
                <span className="font-extrabold text-xs text-gray-800 uppercase tracking-wide">
                  {MONTHS[currentCalendarMonth]} {currentCalendarYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="px-3 py-1.5 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all"
                >
                  Next &rarr;
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                {DAYS.map(day => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, idx) => {
                  const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                  const dayRecord = history.find(h => h.date === day.dateStr);
                  const dayLeave = leaves.find(l => {
                    if (l.status !== 'approved') return false;
                    return day.dateStr >= l.start_date && day.dateStr <= l.end_date;
                  });

                  let cellClass = "h-11 flex flex-col items-center justify-between p-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ";
                  let dotColor = "";
                  let statusLabel = "";

                  if (dayRecord) {
                    if (dayRecord.status === 'present') {
                      cellClass += "bg-green-50 text-green-700 border-green-200 hover:bg-green-100/60";
                      dotColor = "bg-green-500";
                      statusLabel = "Hadir";
                    } else if (dayRecord.status === 'late') {
                      cellClass += "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/60";
                      dotColor = "bg-red-500";
                      statusLabel = "Terlambat";
                    } else {
                      cellClass += "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
                      dotColor = "bg-slate-400";
                      statusLabel = dayRecord.status;
                    }
                  } else if (dayLeave) {
                    cellClass += "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/60";
                    dotColor = "bg-blue-500";
                    statusLabel = dayLeave.leave_type;
                  } else if ((fullSettings?.holidays || []).some((h: any) => h.date === day.dateStr)) {
                    const hol = (fullSettings?.holidays || []).find((h: any) => h.date === day.dateStr);
                    cellClass += "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/60";
                    dotColor = "bg-rose-500";
                    statusLabel = hol ? hol.name : "Libur Nasional";
                  } else {
                    const isPast = new Date(day.dateStr) < new Date(new Date().toISOString().split('T')[0]);
                    const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                    if (isPast) {
                      if (isWeekend) {
                        cellClass += "bg-slate-50/50 border-slate-100 text-slate-300 cursor-default";
                      } else {
                        cellClass += "bg-gray-100 border-gray-200/50 text-gray-400 hover:bg-gray-200/50";
                        dotColor = "bg-gray-400";
                        statusLabel = "Mangkir";
                      }
                    } else {
                      cellClass += "bg-white border-gray-100 text-gray-400 hover:bg-gray-50";
                    }
                  }

                  if (!day.isCurrentMonth) {
                    cellClass += " opacity-25";
                  }

                  if (isToday) {
                    cellClass += " ring-2 ring-indigo-500 ring-offset-1 z-10";
                  }

                  const clockInTime = dayRecord?.clock_in_at 
                    ? new Date(dayRecord.clock_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : null;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (dayRecord || dayLeave || statusLabel === 'Mangkir') {
                          setSelectedDayDetail({
                            dateStr: day.dateStr,
                            record: dayRecord,
                            leave: dayLeave
                          });
                        } else {
                          setSelectedDayDetail(null);
                        }
                      }}
                      className={cellClass}
                    >
                      <div className="flex justify-between items-center w-full px-0.5">
                        <span className="text-[9px] font-bold">{day.date.getDate()}</span>
                        {dotColor && <span className={`w-1 h-1 rounded-full ${dotColor}`}></span>}
                      </div>
                      
                      {clockInTime ? (
                        <span className="text-[8px] font-mono text-gray-500 leading-none">{clockInTime}</span>
                      ) : statusLabel ? (
                        <span className="text-[7px] truncate max-w-full font-bold uppercase tracking-tighter opacity-80 leading-none">{statusLabel.split(' ')[0]}</span>
                      ) : (
                        <span className="h-1.5"></span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Day Detail Card */}
              {selectedDayDetail && (
                <div className="mt-2 p-3.5 border border-indigo-100 rounded-xl bg-indigo-50/20 text-xs text-left relative">
                  <button
                    type="button"
                    onClick={() => setSelectedDayDetail(null)}
                    className="absolute top-2.5 right-2.5 p-1 hover:bg-indigo-100/40 rounded-full text-gray-400"
                  >
                    <X size={14} />
                  </button>
                  <div className="font-extrabold text-gray-800 flex items-center gap-1.5 mb-2.5">
                    <Calendar size={14} className="text-indigo-600" />
                    <span>
                      Detail Tanggal: {new Date(selectedDayDetail.dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {selectedDayDetail.record ? (
                    <div className="grid grid-cols-2 gap-2 mt-1 font-semibold">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Status Kehadiran</span>
                        <span className={`font-bold mt-0.5 ${selectedDayDetail.record.status === 'present' ? 'text-green-600' : 'text-red-500'}`}>
                          {selectedDayDetail.record.status === 'present' ? 'Hadir Tepat Waktu' : 'Terlambat'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Mode Kerja</span>
                        <span className="font-bold text-gray-700 capitalize mt-0.5">{selectedDayDetail.record.work_mode}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Jam Clock-In</span>
                        <span className="font-bold text-gray-700 mt-0.5">
                          {new Date(selectedDayDetail.record.clock_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Jam Clock-Out</span>
                        <span className="font-bold text-gray-700 mt-0.5">
                          {selectedDayDetail.record.clock_out_at 
                            ? `${new Date(selectedDayDetail.record.clock_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` 
                            : 'Belum Clock-Out'}
                        </span>
                      </div>
                      {selectedDayDetail.record.notes && (
                        <div className="col-span-2 flex flex-col border-t border-indigo-100/30 pt-2 mt-1">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Catatan/Alasan</span>
                          <span className="text-gray-600 italic mt-0.5">&quot;{selectedDayDetail.record.notes}&quot;</span>
                        </div>
                      )}
                    </div>
                  ) : selectedDayDetail.leave ? (
                    <div className="flex flex-col gap-1.5 mt-1 font-semibold">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Jenis Cuti / Izin</span>
                          <span className="font-bold text-indigo-700 mt-0.5">{selectedDayDetail.leave.leave_type}</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-[9px] font-black uppercase">APPROVED</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Durasi Pengajuan</span>
                        <span className="font-bold text-gray-700 mt-0.5">
                          {selectedDayDetail.leave.start_date} s/d {selectedDayDetail.leave.end_date} ({selectedDayDetail.leave.total_days} Hari)
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Alasan Pengajuan</span>
                        <span className="text-gray-600 italic mt-0.5">&quot;{selectedDayDetail.leave.reason}&quot;</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col mt-1 font-semibold">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Status Kehadiran</span>
                      <span className="font-bold text-red-600 mt-0.5">Mangkir (Absent)</span>
                      <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed font-normal">Tidak terdeteksi log masuk onsite/wfh dan tidak ada pengajuan cuti/izin yang disetujui pada hari kerja ini.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
      </>
    ) : (
      /* ==================== TAB: TEAM / EMPLOYEES DASHBOARD ==================== */
      <div className="flex flex-col gap-6 w-full text-left">
        {/* Sub-tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-2 self-start font-bold text-xs gap-1 no-print">
          <button
            onClick={() => setTeamSubTab('logs')}
            className={`px-4 py-2 rounded-lg transition-all ${
              teamSubTab === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            📋 Log & Kehadiran Tim
          </button>
          <button
            onClick={() => setTeamSubTab('settings')}
            className={`px-4 py-2 rounded-lg transition-all ${
              teamSubTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            ⚙ Pengaturan Aturan & Lokasi
          </button>
        </div>

        {teamSubTab === 'logs' ? (
          <>
            {/* 1. Today's Team Attendance Recap */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 text-slate-800 flex items-center gap-2">
                <UserCheck size={18} className="text-blue-600" />
                Ringkasan Kehadiran Hari Ini ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center mt-4 font-semibold">
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const todayRecords = allRecords.filter(r => r.date === todayStr);
                  const staffUsers = allUsers.filter(u => u.role !== 'admin');
                  const present = todayRecords.filter(r => r.status === 'present').length;
                  const late = todayRecords.filter(r => r.status === 'late').length;
                  const onLeave = allLeaves.filter(l => l.status === 'approved' && todayStr >= l.start_date && todayStr <= l.end_date).length;
                  const absent = Math.max(0, staffUsers.length - (present + late + onLeave));

                  return (
                    <>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Staf</span>
                        <span className="text-xl font-black text-slate-700">{staffUsers.length}</span>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                        <span className="text-[9px] text-green-500 uppercase tracking-wider block">Hadir</span>
                        <span className="text-xl font-black text-green-700">{present}</span>
                      </div>
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                        <span className="text-[9px] text-red-500 uppercase tracking-wider block">Terlambat</span>
                        <span className="text-xl font-black text-red-700">{late}</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <span className="text-[9px] text-blue-500 uppercase tracking-wider block">Cuti / Izin</span>
                        <span className="text-xl font-black text-blue-700">{onLeave}</span>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <span className="text-[9px] text-amber-500 uppercase tracking-wider block">Belum Absen</span>
                        <span className="text-xl font-black text-amber-700">{absent}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 2. Leave & Excuse Approvals Queue */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 text-slate-800 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Plane size={18} className="text-indigo-600 animate-pulse" />
                  Antrean Persetujuan Cuti & Izin Karyawan
                </span>
                <span className="bg-indigo-50 text-indigo-700 font-black text-[10px] px-2 py-0.5 rounded-full">
                  {allLeaves.filter(l => l.status === 'pending').length} MENUNGGU
                </span>
              </h2>

              <div className="flex flex-col gap-3 mt-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar flex-1">
                {allLeaves.filter(l => l.status === 'pending').length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 italic font-semibold">
                    Tidak ada pengajuan cuti atau izin yang perlu disetujui.
                  </div>
                ) : (
                  allLeaves.filter(l => l.status === 'pending').map((leave) => {
                    const requester = allUsers.find(u => u.id === leave.user_id);
                    return (
                      <div key={leave.id} className="p-4 border border-gray-100 rounded-xl bg-slate-50/50 flex flex-col gap-3 text-xs">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-gray-900 text-sm">
                              {requester?.name || leave.user_id} ({requester?.department} · {requester?.role})
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
                              Tipe: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[9px] text-indigo-600">{leave.leave_type}</code>
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold mt-1">
                              Periode: 📅 {leave.start_date} s/d {leave.end_date} ({leave.total_days} Hari)
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 font-black text-[9px] uppercase tracking-wider rounded">PENDING REVIEW</span>
                        </div>

                        <p className="text-xs text-gray-600 italic bg-white p-3 rounded-lg border border-gray-100/50 leading-relaxed text-left">&quot;{leave.reason}&quot;</p>

                        {leave.attachment_url && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[10px] text-indigo-600 font-extrabold uppercase">Lampiran Bukti:</span>
                            <a href={leave.attachment_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 font-bold">
                              <ImageIcon size={12} /> Lihat Gambar Bukti Lampiran
                            </a>
                          </div>
                        )}

                        {/* Action Inputs */}
                        <div className="flex flex-col sm:flex-row gap-2 border-t border-gray-100/50 pt-3 mt-1">
                          <input 
                            type="text"
                            placeholder="Tuliskan catatan persetujuan / penolakan (Opsional)..."
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
                          />
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleReviewLeave(leave.id, 'approved')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              Setujui (Approve)
                            </button>
                            <button
                              onClick={() => handleReviewLeave(leave.id, 'rejected')}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors"
                            >
                              Tolak (Reject)
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Detailed Employee Attendance Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Employee list selection */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50 border-b border-gray-100 font-extrabold text-xs text-gray-500 uppercase tracking-wider">
                  Daftar Karyawan
                </div>
                <div className="flex flex-col max-h-[380px] overflow-y-auto no-scrollbar">
                  {allUsers.filter(u => u.role !== 'admin').map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setSelectedDayDetail(null);
                      }}
                      className={`p-3.5 border-b border-gray-100 cursor-pointer flex flex-col gap-0.5 text-left transition-all ${
                        selectedEmployeeId === emp.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600 pl-2.5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-bold text-gray-900 text-xs">{emp.name}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{emp.employee_id} · {emp.department} · {emp.role.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee Details Viewer */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-5 min-h-[440px]">
                {(() => {
                  const emp = allUsers.find(u => u.id === selectedEmployeeId);
                  if (!emp) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 italic text-xs py-20 font-semibold">
                        Pilih salah satu karyawan dari daftar untuk melihat log detail absensi.
                      </div>
                    );
                  }

                  const empHistory = allRecords.filter(r => r.user_id === emp.id);
                  const empLeaves = allLeaves.filter(l => l.user_id === emp.id);
                  
                  // Filter for current month (July 2026) vs last month (June 2026)
                  const thisMonthHistory = empHistory.filter(r => r.date.startsWith('2026-07'));
                  const lastMonthHistory = empHistory.filter(r => r.date.startsWith('2026-06'));

                  const calcStats = (recs: any[]) => {
                    const totalJam = recs.reduce((sum, r) => sum + (r.work_hours || 0), 0);
                    const listPresent = recs.filter(r => r.status === 'present');
                    const listLate = recs.filter(r => r.status === 'late');
                    const kesianganCount = listLate.length;
                    const totalLateMinutes = listLate.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
                    const avgJam = recs.length > 0 ? totalJam / recs.length : 0;
                    
                    return {
                      totalJam: Math.round(totalJam * 10) / 10,
                      avgJam: Math.round(avgJam * 10) / 10,
                      kesianganCount,
                      latenessHours: Math.round((totalLateMinutes / 60) * 10) / 10
                    };
                  };

                  const currentStats = calcStats(thisMonthHistory);
                  const historicStats = calcStats(lastMonthHistory);

                  return (
                    <>
                      {/* Employee Meta details */}
                      <div className="flex justify-between items-start border-b border-gray-100 pb-3.5">
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] text-blue-600 font-black tracking-widest uppercase">KARTU PRESENSI KARYAWAN</span>
                          <h3 className="text-base font-extrabold text-gray-950 mt-0.5">{emp.name}</h3>
                          <span className="text-[10px] text-gray-400 font-semibold mt-0.5">{emp.employee_id} · {emp.department} · {emp.role.toUpperCase()}</span>
                        </div>
                        <div className="flex flex-col text-right text-[10px] font-semibold text-gray-400">
                          <span>Sisa Saldo Cuti:</span>
                          <span className="text-slate-800 font-black text-xs">{emp.annual_leave_balance} Hari</span>
                        </div>
                      </div>

                      {/* STATS COMPARISON CARD (THIS MONTH VS LAST MONTH) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        {/* Bulan Ini Card */}
                        <div className="bg-slate-50 border border-gray-200/60 rounded-xl p-4 text-xs">
                          <h4 className="font-extrabold text-indigo-600 border-b border-gray-100 pb-1.5 mb-2.5 uppercase tracking-wide text-[10px]">Bulan Ini (Juli 2026)</h4>
                          <div className="flex flex-col gap-2 font-semibold text-gray-600">
                            <div className="flex justify-between">
                              <span>Total Jam Kerja:</span>
                              <span className="text-slate-900 font-bold">{currentStats.totalJam} Jam</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rata-rata/Hari:</span>
                              <span className="text-slate-900 font-bold">{currentStats.avgJam} Jam</span>
                            </div>
                            <div className="flex justify-between border-t border-dashed border-gray-200 pt-1.5">
                              <span className="text-red-500 font-bold">Kesiangan (Late):</span>
                              <span className="text-red-600 font-extrabold">{currentStats.kesianganCount} Kali</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-500 font-bold">Total Jam Terlambat:</span>
                              <span className="text-red-600 font-extrabold">{currentStats.latenessHours} Jam</span>
                            </div>
                          </div>
                        </div>

                        {/* Bulan Kemarin Card */}
                        <div className="bg-slate-50 border border-gray-200/60 rounded-xl p-4 text-xs">
                          <h4 className="font-extrabold text-gray-500 border-b border-gray-100 pb-1.5 mb-2.5 uppercase tracking-wide text-[10px]">Bulan Kemarin (Juni 2026)</h4>
                          <div className="flex flex-col gap-2 font-semibold text-gray-600">
                            <div className="flex justify-between">
                              <span>Total Jam Kerja:</span>
                              <span className="text-slate-900 font-bold">{historicStats.totalJam} Jam</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rata-rata/Hari:</span>
                              <span className="text-slate-900 font-bold">{historicStats.avgJam} Jam</span>
                            </div>
                            <div className="flex justify-between border-t border-dashed border-gray-200 pt-1.5">
                              <span className="text-gray-500">Kesiangan (Late):</span>
                              <span className="text-slate-950 font-bold">{historicStats.kesianganCount} Kali</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Jam Terlambat:</span>
                              <span className="text-slate-950 font-bold">{historicStats.latenessHours} Jam</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Employee logs list */}
                      <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-center border-b border-gray-150 pb-1.5">
                          <span className="text-[9px] text-gray-400 font-black tracking-widest uppercase text-left">RIWAYAT PRESENSI BULANAN</span>
                          <button
                            onClick={() => {
                              setEditingLogRecord(null);
                              setLogUserId(emp.id);
                              setLogDate(new Date().toISOString().split('T')[0]);
                              setLogClockIn('09:00');
                              setLogClockOut('18:00');
                              setLogStatus('present');
                              setLogWorkMode('onsite');
                              setLogNotes('');
                              setIsLogModalOpen(true);
                            }}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold transition-all"
                          >
                            + Tambah Log Manual
                          </button>
                        </div>
                        <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-1 no-scrollbar text-xs">
                          {empHistory.length === 0 ? (
                            <span className="text-gray-400 italic text-center py-6">Karyawan belum memiliki riwayat presensi harian.</span>
                          ) : (
                            [...empHistory].reverse().map(h => {
                              const inTime = h.clock_in_at ? new Date(h.clock_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';
                              const outTime = h.clock_out_at ? new Date(h.clock_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';
                              return (
                                <div key={h.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 flex justify-between items-center text-left">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-gray-800">
                                      {new Date(h.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-semibold">
                                      <span>Mode: <strong className="text-indigo-600 uppercase">{h.work_mode}</strong></span>
                                      {h.work_hours ? (
                                        <span className="text-indigo-700 bg-indigo-50 px-1 rounded font-black">Jam Kerja: {h.work_hours}j</span>
                                      ) : null}
                                      {h.status === 'late' && h.late_minutes ? (
                                        <span className="text-red-700 bg-red-50 px-1 rounded font-black">Terlambat: {h.late_minutes}m</span>
                                      ) : null}
                                      {h.overtime_hours > 0 && <span className="text-purple-600 bg-purple-50 px-1 rounded font-black">Lembur {h.overtime_hours}j</span>}
                                    </div>
                                    {h.notes && <span className="text-[9px] text-amber-600 font-semibold italic mt-0.5">&quot;{h.notes}&quot;</span>}
                                  </div>
                                  <div className="text-right flex items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                      <span className="font-mono font-bold text-gray-700">{inTime} - {outTime}</span>
                                      <span className={`px-1.5 py-0.5 rounded font-black text-[8px] self-end uppercase ${
                                        h.status === 'present' ? 'bg-green-50 text-green-700' :
                                        h.status === 'late' ? 'bg-red-50 text-red-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {h.status === 'present' ? 'Hadir' : h.status === 'late' ? 'Terlambat' : h.status}
                                      </span>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-1 shrink-0 no-print">
                                      <button
                                        onClick={() => {
                                          setEditingLogRecord(h);
                                          setLogUserId(emp.id);
                                          setLogDate(h.date);
                                          setLogClockIn(h.clock_in_at ? new Date(h.clock_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '');
                                          setLogClockOut(h.clock_out_at ? new Date(h.clock_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '');
                                          setLogStatus(h.status);
                                          setLogWorkMode(h.work_mode);
                                          setLogNotes(h.notes || '');
                                          setIsLogModalOpen(true);
                                        }}
                                        className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold hover:bg-blue-100"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAttendanceLog(h.id)}
                                        className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-bold hover:bg-red-100"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        ) : (
          /* ==================== SUB-TAB: SETTINGS (work hours, geofences, holidays) ==================== */
          <div className="flex flex-col gap-6 w-full font-semibold text-xs text-gray-600 text-left">
            {/* 1. Work hours config */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 text-slate-800 flex items-center gap-2 mb-4">
                📋 Pengaturan Jam Kerja & Toleransi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-extrabold">Jam Masuk (Start)</label>
                  <input
                    type="time"
                    value={whStart}
                    onChange={(e) => setWhStart(e.target.value)}
                    className="px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-extrabold">Jam Keluar (End)</label>
                  <input
                    type="time"
                    value={whEnd}
                    onChange={(e) => setWhEnd(e.target.value)}
                    className="px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-extrabold">Batas Keterlambatan (Menit)</label>
                  <input
                    type="number"
                    value={lateThreshold}
                    onChange={(e) => setLateThreshold(Number(e.target.value))}
                    className="px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>
              <button
                onClick={() => handleSaveSettings({ work_hours_start: whStart, work_hours_end: whEnd, late_threshold_minutes: lateThreshold })}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm"
              >
                Simpan Aturan Jam Kerja
              </button>
            </div>

            {/* 2. Office locations CRUD */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 text-slate-800 flex items-center gap-2 mb-4">
                📍 Pengaturan Lokasi Absensi (Geofencing GPS)
              </h2>
              {/* Location List */}
              <div className="flex flex-col gap-2 mb-4">
                {locations.map((loc) => (
                  <div key={loc.id} className="p-3 border border-gray-150 rounded-xl bg-slate-50 flex justify-between items-center">
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="font-bold text-gray-900 text-xs">{loc.name}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        Koordinat: {loc.latitude}, {loc.longitude} · Radius: {loc.radius_meters} meter
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0 font-bold text-[10px]">
                      <button
                        onClick={() => handleEditLocation(loc)}
                        className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(loc.id)}
                        className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Edit Form */}
              <div className="border-t border-gray-150 pt-4 text-left">
                <h3 className="font-bold text-xs text-gray-800 mb-3">
                  {editingLocId ? 'Edit Lokasi Absensi' : 'Tambah Lokasi Absensi Baru'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Nama Kantor/Lokasi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kantor Cabang Dago"
                      value={locName}
                      onChange={(e) => setLocName(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="-6.9174"
                      value={locLat || ''}
                      onChange={(e) => setLocLat(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="107.6191"
                      value={locLng || ''}
                      onChange={(e) => setLocLng(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Radius Toleransi (Meter)</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={locRadius || ''}
                      onChange={(e) => setLocRadius(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                {/* Leaflet Map Picker */}
                <div className="mt-4">
                  <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider block mb-1">
                    Geser pin merah atau klik pada peta untuk memposisikan koordinat secara akurat:
                  </label>
                  {!leafletLoaded ? (
                    <div className="w-full h-72 rounded-xl border border-gray-200 bg-slate-50 flex items-center justify-center text-xs text-gray-400 font-semibold animate-pulse">
                      Memuat Peta Interaktif Leaflet...
                    </div>
                  ) : null}
                  <div 
                    id="map-picker" 
                    className={`w-full h-72 rounded-xl border border-gray-200 z-10 ${leafletLoaded ? 'block' : 'hidden'}`}
                    style={{ minHeight: '280px' }}
                  ></div>
                </div>

                <div className="flex gap-2 mt-4 font-bold text-xs">
                  {editingLocId ? (
                    <>
                      <button
                        onClick={handleUpdateLocation}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Simpan Perubahan
                      </button>
                      <button
                        onClick={() => {
                          setEditingLocId(null);
                          setLocName('');
                          setLocLat(0);
                          setLocLng(0);
                          setLocRadius(100);
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAddLocation}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      + Tambah Lokasi
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Indonesian Holidays CRUD */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-extrabold text-base border-b border-gray-100 pb-3 text-slate-800 flex items-center gap-2 mb-4">
                🇮🇩 Pengaturan Hari Libur Nasional (Kalender Indonesia)
              </h2>
              {/* Holidays Table */}
              <div className="max-h-60 overflow-y-auto flex flex-col gap-2 mb-4 pr-1 no-scrollbar">
                {holidaysState.length === 0 ? (
                  <span className="text-gray-400 italic text-center py-4">Belum ada hari libur nasional terdaftar.</span>
                ) : (
                  holidaysState.map((hol) => (
                    <div key={hol.id} className="p-3 border border-gray-150 rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                      <div className="flex flex-col gap-0.5 text-left">
                        <span className="font-bold text-gray-900">{hol.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          📅 {new Date(hol.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteHoliday(hol.id)}
                        className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded font-bold text-[10px]"
                      >
                        Hapus
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Holiday Form */}
              <div className="border-t border-gray-150 pt-4 text-left">
                <h3 className="font-bold text-xs text-gray-800 mb-3 font-extrabold">Tambah Hari Libur Baru</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Tanggal Libur</label>
                    <input
                      type="date"
                      value={holDate}
                      onChange={(e) => setHolDate(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none font-semibold text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Nama Hari Libur / Keterangan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Hari Raya Idul Fitri"
                      value={holName}
                      onChange={(e) => setHolName(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddHoliday}
                  disabled={!holDate || !holName}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-bold"
                >
                  + Tambah Hari Libur
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

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
