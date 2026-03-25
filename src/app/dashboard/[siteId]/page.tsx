import { adminClient } from "@/lib/supabase/admin";
import { getSummaryStats } from "@/lib/queries/daily-stats";
import { getTopPages, getTopReferrers, getBrowserBreakdown, getCountryBreakdown } from "@/lib/queries/events";
import { getSiteById } from "@/lib/queries/sites";

type Props = {
  params: Promise<{ siteId: string }>;
};

export default async function SiteDashboardPage(props: Props) {
  const params = await props.params;
  const siteId = params.siteId;
  const days = 30;
  
  const site = await getSiteById(adminClient, siteId).catch((err) => {
    console.error('[SiteDashboardPage] getSiteById threw:', err);
    return null;
  });

  if (!site) return <div className="p-8">Site not found</div>;

  const [summaryStats, topPages, referrers, browsers, countries] = await Promise.all([
    getSummaryStats(adminClient, siteId, days),
    getTopPages(adminClient, siteId, days, 6),
    getTopReferrers(adminClient, siteId, days, 5),
    getBrowserBreakdown(adminClient, siteId, days),
    getCountryBreakdown(adminClient, siteId, days),
  ]);

  const formatNum = (n: number) => n >= 1000000 ? (n/1000000).toFixed(1) + 'M' : n >= 1000 ? (n/1000).toFixed(1) + 'K' : n;

  return (
    <>
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-label text-xs font-semibold text-on-surface-variant uppercase tracking-[0.15em]">
          <span>Project: {site.domain}</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary">Dashboard</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Digital Observatory</h1>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-label text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Total Views</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold font-headline tracking-tighter">{formatNum(summaryStats.total_views || 0)}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-label text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Unique Visitors</span>
          </div>
          <div>
            <span className="text-3xl font-bold font-headline tracking-tighter">{formatNum(summaryStats.total_visitors || 0)}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-label text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Avg Duration</span>
          </div>
          <div>
            <span className="text-3xl font-bold font-headline tracking-tighter">{summaryStats.avg_duration_ms ? (summaryStats.avg_duration_ms / 1000).toFixed(1) + 's' : '0s'}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-label text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Bounce Rate</span>
          </div>
          <div>
            <span className="text-3xl font-bold font-headline tracking-tighter">{summaryStats.avg_bounce_rate ? summaryStats.avg_bounce_rate + '%' : '0%'}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20 space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Top Pages</h3>
          </div>
          <div className="space-y-3">
            {topPages.map((page, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-on-surface max-w-[200px] truncate">{page.path}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-label block text-primary">{formatNum(page.views)}</span>
                </div>
              </div>
            ))}
            {topPages.length === 0 && <div className="text-sm text-on-surface-variant">No data available.</div>}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20 space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Top Referrers</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {referrers.map((ref, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-lg">
                <div className="flex-1 border-l-4 border-primary pl-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-on-surface">{ref.referrer?.replace(/https?:\/\//, '') || 'Direct'}</span>
                    <span className="text-sm font-bold text-primary">{formatNum(ref.views)}</span>
                  </div>
                </div>
              </div>
            ))}
            {referrers.length === 0 && <div className="text-sm text-on-surface-variant">No data available.</div>}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20 space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Browser Usage</h3>
          </div>
          <div className="space-y-6">
            {browsers.map((b, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-on-surface-variant truncate">{b.browser || 'Unknown'}</span>
                <span className="text-sm font-bold font-label text-right text-primary">{b.views}</span>
              </div>
            ))}
            {browsers.length === 0 && <div className="text-sm text-on-surface-variant">No data available.</div>}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col h-full">
           <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Global Reach</h3>
           </div>
           <div className="grid grid-cols-2 gap-x-8 gap-y-4">
             {countries.map((c, i) => (
               <div key={i} className="flex items-center justify-between">
                 <span className="text-sm font-semibold text-on-surface-variant">
                   {c.country || "Unknown"}
                 </span>
                 <span className="text-sm font-bold font-label text-primary">{c.views}</span>
               </div>
             ))}
             {countries.length === 0 && <div className="text-sm text-on-surface-variant">No data available.</div>}
           </div>
        </div>
      </section>
    </>
  );
}
