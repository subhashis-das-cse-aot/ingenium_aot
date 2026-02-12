import { notFound } from "next/navigation";

import GalleryView from "@/components/GalleryView";
import { getPublicYears, listGalleryItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ year: string }>;
};

export default async function YearGalleryPage({ params }: PageProps) {
  const { year } = await params;
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 3000) {
    notFound();
  }

  const years = await getPublicYears();
  if (!years.some((entry) => entry.year === numericYear)) {
    notFound();
  }

  const items = await listGalleryItems(numericYear);
  return <GalleryView items={items} />;
}

