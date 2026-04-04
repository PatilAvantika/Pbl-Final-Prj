import type { ReactNode } from "react";
import Link from "next/link";
import {
  Leaf,
  Users,
  Map,
  ShieldCheck,
  UserCog,
  UserCheck,
  Briefcase,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Sparkles
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden landing-gradient-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.40),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.35),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.15),transparent_40%)]" />
      <div className="absolute -top-24 -left-12 w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl landing-orb" />
      <div className="absolute top-28 -right-8 w-72 h-72 rounded-full bg-sky-300/30 blur-3xl landing-orb animation-delay-2000" />
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-indigo-300/25 blur-3xl landing-orb animation-delay-4000" />
      <div className="absolute top-1/3 left-10 hidden lg:block w-3 h-3 rounded-full bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.8)] landing-sparkle" />
      <div className="absolute top-2/3 right-16 hidden lg:block w-2 h-2 rounded-full bg-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.8)] landing-sparkle animation-delay-2000" />

      <div className="relative z-10 w-full">
        <section className="min-h-[88vh] flex flex-col">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6">
            <header className="glassmorphism rounded-2xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Leaf className="w-5 h-5 text-emerald-700" />
                <p className="text-lg sm:text-xl tracking-[0.35em] font-semibold text-slate-800 uppercase">FieldOps</p>
              </div>
              <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
                <a href="#about" className="hover:text-emerald-700 transition-colors">About</a>
                <a href="#services" className="hover:text-emerald-700 transition-colors">Services</a>
                <a href="#roles" className="hover:text-emerald-700 transition-colors">Logins</a>
                <a href="#contact" className="hover:text-emerald-700 transition-colors">Contact</a>
              </nav>
            </header>
          </div>

          <div id="about" className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
            <div className="w-full max-w-5xl glassmorphism rounded-3xl p-8 sm:p-12 md:p-16 text-center shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
              <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-slate-600 font-bold mb-6">
                NGO Field Operations Suite
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
                NGO <span className="text-emerald-700">FieldOps</span>
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-slate-700 font-medium leading-relaxed">
                Build faster impact with one platform for volunteer management, geo-attendance, task execution,
                field reporting, and operations intelligence.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/70 border border-white px-5 py-2.5 text-sm font-bold text-slate-700">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Real-time coordination for modern NGO teams
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-6">
          <div className="glassmorphism rounded-3xl p-5 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">What We Provide</h2>
              <p className="text-sm md:text-base text-slate-600 font-medium mt-2">
                Purpose-built modules to handle end-to-end NGO operations.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <FeatureCard
                title="Secure Access"
                description="Role-based logins and protected operational modules."
                icon={<ShieldCheck className="w-7 h-7 text-sky-500" />}
                href="/login"
              />
              <FeatureCard
                title="Geofenced Attendance"
                description="Live location check-ins with reliable attendance records."
                icon={<Map className="w-7 h-7 text-emerald-600" />}
              />
              <FeatureCard
                title="Volunteer Management"
                description="Track people, assignments, and field movement in real time."
                icon={<Users className="w-7 h-7 text-indigo-600" />}
              />
              <FeatureCard
                title="Operations Insights"
                description="Monitor reports, progress signals, and team activity."
                icon={<Briefcase className="w-7 h-7 text-slate-600" />}
              />
            </div>
          </div>
        </section>

        <section id="roles" className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-6">
          <div className="glassmorphism rounded-3xl p-5 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Login by Role</h2>
              <p className="text-sm md:text-base text-slate-600 font-medium mt-2">
                Continue with the right portal and enter your dashboard experience.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <PortalCard
                href="/login?role=admin"
                title="Admin Login"
                description="Super admin, NGO admin, and coordinator access."
                icon={<UserCog className="w-7 h-7 text-sky-600" />}
              />
              <PortalCard
                href="/login?role=volunteer"
                title="Volunteer Login"
                description="Field volunteer access and assigned task workflow."
                icon={<UserCheck className="w-7 h-7 text-emerald-600" />}
              />
              <PortalCard
                href="/login?role=staff"
                title="Staff Login"
                description="Operations and internal staff dashboard access."
                icon={<Briefcase className="w-7 h-7 text-indigo-600" />}
              />
            </div>
          </div>
        </section>

        <section id="contact" className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-10">
          <div className="glassmorphism rounded-3xl p-5 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Contact Information</h2>
            <p className="text-sm md:text-base text-slate-600 font-medium mt-2 mb-6">
              For onboarding, support, or collaboration, connect with us directly.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ContactCard icon={<Phone className="w-5 h-5 text-emerald-600" />} label="Phone" value="+91 90000 12345" />
              <ContactCard icon={<Mail className="w-5 h-5 text-sky-600" />} label="Email" value="support@fieldops-ngo.com" />
              <ContactCard icon={<MapPin className="w-5 h-5 text-indigo-600" />} label="Address" value="NGO Operations Center, Mumbai" />
            </div>
            <div className="mt-8 pt-5 border-t border-white/60 text-center text-sm text-slate-600 font-semibold">
              NGO FieldOps • Built for high-impact field organizations
            </div>
          </div>
        </section>

        <footer className="text-center text-xs sm:text-sm text-slate-600 font-semibold pb-8">
          Copyright {new Date().getFullYear()} NGO FieldOps. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function PortalCard({
  href,
  title,
  description,
  icon
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/70 bg-white/70 p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <div>{icon}</div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
    </Link>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  href
}: {
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
}) {
  const className =
    "rounded-2xl border border-white/70 bg-white/70 p-5 transition-all hover:-translate-y-1 hover:shadow-lg";

  if (href) {
    return (
      <Link href={href} className={className}>
        <div className="mb-3">{icon}</div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </Link>
    );
  }

  return (
    <div className={className}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
    </div>
  );
}

function ContactCard({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">{label}</p>
      </div>
      <p className="text-sm md:text-base font-semibold text-slate-800">{value}</p>
    </div>
  );
}
