import Link from "next/link";

import { getCurrentYearNumber, getPublicYears } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const [years, currentYear] = await Promise.all([getPublicYears(), getCurrentYearNumber()]);
  const availableYears = years;

  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <section className="max-w-4xl mx-auto px-6 space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Archive</h1>
        <p className="text-gray-600">Browse yearly issues. All archived years use the same homepage layout.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableYears.map((entry) => (
            <Link
              key={entry.year}
              href={`/year/${entry.year}`}
              className="border rounded px-4 py-3 text-center font-semibold hover:bg-gray-50"
            >
              {entry.year}
              {entry.year === currentYear ? " (Current)" : ""}
            </Link>
          ))}
        </div>

        {availableYears.length === 0 ? (
          <p className="text-sm text-gray-500">No years available yet. Create or archive from the admin panel.</p>
        ) : null}
      </section>
    </main>
  );
}
