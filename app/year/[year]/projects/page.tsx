import { notFound } from "next/navigation";

import ProjectsListView from "@/components/ProjectsListView";
import { getPublicYears, listProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ year: string }>;
};

export default async function YearProjectsPage({ params }: PageProps) {
  const { year } = await params;
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 3000) {
    notFound();
  }

  const years = await getPublicYears();
  if (!years.some((entry) => entry.year === numericYear)) {
    notFound();
  }

  const items = await listProjects(numericYear);
  return <ProjectsListView projects={items} basePath={`/year/${numericYear}/projects`} />;
}

