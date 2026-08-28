import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useSiteContent } from "../context/SiteContentProvider";
import { resolveMediaUrl, resolvePosterUrl } from "../lib/mediaUrl";
import { blurStyle, getMediaEffect, MediaMask } from "../lib/mediaEffects";
import { SiteText } from "../components/site/SiteText";

function HeroImageCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0">
      {images.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={resolveMediaUrl(src)}
          alt=""
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Imagem ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const SECOND_HERO_ALIGN: Record<
  "left" | "center" | "right",
  { container: string; text: string }
> = {
  left: { container: "items-start", text: "text-left" },
  center: { container: "items-center", text: "text-center" },
  right: { container: "items-end", text: "text-right" },
};

/**
 * Velocidade do giro contínuo do carrossel, em pixels por segundo.
 *
 * Devagar de propósito: o movimento é ambientação, não navegação. Rápido
 * demais e a pessoa não consegue ler o card enquanto ele passa.
 */
const CAROUSEL_SPEED_PX_PER_SEC = 26;

/**
 * Quanto o giro automático espera depois que a pessoa mexe no carrossel.
 * Sem isso o automático "briga" com quem está navegando na mão.
 */
const CAROUSEL_RESUME_MS = 8000;

export default function Home() {
  const { content } = useSiteContent();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const workouts = content.home.workouts;
  const heroMedia = content.home.heroMedia;
  const heroVideoUrl = heroMedia.videoUrl || content.media.homeHeroVideo;
  const heroImageUrl = heroMedia.imageUrl;
  const heroCarouselImages = useMemo(
    () => heroMedia.carouselImages.filter(Boolean),
    [heroMedia.carouselImages],
  );
  const secondHero = content.home.secondHero;
  const carousel = content.home.carousel;
  const secondHeroEffect = getMediaEffect(content, 'homeSecondHeroBg');
  const experienceEffect = getMediaEffect(content, 'homeExperienceImage');
  const teaserEffect = getMediaEffect(content, 'homeFranchiseTeaserImage');
  const clampPct = (n: number) => Math.min(100, Math.max(0, n)) / 100;
  const secondHeroAlign = SECOND_HERO_ALIGN[secondHero.textAlign] ?? SECOND_HERO_ALIGN.center;

  // Triple the items for infinite loop
  const displayWorkouts = useMemo(
    () => [...workouts, ...workouts, ...workouts],
    [workouts],
  );

  /** true enquanto o ponteiro está sobre o carrossel. */
  const [carouselHovered, setCarouselHovered] = useState(false);
  /** Momento a partir do qual o automático pode voltar (ver CAROUSEL_RESUME_MS). */
  const autoplayResumeAtRef = useRef(0);

  /**
   * Largura de um card + o espaço entre eles, lida do próprio DOM.
   *
   * Medir em vez de chutar um número fixo é o que faz um clique (ou um passo do
   * automático) andar exatamente uma imagem em qualquer tela — o container tem
   * `snap-center`, então parar no meio de dois cards deixaria o giro torto.
   */
  const carouselStep = useCallback(() => {
    const container = scrollContainerRef.current;
    const card = container?.firstElementChild as HTMLElement | null;
    if (!container || !card) return 320;
    const styles = window.getComputedStyle(container);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return card.offsetWidth + gap;
  }, []);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const amount = carouselStep();
      container.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    },
    [carouselStep],
  );

  /** Segura o automático por um tempo depois de uma ação da pessoa. */
  const holdAutoplay = useCallback(() => {
    autoplayResumeAtRef.current = Date.now() + CAROUSEL_RESUME_MS;
  }, []);

  /**
   * Giro contínuo, alguns pixels por quadro.
   *
   * `requestAnimationFrame` em vez de um `setInterval` que pula um card por vez:
   * o passo grande dava um solavanco a cada intervalo, e aqui o movimento é
   * ambientação — tem que passar despercebido. O deslocamento é calculado pelo
   * tempo decorrido, não por quadro, senão a velocidade mudaria conforme a taxa
   * de atualização da tela (60 Hz, 120 Hz, aba ocupada).
   *
   * Não roda com o ponteiro em cima (a pessoa está olhando o card), com a aba
   * em segundo plano (rolar escondido só gasta bateria e bagunça a posição) nem
   * para quem pediu menos animação no sistema.
   */
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || workouts.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let previous = performance.now();
    // Sobra de menos de 1px entre quadros. Sem acumular, o navegador que
    // arredonda `scrollLeft` engoliria o movimento e o carrossel ficaria parado.
    let pending = 0;

    const step = (now: number) => {
      const elapsed = now - previous;
      previous = now;
      frame = requestAnimationFrame(step);

      if (carouselHovered || document.hidden) return;
      if (Date.now() < autoplayResumeAtRef.current) return;

      pending += (CAROUSEL_SPEED_PX_PER_SEC * elapsed) / 1000;
      const whole = Math.floor(pending);
      if (whole < 1) return;
      pending -= whole;
      container.scrollLeft += whole;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [workouts.length, carouselHovered]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Set initial position to middle set
    const setInitialPosition = () => {
      const oneThird = container.scrollWidth / 3;
      container.scrollLeft = oneThird;
    };

    // Need a slight delay for content to render and dimensions to be accurate
    const timer = setTimeout(setInitialPosition, 50);

    const handleScroll = () => {
      const { scrollLeft, scrollWidth } = container;
      const oneThird = scrollWidth / 3;

      // When reaching near boundaries of middle set, jump to corresponding position in middle
      if (scrollLeft < 10) {
        container.scrollLeft = oneThird + scrollLeft;
      } else if (scrollLeft > oneThird * 2 - 10) {
        container.scrollLeft = scrollLeft - oneThird;
      }
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", setInitialPosition);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", setInitialPosition);
      clearTimeout(timer);
    };
  }, [workouts, content.media.homeHeroVideo]);

  return (
    <div className="w-full">
      {/* New Primary Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col justify-end pb-16 md:pb-24 pt-32 overflow-hidden">
        {/* Background media — tipo escolhido no Admin (vídeo, imagem única ou carrossel) */}
        <div className="absolute inset-0 z-0">
          {heroMedia.type === "image" && heroImageUrl ? (
            <img
              src={resolveMediaUrl(heroImageUrl)}
              alt=""
              referrerPolicy="no-referrer"
              // Hero: primeira imagem visível, nunca lazy.
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : heroMedia.type === "carousel" && heroCarouselImages.length > 0 ? (
            <HeroImageCarousel images={heroCarouselImages} />
          ) : (
            <video
              key={heroVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              // Poster pinta o hero no primeiro frame de render; sem ele a tela
              // fica preta até o vídeo chegar.
              poster={resolvePosterUrl(heroVideoUrl)}
              preload="metadata"
              className="w-full h-full object-cover"
            >
              <source src={resolveMediaUrl(heroVideoUrl)} type="video/mp4" />
            </video>
          )}
          {/* Overlay gradient to ensure text readability */}
          {/* Stronger bottom gradient merging with the page dark theme for a smooth transition */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-eagle-black"></div>
        </div>

        {/* Glow effect matching the footer */}
        <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/2 w-[800px] md:w-[1200px] h-[400px] md:h-[600px] bg-zinc-500/20 blur-[120px] md:blur-[150px] rounded-full pointer-events-none z-0"></div>
      </section>

      {/* Second Section (Former Hero) */}
      <section className="relative min-h-[100vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-eagle-black">
        {/* Background Image — corte, posição e máscara configuráveis no Admin */}
        <div className="absolute inset-0 z-0">
          <img
            src={resolveMediaUrl(content.media.homeSecondHeroBg)}
            alt="Premium Gym Interior"
            loading="lazy"
            decoding="async"
            className="w-full h-full"
            style={{
              objectFit: secondHero.objectFit,
              objectPosition: secondHero.objectPosition,
              ...blurStyle(secondHeroEffect),
            }}
            referrerPolicy="no-referrer"
          />
          <MediaMask effect={secondHeroEffect} />
          {secondHero.overlayEnabled && (
            <div
              className="absolute inset-0 bg-eagle-black"
              style={{
                opacity:
                  Math.min(100, Math.max(0, secondHero.overlayOpacity)) / 100,
              }}
            ></div>
          )}
          {/* Top fade blending with the video banner above */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-eagle-black via-eagle-black/80 to-transparent"></div>
        </div>
        <div
          className={`container mx-auto px-6 relative z-10 flex flex-col ${secondHeroAlign.container} ${secondHeroAlign.text}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <SiteText
              path="home.hero.eyebrow"
              className="text-eagle-gold font-sans tracking-[0.3em] uppercase text-sm md:text-base mb-6 block font-medium"
              style={
                secondHero.eyebrowColor
                  ? { color: secondHero.eyebrowColor }
                  : undefined
              }
            />
            <h1
              className="text-5xl md:text-7xl font-heading font-bold text-eagle-red leading-tight mb-8 drop-shadow-2xl"
              style={
                secondHero.titleColor
                  ? { color: secondHero.titleColor }
                  : undefined
              }
            >
              <SiteText path="home.hero.titleLine1" />
              <br className="hidden md:block" />
              <SiteText
                path="home.hero.titleHighlight"
                className={
                  secondHero.highlightColor
                    ? undefined
                    : "text-transparent bg-clip-text bg-gradient-to-r from-eagle-gold to-yellow-600"
                }
                style={
                  secondHero.highlightColor
                    ? { color: secondHero.highlightColor }
                    : undefined
                }
              />
            </h1>
            <SiteText
              as="p"
              path="home.hero.subtitle"
              html
              className={`text-lg md:text-xl text-eagle-light/80 font-light max-w-2xl mb-12 leading-relaxed drop-shadow-md ${
                secondHero.textAlign === "center" ? "mx-auto" : ""
              }`}
              style={
                secondHero.subtitleColor
                  ? { color: secondHero.subtitleColor }
                  : undefined
              }
            />
          </motion.div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-32 bg-gradient-to-b from-zinc-900 via-eagle-dark to-eagle-black relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-8 leading-tight">
                <SiteText path="home.experience.titleLine1" />
                <br />
                <SiteText
                  path="home.experience.titleLine2"
                  className="text-eagle-gold drop-shadow-lg"
                />
              </h2>
              <SiteText
                as="p"
                path="home.experience.body"
                html
                className="text-eagle-muted text-lg leading-relaxed mb-10"
              />

              <ul className="space-y-6">
                {content.home.experience.bullets.map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <CheckCircle2
                      className="text-eagle-gold shrink-0 mt-1 drop-shadow-md"
                      size={24}
                    />
                    <SiteText
                      path={`home.experience.bullets.${index}`}
                      value={item}
                      className="text-eagle-light/90 text-lg"
                    />
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative h-[600px] rounded-3xl shadow-2xl overflow-hidden"
            >
              <img
                src={resolveMediaUrl(content.media.homeExperienceImage)}
                alt="Personal Trainer guiding client"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                style={blurStyle(experienceEffect)}
                referrerPolicy="no-referrer"
              />
              <MediaMask effect={experienceEffect} />
              <div className="absolute inset-0 border border-eagle-gold/30 m-6 rounded-3xl pointer-events-none"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Workout Types Carousel Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <SiteText
              as="h2"
              path="home.carousel.title"
              className="text-3xl md:text-4xl font-vonique font-bold mb-4 text-eagle-black uppercase tracking-tight"
              style={carousel.titleColor ? { color: carousel.titleColor } : undefined}
            />
            <SiteText
              as="p"
              path="home.carousel.footnote"
              className="text-gray-500 text-sm italic"
              style={carousel.footnoteColor ? { color: carousel.footnoteColor } : undefined}
            />
          </div>

          <div
            className="relative group max-w-[1400px] mx-auto"
            onMouseEnter={() => setCarouselHovered(true)}
            onMouseLeave={() => setCarouselHovered(false)}
            onPointerDown={holdAutoplay}
          >
            {/* Side Fade Overlays - Increased for more prominence */}
            <div
              className="absolute left-0 top-0 bottom-12 w-64 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none"
              style={{ opacity: clampPct(carousel.sideFadeOpacity) }}
            ></div>
            <div
              className="absolute right-0 top-0 bottom-12 w-64 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none"
              style={{ opacity: clampPct(carousel.sideFadeOpacity) }}
            ></div>

            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              // Sem `snap-x snap-mandatory`: o encaixe obrigatório puxa o
              // container de volta para o card mais próximo a cada quadro e o
              // giro contínuo vira tremedeira.
              className="flex gap-6 md:gap-10 overflow-x-auto pb-12 pt-4 px-[calc(50%-140px)] md:px-[calc(50%-190px)] hide-scrollbar"
            >
              {displayWorkouts.map((workout, idx) => {
                // O carrossel repete a lista três vezes para o giro ficar
                // contínuo; a formatação pertence ao card original.
                const cardIndex = workouts.length
                  ? idx % workouts.length
                  : idx;
                return (
                <div
                  key={`${workout.label}-${idx}`}
                  className="min-w-[280px] md:min-w-[380px] h-[480px] relative rounded-[2.5rem] shadow-xl overflow-hidden group/card border border-transparent hover:border-eagle-red/30 transition-all duration-500"
                >
                  <img
                    src={resolveMediaUrl(workout.img)}
                    alt={workout.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Gradients */}
                  <div
                    className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white to-transparent"
                    style={{ opacity: clampPct(carousel.cardOverlayOpacity) }}
                  ></div>
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                  {/* Content Container */}
                  <div className="absolute bottom-0 left-0 w-full p-8 flex items-end">
                    <div className="flex items-center gap-4">
                      {/* Vertical Label */}
                      <SiteText
                        path={`home.workouts.${cardIndex}.label`}
                        value={workout.label}
                        className="[writing-mode:vertical-rl] rotate-180 font-sans font-bold uppercase tracking-[0.3em] text-white/90 border-r-2 border-white/30 pr-3 leading-none"
                        style={{
                          fontSize: `${Math.min(32, Math.max(8, carousel.cardLabelFontSize))}px`,
                          ...(carousel.cardLabelColor ? { color: carousel.cardLabelColor } : {}),
                        }}
                      />
                      {/* Main Title */}
                      <SiteText
                        as="h3"
                        path={`home.workouts.${cardIndex}.title`}
                        value={workout.title}
                        className="font-vonique font-bold text-white leading-[1.1] break-words max-w-[200px] md:max-w-[280px]"
                        style={{
                          // clamp evita que um tamanho alto corte o texto no mobile
                          fontSize: `clamp(${Math.round(
                            Math.min(72, Math.max(12, carousel.cardTitleFontSize)) * 0.6,
                          )}px, 5vw, ${Math.min(72, Math.max(12, carousel.cardTitleFontSize))}px)`,
                          ...(carousel.cardTitleColor ? { color: carousel.cardTitleColor } : {}),
                        }}
                      />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center items-center gap-16 mt-8">
              <button
                onClick={() => {
                  holdAutoplay();
                  scroll("left");
                }}
                className="w-56 h-[3rem] flex items-center justify-center border border-gray-300 rounded-full hover:border-black hover:bg-black hover:text-white text-black transition-all duration-500 group/btn"
                aria-label="Scroll left"
              >
                <span className="text-2xl group-hover/btn:-translate-x-3 transition-transform duration-300 font-black">
                  ←
                </span>
              </button>
              <button
                onClick={() => {
                  holdAutoplay();
                  scroll("right");
                }}
                className="w-56 h-[3rem] flex items-center justify-center border border-gray-300 rounded-full hover:border-black hover:bg-black hover:text-white text-black transition-all duration-500 group/btn"
                aria-label="Scroll right"
              >
                <span className="text-2xl group-hover/btn:translate-x-3 transition-transform duration-300 font-black">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Franchise Teaser Section */}
      <section className="relative py-32 bg-eagle-black border-t border-eagle-gray overflow-hidden">
        {/* Glow effect at the bottom right - increased size and blur */}
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/2 w-[800px] md:w-[1200px] h-[400px] md:h-[600px] bg-zinc-500/30 blur-[120px] md:blur-[150px] rounded-full pointer-events-none"></div>

        <div className="relative container mx-auto px-6 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Static Banner (735x791 aspect ratio) */}
            <div className="relative w-full aspect-[735/791] rounded-3xl overflow-hidden shadow-2xl border border-eagle-gray">
              <img
                src={resolveMediaUrl(content.media.homeFranchiseTeaserImage)}
                alt="Franquia Eagle Center"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                style={blurStyle(teaserEffect)}
                referrerPolicy="no-referrer"
              />
              <MediaMask effect={teaserEffect} />
              <div className="absolute inset-0 bg-gradient-to-t from-eagle-black/80 via-transparent to-transparent"></div>
            </div>

            {/* Right: Text and CTA */}
            <div className="text-left">
              <SiteText
                path="home.franchiseTeaser.eyebrow"
                className="text-eagle-red font-sans tracking-[0.2em] uppercase text-sm font-semibold mb-6 block drop-shadow-md"
              />
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-8 drop-shadow-lg leading-tight">
                <SiteText path="home.franchiseTeaser.titlePart1" />
                <SiteText
                  path="home.franchiseTeaser.titleGradient"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500"
                />
              </h2>
              <SiteText
                as="p"
                path="home.franchiseTeaser.body"
                html
                className="text-eagle-muted text-xl leading-relaxed mb-12"
              />

              <Button
                asChild
                size="lg"
                variant="default"
                className="h-16 px-12 text-lg shadow-xl shadow-eagle-red/20 hover:bg-eagle-red/80"
              >
                <Link to="/franquia">
                  <SiteText path="home.franchiseTeaser.cta" />
                </Link>
              </Button>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
