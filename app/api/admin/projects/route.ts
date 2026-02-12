import { revalidatePath } from "next/cache";

import { getCurrentAdmin } from "@/lib/auth";
import { deleteProject, listProjects, upsertProject } from "@/lib/queries";

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

  const items = await listProjects(year);
  return Response.json({ ok: true, items });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  await upsertProject({
    id: body.id,
    year: Number(body.year),
    title: body.title ?? "",
    excerpt: body.excerpt ?? "",
    category: body.category ?? "",
    teamName: body.teamName ?? "",
    pdfLink: body.pdfLink ?? "",
    problemStatement: body.problemStatement ?? {},
    files: body.files ?? {},
    techStack: body.techStack ?? [],
    createdAt: body.createdAt ?? "",
    uploadedPdf: body.uploadedPdf
      ? {
          dataUrl: body.uploadedPdf.dataUrl ?? "",
          fileName: body.uploadedPdf.fileName ?? "",
        }
      : undefined,
  });

  revalidatePath("/projects");
  revalidatePath(`/year/${body.year}/projects`);
  revalidatePath(`/year/${body.year}/projects/${body.id}`);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  await deleteProject(id);
  revalidatePath("/projects");
  return Response.json({ ok: true });
}
