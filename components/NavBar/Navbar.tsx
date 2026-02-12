/* eslint-disable @next/next/no-img-element */
"use client";
// ======================== Imports ========================
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import AnimatedHamburgerButton from "./Hamburger";
import { motion, AnimatePresence } from "framer-motion";
import type { YearSectionKey } from "@/lib/cms";

type SectionSetting = {
  sectionKey: YearSectionKey;
  displayName: string;
  isHidden: boolean;
};

type NavbarProps = {
  currentYear: number;
  sectionSettings: SectionSetting[];
};

// =================== Nav Bar ===================
const Navbar = ({ currentYear, sectionSettings }: NavbarProps) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const currentRoute = usePathname();
  const divRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    // Check if the clicked or touched target is outside the div
    if (divRef.current && !divRef.current.contains(event.target as Node)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
    // Add event listeners for both desktop (mousedown) and mobile (touchstart)
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    // Track scrolling to add shadow and background
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Clean up the event listeners on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [currentRoute]);

  // =================== Return ===================
  return (
    <>
      <nav
        ref={divRef}
        className={`fixed top-0 w-full pt-2 z-900 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 shadow-md shadow-slate-300 backdrop-blur-sm"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto flex items-center font-medium justify-between h-12 relative px-4 gap-8">
          {/* ========== Logo left ========== */}
          <div className="z-20 text-white text-lg w-fit">
            <Link href="/">
              <img
                src={"/images/logo.png"}
                alt="Logo"
                className="h-10 sm:h-10 transition-transform duration-300 hover:scale-110"
              />
            </Link>
          </div>

          {/* =================== Top Bar =================== */}
          <div className="lg:flex items-center gap-6 hidden font-medium mx-auto">
            <LinksSection currentRoute={currentRoute} currentYear={currentYear} sectionSettings={sectionSettings} />
          </div>

          <div className="z-20 text-white text-lg w-fit">
            <Link href="/">
              <img
                src={"/images/aotlogo.svg"}
                alt="Logo"
                className="h-10 sm:h-10 transition-transform duration-300 hover:scale-110"
              />
            </Link>
          </div>

          <div className="lg:hidden z-1000">
            <AnimatedHamburgerButton
              onToggle={toggleMenu}
              toggled={isMenuOpen}
            />
          </div>
        </div>

        {/* =================== Side Menu =================== */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            >
              <motion.div
                className="bg-white p-8 h-screen w-64 max-w-[80%] absolute top-0 right-0 z-901"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-6 items-start mt-12">
                  <LinksSection currentRoute={currentRoute} currentYear={currentYear} sectionSettings={sectionSettings} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;

{
  /* =================== Links =================== */
}
function normalizeSectionPathKey(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts[0] === "year") {
    if (parts.length >= 3) return parts[2];
    return "year";
  }
  return parts[0];
}

function getActiveYear(pathname: string, fallbackYear: number) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "year") return fallbackYear;
  const maybeYear = Number(parts[1]);
  if (!Number.isInteger(maybeYear)) return fallbackYear;
  return maybeYear;
}

function isYearRoute(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "year" && Number.isInteger(Number(parts[1]));
}

function linkClass(active: boolean) {
  return `relative text-black text-base font-medium transition-all duration-300 hover:text-ingeniumbrand ${
    active
      ? "text-ingeniumbrand after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-ingeniumbrand"
      : "hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:w-full hover:after:h-0.5 hover:after:bg-ingeniumbrand hover:after:scale-x-100 hover:after:origin-left hover:after:transition-transform hover:after:duration-300 after:scale-x-0"
  }`;
}

const LinksSection = ({
  currentRoute,
  currentYear,
  sectionSettings,
}: {
  currentRoute: string;
  currentYear: number;
  sectionSettings: SectionSetting[];
}) => {
  const activeYear = getActiveYear(currentRoute, currentYear);
  const onYearRoute = isYearRoute(currentRoute);
  const activePathKey = normalizeSectionPathKey(currentRoute);
  const settingMap = new Map(sectionSettings.map((item) => [item.sectionKey, item]));
  const archiveHref = "/archive";
  const showCurrentYearButton = onYearRoute && activeYear !== currentYear;

  const sectionLinks = [
    { key: "utkarshi" as const, href: `/year/${activeYear}/utkarshi`, label: settingMap.get("utkarshi")?.displayName ?? "Utkarshi" },
    { key: "abohoman" as const, href: `/year/${activeYear}/abohoman`, label: settingMap.get("abohoman")?.displayName ?? "Abohoman" },
    { key: "prayukti" as const, href: `/year/${activeYear}/prayukti`, label: settingMap.get("prayukti")?.displayName ?? "Prayukti" },
    { key: "sarvagya" as const, href: `/year/${activeYear}/sarvagya`, label: settingMap.get("sarvagya")?.displayName ?? "Sarvagya" },
    { key: "archive" as const, href: archiveHref, label: "Archive" },
    { key: "projects" as const, href: `/year/${activeYear}/projects`, label: settingMap.get("projects")?.displayName ?? "Projects" },
    { key: "gallery" as const, href: `/year/${activeYear}/gallery`, label: settingMap.get("gallery")?.displayName ?? "Gallery" },
  ];

  const visibleLinks = sectionLinks.filter((item) => {
    if (item.key === "archive") return true;
    return !settingMap.get(item.key as YearSectionKey)?.isHidden;
  });

  return (
    <>
      {showCurrentYearButton ? (
        <Link
          href={`/year/${currentYear}`}
          className="text-sm px-3 py-1.5 rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          Current Year
        </Link>
      ) : null}
      {visibleLinks.map((item) => {
        const active =
          item.key === "archive"
            ? activePathKey === "archive" || (onYearRoute && activePathKey === "year")
            : activePathKey === item.key;
        return (
          <Link key={item.key} href={item.href} className={linkClass(active)}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
};
