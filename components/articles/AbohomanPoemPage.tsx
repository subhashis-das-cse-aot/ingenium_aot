import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import type { ArticleData } from "@/types/types";
import { resolveCmsImageSrc } from "@/lib/cms";

function splitColumns(paragraphs: string[]) {
  const nonEmpty = paragraphs.map((line) => line.trim()).filter(Boolean);
  const mid = Math.ceil(nonEmpty.length / 2);
  return [nonEmpty.slice(0, mid), nonEmpty.slice(mid)];
}

function fontClass(text: string) {
  if (/[\u0900-\u097F]/.test(text)) return "font-hindi";
  if (/[\u0980-\u09FF]/.test(text)) return "font-bengali";
  return "";
}

export default function AbohomanPoemPage({
  article,
  backHref,
}: {
  article: ArticleData;
  backHref: string;
}) {
  const bg = resolveCmsImageSrc(article.images?.[0]?.id ?? "");
  const [leftCol, rightCol] = splitColumns(article.paragraphs || []);
  const poemFont = fontClass(`${article.title} ${article.paragraphs.join(" ")}`);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 min-h-screen px-6 py-8 md:px-10 lg:px-14">
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Abohoman
          </Link>
        </div>

        <section className="mx-auto max-w-7xl rounded-xl border border-white/25 bg-black/25 px-5 py-6 backdrop-blur-[1px] md:px-8 md:py-8">
          <div className="text-center">
            <h1 className={`text-4xl font-black tracking-wide md:text-6xl ${poemFont}`}>{article.title}</h1>
            {article.excerpt ? (
              <p className={`mt-2 text-lg italic md:text-2xl ${poemFont}`}>({article.excerpt})</p>
            ) : null}
            <div className="mx-auto mt-5 h-[2px] w-11/12 bg-white/80" />
          </div>

          <div className={`mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 ${poemFont}`}>
            <div className="space-y-4 text-2xl leading-[1.45] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {leftCol.map((line, idx) => (
                <p key={`l-${idx}`} dangerouslySetInnerHTML={{ __html: line }} />
              ))}
            </div>
            <div className="space-y-4 text-2xl leading-[1.45] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {rightCol.map((line, idx) => (
                <p key={`r-${idx}`} dangerouslySetInnerHTML={{ __html: line }} />
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-end text-right">
            <p className="text-4xl font-extrabold tracking-wide">- {article.author.name}</p>
            {article.author.role ? (
              <p className="mt-1 text-xl font-semibold text-white/95">{article.author.role}</p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
