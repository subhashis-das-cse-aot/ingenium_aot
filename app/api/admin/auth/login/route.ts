import { loginAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return Response.json({ ok: false, error: "Email and password are required." }, { status: 400 });
  }

  const user = await loginAdmin(email, password);
  if (!user) {
    return Response.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  return Response.json({ ok: true, user: { email: user.email } });
}
