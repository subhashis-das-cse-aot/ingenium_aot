import { getCurrentAdmin } from "@/lib/auth";
import { setCurrentYear } from "@/lib/queries";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { year?: number };
  const year = Number(body.year);
  if (!Number.isInteger(year) || year < 1900 || year > 3000) {
    return Response.json({ ok: false, error: "Invalid year" }, { status: 400 });
  }

  await setCurrentYear(year);
  revalidatePath("/");
  revalidatePath(`/year/${year}`);
  revalidatePath("/archive");

  return Response.json({ ok: true, year });
}
