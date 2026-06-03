import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Domus CRM & Operasional - Developer Perumahan",
  description: "Platform Internal PWA Developer Perumahan untuk CRM Properti, Absensi GPS, dan Manajemen Dokumen Resmi.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased light">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
