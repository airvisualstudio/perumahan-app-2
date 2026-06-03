import { NextResponse } from 'next/server';
import { db, Document, ApprovalChainStep } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');
    const token = searchParams.get('token');
    const data = db.get();

    // Verification portal request
    if (token) {
      const doc = data.documents.find(d => d.doc_token === token);
      if (!doc) {
        return NextResponse.json({ success: false, error: 'Document token not found' }, { status: 404 });
      }
      
      // Mask PII sensitive information for public display
      const publicDoc = {
        doc_type: doc.doc_type,
        doc_number: doc.doc_number,
        status: doc.status,
        created_at: doc.created_at,
        approved_at: doc.approved_at,
        revoked_at: doc.revoked_at,
        revoked_reason: doc.revoked_reason,
        issuer: data.users.find(u => u.id === doc.requester_id)?.name || 'PT Domus Somnia',
        approver_final: doc.approval_chain
          .filter(c => c.status === 'approved')
          .pop()?.decided_by || 'Sistem'
      };
      
      return NextResponse.json({ success: true, document: publicDoc });
    }

    if (docId) {
      const doc = data.documents.find(d => d.id === docId);
      if (!doc) {
        return NextResponse.json({ success: false, error: 'Document not found' }, { status: 444 });
      }
      return NextResponse.json({ success: true, document: doc });
    }

    return NextResponse.json({ success: true, documents: data.documents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, actor_id } = body;
    const data = db.get();

    if (action === 'create_document') {
      const { doc_type, doc_data } = body;
      const count = data.documents.filter(d => d.doc_type === doc_type).length + 1;
      const indexStr = String(count).padStart(4, '0');
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      let doc_number = '';
      if (doc_type === 'Invoice') {
        doc_number = `INV/${year}/${month}/${indexStr}`;
      } else if (doc_type === 'Kwitansi') {
        doc_number = `KWT/${year}/${month}/${indexStr}`;
      } else {
        doc_number = `SRT/${year}/${month}/${indexStr}`;
      }

      // Load approval chain template
      const template = data.approvalTemplates.find(t => t.doc_type === doc_type);
      const chain: ApprovalChainStep[] = template 
        ? template.chain.map(c => ({
            level: c.level,
            role: c.role,
            user_id: c.user_id,
            status: 'pending'
          }))
        : [];

      const newDoc: Document = {
        id: 'doc-' + Math.random().toString(36).substr(2, 9),
        doc_type,
        doc_number,
        doc_token: crypto.randomBytes(16).toString('hex'), // Unique token
        requester_id: actor_id,
        status: 'draft',
        created_at: new Date().toISOString(),
        data: doc_data,
        approval_chain: chain
      };

      data.documents.unshift(newDoc);

      // Record in prospect history if prospect_id exists in data
      if (doc_data.prospect_id) {
        data.prospectHistory.unshift({
          id: 'ph-' + Math.random().toString(36).substr(2, 9),
          prospect_id: doc_data.prospect_id,
          event_type: 'document_created',
          actor_id,
          description: `Dokumen ${doc_type} (${doc_number}) dibuat status: Draft`,
          created_at: new Date().toISOString()
        });
      }

      db.save(data);
      return NextResponse.json({ success: true, document: newDoc });
    }

    if (action === 'submit_for_approval') {
      const { doc_id } = body;
      const doc = data.documents.find(d => d.id === doc_id);
      if (!doc) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 444 });

      doc.status = 'pending_approval';
      db.save(data);

      if (doc.data.prospect_id) {
        data.prospectHistory.unshift({
          id: 'ph-' + Math.random().toString(36).substr(2, 9),
          prospect_id: doc.data.prospect_id,
          event_type: 'approval_requested',
          actor_id,
          description: `Mengajukan approval untuk dokumen ${doc.doc_type} (${doc.doc_number})`,
          created_at: new Date().toISOString()
        });
        db.save(data);
      }

      return NextResponse.json({ success: true, document: doc });
    }

    if (action === 'approve_document') {
      const { doc_id, remarks } = body;
      const doc = data.documents.find(d => d.id === doc_id);
      if (!doc) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 444 });

      const actor = data.users.find(u => u.id === actor_id);
      if (!actor) return NextResponse.json({ success: false, error: 'Actor not found' }, { status: 400 });

      // Find the first pending step in approval chain
      const activeStep = doc.approval_chain.find(c => c.status === 'pending');
      if (!activeStep) {
        return NextResponse.json({ success: false, error: 'No active pending approval step' }, { status: 400 });
      }

      activeStep.status = 'approved';
      activeStep.decided_by = actor.name;
      activeStep.decided_at = new Date().toISOString();
      activeStep.remarks = remarks;

      // Check if all steps are approved
      const hasPending = doc.approval_chain.some(c => c.status === 'pending');
      if (!hasPending) {
        doc.status = 'approved';
        doc.approved_at = new Date().toISOString();

        // Update booking unit to sold if this is approved invoice/kwitansi for a prospect
        if (doc.doc_type === 'Kwitansi' && doc.data.prospect_id) {
          const prospect = data.prospects.find(p => p.id === doc.data.prospect_id);
          if (prospect && prospect.booked_unit_id) {
            const unit = data.units.find(u => u.id === prospect.booked_unit_id);
            if (unit) {
              unit.status = 'sold';
              data.unitHistory.unshift({
                id: 'uh-' + Math.random().toString(36).substr(2, 9),
                unit_id: unit.id,
                old_status: 'booking',
                new_status: 'sold',
                changed_by: actor_id,
                prospect_id: prospect.id,
                notes: 'Kwitansi lunas disetujui, unit resmi terjual.',
                created_at: new Date().toISOString()
              });
            }
          }
        }

        if (doc.data.prospect_id) {
          data.prospectHistory.unshift({
            id: 'ph-' + Math.random().toString(36).substr(2, 9),
            prospect_id: doc.data.prospect_id,
            event_type: 'document_approved',
            actor_id,
            description: `Dokumen ${doc.doc_type} (${doc.doc_number}) disetujui sepenuhnya!`,
            created_at: new Date().toISOString()
          });
        }
      }

      db.save(data);
      return NextResponse.json({ success: true, document: doc });
    }

    if (action === 'reject_document') {
      const { doc_id, remarks } = body;
      const doc = data.documents.find(d => d.id === doc_id);
      if (!doc) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 444 });

      const actor = data.users.find(u => u.id === actor_id);
      if (!actor) return NextResponse.json({ success: false, error: 'Actor not found' }, { status: 400 });

      const activeStep = doc.approval_chain.find(c => c.status === 'pending');
      if (activeStep) {
        activeStep.status = 'rejected';
        activeStep.decided_by = actor.name;
        activeStep.decided_at = new Date().toISOString();
        activeStep.remarks = remarks;
      }

      doc.status = 'rejected';
      
      if (doc.data.prospect_id) {
        data.prospectHistory.unshift({
          id: 'ph-' + Math.random().toString(36).substr(2, 9),
          prospect_id: doc.data.prospect_id,
          event_type: 'approval_decided',
          actor_id,
          description: `Dokumen ${doc.doc_type} (${doc.doc_number}) ditolak oleh ${actor.name}. Catatan: ${remarks}`,
          created_at: new Date().toISOString()
        });
      }

      db.save(data);
      return NextResponse.json({ success: true, document: doc });
    }

    if (action === 'revoke_document') {
      const { doc_id, reason } = body;
      const doc = data.documents.find(d => d.id === doc_id);
      if (!doc) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 444 });

      const actor = data.users.find(u => u.id === actor_id);
      if (!actor) return NextResponse.json({ success: false, error: 'Actor not found' }, { status: 400 });

      doc.status = 'revoked';
      doc.revoked_reason = reason;
      doc.revoked_at = new Date().toISOString();
      doc.revoked_by = actor.name;

      db.save(data);
      return NextResponse.json({ success: true, document: doc });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
