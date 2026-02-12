import { notFound } from "next/navigation";

import SectionArticlesView from "@/components/SectionArticlesView";
import { getPublicYears, getSectionSettings, listSectionArticles } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ year: string }>;
};

export default async function YearSarvagyaPage({ params }: PageProps) {
  const { year } = await params;
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 3000) {
    notFound();
  }

  const years = await getPublicYears();
  if (!years.some((entry) => entry.year === numericYear)) {
    notFound();
  }

  const [articles, sectionSettings] = await Promise.all([
    listSectionArticles(numericYear, "sarvagya"),
    getSectionSettings(numericYear),
  ]);
  const label = sectionSettings.find((item) => item.sectionKey === "sarvagya")?.displayName;

  return <SectionArticlesView year={numericYear} section="sarvagya" sectionDisplayName={label} articles={articles} />;
}

