import { redirect } from "next/navigation";

import { getCurrentYearNumber } from "@/lib/queries";

export default async function AbohomanPage() {
  const year = await getCurrentYearNumber();
  redirect(`/year/${year}/abohoman`);
}
