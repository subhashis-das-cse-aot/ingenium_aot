import { getCurrentAdmin } from "@/lib/auth";
import { getAllYears, getCurrentYearNumber } from "@/lib/queries";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [years, currentYear] = await Promise.all([getAllYears(), getCurrentYearNumber()]);
  return Response.json({ ok: true, years, currentYear });
}
