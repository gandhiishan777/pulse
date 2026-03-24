import { createClient } from "@/lib/supabase/server";
import { getUserSites } from "@/lib/queries/sites";
import { redirect } from "next/navigation";

export default async function DashboardIndex() {
  const supabase = await createClient();
  const sites = await getUserSites(supabase).catch(() => []);
  
  if (sites.length > 0) {
    redirect(`/dashboard/${sites[0].id}`);
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-6">Your Sites</h1>
      <p className="text-on-surface-variant">No sites found. Please create one.</p>
    </div>
  );
}
