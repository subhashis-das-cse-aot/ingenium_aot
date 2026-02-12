import Link from "next/link";
import { Calendar, Users, FileText, ArrowRight } from "lucide-react";

import type { CmsProject } from "@/lib/queries";

export default function ProjectsListView({
  projects,
  basePath,
}: {
  projects: CmsProject[];
  basePath: string;
}) {
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <main className="min-h-screen bg-white pt-16">
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Projects</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover innovative solutions and technical achievements from our talented teams.
          </p>
          <div className="w-20 h-1 bg-blue-600 mx-auto mt-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedProjects.map((project) => (
            <article
              key={project.id}
              className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-600 text-white text-xs font-bold uppercase px-2 py-1 tracking-wider">
                    {project.category}
                  </span>
                  <span className="text-gray-500 text-xs">{project.year}</span>
                </div>

                <Link href={`${basePath}/${project.id}`}>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>
                </Link>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.excerpt}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>Team: {project.team.name}</span>
                  </div>

                  {project.problemStatement && typeof project.problemStatement === "object" && "id" in project.problemStatement && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileText className="w-4 h-4" />
                      <span>PS ID: {String(project.problemStatement.id ?? "")}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{project.createdAt}</span>
                  </div>
                </div>

                <Link
                  href={`${basePath}/${project.id}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                >
                  View Project Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
