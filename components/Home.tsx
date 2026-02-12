/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  ArrowRight,
  Award,
  Palette,
  Cpu,
  BookOpen,
  Archive,
  Rocket,
} from "lucide-react";
import { resolveCmsImageSrc } from "@/lib/cms";

type TileSectionKey = "utkarshi" | "abohoman" | "prayukti" | "sarvagya" | "gallery" | "projects";
type SectionSetting = {
  sectionKey: TileSectionKey;
  displayName: string;
  isHidden: boolean;
};

const HeroCarousel = ({ articles, year }: { articles: any[]; year: number }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (articles.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % articles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [articles.length]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % articles.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev === 0 ? articles.length - 1 : prev - 1));

  if (!articles.length) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gray-900 group">
      <div
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {articles.map((article, idx) => {
          const coverId = article.images?.[0]?.id || "";

          return (
            <div key={idx} className="w-full shrink-0 relative h-full">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
              {coverId ? (
                <img
                  src={resolveCmsImageSrc(coverId)}
                  alt={article.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800" />
              )}

              <div className="absolute bottom-0 left-0 right-0 z-20 p-8 md:p-12">
                <div className="max-w-4xl">
                  <span className="bg-white text-black text-xs font-bold uppercase tracking-wider px-3 py-1.5 mb-4 inline-block">
                    {article.department}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    {article.title}
                  </h2>
                  <Link
                    href={`/year/${year}/${article.department.toLowerCase()}/blog/${article.id}`}
                    className="inline-flex items-center gap-2 text-white border-b-2 border-white pb-1 hover:border-blue-400 transition-colors font-medium"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/30 p-2 rounded-full text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/30 p-2 rounded-full text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-6 right-6 z-30 flex gap-2">
        {articles.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full transition-all ${current === idx ? "bg-white w-8" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
};

const SectionTiles = ({
  year,
  sectionSettings,
}: {
  year: number;
  sectionSettings: SectionSetting[];
}) => {
  const settingsMap = new Map(sectionSettings.map((item) => [item.sectionKey, item]));
  const label = (key: TileSectionKey, fallback: string) => settingsMap.get(key)?.displayName || fallback;
  const hidden = (key: TileSectionKey) => Boolean(settingsMap.get(key)?.isHidden);

  const sections = [
    {
      key: "utkarshi" as const,
      title: label("utkarshi", "Utkarshi"),
      gradient: "from-purple-600 via-purple-700 to-purple-900",
      link: `/year/${year}/utkarshi`,
      description: "Excellence & Achievements",
      Icon: Award,
      accentColor: "purple",
    },
    {
      key: "abohoman" as const,
      title: label("abohoman", "Abohoman"),
      gradient: "from-blue-600 via-blue-700 to-blue-900",
      link: `/year/${year}/abohoman`,
      description: "Cultural Heritage",
      Icon: Palette,
      accentColor: "blue",
    },
    {
      key: "prayukti" as const,
      title: label("prayukti", "Prayukti"),
      gradient: "from-emerald-600 via-emerald-700 to-emerald-900",
      link: `/year/${year}/prayukti`,
      description: "Technical Innovations",
      Icon: Cpu,
      accentColor: "emerald",
    },
    {
      key: "sarvagya" as const,
      title: label("sarvagya", "Sarvagya"),
      gradient: "from-orange-600 via-orange-700 to-orange-900",
      link: `/year/${year}/sarvagya`,
      description: "Knowledge & Wisdom",
      Icon: BookOpen,
      accentColor: "orange",
    },
    {
      key: "archive" as const,
      title: "Archive",
      gradient: "from-rose-600 via-rose-700 to-rose-900",
      link: "/archive",
      description: "Past Collections",
      Icon: Archive,
      accentColor: "rose",
    },
    {
      key: "projects" as const,
      title: label("projects", "Projects"),
      gradient: "from-indigo-600 via-indigo-700 to-indigo-900",
      link: `/year/${year}/projects`,
      description: "Innovation & Solutions",
      Icon: Rocket,
      accentColor: "indigo",
    },
    {
      key: "gallery" as const,
      title: label("gallery", "Gallery"),
      gradient: "from-teal-600 via-teal-700 to-teal-900",
      link: `/year/${year}/gallery`,
      description: "Visual Memories",
      Icon: Palette,
      accentColor: "teal",
    },
  ];
  const visibleSections = sections.filter((section) => {
    if (section.key === "archive") {
      return true;
    }
    return !hidden(section.key as TileSectionKey);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Explore Our Sections
        </h2>
        <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleSections.map((section, idx) => {
          const Icon = section.Icon;
          return (
            <Link
              key={idx}
              href={section.link}
              className="group relative h-72 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${section.gradient}`}
              />
              <div className="absolute inset-0 opacity-40">
                <div
                  className="absolute w-64 h-64 rounded-full blur-3xl animate-pulse"
                  style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
                    top: "-20%",
                    left: "-20%",
                    animationDuration: "4s",
                  }}
                />
                <div
                  className="absolute w-48 h-48 rounded-full blur-3xl animate-pulse"
                  style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
                    bottom: "-10%",
                    right: "-10%",
                    animationDuration: "6s",
                    animationDelay: "1s",
                  }}
                />
              </div>

              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255,255,255,0.1) 10px,
                    rgba(255,255,255,0.1) 20px
                  )`,
                }}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 group-hover:scale-175 transition-transform duration-500" />
                  <div className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <Icon className="w-10 h-10" strokeWidth={2} />
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2 transform group-hover:scale-105 transition-transform duration-300">
                  {section.title}
                </h3>

                <p className="text-sm text-white/90 mb-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  {section.description}
                </p>

                <div className="h-1 bg-white/50 rounded-full w-12 group-hover:w-20 transition-all duration-300" />
              </div>

              <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-white/40 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0" />
              <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-white/40 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="absolute inset-0 rounded-2xl border-2 border-white/0 group-hover:border-white/30 transition-all duration-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default function Home({
  data,
  year,
  sectionSettings = [],
}: {
  data: any;
  year: number;
  sectionSettings?: SectionSetting[];
}) {
  const allArticles = [
    ...(data.utkarshi || []),
    ...(data.prayukti || []),
    ...(data.abohoman || []),
    ...(data.sarvagya || []),
  ];

  allArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featuredArticles = allArticles
    .filter((article) => article.department === "prayukti" || article.department === "sarvagya")
    .slice(0, 5);
  const feedArticles = allArticles.filter((article) => article.department === "prayukti").slice(0, 6);

  return (
    <main className="min-h-screen bg-white pt-16">
      <HeroCarousel articles={featuredArticles} year={year} />
      <SectionTiles year={year} sectionSettings={sectionSettings} />

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-2 block">
            Latest Updates
          </span>
          <h2 className="text-3xl font-bold text-gray-900">Recent Publications</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {feedArticles.map((article) => {
            const coverId = article.images?.[0]?.id;

            return (
              <article
                key={article.id}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-black text-white text-xs font-bold uppercase px-3 py-1.5 tracking-wider">
                      {article.department}
                    </span>
                  </div>
                  {coverId && (
                    <img
                      src={resolveCmsImageSrc(coverId)}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {article.date}
                    </span>
                    <span>{article.readTime}</span>
                  </div>

                  <Link href={`/year/${year}/${article.department.toLowerCase()}/blog/${article.id}`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                  </Link>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{article.excerpt}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-100 mt-auto">
                    <User className="w-4 h-4" />
                    <span>{article.author.name}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors rounded-sm"
          >
            View All Articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
