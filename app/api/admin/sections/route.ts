import { revalidatePath } from "next/cache";

import { getCurrentAdmin } from "@/lib/auth";
import { isYearSectionKey } from "@/lib/cms";
import { getSectionSettings, upsertSectionSetting } from "@/lib/queries";

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year"));
  if (!Number.isInteger(year) || year < 1900 || year > 3000) {
    return Response.json({ ok: false, error: "Invalid year" }, { status: 400 });
  }

  const settings = await getSectionSettings(year);
  return Response.json({ ok: true, settings });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    year?: number;
    sectionKey?: string;
    displayName?: string;
    isHidden?: boolean;
  };

  const year = Number(body.year);
  const sectionKey = body.sectionKey ?? "";
  if (!Number.isInteger(year) || year < 1900 || year > 3000 || !isYearSectionKey(sectionKey)) {
    return Response.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const displayName = (body.displayName ?? "").trim() || sectionKey;
  await upsertSectionSetting(year, sectionKey, displayName, Boolean(body.isHidden));

  revalidatePath("/");
  revalidatePath(`/year/${year}`);
  revalidatePath("/archive");

  return Response.json({ ok: true });
}
