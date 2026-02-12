import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ ok: false, user: null }, { status: 401 });
  }

  return Response.json({ ok: true, user: admin });
}
