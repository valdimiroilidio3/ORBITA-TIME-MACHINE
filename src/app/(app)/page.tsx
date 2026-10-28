import { ensureSeedUsers, can } from "@/lib/auth";
import { requireUser } from "@/lib/current-user";
import { listLeads, listSectors, listTimeMachines } from "@/lib/repo";
import { ensureDemoData } from "@/lib/seed";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  ensureSeedUsers();
  const user = await requireUser();
  ensureDemoData(user.id);
  const items = listTimeMachines();
  const leads = listLeads();
  const sectors = listSectors();

  return (
    <Dashboard
      items={items}
      leads={leads}
      sectors={sectors}
      canCreate={can(user, "tm:create")}
    />
  );
}
