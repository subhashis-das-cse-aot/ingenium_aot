import { getCurrentAdmin } from "@/lib/auth";
import { isCmsSection } from "@/lib/cms";
import { deleteArticle, listSectionArticles, upsertArticle } from "@/lib/queries";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year"));
  const section = url.searchParams.get("section") ?? "";

  if (!Number.isFinite(year) || !isCmsSection(section)) {
    return Response.json({ ok: false, error: "Invalid year/section" }, { status: 400 });
  }

  const articles = await listSectionArticles(year, section);
  return Response.json({ ok: true, articles });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!isCmsSection(body.section)) {
    return Response.json({ ok: false, error: "Invalid section" }, { status: 400 });
  }

  await upsertArticle({
    id: body.id,
    year: Number(body.year),
    section: body.section,
    title: body.title ?? "",
    excerpt: body.excerpt ?? "",
    date: body.date ?? "",
    readTime: body.readTime ?? "",
    author: body.author ?? { name: "", role: "" },
    paragraphs: body.paragraphs ?? [],
    images: body.images ?? [],
  });

  revalidatePath("/");
  revalidatePath(`/year/${body.year}`);
  revalidatePath("/archive");

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

  await deleteArticle(id);
  revalidatePath("/");
  revalidatePath("/archive");
  return Response.json({ ok: true });
}
