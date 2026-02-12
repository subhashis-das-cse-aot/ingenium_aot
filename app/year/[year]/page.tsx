import { notFound } from "next/navigation";

import Home from "@/components/Home";
import { getPublicYears, getSectionSettings, getYearData } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ year: string }>;
};

export default async function YearPage({ params }: PageProps) {
  const { year } = await params;
  const numericYear = Number(year);

  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 3000) {
    notFound();
  }

  const years = await getPublicYears();
  const exists = years.some((entry) => entry.year === numericYear);
  if (!exists) {
    notFound();
  }

  const data = await getYearData(numericYear);
  const sectionSettings = await getSectionSettings(numericYear);
  return <Home data={data} year={numericYear} sectionSettings={sectionSettings} />;
}

