import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface FAQItem {
  answer: string;
  question: string;
}

const faqs: FAQItem[] = [
  {
    answer:
      "Sora Lattice is a design system generator that produces production-ready token architecture from your brand inputs. Rather than replacing your component library, it acts as the intelligence layer beneath it — generating OKLCH-native color systems, semantic token structures, and type scales that work with whatever stack you're already using.",
    question: "What is Sora Lattice?",
  },
  {
    answer:
      "Everything you need to start building on a principled foundation: a full token configuration package including DTCG JSON, CSS custom properties, a Tailwind config, shadcn-compatible CSS variables, and a README documenting your system's architecture. No sign-up required, no email gate — just configure and download.",
    question: "What do I get for free?",
  },
  {
    answer:
      "Theming tools let you adjust surface-level styles on an existing component set. Sora Lattice generates the underlying architecture — semantic token layering, surface-dependent state logic, perceptually uniform color ramps — that a theming tool never touches. It's the difference between picking colors and building a color system.",
    question:
      "What makes Sora Lattice different from a theming tool like tweakcn or Shadcraft?",
  },
  {
    answer:
      "Sora Lattice generates all colors in OKLCH, a perceptually uniform color space that produces more consistent and accessible palettes than HSL or hex. From your primary brand color, it builds a full 10-hue palette using a greedy algorithm that maximizes angular distance while guaranteeing coverage of red, green, blue, and yellow. Each hue gets a multi-step ramp with saturation scaling relative to each shade's natural chroma ceiling.",
    question: "How does the color system work?",
  },
  {
    answer:
      'Yes! Sora Lattice outputs are designed to slot into your existing tools. The free tier includes a shadcn-compatible CSS variables file out of the box, so you can drop a Sora Lattice-generated system directly into a shadcn project. Think of it as "shadcn with a real design system underneath" rather than "shadcn or Sora Lattice."',
    question:
      "Can I use Sora Lattice with shadcn/ui, Chakra, HeroUI, or other component libraries?",
  },
  {
    answer:
      "The token architecture and color science are fully open. The free tier gives you the complete token package with no restrictions on how you use it — in personal projects, client work, or commercial products. The generated output is yours.",
    question: "Is Sora Lattice open source?",
  },
];

const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div>
      {faqs.map((faq, index) => (
        <div
          className="overflow-hidden border-charcoal/10 border-b bg-white transition-all hover:border-charcoal/20"
          key={index}
        >
          <button
            aria-expanded={openIndex === index}
            className="flex w-full items-center justify-between gap-4 px-4 py-6 text-left transition-all duration-300 hover:cursor-pointer hover:px-10 md:px-8 md:py-8"
            onClick={() => toggleAccordion(index)}
            type="button"
          >
            <span className="pr-4 font-semibold text-lg md:text-xl">
              {faq.question}
            </span>
            <motion.svg
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              className="h-6 w-6 flex-shrink-0 text-charcoal"
              fill="none"
              stroke="currentColor"
              transition={{ duration: 0.3 }}
              viewBox="0 0 24 24"
            >
              <path
                d="M19 9l-7 7-7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </motion.svg>
          </button>

          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="px-4 pt-0 pb-5 md:px-8 md:pb-6">
                  <p className="text-charcoal/80 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default FAQAccordion;
