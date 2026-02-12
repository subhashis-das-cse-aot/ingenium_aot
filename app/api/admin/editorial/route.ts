import { revalidatePath } from "next/cache";

import { getCurrentAdmin } from "@/lib/auth";
import { getEditorialContent, upsertEditorialContent } from "@/lib/queries";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const editorial = await getEditorialContent();
  return Response.json({ ok: true, editorial });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  await upsertEditorialContent({
    title: body.title ?? "",
    author: {
      name: body.author?.name ?? "",
      role: body.author?.role ?? "",
    },
    date: body.date ?? "",
    content: Array.isArray(body.content) ? body.content : [],
    quote: {
      text: body.quote?.text ?? "",
      author: body.quote?.author ?? "",
    },
  });

  revalidatePath("/");
  revalidatePath("/editorial");
  revalidatePath("/archive");

  return Response.json({ ok: true });
}

