import {
  BarChart3,
  Building2,
  GraduationCap,
  Handshake,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { useSiteContent } from "../context/SiteContentProvider";
import { useToast } from "../context/ToastProvider";
import { resolveCardIcon } from "../lib/cardIcons";
import { trpc } from "../lib/trpc";

const whyIcons = [TrendingUp, Building2, Handshake] as const;
const supportIcons = [MapPin, GraduationCap, BarChart3] as const;

export default function Franchise() {
  const { content } = useSiteContent();
  const { success, error } = useToast();
  const f = content.franchise;

  const createLead = trpc.franchiseLeads.create.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    capital: "",
    city: "",
  });

  const whyCards = useMemo(
    () =>
      f.whyCards.map((card, idx) => ({
        ...card,
        icon: resolveCardIcon(card.icon, whyIcons[idx] ?? TrendingUp),
      })),
    [f.whyCards],
  );

  const supportItems = useMemo(
    () =>
      f.supportItems.map((item, idx) => ({
        ...item,
        icon: resolveCardIcon(item.icon, supportIcons[idx] ?? MapPin),
      })),
    [f.supportItems],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createLead.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        capital: formData.capital,
      });
      success(f.formSuccessMessage);
      setFormData({ name: '', email: '', phone: '', capital: '', city: '' });
    } catch {
      error('Não foi possível enviar. Tente de novo.');
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full pt-18">
      <section className="relative min-h-[115vh] pt-20 lg:pt-20 pb-20 bg-gradient-to-l from-zinc-700 via-eagle-dark to-black border-b border-eagle-gray overflow-hidden">
        <div className="absolute right-0 top-0 w-full lg:w-1/2 h-full opacity-20 lg:opacity-30 pointer-events-none">
          <div className="absolute inset-0 z-10 bg-gradient-to-l from-eagle-black to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 pt-0 lg:pt-8"
            >
              <span className="text-eagle-red font-sans tracking-[0.2em] uppercase text-sm font-semibold mb-6 block">
                {f.heroEyebrow}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-8 text-eagle-red">
                {f.heroTitleBefore}
                <span className="text-eagle-gold">{f.heroTitleHighlight}</span>
              </h1>
              <p
                className="text-lg text-eagle-light/80 leading-relaxed mb-10 max-w-xl"
                dangerouslySetInnerHTML={{ __html: f.heroBody }}
              />
              <Button
                asChild
                size="lg"
                variant="default"
                className="px-10 shadow-xl shadow-eagle-red/20"
              >
                <a href="#formulario">{f.heroCta}</a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative w-[calc(100%-2rem)] max-w-[360px] sm:max-w-[400px] lg:max-w-[420px] aspect-[9/16] lg:max-h-[78vh] mx-auto lg:ml-auto lg:mr-0 rounded-3xl overflow-hidden shadow-2xl border border-eagle-gray/50 lg:col-span-6"
            >
              <video
                key={content.media.franchiseHeroVideo}
                className="w-full h-full object-cover"
                src={content.media.franchiseHeroVideo}
                autoPlay
                loop
                playsInline
                controls
                preload="auto"
              ></video>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6 text-eagle-black">
              {f.whyTitle}
            </h2>
            <p
              className="text-gray-600 text-lg"
              dangerouslySetInnerHTML={{ __html: f.whyBody }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyCards.map((item, idx) => (
              <motion.div
                key={`${item.title}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-gray-50 p-8 rounded-3xl shadow-lg border border-gray-100 hover:border-eagle-red/50 transition-colors"
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-gray-100">
                  <item.icon
                    className="text-eagle-red drop-shadow-sm"
                    size={32}
                  />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-4 text-eagle-black">
                  {item.title}
                </h3>
                <p
                  className="text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.desc }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-zinc-900 via-eagle-dark to-eagle-black border-y border-eagle-gray">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-8">
                {f.supportTitle}
              </h2>
              <p
                className="text-eagle-muted text-lg mb-10"
                dangerouslySetInnerHTML={{ __html: f.supportBody }}
              />

              <ul className="space-y-8">
                {supportItems.map((item, idx) => (
                  <li key={`${item.title}-${idx}`} className="flex gap-6">
                    <div className="w-14 h-14 bg-eagle-gray rounded-2xl shadow-lg flex items-center justify-center shrink-0">
                      <item.icon className="text-eagle-gold" size={28} />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-lg mb-2">
                        {item.title}
                      </h4>
                      <p
                        className="text-eagle-muted"
                        dangerouslySetInnerHTML={{ __html: item.desc }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-eagle-dark p-10 rounded-3xl shadow-2xl border border-eagle-gray">
              <h3 className="text-2xl font-heading font-bold mb-6 text-center">
                {f.numbersTitle}
              </h3>
              <div className="space-y-6">
                {f.numbers.map((n, i) => {
                  const isLast = i === f.numbers.length - 1;
                  const valueCls = i === 0 ? 'text-eagle-gold' : 'text-eagle-light';
                  return (
                    <div
                      key={i}
                      className={`flex justify-between items-center ${isLast ? 'pb-2' : 'border-b border-eagle-gray/50 pb-4'}`}
                    >
                      <span className="text-eagle-muted">{n.label}</span>
                      <span className={`font-heading font-semibold ${valueCls}`}>{n.value}</span>
                    </div>
                  );
                })}
              </div>
              <p
                className="text-xs text-eagle-muted mt-6 text-center italic"
                dangerouslySetInnerHTML={{ __html: f.numbersDisclaimer }}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="formulario"
        className="py-24 bg-gradient-to-b from-zinc-900 to-eagle-black border-t border-eagle-gray"
      >
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {f.formTitle}
            </h2>
            <p
              className="text-eagle-muted"
              dangerouslySetInnerHTML={{ __html: f.formSubtitle }}
            />
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-eagle-black p-8 md:p-12 rounded-3xl border border-eagle-gray shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-eagle-light/80"
                >
                  {f.labelName}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-eagle-dark border border-eagle-gray rounded-xl shadow-inner px-4 py-3 text-eagle-light focus:outline-none focus:border-eagle-red focus:ring-1 focus:ring-eagle-red transition-all"
                  placeholder={f.placeholderName}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-eagle-light/80"
                >
                  {f.labelEmail}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-eagle-dark border border-eagle-gray rounded-xl shadow-inner px-4 py-3 text-eagle-light focus:outline-none focus:border-eagle-red focus:ring-1 focus:ring-eagle-red transition-all"
                  placeholder={f.placeholderEmail}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-eagle-light/80"
                >
                  {f.labelPhone}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-eagle-dark border border-eagle-gray rounded-xl shadow-inner px-4 py-3 text-eagle-light focus:outline-none focus:border-eagle-red focus:ring-1 focus:ring-eagle-red transition-all"
                  placeholder={f.placeholderPhone}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="city"
                  className="text-sm font-medium text-eagle-light/80"
                >
                  {f.labelCity}
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-eagle-dark border border-eagle-gray rounded-xl shadow-inner px-4 py-3 text-eagle-light focus:outline-none focus:border-eagle-red focus:ring-1 focus:ring-eagle-red transition-all"
                  placeholder={f.placeholderCity}
                />
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <label
                htmlFor="capital"
                className="text-sm font-medium text-eagle-light/80"
              >
                {f.labelCapital}
              </label>
              <select
                id="capital"
                name="capital"
                required
                value={formData.capital}
                onChange={handleChange}
                className="w-full bg-eagle-dark border border-eagle-gray rounded-xl shadow-inner px-4 py-3 text-eagle-light focus:outline-none focus:border-eagle-red focus:ring-1 focus:ring-eagle-red transition-all appearance-none"
              >
                <option value="" disabled>
                  {f.selectCapitalPlaceholder}
                </option>
                {f.capitalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="default"
              disabled={createLead.isPending}
              className="w-full shadow-xl shadow-eagle-red/20"
            >
              {createLead.isPending ? 'Enviando...' : f.submitButton}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
