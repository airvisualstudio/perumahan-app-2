import { NextResponse } from 'next/server';
import { db, AttendanceRecord, LeaveRequest } from '@/lib/db';

// Haversine formula to calculate distance in meters between two coordinates
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
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
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const data = db.get();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const todayDateStr = new Date().toISOString().split('T')[0];
    const todayRecord = data.attendance.find(a => a.user_id === userId && a.date === todayDateStr);
    const personalHistory = data.attendance.filter(a => a.user_id === userId);
    const personalLeaves = data.leaves.filter(l => l.user_id === userId);
    
    // For manager/admin roles: return all leave requests and today attendance summary
    const allLeaves = data.leaves;
    const allRecords = data.attendance;
    const officeSettings = data.settings.office_locations[0];

    return NextResponse.json({
      success: true,
      todayRecord: todayRecord || null,
      personalHistory,
      personalLeaves,
      allLeaves,
      allRecords,
      officeSettings
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, latitude, longitude, workMode, isOffline, notes, actor_id } = body;
    const data = db.get();
    const todayDateStr = new Date().toISOString().split('T')[0];

    if (action === 'clock_in') {
      // Check if already clock-in today
      const existing = data.attendance.find(a => a.user_id === userId && a.date === todayDateStr);
      if (existing && existing.clock_in_at) {
        return NextResponse.json({ success: false, error: 'Sudah melakukan Clock-In hari ini.' }, { status: 400 });
      }

      const office = data.settings.office_locations[0];
      const distance = getDistanceMeters(latitude, longitude, office.latitude, office.longitude);
      const isWithinRadius = distance <= office.radius_meters;

      if (workMode === 'onsite' && !isWithinRadius) {
        return NextResponse.json({ 
          success: false, 
          error: `Di luar radius kantor. Jarak Anda: ${Math.round(distance)}m (Maks: ${office.radius_meters}m). Silakan gunakan mode WFH jika dizinkan.` 
        }, { status: 400 });
      }

      // Check if late (default start is 09:00)
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const isLate = workMode === 'onsite' && (currentHours > 9 || (currentHours === 9 && currentMinutes > data.settings.late_threshold_minutes));

      const recordStatus = isLate ? 'late' : 'present';

      const newRecord: AttendanceRecord = {
        id: 'att-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        date: todayDateStr,
        clock_in_at: new Date().toISOString(),
        clock_in_lat: latitude,
        clock_in_lng: longitude,
        office_id: office.id,
        status: recordStatus,
        work_mode: workMode || 'onsite',
        is_offline_sync: !!isOffline,
        notes
      };

      data.attendance.push(newRecord);
      
      // Audit log
      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        action: 'attendance.clock_in',
        entity_type: 'attendance',
        entity_id: newRecord.id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, record: newRecord, distance: Math.round(distance) });
    }

    if (action === 'clock_out') {
      const record = data.attendance.find(a => a.user_id === userId && a.date === todayDateStr);
      if (!record) {
        return NextResponse.json({ success: false, error: 'Belum melakukan Clock-In hari ini.' }, { status: 400 });
      }

      record.clock_out_at = new Date().toISOString();
      record.clock_out_lat = latitude;
      record.clock_out_lng = longitude;

      db.save(data);
      return NextResponse.json({ success: true, record });
    }

    if (action === 'apply_leave') {
      const { leave_type, start_date, end_date, total_days, reason } = body;
      const user = data.users.find(u => u.id === userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 400 });
      }

      if (leave_type === 'Cuti Tahunan' && user.annual_leave_balance < total_days) {
        return NextResponse.json({ success: false, error: `Saldo cuti tahunan tidak mencukupi (Sisa: ${user.annual_leave_balance} hari).` }, { status: 400 });
      }

      const newRequest: LeaveRequest = {
        id: 'lv-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        leave_type,
        start_date,
        end_date,
        total_days: Number(total_days),
        reason,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      data.leaves.unshift(newRequest);
      db.save(data);
      return NextResponse.json({ success: true, leave: newRequest });
    }

    if (action === 'review_leave') {
      const { leave_id, status, review_notes, reviewer_id } = body;
      const request = data.leaves.find(l => l.id === leave_id);
      if (!request) {
        return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 444 });
      }

      request.status = status;
      request.reviewed_by = reviewer_id;
      request.reviewed_at = new Date().toISOString();
      request.review_notes = review_notes;

      // If approved and is cuti tahunan, reduce balance
      if (status === 'approved' && request.leave_type === 'Cuti Tahunan') {
        const user = data.users.find(u => u.id === request.user_id);
        if (user) {
          user.annual_leave_balance = Math.max(0, user.annual_leave_balance - request.total_days);
        }
      }

      db.save(data);
      return NextResponse.json({ success: true, leave: request });
    }

    if (action === 'sync_offline') {
      const { records } = body;
      if (!records || !Array.isArray(records)) {
        return NextResponse.json({ success: false, error: 'Records array is required' }, { status: 400 });
      }

      let syncCount = 0;
      records.forEach((rec: any) => {
        const hasExisting = data.attendance.some(a => a.user_id === rec.user_id && a.date === rec.date);
        if (!hasExisting) {
          data.attendance.push({
            id: 'att-' + Math.random().toString(36).substr(2, 9),
            user_id: rec.user_id,
            date: rec.date,
            clock_in_at: rec.clock_in_at,
            clock_out_at: rec.clock_out_at,
            clock_in_lat: rec.clock_in_lat,
            clock_in_lng: rec.clock_in_lng,
            status: rec.status || 'present',
            work_mode: rec.work_mode || 'onsite',
            is_offline_sync: true,
            notes: rec.notes
          });
          syncCount++;
        }
      });

      if (syncCount > 0) {
        db.save(data);
      }
      return NextResponse.json({ success: true, syncedCount: syncCount });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
