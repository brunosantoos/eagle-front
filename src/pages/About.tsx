import { Award, Heart, Target } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";
import { useSiteContent } from "../context/SiteContentProvider";
import { useToast } from "../context/ToastProvider";
import { trpc } from "../lib/trpc";

function ContactForm() {
  const { success, error } = useToast();
  const createContact = trpc.contactSubmissions.create.useMutation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createContact.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message,
      });
      success('Mensagem enviada! Em breve entraremos em contato.');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      error('Não foi possível enviar. Tente de novo.');
    }
  };

  const inp = 'w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-eagle-red focus:ring-1 focus:ring-eagle-red/40';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome *</label>
          <input className={inp} required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Seu nome" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">E-mail *</label>
          <input className={inp} type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telefone</label>
        <input className={inp} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(00) 00000-0000" />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Mensagem *</label>
        <textarea className={`${inp} min-h-[120px] resize-y`} required value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Como podemos ajudar?" />
      </div>
      <button
        type="submit"
        disabled={createContact.isPending}
        className="w-full py-3.5 rounded-xl bg-eagle-red hover:bg-red-700 disabled:opacity-60 text-white font-heading font-semibold text-sm transition-colors"
      >
        {createContact.isPending ? 'Enviando...' : 'Enviar mensagem'}
      </button>
    </form>
  );
}

export default function About() {
  const { content } = useSiteContent();

  const valueBlocks = useMemo(
    () => [
      {
        icon: Award,
        title: content.about.missionTitle,
        desc: content.about.missionDesc,
      },
      {
        icon: Target,
        title: content.about.visionTitle,
        desc: content.about.visionDesc,
      },
      {
        icon: Heart,
        title: content.about.valuesTitle,
        desc: content.about.valuesDesc,
      },
    ],
    [content.about],
  );

  return (
    <div className="w-full pt-24">
      {/* Hero Section */}
      <section className="relative px-6 flex items-center justify-center min-h-[60vh] overflow-hidden bg-eagle-black pt-32 pb-24 border-b border-eagle-gray">
        <div className="absolute inset-0 z-0">
          <img
            src={content.media.aboutHeroBg}
            alt="Eagle Center Fitness Environment"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-eagle-black"></div>
        </div>

        <div className="container mx-auto relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-5xl lg:text-7xl font-vonique  text-white uppercase tracking-tight max-w-6xl mx-auto leading-tight drop-shadow-2xl"
            style={
              content.about.heroTitleColor
                ? { color: content.about.heroTitleColor }
                : undefined
            }
            dangerouslySetInnerHTML={{ __html: content.about.heroTitle }}
          />
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-vonique font-bold mb-8 text-eagle-red uppercase">
                {content.about.storyTitle}
              </h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                {content.about.storyParagraphs.map((p, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </motion.div>

            <img
              src={content.media.aboutStoryImage}
              alt="Premium Gym Environment"
              className="w-full  "
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-eagle-red uppercase">
              {content.about.pillarsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="order-2 lg:order-1">
              <p className="text-xl md:text-2xl text-gray-600 mb-6 leading-relaxed font-light lowercase">
                {content.about.pillarsIntro}
              </p>
              <h3
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-eagle-red uppercase mb-8 leading-tight tracking-tight"
                dangerouslySetInnerHTML={{ __html: content.about.pillarsHeadline }}
              />
              <p
                className="text-xl text-gray-600 leading-relaxed font-light lowercase"
                dangerouslySetInnerHTML={{ __html: content.about.pillarsOutro }}
              />
            </div>
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[600px] aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-4 border-gray-100">
                <img
                  src={content.media.aboutPillarsImage}
                  alt="Pilares da Marca Eagle Center"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {valueBlocks.map((value, idx) => (
              <motion.div
                key={`${value.title}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="text-center group"
              >
                <div className="w-24 h-24 mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <value.icon
                    className="text-eagle-red drop-shadow-md"
                    size={64}
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-2xl font-heading font-bold mb-4 text-eagle-black uppercase">
                  {value.title}
                </h3>
                <p
                  className="text-gray-600 leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{ __html: value.desc }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section className="bg-eagle-black py-20 border-t border-zinc-800/60">
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="text-eagle-red font-sans tracking-[0.2em] uppercase text-sm font-semibold mb-4 block">
              Contato
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
              Entre em Contato
            </h2>
            <p className="text-zinc-400 text-lg">
              Tem alguma dúvida? Fale com a nossa equipe.
            </p>
          </motion.div>

          <ContactForm />
        </div>
      </section>
    </div>
  );
}
