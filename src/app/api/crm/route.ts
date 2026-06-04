import { NextResponse } from 'next/server';
import { db, Prospect, FollowupRecord, ProspectHistory, PropertyUnit, UnitStatusHistory } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const data = db.get();
    return NextResponse.json({ 
      success: true, 
      clusters: data.clusters,
      unitTypes: data.unitTypes,
      units: data.units,
      prospects: data.prospects
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const data = db.get();

    if (action === 'create_prospect') {
      const { full_name, phone, email, occupation, company_name, estimated_income, lead_source, referral_name, interested_cluster_id, interested_type_id, notes, actor_id } = body;
      
      const newProspect: Prospect = {
        id: 'pr-' + Math.random().toString(36).substr(2, 9),
        full_name,
        phone,
        email,
        occupation,
        company_name,
        estimated_income: estimated_income ? Number(estimated_income) : undefined,
        lead_source,
        referral_name,
        pipeline_stage: 'prospect_baru',
        assigned_to: 'usr-sales', // Default assign to Rina
        interested_cluster_id,
        interested_type_id,
        tags: [],
        notes,
        created_by: actor_id,
        created_at: new Date().toISOString()
      };

      const historyLog: ProspectHistory = {
        id: 'ph-' + Math.random().toString(36).substr(2, 9),
        prospect_id: newProspect.id,
        event_type: 'prospect_created',
        actor_id,
        description: `Prospek baru dibuat oleh sales agent · Sumber: ${lead_source}`,
        created_at: new Date().toISOString()
      };

      data.prospects.unshift(newProspect);
      data.prospectHistory.unshift(historyLog);
      
      // Log audit
      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        action: 'prospect.create',
        entity_type: 'prospect',
        entity_id: newProspect.id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, prospect: newProspect });
    }

    if (action === 'update_prospect_stage') {
      const { prospect_id, new_stage, actor_id } = body;
      const prospect = data.prospects.find(p => p.id === prospect_id);
      if (!prospect) {
        return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 444 });
      }

      const oldStage = prospect.pipeline_stage;
      prospect.pipeline_stage = new_stage;
      prospect.updated_at = new Date().toISOString();

      // Log prospect stage changes history
      const historyLog: ProspectHistory = {
        id: 'ph-' + Math.random().toString(36).substr(2, 9),
        prospect_id,
        event_type: 'stage_changed',
        actor_id,
        metadata: { from: oldStage, to: new_stage },
        description: `Stage pipeline berubah: ${oldStage} ➔ ${new_stage}`,
        created_at: new Date().toISOString()
      };

      data.prospectHistory.unshift(historyLog);
      
      // If stage is 'akad', verify units or update unit booking state if needed
      db.save(data);
      return NextResponse.json({ success: true, prospect });
    }

    if (action === 'add_followup') {
      const { prospect_id, followup_type, notes, prospect_response, next_followup_at, next_followup_note, attachments, actor_id } = body;
      const prospect = data.prospects.find(p => p.id === prospect_id);
      if (!prospect) {
        return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 444 });
      }

      const newFollowup: FollowupRecord = {
        id: 'fl-' + Math.random().toString(36).substr(2, 9),
        prospect_id,
        conducted_by: actor_id,
        followup_type,
        followup_at: new Date().toISOString(),
        notes,
        prospect_response,
        next_followup_at,
        next_followup_note,
        attachments: attachments || [],
        created_at: new Date().toISOString()
      };

      prospect.last_followup_at = newFollowup.created_at;
      
      const historyLog: ProspectHistory = {
        id: 'ph-' + Math.random().toString(36).substr(2, 9),
        prospect_id,
        event_type: 'followup_added',
        actor_id,
        description: `Follow-up ditambahkan: ${followup_type} · Respon: ${prospect_response}`,
        created_at: new Date().toISOString()
      };

      data.followups.unshift(newFollowup);
      data.prospectHistory.unshift(historyLog);
      db.save(data);
      return NextResponse.json({ success: true, followup: newFollowup });
    }

    if (action === 'update_unit_status') {
      const { unit_id, new_status, prospect_id, notes, actor_id } = body;
      const unit = data.units.find(u => u.id === unit_id);
      if (!unit) {
        return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 444 });
      }

      const oldStatus = unit.status;
      unit.status = new_status;
      unit.updated_at = new Date().toISOString();
      if (prospect_id) {
        unit.reserved_for = prospect_id;
      } else {
        unit.reserved_for = undefined;
      }

      const unitHistoryItem: UnitStatusHistory = {
        id: 'uh-' + Math.random().toString(36).substr(2, 9),
        unit_id,
        old_status: oldStatus,
        new_status,
        changed_by: actor_id,
        prospect_id,
        notes,
        created_at: new Date().toISOString()
      };

      data.unitHistory.unshift(unitHistoryItem);

      // If there's an associated prospect, record in prospect history as well
      if (prospect_id) {
        const pHistory: ProspectHistory = {
          id: 'ph-' + Math.random().toString(36).substr(2, 9),
          prospect_id,
          event_type: new_status === 'available' ? 'unit_released' : new_status === 'booking' ? 'unit_booked' : 'unit_reserved',
          actor_id,
          metadata: { unit_id },
          description: `Kavling Blok ${unit.block_number} status berubah menjadi: ${new_status}`,
          created_at: new Date().toISOString()
        };
        data.prospectHistory.unshift(pHistory);
      }

      db.save(data);
      return NextResponse.json({ success: true, unit });
    }

    if (action === 'add_prospect_attachment') {
      const { prospect_id, attachment, actor_id } = body;
      const prospect = data.prospects.find(p => p.id === prospect_id);
      if (!prospect) {
        return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 444 });
      }

      if (!prospect.attachments) {
        prospect.attachments = [];
      }

      const newAttachment = {
        id: 'att-' + Math.random().toString(36).substr(2, 9),
        url: attachment.url,
        file_name: attachment.file_name,
        file_size_bytes: attachment.file_size_bytes
      };

      prospect.attachments.push(newAttachment);

      data.prospectHistory.unshift({
        id: 'ph-' + Math.random().toString(36).substr(2, 9),
        prospect_id,
        event_type: 'attachment_added',
        actor_id,
        description: `Mengunggah berkas dokumen: ${attachment.file_name}`,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, prospect });
    }

    if (action === 'add_followup_comment') {
      const { followup_id, content, actor_id } = body;
      const followup = data.followups.find(f => f.id === followup_id);
      if (!followup) {
        return NextResponse.json({ success: false, error: 'Followup not found' }, { status: 444 });
      }

      const actor = data.users.find(u => u.id === actor_id);
      if (!actor) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 444 });
      }

      if (!followup.comments) {
        followup.comments = [];
      }

      const newComment = {
        id: 'cm-' + Math.random().toString(36).substr(2, 9),
        user_id: actor.id,
        user_name: actor.name,
        user_role: actor.role,
        content,
        created_at: new Date().toISOString()
      };

      followup.comments.push(newComment);

      data.prospectHistory.unshift({
        id: 'ph-' + Math.random().toString(36).substr(2, 9),
        prospect_id: followup.prospect_id,
        event_type: 'followup_comment_added',
        actor_id,
        description: `${actor.name} (${actor.role}) mengomentari follow-up: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, followup });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
