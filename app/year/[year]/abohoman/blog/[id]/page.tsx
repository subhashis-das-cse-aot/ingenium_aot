import { notFound } from "next/navigation";

import AbohomanPoemPage from "@/components/articles/AbohomanPoemPage";
import { getSectionArticleById } from "@/lib/queries";
import type { ArticleData } from "@/types/types";

type PageProps = {
  params: Promise<{ year: string; id: string }>;
};

export default async function YearAbohomanArticlePage({ params }: PageProps) {
  const { year, id } = await params;
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 3000) {
    notFound();
  }

  const article = await getSectionArticleById(numericYear, "abohoman", id);
  if (!article) {
    notFound();
  }

  const articleProps: ArticleData = {
    ...article,
    department: article.section,
  };

  return <AbohomanPoemPage article={articleProps} backHref={`/year/${numericYear}/abohoman`} />;
}
