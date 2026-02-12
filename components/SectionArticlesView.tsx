/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Calendar, ArrowRight, Award, Newspaper, BookOpen, Lightbulb } from "lucide-react";

import { resolveCmsImageSrc, type CmsArticle, type CmsSection } from "@/lib/cms";

type SectionConfig = {
  badgeBg: string;
  badgeText: string;
  cardAccent: string;
  cardHover: string;
  title: string;
  subtitle: string;
  Icon: typeof Award;
};

const SECTION_CONFIG: Record<CmsSection, SectionConfig> = {
  utkarshi: {
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    cardAccent: "bg-emerald-600",
    cardHover: "group-hover:text-emerald-600",
    title: "Excellence & Achievements",
    subtitle: "Celebrating outstanding achievements and excellence.",
    Icon: Award,
  },
  abohoman: {
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    cardAccent: "bg-indigo-600",
    cardHover: "group-hover:text-indigo-600",
    title: "Campus Life & Culture",
    subtitle: "Stories, events, and perspectives from the heart of our campus community.",
    Icon: Newspaper,
  },
  prayukti: {
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    cardAccent: "bg-emerald-600",
    cardHover: "group-hover:text-emerald-600",
    title: "Technical Articles & Innovations",
    subtitle: "Exploring the latest in technology, research, and innovation from our campus community.",
    Icon: BookOpen,
  },
  sarvagya: {
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    cardAccent: "bg-emerald-600",
    cardHover: "group-hover:text-emerald-600",
    title: "Knowledge & Wisdom",
    subtitle: "Sharing knowledge and wisdom across disciplines.",
    Icon: Lightbulb,
  },
};

export default function SectionArticlesView({
  year,
  section,
  sectionDisplayName,
  articles,
}: {
  year: number;
  section: CmsSection;
  sectionDisplayName?: string;
  articles: CmsArticle[];
}) {
  const config = SECTION_CONFIG[section];
  const label = sectionDisplayName || section;
  const basePath = `/year/${year}/${section}`;

  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 ${config.badgeBg} ${config.badgeText} px-4 py-2 rounded-full mb-4`}>
            <config.Icon className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">{config.title}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{config.subtitle}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => {
            const coverId = article.images?.[0]?.id;
            return (
              <article key={article.id} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`${config.cardAccent} text-white text-xs font-bold uppercase px-3 py-1.5 tracking-wider rounded`}>
                      {article.department}
                    </span>
                  </div>
                  {coverId ? (
                    <img
                      src={resolveCmsImageSrc(coverId)}
                      alt={article.title}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : null}
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {article.date}
                    </span>
                    <span>{article.readTime}</span>
                  </div>

                  <Link href={`${basePath}/blog/${article.id}`}>
                    <h2 className={`text-xl font-bold text-gray-900 mb-3 line-clamp-2 ${config.cardHover} transition-colors`}>
                      {article.title}
                    </h2>
                  </Link>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${config.cardAccent} flex items-center justify-center text-white text-xs font-bold`}>
                        {article.author.name?.[0] ?? "A"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{article.author.name}</p>
                        <p className="text-xs text-gray-500">{article.author.role}</p>
                      </div>
                    </div>

                    <Link href={`${basePath}/blog/${article.id}`} className="text-emerald-600 hover:text-emerald-700 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
