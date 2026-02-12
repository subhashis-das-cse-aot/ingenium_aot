import { Quote } from "lucide-react";

import { getEditorialContent } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditorialPage() {
  let editorial = {
    title: "From the Editor's Desk",
    author: { name: "", role: "" },
    date: "",
    content: [] as string[],
    quote: { text: "", author: "" },
  };
  try {
    editorial = await getEditorialContent();
  } catch {
    // Keep page available even if DB is temporarily unavailable.
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-16">
      <section className="max-w-4xl mx-auto px-6 mb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full mb-6 border border-purple-200">
            <Quote className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Editorial</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">{editorial.title}</h1>
          <p className="text-xl text-gray-600">{editorial.date}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 mb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {editorial.author.name?.[0] ?? "E"}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{editorial.author.name || "Editorial Team"}</h3>
              <p className="text-gray-600">{editorial.author.role}</p>
            </div>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
          <div className="prose prose-lg max-w-none">
            {editorial.content.map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-6 text-lg">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {editorial.author.name?.[0] ?? "E"}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{editorial.author.name || "Editorial Team"}</p>
                <p className="text-gray-600 text-sm">{editorial.author.role}</p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {editorial.quote.text ? (
        <section className="max-w-3xl mx-auto px-6 mt-12">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-100">
            <Quote className="w-12 h-12 text-purple-600 mb-4" />
            <p className="text-2xl font-semibold text-gray-900 italic">&quot;{editorial.quote.text}&quot;</p>
            <p className="text-gray-600 mt-4">- {editorial.quote.author}</p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
