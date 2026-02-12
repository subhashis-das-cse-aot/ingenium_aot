import { getProjectPdf } from "@/lib/queries";

type RouteProps = {
  params: Promise<{ year: string; id: string }>;
};

export async function GET(_req: Request, { params }: RouteProps) {
  const { year, id } = await params;
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 3000 || !id) {
    return new Response("Invalid request", { status: 400 });
  }

  const file = await getProjectPdf(numericYear, id);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const pdfBytes = new Uint8Array(file.file_bytes);

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": file.mime_type || "application/pdf",
      "Content-Disposition": `inline; filename="${file.file_name || "project.pdf"}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
