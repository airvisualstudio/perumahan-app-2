"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, User, Mail, Phone, Building2, IdCard, CheckCircle2, ShieldCheck, Calendar, Camera, Upload, Trash2, Lock, Crop } from 'lucide-react';
import ImageCropModal from './ImageCropModal';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    employee_id: '',
    avatar_url: ''
  });

  const [rawImageSrc, setRawImageSrc] = useState<string>('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '081234567890',
        department: user.department || '',
        employee_id: user.employee_id || '',
        avatar_url: user.avatar_url || ''
      });
      setIsSaved(false);
      setErrors({});
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const getInitials = (nameStr: string) => {
    if (!nameStr.trim()) return 'U';
    return nameStr
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'Ukuran foto maksimal 10MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setRawImageSrc(result);
      setIsCropModalOpen(true);
      setErrors(prev => ({ ...prev, avatar: '' }));

      // Reset file input value so selecting same image triggers change again
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.name.trim()) errs.name = 'Nama lengkap wajib diisi';
    if (!formData.email.trim()) errs.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Format email tidak valid';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    updateUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      avatar_url: formData.avatar_url
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <User size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-tight">Edit Profil Saya</h2>
              <p className="text-[11px] text-slate-400">Perbarui foto & informasi akun pribadi</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Saved Success Notification */}
        {isSaved && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center gap-2 text-emerald-700 text-xs font-semibold animate-in slide-in-from-top duration-200">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>Profil berhasil diperbarui!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Hidden File Input */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Avatar & Foto Profil */}
          <div className="flex items-center gap-4 p-4 bg-purple-50/50 border border-purple-100/60 rounded-2xl">
            <div className="relative group flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-purple-200 overflow-hidden ring-4 ring-white">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(formData.name)
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md hover:scale-110 transition-all cursor-pointer border-2 border-white"
                title="Upload Foto Profil"
              >
                <Camera size={13} />
              </button>
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 truncate">
                  {formData.name || 'Nama Pengguna'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">{formData.email || 'email@domus.com'}</p>
              
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Upload size={12} />
                  {formData.avatar_url ? 'Ganti Foto' : 'Upload Foto'}
                </button>
                {formData.avatar_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-2.5 py-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Hapus
                  </button>
                )}
              </div>
              {errors.avatar && <p className="text-[10px] font-semibold text-red-500 mt-0.5">{errors.avatar}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <User size={13} className="text-purple-600" />
                Nama Lengkap
              </label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white transition-all font-medium ${
                  errors.name ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-purple-500'
                }`}
              />
              {errors.name && <p className="text-[10px] font-semibold text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail size={13} className="text-purple-600" />
                Email
              </label>
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@domus.com"
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:bg-white transition-all font-medium ${
                  errors.email ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-purple-500'
                }`}
              />
              {errors.email && <p className="text-[10px] font-semibold text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone size={13} className="text-purple-600" />
                No. Telepon / WA
              </label>
              <input 
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812xxxxxxxx"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* NIP / ID Karyawan (Read-only / Terkunci) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <IdCard size={13} className="text-slate-400" />
                  NIP / ID Karyawan
                </span>
                <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                  <Lock size={10} /> Terkunci
                </span>
              </label>
              <input 
                type="text"
                value={formData.employee_id}
                disabled
                readOnly
                tabIndex={-1}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-100/90 text-slate-500 border border-slate-200 rounded-xl outline-none cursor-not-allowed select-none font-medium"
              />
              <p className="text-[10px] text-slate-400 font-medium">Hanya diubah oleh Admin/Manager di menu lain</p>
            </div>

            {/* Departemen (Read-only / Terkunci) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" />
                  Departemen
                </span>
                <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                  <Lock size={10} /> Terkunci
                </span>
              </label>
              <input 
                type="text"
                value={formData.department}
                disabled
                readOnly
                tabIndex={-1}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-100/90 text-slate-500 border border-slate-200 rounded-xl outline-none cursor-not-allowed select-none font-medium"
              />
              <p className="text-[10px] text-slate-400 font-medium">Hanya diubah oleh Admin/Manager di menu lain</p>
            </div>
          </div>

          {/* Info Cards (System Info) */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hak Akses / Role</p>
                <p className="text-xs font-semibold text-slate-800 capitalize">{user.role}</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2.5">
              <Calendar size={18} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sisa Hak Cuti</p>
                <p className="text-xs font-semibold text-slate-800">{user.annual_leave_balance ?? 12} Hari</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl transition-all shadow-md shadow-purple-200 cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>

        {/* Image Crop & Compress Modal */}
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawImageSrc}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={(croppedImageBase64) => {
            setFormData(prev => ({ ...prev, avatar_url: croppedImageBase64 }));
          }}
        />
      </div>
    </div>
  );
}


