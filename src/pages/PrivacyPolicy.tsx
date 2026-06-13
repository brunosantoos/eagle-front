import { motion } from "motion/react";
import { useSiteContent } from "../context/SiteContentProvider";

export default function PrivacyPolicy() {
  const { content } = useSiteContent();
  const policy = content.privacyPolicy;

  return (
    <div className="w-full pt-24">
      <section className="py-24 bg-gradient-to-b from-zinc-900 via-eagle-dark to-eagle-black min-h-[70vh]">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl md:text-5xl font-heading font-bold text-white mb-10"
          >
            {policy.title}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="text-eagle-light/85 text-base md:text-lg leading-relaxed space-y-4 [&_p]:mb-4 [&_h2]:text-2xl [&_h2]:font-heading [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-heading [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-eagle-gold [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />
        </div>
      </section>
    </div>
  );
}
