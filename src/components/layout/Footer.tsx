import { useSiteContent } from "@/src/context/SiteContentProvider";
import { cn } from "@/src/lib/utils";
import { resolveSocialIcon, resolveSocialLabel } from "@/src/lib/socialIcons";
import { resolveMediaUrl } from "@/src/lib/mediaUrl";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

/** Só dígitos e '+' — formato aceito por tel:. */
function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

/**
 * Link do mapa: usa a URL configurada no Admin ou, se vazia, monta uma busca
 * no Google Maps com o endereço — funciona em iOS, Android e desktop.
 */
function mapsHref(mapsUrl: string, line1: string, line2: string) {
  if (mapsUrl.trim()) return mapsUrl.trim();
  const query = [line1, line2].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function Footer() {
  const { content } = useSiteContent();
  const location = useLocation();
  const isHome = location.pathname === "/";
  // Link vazio não vira ícone no site — é assim que se "esconde" uma rede.
  const socialLinks = content.footer.socialLinks.filter((s) => s.url.trim() !== "");
  const { addressLine1, addressLine2, phone, email, mapsUrl } = content.footer;
  const hasAddress = Boolean(addressLine1.trim() || addressLine2.trim());

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
                src={resolveMediaUrl(content.media.footerLogo)}
                alt="Logo"
                className="w-24 mx-auto"
              />
            </Link>
            <p
              className="text-eagle-muted text-sm leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: content.footer.tagline }}
            />
            {socialLinks.length > 0 && (
              <div>
                {content.footer.socialTitle && (
                  <h4 className="font-heading font-semibold text-eagle-light mb-2 uppercase tracking-wider text-xs">
                    {content.footer.socialTitle}
                  </h4>
                )}
                {content.footer.socialDescription && (
                  <p className="text-eagle-muted text-xs leading-relaxed mb-3">
                    {content.footer.socialDescription}
                  </p>
                )}
                <div className="flex flex-wrap gap-2.5">
                  {socialLinks.map((s, i) => {
                    const Icon = resolveSocialIcon(s.platform);
                    const label = resolveSocialLabel(s.platform);
                    return (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        title={label}
                        className="inline-flex items-center gap-2 rounded-xl border border-eagle-gray/70 bg-white/5 px-3 py-2 text-xs font-medium text-eagle-light hover:border-eagle-red hover:bg-eagle-red hover:text-white transition-colors"
                      >
                        <Icon size={18} />
                        <span>{label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
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
              {hasAddress && (
                <li>
                  <a
                    href={mapsHref(mapsUrl, addressLine1, addressLine2)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Abrir endereço no mapa"
                    className="flex items-start gap-3 text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                  >
                    <MapPin size={18} className="text-eagle-gold shrink-0 mt-0.5" />
                    <span>
                      {addressLine1}
                      {addressLine1 && addressLine2 && <br />}
                      {addressLine2}
                    </span>
                  </a>
                </li>
              )}
              {phone.trim() && (
                <li>
                  <a
                    href={telHref(phone)}
                    aria-label={`Ligar para ${phone}`}
                    className="flex items-center gap-3 text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                  >
                    <Phone size={18} className="text-eagle-gold shrink-0" />
                    <span>{phone}</span>
                  </a>
                </li>
              )}
              {email.trim() && (
                <li>
                  <a
                    href={`mailto:${email.trim()}`}
                    aria-label={`Enviar e-mail para ${email}`}
                    className="flex items-center gap-3 text-eagle-muted hover:text-eagle-red transition-colors text-sm break-all"
                  >
                    <Mail size={18} className="text-eagle-gold shrink-0" />
                    <span>{email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-eagle-gray pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-eagle-muted text-xs">
            © {new Date().getFullYear()} {content.footer.copyrightName}. Todos
            os direitos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              to="/termos"
              className="text-eagle-muted hover:text-eagle-light text-xs transition-colors"
            >
              {content.footer.terms}
            </Link>
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
