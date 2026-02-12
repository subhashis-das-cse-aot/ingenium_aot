export const CMS_SECTIONS = [
  "utkarshi",
  "abohoman",
  "prayukti",
  "sarvagya",
] as const;

export type CmsSection = (typeof CMS_SECTIONS)[number];

export const YEAR_SECTION_KEYS = [
  "utkarshi",
  "abohoman",
  "prayukti",
  "sarvagya",
  "gallery",
  "projects",
] as const;

export type YearSectionKey = (typeof YEAR_SECTION_KEYS)[number];

export type CmsArticle = {
  id: string;
  year: number;
  section: CmsSection;
  title: string;
  excerpt: string;
  department: CmsSection;
  date: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  paragraphs: string[];
  images: Array<{
    id: string;
    caption?: string;
    position: number;
  }>;
};

export type HomeData = Record<CmsSection, CmsArticle[]>;

export function blankHomeData(): HomeData {
  return {
    utkarshi: [],
    abohoman: [],
    prayukti: [],
    sarvagya: [],
  };
}

export function isCmsSection(value: string): value is CmsSection {
  return CMS_SECTIONS.includes(value as CmsSection);
}

export function isYearSectionKey(value: string): value is YearSectionKey {
  return YEAR_SECTION_KEYS.includes(value as YearSectionKey);
}

export function resolveCmsImageSrc(input: string): string {
  const value = input?.trim() ?? "";
  if (!value) return "/images/placeholder.jpg";

  if (
    value.startsWith("data:image/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  ) {
    return value;
  }

  if (value.startsWith("d/")) {
    return `https://drive.google.com/uc?export=view&id=${value.slice(2)}`;
  }

  return `https://lh3.googleusercontent.com/${value}`;
}
