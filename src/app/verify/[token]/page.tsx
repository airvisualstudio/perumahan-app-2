"use client";

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

export default function VerificationRedirectPage({ params }: Props) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace(`/verify?token=${token}`);
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 text-center font-sans gap-3">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Membuka Portal Verifikasi Dokumen...</span>
    </div>
  );
}
