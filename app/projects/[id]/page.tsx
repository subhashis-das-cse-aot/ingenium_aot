import { notFound } from "next/navigation";

import ProjectDetailView from "@/components/ProjectDetailView";
import { getCurrentYearNumber, getProjectById } from "@/lib/queries";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const year = await getCurrentYearNumber();
  const project = await getProjectById(year, id);
  if (!project) {
    notFound();
  }
  return <ProjectDetailView project={project} backHref={`/year/${year}/projects`} />;
}

export async function generateStaticParams() {
  return [];
}
