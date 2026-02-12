import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
} from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import Navbar from "@/components/NavBar/Navbar";
import FooterIndex from "@/components/Footer";
import { getCurrentYearNumber, getSectionSettings } from "@/lib/queries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-sans-bengali",
  subsets: ["bengali"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-sans-devanagari",
  subsets: ["devanagari"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Ingenium 4.O",
  description: "Thoughts, Stories, Ideas",
  icons: {
    icon: "/images/ing-logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let currentYear = new Date().getFullYear();
  let sectionSettings: Awaited<ReturnType<typeof getSectionSettings>> = [];

  try {
    currentYear = await getCurrentYearNumber();
    sectionSettings = await getSectionSettings(currentYear);
  } catch {
    // Keep layout renderable during build/startup if DB schema is not ready yet.
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansBengali.variable} ${notoSansDevanagari.variable} antialiased`}
      >
        <NextTopLoader
          color="#9333ea"
          initialPosition={0.08}
          height={6}
          crawl={true}
          showSpinner={false}
        />
        <Navbar currentYear={currentYear} sectionSettings={sectionSettings} />
        <div className="min-h-screen w-full md:w-11/12 mx-auto px-1 sm:px-4">
          {children}
        </div>
        <FooterIndex currentYear={currentYear} sectionSettings={sectionSettings} />{" "}
      </body>
    </html>
  );
}
