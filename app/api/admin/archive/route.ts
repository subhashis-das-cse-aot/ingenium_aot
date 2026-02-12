import { getCurrentAdmin } from "@/lib/auth";
import { archiveCurrentYearAndCreateNext } from "@/lib/queries";
import { revalidatePath } from "next/cache";

export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await archiveCurrentYearAndCreateNext();
  revalidatePath("/");
  revalidatePath(`/year/${result.archivedYear}`);
  revalidatePath("/archive");
  return Response.json({ ok: true, ...result });
}
