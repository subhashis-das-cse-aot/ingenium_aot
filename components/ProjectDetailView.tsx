import Link from "next/link";
import { ArrowLeft, Calendar, Users, FileText, Code } from "lucide-react";

import type { CmsProject } from "@/lib/queries";

export default function ProjectDetailView({
  project,
  backHref,
}: {
  project: CmsProject;
  backHref: string;
}) {
  const ps = project.problemStatement ?? {};
  const files = project.files ?? {};
  const pdf = (files.pdf as { name?: string; driveId?: string } | undefined) ?? {};
  const effectivePdfLink = project.pdfLink || (pdf.driveId ? `https://drive.google.com/file/${pdf.driveId}/view` : "");

  const getEmbeddablePdfUrl = (input: string) => {
    if (!input) return "";

    const matchDriveId = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchDriveId?.[1]) {
      return `https://drive.google.com/file/d/${matchDriveId[1]}/preview`;
    }

    const byId = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (input.includes("drive.google.com") && byId?.[1]) {
      return `https://drive.google.com/file/d/${byId[1]}/preview`;
    }

    if (input.includes("github.com") && input.includes("/blob/")) {
      const rawGithub = input
        .replace("https://github.com/", "https://raw.githubusercontent.com/")
        .replace("/blob/", "/");
      return rawGithub;
    }

    return input;
  };

  const embeddablePdfUrl = getEmbeddablePdfUrl(effectivePdfLink);

  return (
    <main className="min-h-screen bg-white pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link href={backHref} className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-600 text-white text-xs font-bold uppercase px-3 py-1.5 tracking-wider">
              {project.category}
            </span>
            <span className="text-gray-500 text-sm">{project.year}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{project.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{project.excerpt}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                <strong>Team:</strong> {project.team.name}
              </span>
            </div>

            {"id" in ps ? (
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  <strong>PS ID:</strong> {String(ps.id ?? "")}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                <strong>Created:</strong> {project.createdAt}
              </span>
            </div>
          </div>

          {"title" in ps ? (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Problem Statement</h3>
              <p className="text-gray-700 mb-2">{String(ps.title ?? "")}</p>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>
                  <strong>Theme:</strong> {String(ps.theme ?? "")}
                </span>
                <span>
                  <strong>Category:</strong> {String(ps.psCategory ?? "")}
                </span>
              </div>
            </div>
          ) : null}

          {project.techStack.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Technology Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {embeddablePdfUrl ? (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project Documentation
              </h2>
              <p className="text-sm text-gray-600 mt-1">{pdf.name ?? "Project PDF"}</p>
            </div>

            <div className="relative w-full" style={{ height: "600px" }}>
              <iframe src={embeddablePdfUrl} className="w-full h-full border-0" />
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
