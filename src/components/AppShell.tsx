"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  Users, 
  CheckSquare, 
  Clock, 
  FileText, 
  Settings, 
  Bell, 
  LogOut, 
  Layers, 
  Terminal,
  Menu,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SlackLog {
  timestamp: string;
  channel: string;
  message: string;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, availableUsers, switchUser, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSlackDrawerOpen, setIsSlackDrawerOpen] = useState(false);
  const [slackLogs, setSlackLogs] = useState<SlackLog[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [settings, setSettings] = useState<any>(null);

  // Load read notification IDs and company settings on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success) setSettings(json.settings);
      })
      .catch(err => console.error(err));

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('domus_read_notifications');
      if (saved) {
        setReadIds(JSON.parse(saved));
      }
    }
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&role=${user.role}`);
      const json = await res.json();
      if (json.success) {
        // Match against readIds from localStorage
        const items = json.notifications.map((notif: any) => ({
          ...notif,
          read: readIds.includes(notif.id)
        }));
        setNotifications(items);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Poll for notifications in real-time
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user, readIds]);

  const markAsRead = (id: string) => {
    const updatedReadIds = [...readIds, id];
    setReadIds(updatedReadIds);
    localStorage.setItem('domus_read_notifications', JSON.stringify(updatedReadIds));
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const updatedReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updatedReadIds);
    localStorage.setItem('domus_read_notifications', JSON.stringify(updatedReadIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setShowNotifications(false);
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setShowNotifications(false);
  };

  const formatTimeAgo = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit yang lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Kemarin';
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  // Subscribe to virtual Slack webhooks event
  useEffect(() => {
    const handleSlackEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SlackLog>;
      setSlackLogs(prev => [customEvent.detail, ...prev].slice(0, 10)); // Keep last 10 logs
      setIsSlackDrawerOpen(true); // Auto expand to notify user
      
      // Instantly refresh when a system webhook triggers
      fetchNotifications();
    };

    window.addEventListener('simulated-slack-webhook', handleSlackEvent);
    return () => {
      window.removeEventListener('simulated-slack-webhook', handleSlackEvent);
    };
  }, [user, readIds]);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'manager', 'staff'] },
    { name: 'CRM Properti', href: '/crm', icon: Users, roles: ['admin', 'manager', 'staff'] },
    { name: 'Manajemen Properti', href: '/properties', icon: Layers, roles: ['admin', 'manager', 'staff'] },
    { name: 'Task Board', href: '/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'staff'] },
    { name: 'Absensi PWA', href: '/absensi', icon: Clock, roles: ['admin', 'manager', 'staff'] },
    { name: 'Dokumen & Approval', href: '/documents', icon: FileText, roles: ['admin', 'manager', 'staff'] },
    { name: 'Backoffice', href: '/backoffice', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || ''));

  const triggerSlackMock = (channel: string, message: string) => {
    const log: SlackLog = {
      timestamp: new Date().toLocaleTimeString('id-ID'),
      channel,
      message
    };
    window.dispatchEvent(new CustomEvent('simulated-slack-webhook', { detail: log }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-b border-gray-200/40 px-4 md:px-8 py-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3 text-left">
          <div className="flex items-center gap-2">
            {settings?.org_logo ? (
              <img src={settings.org_logo} alt="Logo" className="w-8 h-8 object-cover rounded-full border border-gray-150 shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {settings?.org_name ? settings.org_name.charAt(0) : 'D'}
              </div>
            )}
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {settings?.org_name ? settings.org_name.split(' ')[0] : 'Domus'}
              </span>
              <span className="text-gray-500 text-xs ml-1.5 font-medium border border-gray-200 px-2 py-0.5 rounded-full">PWA</span>
            </div>
          </div>
        </div>

        {/* Desktop Navbar */}
        <nav className="hidden md:flex items-center gap-1.5">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Header Operations */}
        <div className="flex items-center gap-4">
          {/* Notifications Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full relative transition-colors"
            >
              <Bell size={20} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white border border-gray-200 rounded-2xl py-2 z-50 shadow-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <span className="font-bold text-xs text-gray-700 tracking-wide uppercase">Notifikasi In-App</span>
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-gray-400">
                      Tidak ada notifikasi aktif saat ini.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <Link 
                        key={notif.id} 
                        href={notif.link || '#'}
                        onClick={() => handleNotificationClick(notif.id)}
                        className={`px-4 py-3 text-left block transition-all duration-200 hover:bg-blue-50/40 ${!notif.read ? 'bg-blue-50/20' : ''}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${!notif.read ? 'text-blue-600' : 'text-gray-400'}`}>
                            {notif.title}
                          </span>
                          <p className={`text-xs text-gray-700 leading-normal ${!notif.read ? 'font-semibold' : ''}`}>
                            {notif.description}
                          </p>
                          <span className="text-[9px] text-gray-400 font-medium mt-1">
                            {formatTimeAgo(notif.time)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {user ? getInitials(user.name) : '..'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="font-semibold text-sm leading-tight">{user?.name || 'Loading...'}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role} · {user?.department}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-72 max-w-[85vw] h-full bg-white/80 backdrop-blur-lg border-r border-gray-200/30 rounded-r-3xl flex flex-col p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-left">
                {settings?.org_logo ? (
                  <img src={settings.org_logo} alt="Logo" className="w-8 h-8 object-cover rounded-full border border-gray-150" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {settings?.org_name ? settings.org_name.charAt(0) : 'D'}
                  </div>
                )}
                <span className="font-bold text-lg">{settings?.org_name || 'Domus Somnia'}</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5 flex-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <button 
              onClick={logout}
              className="mt-auto flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} />
              Keluar Sistem
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 md:px-8 py-6 md:py-8">
        {children}
      </main>

      {/* Persistent Bottom Mobile Nav (floating modern blur dock) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/75 backdrop-blur-lg border border-gray-200/40 flex justify-around py-3 rounded-full px-2">
        {filteredNavItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-bold transition-all duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon size={18} />
              <span className="truncate max-w-[60px]">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* Simulated Slack Webhook Console (Bottom Panel) */}
      <div className="fixed bottom-16 md:bottom-0 left-4 z-40 max-w-sm w-full transition-all duration-300">
        <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-t-xl shadow-2xl overflow-hidden">
          <button 
            onClick={() => setIsSlackDrawerOpen(!isSlackDrawerOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/60 hover:bg-slate-950 text-xs font-bold font-mono border-b border-slate-800 text-teal-400"
          >
            <span className="flex items-center gap-1.5">
              <Terminal size={14} />
              INTEGRASI SLACK LOGS ({slackLogs.length})
            </span>
            {isSlackDrawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          
          {isSlackDrawerOpen && (
            <div className="p-3 max-h-48 overflow-y-auto font-mono text-[10px] leading-relaxed flex flex-col gap-2 no-scrollbar bg-slate-900/95">
              {slackLogs.length === 0 ? (
                <span className="text-slate-500 italic text-center py-2">Listening to outgoing webhooks...</span>
              ) : (
                slackLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-800/80 pb-2 last:border-0">
                    <div className="flex items-center justify-between text-teal-500 mb-0.5">
                      <span>#{log.channel}</span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Role Switcher Widget (Bottom Right) */}
      <div className="fixed bottom-16 md:bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className="relative group">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3.5 py-2 rounded-full transition-all cursor-pointer hover:border-blue-400">
            <Layers size={16} className="text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">MOCK TESTING ROLE</span>
              <span className="text-xs font-bold text-gray-800">{user?.name} ({user?.role})</span>
            </div>
            <ChevronDown size={14} className="text-gray-400 ml-1.5" />
          </div>
          
          {/* Dropdown list */}
          <div className="absolute bottom-full right-0 mb-2.5 w-60 bg-white border border-gray-200 rounded-2xl py-2 invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 transition-all z-[99]">
            <div className="px-4 py-1.5 border-b border-gray-100 font-bold text-xs text-gray-500">
              PILIH ROLE EVALUASI
            </div>
            <div className="flex flex-col max-h-64 overflow-y-auto">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={`px-4 py-2.5 text-left text-xs flex flex-col gap-0.5 hover:bg-blue-50 transition-colors ${
                    user?.id === u.id ? 'bg-blue-50/60 font-semibold text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <span className="font-semibold">{u.name}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">{u.role} · {u.department}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
