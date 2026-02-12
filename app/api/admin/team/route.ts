import { revalidatePath } from "next/cache";

import { getCurrentAdmin } from "@/lib/auth";
import { deleteTeamMember, listTeamMembers, upsertTeamMember } from "@/lib/queries";

function validateYear(year: number) {
  return Number.isInteger(year) && year >= 1900 && year <= 3000;
}

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year"));
  if (!validateYear(year)) {
    return Response.json({ ok: false, error: "Invalid year" }, { status: 400 });
  }

  const items = await listTeamMembers(year);
  return Response.json({ ok: true, items });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const year = Number(body.year);
  const id = String(body.id ?? "").trim();
  const name = String(body.name ?? "").trim();

  if (!validateYear(year) || !id || !name) {
    return Response.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  try {
    await upsertTeamMember({
      year,
      id,
      name,
      role: body.role ?? "",
      department: body.department ?? "",
      yearLabel: body.yearLabel ?? "",
      imageId: body.imageId ?? "",
      linkedin: body.linkedin ?? "",
      github: body.github ?? "",
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save team member" },
      { status: 400 },
    );
  }

  revalidatePath("/team");
  revalidatePath("/");
  revalidatePath(`/year/${year}`);
  revalidatePath("/archive");

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year"));
  const id = url.searchParams.get("id") ?? "";
  if (!validateYear(year) || !id) {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  await deleteTeamMember(year, id);
  revalidatePath("/team");
  revalidatePath("/");
  revalidatePath(`/year/${year}`);
  revalidatePath("/archive");

  return Response.json({ ok: true });
}

