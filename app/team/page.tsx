/* eslint-disable @next/next/no-img-element */
import { Github, Linkedin } from "lucide-react";

import { getCurrentYearNumber, listTeamMembers } from "@/lib/queries";
import { resolveCmsImageSrc } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  let currentYear = new Date().getFullYear();
  let teamMembers: Awaited<ReturnType<typeof listTeamMembers>> = [];
  try {
    currentYear = await getCurrentYearNumber();
    teamMembers = await listTeamMembers(currentYear);
  } catch {
    // Keep page available even if DB is temporarily unavailable.
  }

  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">Meet Our Team</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The passionate individuals behind Ingenium for {currentYear}.
          </p>
          <div className="w-20 h-1 bg-blue-600 mx-auto mt-6"></div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Technical Team</h2>

        {teamMembers.length === 0 ? (
          <p className="text-center text-gray-500">No team members configured yet for {currentYear}.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  {member.imageId ? (
                    <img
                      src={resolveCmsImageSrc(member.imageId)}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-white flex items-center justify-center text-6xl font-bold text-gray-700 shadow-xl group-hover:scale-110 transition-transform duration-300">
                      {member.name[0]}
                    </div>
                  )}
                </div>

                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-purple-600 font-semibold mb-1">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-4">
                    {member.department} {member.yearLabel ? `• ${member.yearLabel}` : ""}
                  </p>

                  <div className="flex justify-center gap-3">
                    {member.linkedin ? (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    ) : null}
                    {member.github ? (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
