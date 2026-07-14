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

    // Protect Property CRUD actions - only Admin or Manager role allowed
    const propertyCrudActions = [
      'create_cluster', 'update_cluster', 'delete_cluster',
      'create_unit_type', 'update_unit_type', 'delete_unit_type',
      'create_unit', 'update_unit', 'delete_unit'
    ];
    if (propertyCrudActions.includes(action)) {
      const { actor_id } = body;
      const actor = data.users.find(u => u.id === actor_id);
      const isAllowed = actor?.role === 'admin' || actor?.role === 'manager';
      if (!isAllowed) {
        return NextResponse.json({ 
          success: false, 
          error: 'Akses ditolak. Hanya Admin atau Manager yang dapat mengelola properti perumahan.' 
        }, { status: 403 });
      }
    }

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

      const prospect = data.prospects.find(p => p.id === followup.prospect_id);
      if (!prospect) {
        return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 444 });
      }

      const canComment = actor.role === 'manager' || actor.role === 'admin' || prospect.assigned_to === actor.id;
      if (!canComment) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
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

    if (action === 'create_cluster') {
      const { name, location, description, status, svg_content, logo_url, address, email, phone, bank_account, documents, actor_id } = body;
      
      const newCluster = {
        id: 'cls-' + Math.random().toString(36).substr(2, 9),
        name,
        location,
        description,
        total_units: 0,
        status: status || 'active',
        svg_content,
        logo_url: logo_url || '',
        address: address || '',
        email: email || '',
        phone: phone || '',
        bank_account: bank_account || '',
        documents: documents || [],
        created_by: actor_id,
        created_at: new Date().toISOString()
      };

      data.clusters.push(newCluster);

      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        action: 'cluster.create',
        entity_type: 'cluster',
        entity_id: newCluster.id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, cluster: newCluster, clusters: data.clusters });
    }

    if (action === 'create_unit_type') {
      const { cluster_id, name, building_area, land_area, base_price, bedrooms, bathrooms, has_carport, description, photos, actor_id } = body;
      
      const newType = {
        id: 'typ-' + Math.random().toString(36).substr(2, 9),
        cluster_id,
        name,
        building_area: Number(building_area),
        land_area: Number(land_area),
        base_price: Number(base_price),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        has_carport: Boolean(has_carport),
        description,
        photos: photos || ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=400'],
      };

      if (!data.unitTypes) {
        data.unitTypes = [];
      }
      data.unitTypes.push(newType);

      db.save(data);
      return NextResponse.json({ success: true, unitType: newType, unitTypes: data.unitTypes });
    }

    if (action === 'create_unit') {
      const { cluster_id, unit_type_id, block_number, sell_price, orientation, status, notes, construction_status, legal_status, pbb_status, pbb_nop, pbb_owner_name, land_documents, tax_documents, actor_id } = body;
      
      const newUnit = {
        id: 'unt-' + Math.random().toString(36).substr(2, 9),
        cluster_id,
        unit_type_id,
        block_number,
        sell_price: Number(sell_price),
        orientation: orientation || 'middle',
        status: status || 'available',
        notes,
        construction_status: construction_status || 'belum_terbangun',
        legal_status: legal_status || 'shm',
        pbb_status: pbb_status || 'not_registered',
        pbb_nop: pbb_nop || '',
        pbb_owner_name: pbb_owner_name || '',
        land_documents: land_documents || [],
        tax_documents: tax_documents || [],
        updated_at: new Date().toISOString()
      };

      data.units.push(newUnit);

      // Increment cluster unit count
      const cluster = data.clusters.find(c => c.id === cluster_id);
      if (cluster) {
        cluster.total_units = (cluster.total_units || 0) + 1;
      }

      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        action: 'unit.create',
        entity_type: 'unit',
        entity_id: newUnit.id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, unit: newUnit, units: data.units, clusters: data.clusters });
    }

    if (action === 'update_cluster') {
      const { cluster_id, name, location, description, status, svg_content, logo_url, address, email, phone, bank_account, documents, actor_id } = body;
      const cluster = data.clusters.find(c => c.id === cluster_id);
      if (!cluster) {
        return NextResponse.json({ success: false, error: 'Cluster not found' }, { status: 444 });
      }

      cluster.name = name;
      cluster.location = location;
      cluster.description = description;
      cluster.status = status;
      if (svg_content !== undefined) {
        cluster.svg_content = svg_content;
      }
      if (logo_url !== undefined) {
        cluster.logo_url = logo_url;
      }
      if (address !== undefined) {
        cluster.address = address;
      }
      if (email !== undefined) {
        cluster.email = email;
      }
      if (phone !== undefined) {
        cluster.phone = phone;
      }
      if (bank_account !== undefined) {
        cluster.bank_account = bank_account;
      }
      if (documents !== undefined) {
        cluster.documents = documents;
      }

      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        action: 'cluster.update',
        entity_type: 'cluster',
        entity_id: cluster_id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, cluster, clusters: data.clusters });
    }

    if (action === 'delete_cluster') {
      const { cluster_id, actor_id } = body;
      
      data.clusters = data.clusters.filter(c => c.id !== cluster_id);
      data.unitTypes = data.unitTypes.filter(t => t.cluster_id !== cluster_id);
      data.units = data.units.filter(u => u.cluster_id !== cluster_id);

      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        action: 'cluster.delete',
        entity_type: 'cluster',
        entity_id: cluster_id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, clusters: data.clusters, unitTypes: data.unitTypes, units: data.units });
    }

    if (action === 'update_unit_type') {
      const { unit_type_id, name, building_area, land_area, base_price, bedrooms, bathrooms, has_carport, description, actor_id } = body;
      const type = data.unitTypes.find(t => t.id === unit_type_id);
      if (!type) {
        return NextResponse.json({ success: false, error: 'Unit type not found' }, { status: 444 });
      }

      type.name = name;
      type.building_area = Number(building_area);
      type.land_area = Number(land_area);
      type.base_price = Number(base_price);
      type.bedrooms = Number(bedrooms);
      type.bathrooms = Number(bathrooms);
      type.has_carport = Boolean(has_carport);
      type.description = description;

      db.save(data);
      return NextResponse.json({ success: true, unitType: type, unitTypes: data.unitTypes });
    }

    if (action === 'delete_unit_type') {
      const { unit_type_id, actor_id } = body;
      
      data.units = data.units.filter(u => u.unit_type_id !== unit_type_id);
      data.unitTypes = data.unitTypes.filter(t => t.id !== unit_type_id);

      db.save(data);
      return NextResponse.json({ success: true, unitTypes: data.unitTypes, units: data.units });
    }

    if (action === 'update_unit') {
      const { unit_id, unit_type_id, block_number, sell_price, orientation, status, notes, construction_status, legal_status, pbb_status, pbb_nop, pbb_owner_name, land_documents, tax_documents, actor_id } = body;
      const unit = data.units.find(u => u.id === unit_id);
      if (!unit) {
        return NextResponse.json({ success: false, error: 'Unit not found' }, { status: 444 });
      }

      unit.unit_type_id = unit_type_id;
      unit.block_number = block_number;
      unit.sell_price = Number(sell_price);
      unit.orientation = orientation;
      unit.status = status;
      unit.notes = notes;
      unit.construction_status = construction_status;
      unit.legal_status = legal_status;
      unit.pbb_status = pbb_status;
      unit.pbb_nop = pbb_nop;
      unit.pbb_owner_name = pbb_owner_name;
      if (land_documents !== undefined) {
        unit.land_documents = land_documents;
      }
      if (tax_documents !== undefined) {
        unit.tax_documents = tax_documents;
      }
      unit.updated_at = new Date().toISOString();

      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        action: 'unit.update',
        entity_type: 'unit',
        entity_id: unit_id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, unit, units: data.units });
    }

    if (action === 'delete_unit') {
      const { unit_id, actor_id } = body;
      
      const unit = data.units.find(u => u.id === unit_id);
      if (unit) {
        const cluster = data.clusters.find(c => c.id === unit.cluster_id);
        if (cluster) {
          cluster.total_units = Math.max(0, (cluster.total_units || 1) - 1);
        }
      }

      data.units = data.units.filter(u => u.id !== unit_id);

      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        action: 'unit.delete',
        entity_type: 'unit',
        entity_id: unit_id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, units: data.units, clusters: data.clusters });
    }

    if (action === 'update_prospect') {
      const { prospect_id, full_name, phone, email, occupation, company_name, estimated_income, notes, actor_id } = body;
      const prospect = data.prospects.find(p => p.id === prospect_id);
      if (!prospect) {
        return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 444 });
      }

      prospect.full_name = full_name;
      prospect.phone = phone;
      prospect.email = email;
      prospect.occupation = occupation;
      prospect.company_name = company_name;
      prospect.estimated_income = estimated_income ? Number(estimated_income) : undefined;
      prospect.notes = notes;
      prospect.updated_at = new Date().toISOString();

      data.prospectHistory.unshift({
        id: 'ph-' + Math.random().toString(36).substr(2, 9),
        prospect_id,
        event_type: 'prospect_updated',
        actor_id,
        description: `Data prospek diperbarui oleh sales agent`,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, prospect, prospects: data.prospects });
    }

    if (action === 'delete_prospect') {
      const { prospect_id, actor_id } = body;
      data.prospects = data.prospects.filter(p => p.id !== prospect_id);
      data.prospectHistory = data.prospectHistory.filter(ph => ph.prospect_id !== prospect_id);
      data.followups = data.followups.filter(f => f.prospect_id !== prospect_id);

      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        action: 'prospect.delete',
        entity_type: 'prospect',
        entity_id: prospect_id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, prospects: data.prospects });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
