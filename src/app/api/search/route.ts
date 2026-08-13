import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const query = rawQuery.trim().toLowerCase();

    const data = db.get();
    const { companies = [], clusters = [], prospects = [] } = data;

    // Fast lookup maps
    const companyMap = new Map(companies.map(c => [c.id, c.name]));
    const clusterMap = new Map(clusters.map(cl => [cl.id, cl.name]));

    // 1. Search Companies (Nama PT)
    const matchedCompanies = companies
      .filter(c => {
        if (!query) return true;
        return (
          c.name?.toLowerCase().includes(query) ||
          c.legal_name?.toLowerCase().includes(query) ||
          c.code?.toLowerCase().includes(query) ||
          c.address?.toLowerCase().includes(query) ||
          c.director_name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query)
        );
      })
      .map(c => ({
        id: c.id,
        type: 'company' as const,
        badge: 'Nama PT',
        title: c.name,
        subtitle: c.legal_name || c.address || 'Perusahaan Developer',
        details: [
          c.director_name ? `Direktur: ${c.director_name}` : null,
          c.phone ? `Tel: ${c.phone}` : null,
          c.code ? `Kode: ${c.code}` : null
        ].filter(Boolean).join(' • '),
        href: `/properties?tab=companies&search=${encodeURIComponent(c.name)}`
      }));

    // 2. Search Clusters (Nama Perumahan)
    const matchedClusters = clusters
      .filter(cl => {
        if (!query) return true;
        const compName = cl.company_id ? companyMap.get(cl.company_id) || '' : '';
        return (
          cl.name?.toLowerCase().includes(query) ||
          cl.location?.toLowerCase().includes(query) ||
          cl.description?.toLowerCase().includes(query) ||
          cl.address?.toLowerCase().includes(query) ||
          compName.toLowerCase().includes(query)
        );
      })
      .map(cl => {
        const compName = cl.company_id ? companyMap.get(cl.company_id) : undefined;
        return {
          id: cl.id,
          type: 'cluster' as const,
          badge: 'Perumahan',
          title: cl.name,
          subtitle: cl.location || 'Lokasi belum diisi',
          details: [
            compName ? `Developer: ${compName}` : null,
            cl.total_units ? `${cl.total_units} Unit` : null,
            cl.status ? `Status: ${cl.status.replace('_', ' ')}` : null
          ].filter(Boolean).join(' • '),
          href: `/properties?tab=clusters&search=${encodeURIComponent(cl.name)}`
        };
      });

    // 3. Search Prospects (Nama Konsumen)
    const matchedProspects = prospects
      .filter(p => {
        if (!query) return true;
        return (
          p.full_name?.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.company_name?.toLowerCase().includes(query) ||
          p.nik?.toLowerCase().includes(query) ||
          p.occupation?.toLowerCase().includes(query)
        );
      })
      .map(p => {
        const clusterName = p.interested_cluster_id ? clusterMap.get(p.interested_cluster_id) : undefined;
        const stageFormatted = p.pipeline_stage ? p.pipeline_stage.replace('_', ' ') : 'Prospect';
        return {
          id: p.id,
          type: 'prospect' as const,
          badge: 'Konsumen',
          title: p.full_name,
          subtitle: `${p.phone || p.email || 'Tanpa kontak'} ${p.company_name ? `• ${p.company_name}` : ''}`,
          details: [
            `Tahap: ${stageFormatted}`,
            clusterName ? `Minat: ${clusterName}` : null,
            p.occupation ? `Pekerjaan: ${p.occupation}` : null
          ].filter(Boolean).join(' • '),
          href: `/prospects/${p.id}`
        };
      });

    const limit = query ? 15 : 5;

    return NextResponse.json({
      success: true,
      query,
      results: {
        companies: matchedCompanies.slice(0, limit),
        clusters: matchedClusters.slice(0, limit),
        prospects: matchedProspects.slice(0, limit)
      },
      totalCount: matchedCompanies.length + matchedClusters.length + matchedProspects.length
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
