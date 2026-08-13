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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
      
      const savedSidebar = localStorage.getItem('domus_sidebar_collapsed');
      if (savedSidebar) {
        setIsSidebarCollapsed(JSON.parse(savedSidebar));
      }
    }
  }, []);

  const toggleSidebar = () => {
    const nextVal = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('domus_sidebar_collapsed', JSON.stringify(nextVal));
    }
  };

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

  // Subscribe to virtual Slack & Telegram webhooks event
  useEffect(() => {
    const handleSlackEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SlackLog>;
      setSlackLogs(prev => [customEvent.detail, ...prev].slice(0, 10)); // Keep last 10 logs
      setIsSlackDrawerOpen(true); // Auto expand to notify user
      
      // Dispatch real-time log to Telegram Bot API
      if (customEvent.detail?.message) {
        fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_log',
            message: customEvent.detail.message,
            channel: customEvent.detail.channel
          })
        }).catch(err => console.error('Telegram dispatch error:', err));
      }

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

  const getPageTitle = () => {
    const activeItem = navItems.find(item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
    return activeItem ? activeItem.name : 'Platform Developer';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc] text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200/70 h-full flex-shrink-0 z-30 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-64 lg:w-68'
      }`}>
        {/* Sidebar Header - Logo Brand */}
        <div className={`flex items-center px-4 py-4.5 border-b border-slate-100 flex-shrink-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between gap-3'
        }`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-purple-200">
                X
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base text-slate-900 tracking-tight truncate">
                  {settings?.org_name || 'SalesX'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-purple-200">
              X
            </div>
          )}

          {/* Minimize/Maximize button */}
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
            title={isSidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Search Bar (SalesX Style) */}
        {!isSidebarCollapsed && (
          <div className="px-3.5 pt-4 pb-2">
            <div className="relative flex items-center bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-slate-400 group focus-within:border-purple-500 focus-within:bg-white transition-all">
              <span className="mr-2 text-slate-400"><Search size={15} /></span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
              />
              <div className="flex items-center gap-0.5 text-[9px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-xs">
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          </div>
        )}

        {/* Menu Section Header */}
        {!isSidebarCollapsed && (
          <div className="px-4 pt-3 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Menu</span>
          </div>
        )}

        {/* Sidebar Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1 no-scrollbar">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center rounded-xl text-[13px] font-medium transition-all group ${
                  isSidebarCollapsed ? 'justify-center p-2.5 mx-0.5' : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive 
                    ? 'bg-purple-50 text-purple-700 font-semibold shadow-xs shadow-purple-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <Icon size={17} className={isActive ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-600'} />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Menu Items (Settings & Help) */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0 space-y-1 bg-white">
          <Link
            href="/backoffice"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-all ${
              isSidebarCollapsed ? 'justify-center p-2' : ''
            }`}
          >
            <Settings size={16} className="text-slate-400" />
            {!isSidebarCollapsed && <span>Settings</span>}
          </Link>

          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-1' : 'justify-between px-3 py-2'} border-t border-slate-100 mt-2 pt-2`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user ? getInitials(user.name) : '..'}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-semibold text-xs truncate text-slate-800">{user?.name || 'User'}</span>
                  <span className="text-[10px] text-slate-400 truncate capitalize">{user?.role}</span>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button 
                onClick={logout}
                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Keluar"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#f8f9fc]">
        {/* Header - Desktop & Mobile */}
        <header className="sticky top-0 z-20 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-8 py-3.5 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg md:hidden transition-colors cursor-pointer"
            >
              <Menu size={18} />
            </button>

            {/* Desktop Page Title */}
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Header Operations (SalesX Style Header Icons) */}
          <div className="flex items-center gap-2">
            {/* Search Button (Mobile) */}
            <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl md:hidden">
              <Search size={18} />
            </button>

            {/* Notifications Bell Trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200/70 relative transition-colors cursor-pointer bg-white"
              >
                <Bell size={17} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-76 bg-white border border-slate-200 rounded-2xl py-2 z-50 shadow-xl overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="font-bold text-[10px] text-slate-500 tracking-wider uppercase">Notifikasi In-App</span>
                    {notifications.some(n => !n.read) && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] text-purple-600 hover:underline font-semibold cursor-pointer"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">
                        Tidak ada notifikasi aktif.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <Link 
                          key={notif.id} 
                          href={notif.link || '#'}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`px-3.5 py-2.5 text-left block transition-all duration-150 hover:bg-purple-50/30 ${notif.read ? '' : 'bg-purple-50/20'}`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${notif.read ? 'text-slate-400' : 'text-purple-600'}`}>
                              {notif.title}
                            </span>
                            <p className={`text-[12px] text-slate-700 leading-snug ${notif.read ? '' : 'font-medium'}`}>
                              {notif.description}
                            </p>
                            <span className="text-[9px] text-slate-400 font-medium mt-0.5">
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

            {/* SalesX Avatar Profile Button */}
            <div className="flex items-center gap-2 border border-slate-200/70 p-1 pl-1.5 pr-2.5 rounded-full bg-white hover:border-slate-300 transition-all cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                {user ? getInitials(user.name) : 'U'}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 w-full overflow-y-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-68 max-w-[85vw] h-full bg-white flex flex-col p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2 text-left">
                {settings?.org_logo ? (
                  <img src={settings.org_logo} alt="Logo" className="w-7 h-7 object-cover rounded-full border border-gray-150 shadow-xs" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base">
                    {settings?.org_name ? settings.org_name.charAt(0) : 'D'}
                  </div>
                )}
                <span className="font-bold text-base bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {settings?.org_name || 'Domus Somnia'}
                </span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 font-semibold' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <button 
              onClick={logout}
              className="mt-auto flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 cursor-pointer"
            >
              <LogOut size={16} />
              Keluar Sistem
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Mobile Nav (floating modern blur dock) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/85 backdrop-blur-md border border-gray-200/50 flex justify-around py-2 rounded-full px-2 shadow-sm">
        {filteredNavItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-1 py-0.5 text-[9px] font-semibold transition-all duration-150 ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              <span className="truncate max-w-[55px]">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* Simulated Slack Webhook Console (Bottom Left Compact Panel) */}
      <div className="fixed bottom-14 md:bottom-2 left-3 z-40 max-w-[280px] w-full transition-all duration-200">
        <div className="bg-slate-900/90 backdrop-blur-xs border border-slate-800 text-slate-200 rounded-lg shadow-lg overflow-hidden">
          <button 
            onClick={() => setIsSlackDrawerOpen(!isSlackDrawerOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-950/80 hover:bg-slate-950 text-[10px] font-semibold font-mono text-teal-400 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Terminal size={12} />
              SLACK LOGS ({slackLogs.length})
            </span>
            {isSlackDrawerOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
          
          {isSlackDrawerOpen && (
            <div className="p-2.5 max-h-40 overflow-y-auto font-mono text-[9px] leading-relaxed flex flex-col gap-1.5 no-scrollbar bg-slate-900/95">
              {slackLogs.length === 0 ? (
                <span className="text-slate-500 italic text-center py-1">Listening webhooks...</span>
              ) : (
                slackLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-800/80 pb-1.5 last:border-0">
                    <div className="flex items-center justify-between text-teal-400 mb-0.5">
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

      {/* Floating Role Switcher Widget (Bottom Right Compact Pill) */}
      <div className="fixed bottom-14 md:bottom-3 right-3 z-50 flex flex-col items-end gap-1.5">
        <div className="relative group">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-gray-200/80 px-3 py-1.5 rounded-full transition-all cursor-pointer hover:border-blue-300 shadow-xs hover:shadow-sm">
            <Layers size={14} className="text-blue-600 animate-spin" style={{ animationDuration: '8s' }} />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider leading-none">ROLE</span>
              <span className="text-[11px] font-semibold text-gray-800 leading-tight">{user?.name} ({user?.role})</span>
            </div>
            <ChevronDown size={12} className="text-gray-400 ml-1" />
          </div>
          
          {/* Dropdown list */}
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-gray-200 rounded-xl py-1.5 invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 transition-all z-[99] shadow-md">
            <div className="px-3 py-1 border-b border-gray-100 font-bold text-[10px] text-gray-400 uppercase tracking-wider">
              Pilih Role Testing
            </div>
            <div className="flex flex-col max-h-56 overflow-y-auto">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={`px-3 py-2 text-left text-[11px] flex flex-col gap-0.5 hover:bg-blue-50 transition-colors cursor-pointer ${
                    user?.id === u.id ? 'bg-blue-50/70 font-semibold text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <span className="font-medium">{u.name}</span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider">{u.role} · {u.department}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
