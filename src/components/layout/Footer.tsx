import { useSiteContent } from "@/src/context/SiteContentProvider";
import { cn } from "@/src/lib/utils";
import {
  resolveSocialHref,
  resolveSocialIcon,
  resolveSocialLabel,
} from "@/src/lib/socialIcons";
import { resolveMediaUrl } from "@/src/lib/mediaUrl";
import { scrollTopIfSamePath } from "@/src/lib/sameRouteScroll";
import { SiteText } from "@/src/components/site/SiteText";
import { Check, Copy, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
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
  /** Feedback do botão de copiar — o `mailto:` não avisa nada se falhar. */
  const [emailCopied, setEmailCopied] = useState(false);
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
            <Link
              to="/"
              onClick={scrollTopIfSamePath(location.pathname, "/")}
              className="flex items-center gap-2 mb-6 "
            >
              <img
                src={resolveMediaUrl(content.media.footerLogo)}
                alt="Logo"
                loading="lazy"
                decoding="async"
                className="w-24 mx-auto"
              />
            </Link>
            <SiteText
              as="p"
              path="footer.tagline"
              html
              className="text-eagle-muted text-sm leading-relaxed mb-6"
            />
            {socialLinks.length > 0 && (
              <div>
                {content.footer.socialTitle && (
                  <SiteText
                    as="h4"
                    path="footer.socialTitle"
                    className="font-heading font-semibold text-eagle-light mb-2 uppercase tracking-wider text-xs"
                  />
                )}
                {content.footer.socialDescription && (
                  <SiteText
                    as="p"
                    path="footer.socialDescription"
                    className="text-eagle-muted text-xs leading-relaxed mb-3"
                  />
                )}
                <div className="flex flex-wrap gap-2.5">
                  {socialLinks.map((s, i) => {
                    const Icon = resolveSocialIcon(s.platform);
                    const label = resolveSocialLabel(s.platform);
                    return (
                      <a
                        key={i}
                        href={resolveSocialHref(s.url)}
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
            <SiteText
              as="h4"
              path="footer.navTitle"
              className="font-heading font-semibold text-eagle-light mb-6 uppercase tracking-wider text-sm"
            />
            <ul className="space-y-4">
              <li>
                <Link
                  to="/"

                  onClick={scrollTopIfSamePath(location.pathname, "/")}
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  <SiteText path="footer.linkHome" />
                </Link>
              </li>
              <li>
                <Link
                  to="/sobre"

                  onClick={scrollTopIfSamePath(location.pathname, "/sobre")}
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  <SiteText path="footer.linkAbout" />
                </Link>
              </li>
              <li>
                <Link
                  to="/franquia"

                  onClick={scrollTopIfSamePath(location.pathname, "/franquia")}
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  <SiteText path="footer.linkFranchise" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Franchise */}
          <div>
            <SiteText
              as="h4"
              path="footer.franchiseColumnTitle"
              className="font-heading font-semibold text-eagle-light mb-6 uppercase tracking-wider text-sm"
            />
            <ul className="space-y-4">
              <li>
                <Link
                  to="/franquia"

                  onClick={scrollTopIfSamePath(location.pathname, "/franquia")}
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  <SiteText path="footer.franchiseLink1" />
                </Link>
              </li>
              <li>
                <Link
                  to="/franquia"

                  onClick={scrollTopIfSamePath(location.pathname, "/franquia")}
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  <SiteText path="footer.franchiseLink2" />
                </Link>
              </li>
              <li>
                <Link
                  to="/franquia"

                  onClick={scrollTopIfSamePath(location.pathname, "/franquia")}
                  className="text-eagle-muted hover:text-eagle-red transition-colors text-sm"
                >
                  <SiteText path="footer.franchiseLink3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <SiteText
              as="h4"
              path="footer.contactTitle"
              className="font-heading font-semibold text-eagle-light mb-6 uppercase tracking-wider text-sm"
            />
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
                      <SiteText path="footer.addressLine1" />
                      {addressLine1 && addressLine2 && <br />}
                      <SiteText path="footer.addressLine2" />
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
                    <SiteText path="footer.phone" />
                  </a>
                </li>
              )}
              {email.trim() && (
                <li className="flex items-center gap-2">
                  <a
                    href={`mailto:${email.trim()}`}
                    aria-label={`Enviar e-mail para ${email}`}
                    className="flex items-center gap-3 text-eagle-muted hover:text-eagle-red transition-colors text-sm break-all"
                  >
                    <Mail size={18} className="text-eagle-gold shrink-0" />
                    <SiteText path="footer.email" />
                  </a>
                  {/*
                    O `mailto:` só funciona em quem tem app de e-mail padrão
                    configurado — em muito desktop o clique não faz nada. O botão
                    de copiar é a saída para esse caso.
                  */}
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(email.trim())
                        .then(() => {
                          setEmailCopied(true);
                          setTimeout(() => setEmailCopied(false), 2000);
                        })
                        .catch(() => {
                          /* sem permissão de área de transferência */
                        });
                    }}
                    aria-label="Copiar endereço de e-mail"
                    title={emailCopied ? "E-mail copiado" : "Copiar e-mail"}
                    className="shrink-0 p-1 rounded text-eagle-muted hover:text-eagle-gold transition-colors"
                  >
                    {emailCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-eagle-gray pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <SiteText as="p" path="footer.copyrightName" className="text-eagle-muted text-xs">
            © {new Date().getFullYear()} {content.footer.copyrightName}. Todos
            os direitos reservados.
          </SiteText>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              to="/termos"

              onClick={scrollTopIfSamePath(location.pathname, "/termos")}
              className="text-eagle-muted hover:text-eagle-light text-xs transition-colors"
            >
              <SiteText path="footer.terms" />
            </Link>
            <Link
              to="/privacidade"

              onClick={scrollTopIfSamePath(location.pathname, "/privacidade")}
              className="text-eagle-muted hover:text-eagle-light text-xs transition-colors"
            >
              <SiteText path="footer.privacy" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
