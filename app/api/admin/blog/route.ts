import { getCurrentAdmin } from "@/lib/auth";
import { isCmsSection } from "@/lib/cms";
import { upsertArticle } from "@/lib/queries";
import { revalidatePath } from "next/cache";

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
