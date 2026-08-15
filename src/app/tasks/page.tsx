"use client";

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import HeroSelect from '@/components/HeroSelect';
import { useAuth } from '@/context/AuthContext';
import { useCrudModal } from '@/context/CrudModalContext';
import { 
  CheckSquare, 
  Plus, 
  MessageSquare, 
  Clock, 
  User as UserIcon, 
  Check, 
  Trash2, 
  AlertCircle,
  X
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee_id: string;
  created_by: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'done';
  due_date?: string;
  comments: { id: string; user_id: string; content: string; created_at: string }[];
  created_at: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  department: string;
}

const statusConfig = {
  open: { label: 'To Do', border: 'border-blue-400', text: 'text-blue-700', bg: 'bg-blue-50/50' },
  in_progress: { label: 'In Progress', border: 'border-orange-400', text: 'text-orange-700', bg: 'bg-orange-50/50' },
  done: { label: 'Done / Completed', border: 'border-green-400', text: 'text-green-700', bg: 'bg-green-50/50' }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  high: { label: 'High Priority', color: 'bg-rose-100 text-rose-700 border-rose-200' }
};

export default function TaskBoardPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useCrudModal();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Create Task states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDue, setNewDue] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');

  const fetchTasksData = async () => {
    try {
      const res = await fetch('/api/tasks');
      const json = await res.json();
      if (json.success) {
        setTasks(json.tasks || []);
        setUsers(json.users || []);
        if (json.users && json.users.length > 0 && !newAssignee) {
          setNewAssignee(json.users[0].id);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_task',
          title: newTitle,
          description: newDesc,
          assignee_id: newAssignee,
          priority: newPriority,
          due_date: newDue || undefined,
          actor_id: user?.id
        })
      });
      const json = await res.json();
      if (json.success) {
        // Trigger simulated Slack alert
        const assignedUser = users.find(u => u.id === newAssignee);
        const message = `Task baru dibuat: *${newTitle}* (Priority: ${newPriority}) ditugaskan ke *${assignedUser?.name}* oleh ${user?.name}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'task-notif', message }
        }));

        showSuccess('Tugas Berhasil Dibuat', `Tugas baru "${newTitle}" berhasil dibuat dan ditugaskan!`, 'CREATE');
        setIsAddOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewDue('');
        fetchTasksData();
      } else {
        showError('Gagal Membuat Tugas', json.error || 'Gagal membuat tugas.');
      }
    } catch (err: any) {
      showError('Gagal Membuat Tugas', err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleUpdateStatus = async (taskId: string, status: 'open' | 'in_progress' | 'done') => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_task_status',
          task_id: taskId,
          new_status: status,
          actor_id: user?.id
        })
      });
      const json = await res.json();
      if (json.success) {
        // Slack trigger
        const task = tasks.find(t => t.id === taskId);
        const message = `Task *"${task?.title}"* status dipindahkan menjadi *${status.toUpperCase()}* oleh ${user?.name}`;
        window.dispatchEvent(new CustomEvent('simulated-slack-webhook', {
          detail: { timestamp: new Date().toLocaleTimeString('id-ID'), channel: 'task-notif', message }
        }));
        
        showSuccess('Status Tugas Diperbarui', `Status tugas "${task?.title || ''}" telah diubah menjadi ${status.toUpperCase()}.`, 'UPDATE');
        fetchTasksData();
        // If selected task is currently being viewed, update details in selected state
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, status } : null);
        }
      } else {
        showError('Gagal Update Status', json.error || 'Gagal mengubah status tugas.');
      }
    } catch (err: any) {
      showError('Gagal Update Status', err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_comment',
          task_id: selectedTask.id,
          content: commentText,
          actor_id: user?.id
        })
      });
      const json = await res.json();
      if (json.success) {
        setCommentText('');
        fetchTasksData();
        
        // Refresh selectedTask comments instantly in UI
        const refreshedComments = [...selectedTask.comments, {
          id: json.comment.id,
          user_id: user?.id || 'sistem',
          content: commentText,
          created_at: new Date().toISOString()
        }];
        setSelectedTask(prev => prev ? { ...prev, comments: refreshedComments } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="w-full animate-pulse gap-6 flex flex-col">
          <div className="h-10 bg-gray-200 rounded-lg w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Task & Operasional Board</h1>
            <p className="text-gray-500 text-sm mt-1">Koordinasi kerja, tiket operasional unit, dan penugasan follow-up lapangan sales.</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg font-bold text-xs transition-all cursor-pointer"
          >
            <Plus size={16} />
            TAMBAH TASK
          </button>
        </div>

        {/* Kanban Board columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['open', 'in_progress', 'done'] as const).map((colStatus) => {
            const config = statusConfig[colStatus];
            const columnTasks = tasks.filter(t => t.status === colStatus);

            return (
              <div 
                key={colStatus} 
                className="bg-gray-100/70 border border-gray-200/50 rounded-2xl p-4 flex flex-col gap-4 max-h-[75vh]"
              >
                {/* Column Header */}
                <div className={`border-b-2 pb-2 flex justify-between items-center px-1 font-bold text-xs ${config.text}`}>
                  <span>{config.label}</span>
                  <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black">{columnTasks.length}</span>
                </div>

                {/* Tasks List */}
                <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar flex-1">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-gray-400 italic">Kolom Kosong</div>
                  ) : (
                    columnTasks.map((task) => {
                      const assignee = users.find(u => u.id === task.assignee_id);
                      const priority = priorityConfig[task.priority];

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 cursor-pointer hover:-translate-y-0.5 premium-card text-left"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold text-sm text-gray-900 leading-snug line-clamp-2">{task.title}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${priority.color}`}>
                              {priority.label}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-gray-500 font-semibold line-clamp-2">{task.description}</p>
                          )}

                          <div className="flex justify-between items-center border-t border-gray-50 pt-2.5 mt-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                              <UserIcon size={12} />
                              <span className="truncate max-w-[80px]">{assignee?.name || 'Unassigned'}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                <MessageSquare size={12} />
                                {task.comments.length}
                              </span>

                              {task.due_date && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                  <Clock size={12} />
                                  {task.due_date}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick action stage transitions directly on card */}
                          <div className="flex gap-1.5 border-t border-gray-50 pt-2 mt-0.5" onClick={e => e.stopPropagation()}>
                            {colStatus !== 'open' && (
                              <button 
                                onClick={() => handleUpdateStatus(task.id, 'open')}
                                className="flex-1 py-1 text-[9px] font-bold text-gray-500 hover:bg-gray-100 rounded border border-gray-100 transition-colors"
                              >
                                To Do
                              </button>
                            )}
                            {colStatus !== 'in_progress' && (
                              <button 
                                onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                                className="flex-1 py-1 text-[9px] font-bold text-orange-600 hover:bg-orange-50 rounded border border-orange-100 transition-colors"
                              >
                                In Progress
                              </button>
                            )}
                            {colStatus !== 'done' && (
                              <button 
                                onClick={() => handleUpdateStatus(task.id, 'done')}
                                className="flex-1 py-1 text-[9px] font-bold text-green-600 hover:bg-green-50 rounded border border-green-100 transition-colors"
                              >
                                Done
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL: ADD TASK */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <CheckSquare size={20} className="text-blue-600" />
                  Buat Task Baru
                </h3>
                <button 
                  onClick={() => setIsAddOpen(false)} 
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 text-xs font-bold"
                >
                  BATAL
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="flex flex-col gap-4 text-xs font-semibold">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Judul Tugas / Tiket *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan ringkasan tugas..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Deskripsi Detail (Opsional)</label>
                  <textarea
                    placeholder="Masukkan detail instruksi tugas..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none font-medium"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <HeroSelect
                    label="ASSIGNEE (PENUGASAN)"
                    value={newAssignee}
                    onChange={(val) => setNewAssignee(val)}
                    options={users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))}
                  />

                  <HeroSelect
                    label="PRIORITAS"
                    value={newPriority}
                    onChange={(val) => setNewPriority(val as any)}
                    options={[
                      { value: 'low', label: 'Rendah (Low)' },
                      { value: 'medium', label: 'Sedang (Medium)' },
                      { value: 'high', label: 'Tinggi (High)' }
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase tracking-wider text-[10px]">Tenggat Waktu (Due Date)</label>
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check size={16} />
                  BUAT TIKET TUGAS
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DRAWER / DETAILS MODAL: TASK DETAIL & COMMENTS */}
        {selectedTask && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-lg text-gray-900">{selectedTask.title}</h3>
                <button 
                  onClick={() => setSelectedTask(null)} 
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 text-xs font-bold"
                >
                  TUTUP
                </button>
              </div>

              {/* Task meta info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-200/50 p-4 rounded-xl text-xs font-semibold text-gray-700">
                <div>
                  <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">Status:</span>
                  <span className="block capitalize font-extrabold text-gray-800">{selectedTask.status.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">Tenggat Waktu:</span>
                  <span className="block font-bold text-gray-800">{selectedTask.due_date || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">Assignee:</span>
                  <span className="block font-bold text-gray-800">
                    {users.find(u => u.id === selectedTask.assignee_id)?.name || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">Prioritas:</span>
                  <span className="block font-extrabold text-rose-600 capitalize">{selectedTask.priority}</span>
                </div>
              </div>

              {selectedTask.description && (
                <div className="flex flex-col gap-1 bg-white border border-gray-100 p-4 rounded-xl text-xs">
                  <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider mb-1">Deskripsi Tugas</span>
                  <p className="text-gray-600 font-medium whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}

              {/* Comments Section */}
              <div className="flex flex-col gap-4 border-t border-gray-100 pt-4 text-xs font-semibold">
                <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">Diskusi & Komentar ({selectedTask.comments.length})</span>
                
                <div className="flex flex-col gap-3.5 max-h-40 overflow-y-auto no-scrollbar">
                  {selectedTask.comments.length === 0 ? (
                    <span className="text-gray-400 text-center py-4 italic font-medium">Belum ada komentar</span>
                  ) : (
                    selectedTask.comments.map((com) => {
                      const comUser = users.find(u => u.id === com.user_id);
                      return (
                        <div key={com.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col gap-1 text-left">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-gray-800">{comUser?.name || 'Staff'} ({comUser?.role})</span>
                            <span className="text-gray-400">{new Date(com.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
                          <p className="text-gray-600 font-medium italic mt-0.5">&quot;{com.content}&quot;</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Tuliskan komentar atau update progress..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors text-xs flex items-center justify-center"
                  >
                    KIRIM
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
