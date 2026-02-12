import { notFound } from "next/navigation";

import ProjectDetailView from "@/components/ProjectDetailView";
import { getPublicYears, getProjectById } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ year: string; id: string }>;
};

export default async function YearProjectDetailPage({ params }: PageProps) {
  const { year, id } = await params;
  const numericYear = Number(year);

  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 3000) {
    notFound();
  }

  const years = await getPublicYears();
  if (!years.some((entry) => entry.year === numericYear)) {
    notFound();
  }

  const project = await getProjectById(numericYear, id);
  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} backHref={`/year/${numericYear}/projects`} />;
}

