import { revalidatePath } from "next/cache";

import { getCurrentAdmin } from "@/lib/auth";
import { deleteGalleryItem, listGalleryItems, upsertGalleryItem } from "@/lib/queries";

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

  const items = await listGalleryItems(year);
  return Response.json({ ok: true, items });
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (body.kind !== "photograph" && body.kind !== "drawing") {
    return Response.json({ ok: false, error: "Invalid kind" }, { status: 400 });
  }

  await upsertGalleryItem({
    id: body.id,
    year: Number(body.year),
    kind: body.kind,
    title: body.title ?? "",
    description: body.description ?? "",
    imageId: body.imageId ?? "",
    photographer: body.photographer ?? {},
    rank: body.rank ?? "",
    folderContext: body.folderContext ?? "",
  });

  revalidatePath("/gallery");
  revalidatePath(`/year/${body.year}/gallery`);
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

  await deleteGalleryItem(id);
  revalidatePath("/gallery");
  return Response.json({ ok: true });
}
