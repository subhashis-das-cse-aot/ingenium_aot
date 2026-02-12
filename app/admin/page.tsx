import { redirect } from "next/navigation";

import AdminEditor from "@/components/AdminEditor";
import { getCurrentAdmin, logoutAdmin } from "@/lib/auth";
import { getAllYears, getCurrentYearNumber } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  async function logoutAction() {
    "use server";
    await logoutAdmin();
    redirect("/admin/login");
  }

  const [years, currentYear] = await Promise.all([getAllYears(), getCurrentYearNumber()]);

  return (
    <main className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin CMS</h1>
        <form action={logoutAction}>
          <button type="submit" className="text-sm border px-3 py-2 rounded">
            Logout
          </button>
        </form>
      </div>
      <AdminEditor currentYear={currentYear} years={years} />
    </main>
  );
}
