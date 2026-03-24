"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  Trophy,
  Code2,
  Users,
  Zap,
  Terminal,
  CheckCircle,
  ArrowRight,
  Github,
  Twitter,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Shield,
  Clock,
  Star,
  FileCode2,
} from "lucide-react";
import { signIn } from "next-auth/react";

const GridBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 100%)",
      }}
    />
  </div>
);

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

interface LandingClientProps {
  isLoggedIn: boolean;
  userName?: string | null;
}

export default function LandingClient({ isLoggedIn, userName }: LandingClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const howRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });
  const howInView = useInView(howRef, { once: true, margin: "-80px" });

  const navLinks = [
    { label: "Problems", href: "/problems" },
    { label: "Contests", href: "/contests" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  const features = [
    {
      icon: Zap,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      title: "Real-time Judge",
      desc: "Code gets evaluated in milliseconds. Live feedback, live results — no waiting around.",
    },
    {
      icon: Trophy,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
      title: "Live Contests",
      desc: "Compete in timed arenas against others. Climb the leaderboard as submissions roll in.",
    },
    {
      icon: BarChart3,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      title: "Deep Analytics",
      desc: "Track every submission, language, runtime, and correctness. Know where to improve.",
    },
    {
      icon: Shield,
      color: "text-purple-500",
      bg: "bg-purple-500/10 border-purple-500/20",
      title: "Curated Problems",
      desc: "Every problem goes through an approval pipeline before it reaches you. Quality first.",
    },
    {
      icon: Code2,
      color: "text-rose-500",
      bg: "bg-rose-500/10 border-rose-500/20",
      title: "Multi-language",
      desc: "C++, Rust, JavaScript — pick your weapon. Boilerplate ready, just write the logic.",
    },
    {
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10 border-orange-500/20",
      title: "Auto Submit",
      desc: "Contest ends? Your latest code auto-submits. Never lose work when the timer hits zero.",
    },
  ];

  const steps = [
    { num: "01", title: "Pick a problem", desc: "Browse the catalog or jump into a live contest with thousands of participants." },
    { num: "02", title: "Write your solution", desc: "Use the built-in editor with syntax highlighting across C++, Rust, and JavaScript." },
    { num: "03", title: "Submit and rank", desc: "The judge runs your code instantly. Watch your position update on the leaderboard live." },
  ];

  const stats = [
    { value: "12,400+", label: "Registered Users", icon: Users, color: "text-blue-500" },
    { value: "380+", label: "Curated Problems", icon: FileCode2, color: "text-purple-500" },
    { value: "94,000+", label: "Total Submissions", icon: CheckCircle, color: "text-emerald-500" },
    { value: "60+", label: "Contests Held", icon: Trophy, color: "text-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans overflow-x-hidden" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>


      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <GridBackground />

        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-8"
          >
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Live contests running now
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05]"
          >
            Where coders{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              compete
            </span>
            {" "}and{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              grow.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            ContestArena is a competitive programming platform with real-time judging, live contests, and deep performance analytics. Write better code, faster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              Start competing <ArrowRight size={17} />
            </a>
            <a
              href="/problems"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-semibold text-base transition-all hover:bg-white/5"
            >
              Browse problems
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.48 }}
            className="mt-16 mx-auto max-w-2xl bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-800 bg-[#242424]">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="ml-3 text-xs text-gray-500 font-mono">solution.cpp</span>
            </div>
            <div className="p-5 text-left font-mono text-sm leading-relaxed">
              <span className="text-purple-400">int </span>
              <span className="text-blue-400">twoSum</span>
              <span className="text-gray-300">(vector&lt;</span>
              <span className="text-purple-400">int</span>
              <span className="text-gray-300">&gt; nums, </span>
              <span className="text-purple-400">int</span>
              <span className="text-gray-300"> target) {"{"}</span>
              <br />
              <span className="text-gray-300">{"  "}unordered_map&lt;</span>
              <span className="text-purple-400">int</span>
              <span className="text-gray-300">, </span>
              <span className="text-purple-400">int</span>
              <span className="text-gray-300">&gt; seen;</span>
              <br />
              <span className="text-yellow-400">{"  "}for </span>
              <span className="text-gray-300">(</span>
              <span className="text-purple-400">int</span>
              <span className="text-gray-300"> i = 0; i &lt; nums.size(); i++) {"{"}</span>
              <br />
              <span className="text-yellow-400">{"    "}if </span>
              <span className="text-gray-300">(seen.count(target - nums[i]))</span>
              <br />
              <span className="text-yellow-400">{"      "}return </span>
              <span className="text-gray-300">{"{"}-1, i{"}"};</span>
              <br />
              <span className="text-gray-300">{"    "}seen[nums[i]] = i;</span>
              <br />
              <span className="text-gray-300">{"  "}{"}"}</span>
              <br />
              <span className="text-gray-300">{"}"}</span>
              <br />
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold">
                  <CheckCircle size={13} /> Accepted
                </span>
                <span className="text-gray-600 text-xs">Runtime: 4ms · Memory: 11.2 MB</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section ref={statsRef} className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={statsInView ? "show" : "hidden"}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg ${s.color.replace("text-", "bg-").replace("-500", "-500/10")} flex items-center justify-center mb-4`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={featuresInView ? "show" : "hidden"}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-3">
              Everything you need
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Built for serious competitive programmers
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-gray-400 max-w-xl mx-auto">
              Every feature is built around one goal — helping you code faster, think sharper, and rank higher.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={featuresInView ? "show" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 rounded-xl p-6 transition-all hover:-translate-y-1 duration-300"
              >
                <div className={`w-11 h-11 rounded-xl border ${f.bg} flex items-center justify-center mb-5`}>
                  <f.icon size={20} className={f.color} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section ref={howRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={howInView ? "show" : "hidden"}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-3">
              How it works
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Three steps. Zero friction.
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={howInView ? "show" : "hidden"}
            className="space-y-4"
          >
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex gap-6 items-start bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#242424] border border-gray-700 flex items-center justify-center font-mono text-sm font-bold text-gray-500 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base mb-1.5">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#1a1a1a]" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-6">
              Ready to prove yourself?
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Join thousands of programmers already competing on ContestArena. Free to start, no credit card required.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              Create your account <ArrowRight size={18} />
            </a>
          </motion.div>
        </div>
      </section>

     <footer className="border-t border-gray-800 bg-[#0f0f0f] min-h-[350px] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle background glow to fill the vertical space elegantly */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-40 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 flex flex-col items-center text-center">
        {/* Logo Icon */}
        <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6">
          <Terminal size={24} className="text-blue-500" />
        </div>

        {/* Catchy Tagline */}
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
          Built for coders who refuse to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">stay average.</span>
        </h3>

        <p className="text-gray-500 mb-10 max-w-md">
          Level up your logic, dominate the leaderboard, and build things that matter.
        </p>

        {/* Credits & GitHub Link */}
        <div className="flex items-center gap-3 text-sm font-medium text-gray-400 bg-[#151515] border border-gray-800 px-6 py-3 rounded-full shadow-lg">
          <span>Made with</span>
          <span className="text-red-500 animate-pulse text-base">❤️</span>
          <span className="text-gray-300">by MSVaibhav</span>
          
          {/* Vertical Divider */}
          <div className="w-px h-4 bg-gray-700 mx-2" />
          
          <a
            href="https://github.com/MSVaibhav4141"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
          >
            <Github size={18} className="group-hover:scale-110 transition-transform" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
    </div>
  );
}
