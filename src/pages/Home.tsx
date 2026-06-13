import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useSiteContent } from "../context/SiteContentProvider";

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
          src={src}
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
  const secondHeroAlign = SECOND_HERO_ALIGN[secondHero.textAlign] ?? SECOND_HERO_ALIGN.center;

  // Triple the items for infinite loop
  const displayWorkouts = useMemo(
    () => [...workouts, ...workouts, ...workouts],
    [workouts],
  );

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount =
        scrollContainerRef.current.clientWidth > 768 ? 800 : 320;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

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
              src={heroImageUrl}
              alt=""
              referrerPolicy="no-referrer"
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
              className="w-full h-full object-cover"
            >
              <source src={heroVideoUrl} type="video/mp4" />
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
            src={content.media.homeSecondHeroBg}
            alt="Premium Gym Interior"
            className="w-full h-full"
            style={{
              objectFit: secondHero.objectFit,
              objectPosition: secondHero.objectPosition,
            }}
            referrerPolicy="no-referrer"
          />
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
            <span
              className="text-eagle-gold font-sans tracking-[0.3em] uppercase text-sm md:text-base mb-6 block font-medium"
              style={
                secondHero.eyebrowColor
                  ? { color: secondHero.eyebrowColor }
                  : undefined
              }
            >
              {content.home.hero.eyebrow}
            </span>
            <h1
              className="text-5xl md:text-7xl font-heading font-bold text-eagle-red leading-tight mb-8 drop-shadow-2xl"
              style={
                secondHero.titleColor
                  ? { color: secondHero.titleColor }
                  : undefined
              }
            >
              {content.home.hero.titleLine1}
              <br className="hidden md:block" />
              <span
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
              >
                {content.home.hero.titleHighlight}
              </span>
            </h1>
            <p
              className={`text-lg md:text-xl text-eagle-light/80 font-light max-w-2xl mb-12 leading-relaxed drop-shadow-md ${
                secondHero.textAlign === "center" ? "mx-auto" : ""
              }`}
              style={
                secondHero.subtitleColor
                  ? { color: secondHero.subtitleColor }
                  : undefined
              }
              dangerouslySetInnerHTML={{ __html: content.home.hero.subtitle }}
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
                {content.home.experience.titleLine1}
                <br />
                <span className="text-eagle-gold drop-shadow-lg">
                  {content.home.experience.titleLine2}
                </span>
              </h2>
              <p
                className="text-eagle-muted text-lg leading-relaxed mb-10"
                dangerouslySetInnerHTML={{ __html: content.home.experience.body }}
              />

              <ul className="space-y-6">
                {content.home.experience.bullets.map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <CheckCircle2
                      className="text-eagle-gold shrink-0 mt-1 drop-shadow-md"
                      size={24}
                    />
                    <span className="text-eagle-light/90 text-lg">{item}</span>
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
                src={content.media.homeExperienceImage}
                alt="Personal Trainer guiding client"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 border border-eagle-gold/30 m-6 rounded-3xl pointer-events-none"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Workout Types Carousel Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-vonique font-bold mb-4 text-eagle-black uppercase tracking-tight">
              {content.home.carousel.title}
            </h2>
            <p className="text-gray-500 text-sm italic">
              {content.home.carousel.footnote}
            </p>
          </div>

          <div className="relative group max-w-[1400px] mx-auto">
            {/* Side Fade Overlays - Increased for more prominence */}
            <div className="absolute left-0 top-0 bottom-12 w-64 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-12 w-64 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none"></div>

            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-6 md:gap-10 overflow-x-auto snap-x snap-mandatory pb-12 pt-4 px-[calc(50%-140px)] md:px-[calc(50%-190px)] hide-scrollbar"
            >
              {displayWorkouts.map((workout, idx) => (
                <div
                  key={`${workout.label}-${idx}`}
                  className="min-w-[280px] md:min-w-[380px] h-[480px] snap-center relative rounded-[2.5rem] shadow-xl overflow-hidden group/card border border-transparent hover:border-eagle-red/30 transition-all duration-500"
                >
                  <img
                    src={workout.img}
                    alt={workout.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Gradients */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent"></div>
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                  {/* Content Container */}
                  <div className="absolute bottom-0 left-0 w-full p-8 flex items-end">
                    <div className="flex items-center gap-4">
                      {/* Vertical Label */}
                      <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] md:text-[12px] font-sans font-bold uppercase tracking-[0.3em] text-white/90 border-r-2 border-white/30 pr-3 leading-none">
                        {workout.label}
                      </span>
                      {/* Main Title */}
                      <h3 className="text-xl md:text-4xl font-vonique font-bold text-white leading-[1.1] break-words max-w-[200px] md:max-w-[280px]">
                        {workout.title}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center items-center gap-16 mt-8">
              <button
                onClick={() => scroll("left")}
                className="w-56 h-[3rem] flex items-center justify-center border border-gray-300 rounded-full hover:border-black hover:bg-black hover:text-white text-black transition-all duration-500 group/btn"
                aria-label="Scroll left"
              >
                <span className="text-2xl group-hover/btn:-translate-x-3 transition-transform duration-300 font-black">
                  ←
                </span>
              </button>
              <button
                onClick={() => scroll("right")}
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
                src={content.media.homeFranchiseTeaserImage}
                alt="Franquia Eagle Center"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-eagle-black/80 via-transparent to-transparent"></div>
            </div>

            {/* Right: Text and CTA */}
            <div className="text-left">
              <span className="text-eagle-red font-sans tracking-[0.2em] uppercase text-sm font-semibold mb-6 block drop-shadow-md">
                {content.home.franchiseTeaser.eyebrow}
              </span>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-8 drop-shadow-lg leading-tight">
                {content.home.franchiseTeaser.titlePart1}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                  {content.home.franchiseTeaser.titleGradient}
                </span>
              </h2>
              <p
                className="text-eagle-muted text-xl leading-relaxed mb-12"
                dangerouslySetInnerHTML={{ __html: content.home.franchiseTeaser.body }}
              />

              <Button
                asChild
                size="lg"
                variant="default"
                className="h-16 px-12 text-lg shadow-xl shadow-eagle-red/20 hover:bg-eagle-red/80"
              >
                <Link to="/franquia">{content.home.franchiseTeaser.cta}</Link>
              </Button>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
