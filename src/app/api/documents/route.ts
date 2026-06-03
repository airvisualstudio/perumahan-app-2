import { NextResponse } from 'next/server';
import { db, Document, ApprovalChainStep, DocumentTemplate, DocumentTemplateBlock } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');
    const token = searchParams.get('token');
    const templates = searchParams.get('templates');
    const data = db.get();

    // Return all document templates
    if (templates === '1') {
      // Ensure backwards-compat: if documentTemplates doesn't exist yet, return empty
      return NextResponse.json({ success: true, templates: data.documentTemplates || [] });
    }

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

    // Ensure documentTemplates array exists (backwards compat for existing db.json)
    if (!data.documentTemplates) {
      data.documentTemplates = [];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATE MANAGEMENT ACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    if (action === 'save_template') {
      const { template } = body as { template: DocumentTemplate };

      if (!template.name || !template.doc_type_key || !template.prefix) {
        return NextResponse.json({ success: false, error: 'name, doc_type_key, and prefix are required' }, { status: 400 });
      }

      const existing = data.documentTemplates.findIndex(t => t.id === template.id);
      if (existing >= 0) {
        // Update existing
        data.documentTemplates[existing] = {
          ...data.documentTemplates[existing],
          ...template,
          updated_at: new Date().toISOString()
        };
      } else {
        // Create new
        const newTemplate: DocumentTemplate = {
          ...template,
          id: template.id || ('tpl-' + Math.random().toString(36).substr(2, 9)),
          is_builtin: false,
          created_by: actor_id || 'usr-admin',
          created_at: new Date().toISOString()
        };
        data.documentTemplates.unshift(newTemplate);
      }

      // Log audit
      data.auditLogs.unshift({
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id || 'usr-admin',
        action: 'template.save',
        entity_type: 'document_template',
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, templates: data.documentTemplates });
    }

    if (action === 'delete_template') {
      const { template_id } = body;
      const tpl = data.documentTemplates.find(t => t.id === template_id);
      if (!tpl) return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      if (tpl.is_builtin) return NextResponse.json({ success: false, error: 'Built-in templates cannot be deleted' }, { status: 403 });

      data.documentTemplates = data.documentTemplates.filter(t => t.id !== template_id);

      data.auditLogs.unshift({
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id || 'usr-admin',
        action: 'template.delete',
        entity_type: 'document_template',
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, templates: data.documentTemplates });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOCUMENT CREATION
    // ─────────────────────────────────────────────────────────────────────────

    if (action === 'create_document') {
      const { doc_type, doc_data, template_id } = body;

      // Resolve prefix: use template prefix if available, otherwise legacy fallback
      let prefix = 'DOC';
      const resolvedTemplate = data.documentTemplates.find(t => t.id === template_id || t.doc_type_key === doc_type);
      if (resolvedTemplate) {
        prefix = resolvedTemplate.prefix;
      } else if (doc_type === 'Invoice') {
        prefix = 'INV';
      } else if (doc_type === 'Kwitansi') {
        prefix = 'KWT';
      } else if (doc_type === 'Surat') {
        prefix = 'SRT';
      }

      const count = data.documents.filter(d => d.doc_type === doc_type).length + 1;
      const indexStr = String(count).padStart(4, '0');
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const doc_number = `${prefix}/${year}/${month}/${indexStr}`;

      // Load approval chain: from template or legacy approval template
      let chain: ApprovalChainStep[] = [];
      if (resolvedTemplate && resolvedTemplate.approval_chain_roles.length > 0) {
        chain = resolvedTemplate.approval_chain_roles.map((role, idx) => ({
          level: idx + 1,
          role,
          status: 'pending' as const
        }));
      } else {
        const template = data.approvalTemplates.find(t => t.doc_type === doc_type);
        chain = template
          ? template.chain.map(c => ({
              level: c.level,
              role: c.role,
              user_id: c.user_id,
              status: 'pending' as const
            }))
          : [];
      }

      const newDoc: Document = {
        id: 'doc-' + Math.random().toString(36).substr(2, 9),
        doc_type,
        doc_number,
        doc_token: crypto.randomBytes(16).toString('hex'),
        requester_id: actor_id,
        status: 'draft',
        created_at: new Date().toISOString(),
        data: doc_data,
        approval_chain: chain,
        template_id: resolvedTemplate?.id
      };

      data.documents.unshift(newDoc);

      // Record in prospect history if prospect_id exists
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

      const activeStep = doc.approval_chain.find(c => c.status === 'pending');
      if (!activeStep) {
        return NextResponse.json({ success: false, error: 'No active pending approval step' }, { status: 400 });
      }

      activeStep.status = 'approved';
      activeStep.decided_by = actor.name;
      activeStep.decided_at = new Date().toISOString();
      activeStep.remarks = remarks;

      const hasPending = doc.approval_chain.some(c => c.status === 'pending');
      if (!hasPending) {
        doc.status = 'approved';
        doc.approved_at = new Date().toISOString();

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

