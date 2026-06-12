import { useSiteContent } from "@/src/context/SiteContentProvider";
import { cn } from "@/src/lib/utils";
import { Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Footer() {
  const { content } = useSiteContent();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <footer
      className={cn(
        "relative pt-20 pb-10 overflow-hidden",
        isHome
          ? "bg-eagle-black"
          : "bg-gradient-to-b from-zinc-800 via-eagle-dark to-black border-t border-eagle-gray",
      )}
    >
      {isHome && (
        <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/2 w-[800px] md:w-[1200px] h-[400px] md:h-[600px] bg-zinc-500/30 blur-[120px] md:blur-[150px] rounded-full pointer-events-none"></div>
      )}
      <div className="relative container mx-auto px-6 z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1 ">
            <Link to="/" className="flex items-center gap-2 mb-6 ">
              <img
                src={content.media.footerLogo}
                alt="Logo"
                className="w-24 mx-auto"
              />
            </Link>
            <p
              className="text-eagle-muted text-sm leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: content.footer.tagline }}
            />
            <div className="flex gap-4">
              <a
                href="#"
                className="text-eagle-muted hover:text-eagle-red transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-eagle-muted hover:text-eagle-red transition-colors"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-eagle-light mb-6 uppercase tracking-wider text-sm">
              {content.footer.navTitle}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/"
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  {content.footer.linkHome}
                </Link>
              </li>
              <li>
                <Link
                  to="/sobre"
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  {content.footer.linkAbout}
                </Link>
              </li>
              <li>
                <Link
                  to="/franquia"
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  {content.footer.linkFranchise}
                </Link>
              </li>
            </ul>
          </div>

          {/* Franchise */}
          <div>
            <h4 className="font-heading font-semibold text-eagle-light mb-6 uppercase tracking-wider text-sm">
              {content.footer.franchiseColumnTitle}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/franquia"
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  {content.footer.franchiseLink1}
                </Link>
              </li>
              <li>
                <Link
                  to="/franquia"
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  {content.footer.franchiseLink2}
                </Link>
              </li>
              <li>
                <Link
                  to="/franquia"
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  {content.footer.franchiseLink3}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-eagle-light mb-6 uppercase tracking-wider text-sm">
              {content.footer.contactTitle}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-eagle-muted text-sm">
                <MapPin size={18} className="text-eagle-gold shrink-0 mt-0.5" />
                <span>
                  {content.footer.addressLine1}
                  <br />
                  {content.footer.addressLine2}
                </span>
              </li>
              <li className="flex items-center gap-3 text-eagle-muted text-sm">
                <Phone size={18} className="text-eagle-gold shrink-0" />
                <span>{content.footer.phone}</span>
              </li>
              <li className="flex items-center gap-3 text-eagle-muted text-sm">
                <Mail size={18} className="text-eagle-gold shrink-0" />
                <span>{content.footer.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-eagle-gray pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-eagle-muted text-xs">
            © {new Date().getFullYear()} {content.footer.copyrightName}. Todos
            os direitos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href="#"
              className="text-eagle-muted hover:text-eagle-light text-xs transition-colors"
            >
              {content.footer.terms}
            </a>
            <Link
              to="/privacidade"
              className="text-eagle-muted hover:text-eagle-light text-xs transition-colors"
            >
              {content.footer.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
