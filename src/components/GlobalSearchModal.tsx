"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Building2, 
  Home as HomeIcon, 
  User, 
  X, 
  ChevronRight, 
  Command, 
  Loader2,
  ArrowRight,
  Filter
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  type: 'company' | 'cluster' | 'prospect';
  badge: string;
  title: string;
  subtitle: string;
  details?: string;
  href: string;
}

interface SearchResults {
  companies: SearchResultItem[];
  clusters: SearchResultItem[];
  prospects: SearchResultItem[];
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryTab = 'all' | 'cluster' | 'company' | 'prospect';

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    companies: [],
    clusters: [],
    prospects: []
  });
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto focus on open & fetch initial data
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      fetchSearchResults(query);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search on query change
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchSearchResults(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const fetchSearchResults = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.results) {
          setResults(json.results);
          setSelectedIndex(0);
        }
      }
    } catch (err) {
      console.error("Global search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on activeTab
  const getFilteredItems = (): SearchResultItem[] => {
    if (activeTab === 'cluster') return results.clusters;
    if (activeTab === 'company') return results.companies;
    if (activeTab === 'prospect') return results.prospects;
    return [...results.clusters, ...results.companies, ...results.prospects];
  };

  const allFilteredItems = getFilteredItems();

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (allFilteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allFilteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allFilteredItems.length) % allFilteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allFilteredItems[selectedIndex];
      if (selected) {
        handleNavigate(selected.href);
      }
    }
  };

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const getIconForType = (type: 'company' | 'cluster' | 'prospect') => {
    switch (type) {
      case 'company':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'cluster':
        return <HomeIcon className="w-4 h-4 text-indigo-600" />;
      case 'prospect':
        return <User className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getBadgeStyle = (type: 'company' | 'cluster' | 'prospect') => {
    switch (type) {
      case 'company':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'cluster':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'prospect':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  if (!isOpen) return null;

  const totalCount = results.clusters.length + results.companies.length + results.prospects.length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[85vh] transition-all duration-200 scale-100"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 bg-white">
          <Search className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari nama perumahan, nama PT, atau nama konsumen..."
            className="w-full text-sm sm:text-base text-slate-800 placeholder-slate-400 bg-transparent outline-none font-medium"
          />
          {query ? (
            <button 
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors mr-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md mr-1">
              <span>ESC</span>
            </div>
          )}
          {loading && (
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin ml-1 flex-shrink-0" />
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50/70 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('all'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-xs shadow-purple-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span>Semua</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'all' ? 'bg-purple-500/80 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('cluster'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'cluster'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <HomeIcon size={13} />
            <span>Perumahan</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'cluster' ? 'bg-indigo-500/80 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {results.clusters.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('company'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'company'
                ? 'bg-purple-600 text-white shadow-xs shadow-purple-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Building2 size={13} />
            <span>Nama PT</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'company' ? 'bg-purple-500/80 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {results.companies.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('prospect'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'prospect'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <User size={13} />
            <span>Nama Konsumen</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'prospect' ? 'bg-emerald-500/80 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {results.prospects.length}
            </span>
          </button>
        </div>

        {/* Results List */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 max-h-[50vh]">
          {allFilteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Search size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Tidak ada hasil ditemukan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Coba gunakan kata kunci lain seperti nama perumahan, nama PT pengembang, atau nama konsumen.
              </p>
            </div>
          ) : (
            allFilteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleNavigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'bg-purple-50/80 border border-purple-200/60' : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${getBadgeStyle(item.type)}`}>
                      {getIconForType(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getBadgeStyle(item.type)}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate">
                        {item.subtitle}
                      </p>
                      {item.details && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-lg transition-all ${
                    isSelected ? 'bg-purple-600 text-white' : 'text-slate-300 group-hover:text-slate-500'
                  }`}>
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] shadow-2xs">↓</kbd>
              <span className="ml-0.5">Navigasi</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] shadow-2xs">↵</kbd>
              <span className="ml-0.5">Pilih</span>
            </span>
          </div>
          <span className="text-slate-400 hidden sm:inline">Pencarian Cepat SalesX</span>
        </div>
      </div>
    </div>
  );
}
