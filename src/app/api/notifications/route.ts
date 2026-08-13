import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json({ success: false, error: 'userId and role are required' }, { status: 400 });
    }

    const data = db.get() || {};
    const notifications = [];

    // Helper: Map user ID to user Name
    const getUserName = (id: string) => {
      const emp = (data.employees || []).find(e => e.user_id === id);
      return emp ? emp.name : id;
    };

    // 1. DOCUMENTS IN NEED OF APPROVAL
    const pendingDocs = (data.documents || []).filter(d => d.status === 'pending_approval');
    for (const doc of pendingDocs) {
      const activeStep = (doc.approval_chain || []).find(c => c.status === 'pending');
      if (activeStep) {
        let canApprove = false;
        
        if (role === 'admin') {
          canApprove = true; // Admin can approve anything
        } else if (activeStep.role === 'Staff Pemasaran' && role === 'staff' && (data.employees || []).find(e => e.user_id === userId)?.department === 'Pemasaran') {
          canApprove = true;
        } else if (activeStep.role === 'Manager Pemasaran' && role === 'manager' && (data.employees || []).find(e => e.user_id === userId)?.department === 'Pemasaran') {
          canApprove = true;
        } else if (activeStep.role === 'Keuangan' && (data.employees || []).find(e => e.user_id === userId)?.department === 'Keuangan') {
          canApprove = true;
        } else if (activeStep.role === role || activeStep.user_id === userId) {
          canApprove = true;
        }
        
        if (canApprove) {
          notifications.push({
            id: `doc-approval-${doc.id}-${activeStep.level}`,
            title: `Persetujuan Dokumen (${doc.doc_type})`,
            description: `Dokumen ${doc.doc_number} membutuhkan persetujuan Anda (Level ${activeStep.level}).`,
            time: doc.created_at || new Date().toISOString(),
            type: 'document',
            link: '/documents'
          });
        }
      }
    }

    // 2. DOCUMENT STATUS UPDATES FOR REQUESTERS
    const finishedDocs = (data.documents || []).filter(d => d.requester_id === userId && ['approved', 'rejected'].includes(d.status));
    for (const doc of finishedDocs) {
      const lastApproverStep = [...(doc.approval_chain || [])].reverse().find(c => c.status === 'approved' || c.status === 'rejected');
      const decider = lastApproverStep?.decided_by || 'Sistem';
      const statusIndo = doc.status === 'approved' ? 'DISETUJUI' : 'DITOLAK';
      const notesStr = lastApproverStep?.remarks ? ` Catatan: "${lastApproverStep.remarks}"` : '';

      notifications.push({
        id: `doc-status-${doc.id}-${doc.status}`,
        title: `Dokumen Anda ${statusIndo}`,
        description: `Dokumen ${doc.doc_number} telah ${doc.status} oleh ${decider}.${notesStr}`,
        time: doc.approved_at || lastApproverStep?.decided_at || doc.created_at || new Date().toISOString(),
        type: 'document',
        link: '/documents'
      });
    }

    // 3. TASKS ASSIGNED TO USER
    const userTasks = (data.tasks || []).filter(t => t.assignee_id === userId && t.status !== 'done');
    for (const task of userTasks) {
      notifications.push({
        id: `task-assigned-${task.id}`,
        title: `Tugas Baru Ditugaskan`,
        description: `Tugas: "${task.title}" (Prioritas: ${(task.priority || '').toUpperCase()}).`,
        time: task.updated_at || task.created_at || new Date().toISOString(),
        type: 'task',
        link: '/tasks'
      });
    }

    // 4. LEAVE REQUESTS PENDING (For manager / admin to review)
    if (['admin', 'manager'].includes(role)) {
      const pendingLeaves = (data.leaves || []).filter(l => l.status === 'pending');
      for (const leave of pendingLeaves) {
        const requesterName = getUserName(leave.user_id);
        notifications.push({
          id: `leave-pending-${leave.id}`,
          title: `Pengajuan Cuti Baru`,
          description: `${requesterName} mengajukan ${leave.leave_type} selama ${leave.total_days} hari.`,
          time: leave.created_at || new Date().toISOString(),
          type: 'leave',
          link: '/absensi'
        });
      }
    }

    // 5. LEAVE REQUESTS STATUS FOR EMPLOYEES
    const userLeaves = (data.leaves || []).filter(l => l.user_id === userId && ['approved', 'rejected'].includes(l.status));
    for (const leave of userLeaves) {
      const reviewerName = leave.reviewed_by ? getUserName(leave.reviewed_by) : 'Atasan';
      const statusIndo = leave.status === 'approved' ? 'DISETUJUI' : 'DITOLAK';
      const notesStr = leave.review_notes ? ` Catatan: "${leave.review_notes}"` : '';

      notifications.push({
        id: `leave-status-${leave.id}-${leave.status}`,
        title: `Pengajuan Cuti ${statusIndo}`,
        description: `Pengajuan ${leave.leave_type} Anda telah ${leave.status} oleh ${reviewerName}.${notesStr}`,
        time: leave.reviewed_at || leave.created_at || new Date().toISOString(),
        type: 'leave',
        link: '/absensi'
      });
    }

    // Sort by time (newest first)
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
