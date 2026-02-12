import { redirect } from "next/navigation";

import { getCurrentYearNumber } from "@/lib/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function UtkarshiBlogRedirectPage({ params }: PageProps) {
  const { id } = await params;
  const year = await getCurrentYearNumber();
  redirect(`/year/${year}/utkarshi/blog/${id}`);
}
