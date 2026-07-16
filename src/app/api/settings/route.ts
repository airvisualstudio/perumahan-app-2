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
      const { target_user_id, accessible_clusters, role, department, name, employee_id, annual_leave_balance } = body;
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

      // Sync employee details if linked
      if (!data.employees) data.employees = [];
      const employeeIndex = data.employees.findIndex((e: any) => e.user_id === target_user_id);
      if (employeeIndex !== -1) {
        if (department !== undefined) data.employees[employeeIndex].department = department;
        if (name !== undefined) data.employees[employeeIndex].name = name;
        if (employee_id !== undefined) data.employees[employeeIndex].employee_id = employee_id;
        if (annual_leave_balance !== undefined) data.employees[employeeIndex].annual_leave_balance = Number(annual_leave_balance);
      } else {
        data.employees.push({
          id: 'emp-' + target_user_id.split('-')[1],
          user_id: target_user_id,
          name: name || 'Staff Domus',
          department: department || 'Umum',
          employee_id: employee_id || ('EMP-' + Math.random().toString().substr(2, 6)),
          join_date: new Date().toISOString().split('T')[0],
          annual_leave_balance: annual_leave_balance !== undefined ? Number(annual_leave_balance) : 12,
          is_active: true,
          created_at: new Date().toISOString()
        });
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

    if (action === 'update_employee') {
      const { id, name, department, employee_id, annual_leave_balance, is_active } = body;
      if (!data.employees) data.employees = [];
      const employeeIndex = data.employees.findIndex((e: any) => e.id === id);
      if (employeeIndex === -1) {
        return NextResponse.json({ success: false, error: 'Karyawan tidak ditemukan' }, { status: 404 });
      }

      if (name !== undefined) data.employees[employeeIndex].name = name;
      if (department !== undefined) data.employees[employeeIndex].department = department;
      if (employee_id !== undefined) data.employees[employeeIndex].employee_id = employee_id;
      if (annual_leave_balance !== undefined) data.employees[employeeIndex].annual_leave_balance = Number(annual_leave_balance);
      if (is_active !== undefined) data.employees[employeeIndex].is_active = is_active;

      // Add audit log
      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id || 'usr-admin',
        action: 'employee.update',
        entity_type: 'employee',
        entity_id: id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true });
    }

    if (action === 'create_employee') {
      const { name, department, employee_id, annual_leave_balance } = body;
      if (!data.employees) data.employees = [];

      const newEmpId = 'emp-' + Math.random().toString(36).substr(2, 9);
      data.employees.push({
        id: newEmpId,
        name: name || 'Karyawan Baru',
        department: department || 'Umum',
        employee_id: employee_id || ('EMP-' + Math.random().toString().substr(2, 6)),
        join_date: new Date().toISOString().split('T')[0],
        annual_leave_balance: annual_leave_balance !== undefined ? Number(annual_leave_balance) : 12,
        is_active: true,
        created_at: new Date().toISOString()
      });

      // Add audit log
      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id || 'usr-admin',
        action: 'employee.create',
        entity_type: 'employee',
        entity_id: newEmpId,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true });
    }

    if (action === 'create_user_for_employee') {
      const { employee_id, email, password, role } = body;
      if (!data.employees) data.employees = [];
      const employeeIndex = data.employees.findIndex((e: any) => e.id === employee_id);
      if (employeeIndex === -1) {
        return NextResponse.json({ success: false, error: 'Karyawan tidak ditemukan' }, { status: 404 });
      }

      const existingUser = data.users.find((u: any) => u.email === email);
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 400 });
      }

      const newUserId = 'usr-' + Math.random().toString(36).substr(2, 9);
      data.users.push({
        id: newUserId,
        email: email,
        role: role || 'staff',
        is_active: true,
        created_at: new Date().toISOString()
      });

      data.employees[employeeIndex].user_id = newUserId;

      // Add audit log
      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id || 'usr-admin',
        action: 'user.create_for_employee',
        entity_type: 'user',
        entity_id: newUserId,
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
