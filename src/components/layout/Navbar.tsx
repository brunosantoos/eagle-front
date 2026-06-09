import { useSiteContent } from "@/src/context/SiteContentProvider";
import { cn } from "@/src/lib/utils";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const { content } = useSiteContent();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = useMemo(
    () => [
      { name: content.nav.home, path: "/" },
      { name: content.nav.about, path: "/sobre" },
      { name: content.nav.franchise, path: "/franquia" },
    ],
    [content.nav],
  );

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white py-4 shadow-lg",
      )}
    >
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 group transition-opacity duration-300 shrink-0",
            !isScrolled && "opacity-100", // Logo is always visible now
          )}
        >
          <img src={content.media.navLogo} alt="Logo" className="w-20" />
          <img
            src={content.media.navEagle}
            alt="Logo"
            className="w-36 sm:w-44 md:w-48 lg:w-52"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-end gap-8 justify-end">
          {navLinks.map((link) => {
            const isFranchise = link.path === "/franquia";

            if (isFranchise) {
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "group relative overflow-hidden px-6 py-2 rounded-xl text-lg uppercase font-bold tracking-wider transition-all duration-300 border border-transparent",
                    isScrolled
                      ? "bg-eagle-red text-white hover:bg-eagle-gold hover:text-eagle-black hover:border-eagle-gold/70 shadow-[0_8px_24px_rgba(203,12,12,0.28)] hover:shadow-[0_12px_32px_rgba(224,198,128,0.5)]"
                      : "bg-eagle-red text-white hover:bg-eagle-gold hover:text-eagle-black hover:border-eagle-gold/70 shadow-[0_8px_24px_rgba(203,12,12,0.28)] hover:shadow-[0_12px_32px_rgba(224,198,128,0.5)]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-3 -bottom-1 h-2 rounded-full bg-eagle-gold/80 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  {link.name}
                </Link>
              );
            }

            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-xl uppercase font-semibold tracking-wider my-auto transition-colors hover:text-eagle-red",
                  location.pathname === link.path
                    ? "text-eagle-red"
                    : isScrolled
                      ? "text-black"
                      : "text-black",
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={cn(
            "md:hidden transition-colors hover:text-eagle-red text-black",
          )}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 p-6 flex flex-col gap-4 shadow-xl">
          {navLinks.map((link) => {
            const isFranchise = link.path === "/franquia";

            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-xl uppercase font-semibold tracking-wider py-3",
                  !isFranchise && "border-b border-gray-100",
                  isFranchise &&
                    "bg-eagle-red text-white text-center rounded-xl mt-4",
                  !isFranchise && location.pathname === link.path
                    ? "text-eagle-red"
                    : !isFranchise
                      ? "text-black"
                      : "",
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
