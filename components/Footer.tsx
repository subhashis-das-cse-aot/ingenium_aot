import { Mail, MapPin, Phone, Facebook, Instagram, Twitter, Linkedin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { YearSectionKey } from "@/lib/cms"

type SectionSetting = {
  sectionKey: YearSectionKey;
  displayName: string;
  isHidden: boolean;
};

export default function FooterIndex({
  currentYear,
  sectionSettings,
}: {
  currentYear: number;
  sectionSettings: SectionSetting[];
}) {
  const settingsMap = new Map(sectionSettings.map((item) => [item.sectionKey, item]));
  const sectionLinks = [
    {
      key: "utkarshi" as const,
      href: `/year/${currentYear}/utkarshi`,
      label: settingsMap.get("utkarshi")?.displayName ?? "Utkarshi",
    },
    {
      key: "abohoman" as const,
      href: `/year/${currentYear}/abohoman`,
      label: settingsMap.get("abohoman")?.displayName ?? "Abohoman",
    },
    {
      key: "prayukti" as const,
      href: `/year/${currentYear}/prayukti`,
      label: settingsMap.get("prayukti")?.displayName ?? "Prayukti",
    },
    {
      key: "sarvagya" as const,
      href: `/year/${currentYear}/sarvagya`,
      label: settingsMap.get("sarvagya")?.displayName ?? "Sarvagya",
    },
  ].filter((item) => !settingsMap.get(item.key)?.isHidden);
  
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* About Section */}
          <div className="flex flex-col items-center md:items-start">
            <Image
              src="/images/ing-logo-trans.png"
              alt="Ingenium Logo"
              width={120}
              height={120}
              className="h-20 w-auto mb-4 brightness-0 invert hover:scale-105 transition-transform duration-300"
            />
            <p className="text-sm text-gray-400 mb-6 text-center md:text-left leading-relaxed">
              Official Web Magazine of Academy of Technology - Celebrating innovation, culture, and excellence in engineering education.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-3">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition-all duration-300 group"
              >
                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-all duration-300 group"
              >
                <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-400 transition-all duration-300 group"
              >
                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-700 transition-all duration-300 group"
              >
                <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 relative inline-block">
              Quick Links
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-blue-600"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white hover:translate-x-2 inline-block transition-all duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white hover:translate-x-2 inline-block transition-all duration-300">
                  All Articles
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-gray-400 hover:text-white hover:translate-x-2 inline-block transition-all duration-300">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-gray-400 hover:text-white hover:translate-x-2 inline-block transition-all duration-300">
                  Our Team
                </Link>
              </li>
              <li>
                <Link href="/editorial" className="text-gray-400 hover:text-white hover:translate-x-2 inline-block transition-all duration-300">
                  Editorial
                </Link>
              </li>
            </ul>
          </div>

          {/* Sections */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 relative inline-block">
              Sections
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-blue-600"></span>
            </h3>
            <ul className="space-y-3">
              {sectionLinks.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="text-gray-400 hover:text-white hover:translate-x-2 inline-block transition-all duration-300">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/archive" className="text-gray-400 hover:text-white hover:translate-x-2 inline-block transition-all duration-300">
                  Archive
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 relative inline-block">
              Contact Us
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-blue-600"></span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-gray-400 text-sm leading-relaxed">
                  Academy of Technology<br />
                  Adisaptagram, Hooghly<br />
                  West Bengal - 712121
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <Mail className="w-5 h-5 text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a 
                  href="mailto:ingenium@aot.edu.in" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  ingenium@aot.edu.in
                </a>
              </li>
              <li className="flex items-center gap-3 group">
                <Phone className="w-5 h-5 text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a 
                  href="tel:+916290761989" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  +91 62907 61989
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} Ingenium 4.0. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Use
              </Link>
              <Link href="/sitemap" className="hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
