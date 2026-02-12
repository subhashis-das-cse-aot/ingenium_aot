import Home from "@/components/Home";
import { getCurrentYearData, getSectionSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { data, currentYear } = await getCurrentYearData();
  const sectionSettings = await getSectionSettings(currentYear);
  return <Home data={data} year={currentYear} sectionSettings={sectionSettings} />;
}
