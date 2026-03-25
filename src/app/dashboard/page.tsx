import { redirect } from "next/navigation";

const HARDCODED_SITE_ID = 'b1b2c3d4-0000-0000-0000-000000000001';

export default function DashboardIndex() {
  redirect(`/dashboard/${HARDCODED_SITE_ID}`);
}
