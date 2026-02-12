import { notFound } from "next/navigation";

import ArticlePage from "@/components/articles/ArticlePage";
import { getSectionArticleById } from "@/lib/queries";
import type { ArticleData } from "@/types/types";

type PageProps = {
  params: Promise<{ year: string; id: string }>;
};

export default async function YearUtkarshiArticlePage({ params }: PageProps) {
  const { year, id } = await params;
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 3000) {
    notFound();
  }

  const article = await getSectionArticleById(numericYear, "utkarshi", id);
  if (!article) {
    notFound();
  }

  const articleProps: ArticleData = {
    ...article,
    department: article.section,
  };

  return <ArticlePage article={articleProps} section={`year/${numericYear}/utkarshi`} />;
}
