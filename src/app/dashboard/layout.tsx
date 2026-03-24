import { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserSites } from "@/lib/queries/sites";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const sites = await getUserSites(supabase).catch(() => []);

  return (
    <div className="min-h-screen bg-background text-on-surface pt-0">
      {/* Side Navigation Bar */}
      <aside className="hidden xl:flex h-screen w-64 fixed left-0 top-0 border-r border-outline-variant/20 bg-surface-container-lowest flex-col py-6 z-[60]">
        <div className="px-8 mb-10 mt-2">
          <h2 className="text-lg font-black tracking-tight text-on-surface">The Observatory</h2>
          <p className="text-[10px] font-bold text-outline tracking-widest uppercase mt-1">Pulse Analytics</p>
        </div>
        <div className="flex-1 space-y-1 px-4 mt-4">
          <Link href="/dashboard" className="flex items-center gap-3 bg-primary-fixed text-on-primary-fixed rounded-lg px-3 py-3 text-xs uppercase tracking-widest font-semibold hover:translate-x-1 duration-200">
            <span className="material-symbols-outlined">dashboard</span>
            Overview
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg px-3 py-3 text-xs uppercase tracking-widest font-semibold hover:translate-x-1 duration-200">
            <span className="material-symbols-outlined">group</span>
            Audience
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg px-3 py-3 text-xs uppercase tracking-widest font-semibold hover:translate-x-1 duration-200">
            <span className="material-symbols-outlined">ads_click</span>
            Acquisition
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-low rounded-lg px-3 py-3 text-xs uppercase tracking-widest font-semibold hover:translate-x-1 duration-200">
            <span className="material-symbols-outlined">query_stats</span>
            Behavior
          </Link>
        </div>
        <div className="px-4 mt-auto space-y-4">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-bold py-3 rounded-lg shadow-sm active:scale-95 transition-all">
            Export Report
          </button>
        </div>
      </aside>

      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full xl:w-[calc(100%-16rem)] xl:left-64 z-50 bg-surface-container-lowest/70 backdrop-blur-xl shadow-[0_20px_40px_rgba(11,28,48,0.05)] h-16 flex justify-between items-center px-8 border-none">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter text-primary hover:opacity-80 transition-opacity">Analytics.IO</Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium tracking-tight">
             <span className="text-primary border-b-2 border-primary pb-1">Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {sites.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <span className="text-primary">24h</span>
              <span className="w-px h-3 bg-outline-variant"></span>
              <span>Project: {sites[0].domain}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-outline">account_circle</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-8 max-w-[1600px] xl:ml-64 mx-auto space-y-10">
        {children}
      </main>
    </div>
  );
}
