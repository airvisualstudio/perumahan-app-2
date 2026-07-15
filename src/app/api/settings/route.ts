import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const data = db.get();
    let updated = false;

    // Automatic migration/fallbacks for preexisting databases
    if (!data.settings.org_address) {
      data.settings.org_address = 'Grand Surapati Core Blok B-03, Jl. Phh. Mustofa No.39, Bandung';
      updated = true;
    }
    if (!data.settings.org_email) {
      data.settings.org_email = 'info@domus.com';
      updated = true;
    }
    if (!data.settings.org_phone) {
      data.settings.org_phone = '(022) 1234567';
      updated = true;
    }
    if (!data.settings.org_bank_account) {
      data.settings.org_bank_account = '131-00-1234567-8 a/n PT Domus Somnia Properti';
      updated = true;
    }

    if (updated) {
      db.save(data);
    }

    return NextResponse.json({ success: true, settings: data.settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, actor_id, org_name, org_logo, org_address, org_email, org_phone, org_bank_account } = body;
    const data = db.get();

    if (action === 'save_company_settings') {
      if (org_name !== undefined) data.settings.org_name = org_name;
      if (org_logo !== undefined) data.settings.org_logo = org_logo;
      if (org_address !== undefined) data.settings.org_address = org_address;
      if (org_email !== undefined) data.settings.org_email = org_email;
      if (org_phone !== undefined) data.settings.org_phone = org_phone;
      if (org_bank_account !== undefined) data.settings.org_bank_account = org_bank_account;

      // Add audit log
      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id || 'usr-admin',
        action: 'system.update_company_settings',
        entity_type: 'settings',
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, settings: data.settings });
    }

    if (action === 'update_user_access') {
      const { target_user_id, accessible_clusters, role, department } = body;
      const userIndex = data.users.findIndex((u: any) => u.id === target_user_id);
      if (userIndex === -1) {
        return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
      }

      if (accessible_clusters !== undefined) {
        data.users[userIndex].accessible_clusters = accessible_clusters;
      }
      if (role !== undefined) {
        data.users[userIndex].role = role;
      }
      if (department !== undefined) {
        data.users[userIndex].department = department;
      }

      // Add audit log
      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id || 'usr-admin',
        action: 'user.update_access',
        entity_type: 'user',
        entity_id: target_user_id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
