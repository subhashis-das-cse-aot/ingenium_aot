import { redirect } from "next/navigation";

import { getCurrentYearNumber } from "@/lib/queries";

export default async function PrayuktiPage() {
  const year = await getCurrentYearNumber();
  redirect(`/year/${year}/prayukti`);
}
