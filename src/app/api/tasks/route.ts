import { NextResponse } from 'next/server';
import { db, Task } from '@/lib/db';

export async function GET() {
  try {
    const data = db.get();
    return NextResponse.json({ success: true, tasks: data.tasks, users: data.users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const data = db.get();

    if (action === 'create_task') {
      const { title, description, assignee_id, priority, due_date, actor_id } = body;
      const newTask: Task = {
        id: 'tsk-' + Math.random().toString(36).substr(2, 9),
        title,
        description,
        assignee_id,
        created_by: actor_id,
        priority: priority || 'medium',
        status: 'open',
        due_date,
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      data.tasks.unshift(newTask);
      
      // Audit log
      data.auditLogs.unshift({
        id: 'aud-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        action: 'task.create',
        entity_type: 'task',
        entity_id: newTask.id,
        created_at: new Date().toISOString()
      });

      db.save(data);
      return NextResponse.json({ success: true, task: newTask });
    }

    if (action === 'update_task_status') {
      const { task_id, new_status, actor_id } = body;
      const task = data.tasks.find(t => t.id === task_id);
      if (!task) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 444 });
      }

      task.status = new_status;
      task.updated_at = new Date().toISOString();
      db.save(data);
      return NextResponse.json({ success: true, task });
    }

    if (action === 'add_comment') {
      const { task_id, content, actor_id } = body;
      const task = data.tasks.find(t => t.id === task_id);
      if (!task) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 444 });
      }

      const comment = {
        id: 'com-' + Math.random().toString(36).substr(2, 9),
        user_id: actor_id,
        content,
        created_at: new Date().toISOString()
      };

      task.comments.push(comment);
      task.updated_at = new Date().toISOString();
      db.save(data);
      return NextResponse.json({ success: true, comment });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
