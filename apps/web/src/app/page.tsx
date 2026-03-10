"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Calculator, PieChart, ShieldCheck, Scale } from "lucide-react";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const featureCards = [
    {
      title: "Advanced SIP",
      desc: "Simulate step-ups, compare against inflation, and project your wealth accurately.",
      icon: Calculator,
      href: "/sip",
    },
    {
      title: "Portfolio Planning",
      desc: "Map your life goals to actionable monthly investments.",
      icon: PieChart,
      href: "/financial-planning",
    },
    {
      title: "Term Insurance",
      desc: "Find out how much cover you actually need and if it's effectively free.",
      icon: ShieldCheck,
      href: "/term-insurance",
    },
    {
      title: "SIP vs Lumpsum",
      desc: "Struggling to decide? View the mathematical winner over your exact time horizon.",
      icon: Scale,
      href: "/sip-vs-lumpsum",
    },
  ];

  return (
    <div className="min-h-full w-full flex flex-col items-center pt-24 pb-16 px-6 relative">
      <motion.div
        className="max-w-4xl text-center space-y-6 z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-gold/20 bg-brand-gold/5 text-brand-gold text-sm font-medium tracking-wide mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="w-2 h-2 rounded-full bg-brand-gold" />
          Production-grade Financial Engine
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-heading font-bold text-foreground leading-[1.1] tracking-tight">
          Master Your Wealth with <br className="hidden md:block" />
          <span className="text-gradient">Precision.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-6">
          Investor-ready financial planning tools built for the modern wealth builder.
          Stop guessing, start projecting.
        </p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/sip">
            <button className="group relative overflow-hidden rounded-lg bg-gold-gradient px-8 py-4 text-brand-darkBg font-semibold text-lg hover:scale-[0.98] transition-all duration-200 w-full sm:w-auto flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(245,166,35,0.4)]">
              <span className="relative z-10">Launch Calculators</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </button>
          </Link>
          <button className="px-8 py-4 rounded-lg border border-brand-surfaceBorder bg-brand-surface text-foreground font-medium text-lg hover:bg-white/5 transition-all duration-200 w-full sm:w-auto">
            View Methodology
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mt-32 w-full z-10"
      >
        {featureCards.map((card, idx) => (
          <Link key={idx} href={card.href}>
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl p-6 group cursor-pointer hover:-translate-y-1 hover:border-brand-gold/30 hover:shadow-[0_8px_30px_-12px_rgba(245,166,35,0.2)] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-12 h-12 rounded-xl bg-brand-darkBg border border-brand-surfaceBorder flex items-center justify-center mb-6 group-hover:border-brand-gold/50 transition-colors">
                <card.icon className="w-6 h-6 text-brand-gold" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2 group-hover:text-brand-gold transition-colors">{card.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{card.desc}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
  );
}
