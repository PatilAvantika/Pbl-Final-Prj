import Link from "next/link";
import { Leaf, Users, Map, ShieldCheck, Video } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full max-w-5xl px-6 py-16 flex flex-col gap-16 animate-fade-in">
      <header className="flex flex-col gap-4 text-center items-center">
        <div className="p-4 bg-emerald-100/50 rounded-2xl inline-block shadow-sm">
          <Leaf className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mt-4">
          Field Operations <span className="text-emerald-600">SaaS</span>
        </h1>
        <p className="max-w-xl text-lg text-slate-500 font-medium">
          Production-grade offline-resilient platform for Environmental NGOs.
          Manage tasks, volunteers, hr intelligence, and geo-verified attendance.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/login" className="flat-card p-6 flex flex-col gap-3 group">
          <ShieldCheck className="w-8 h-8 text-sky-500 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-bold text-slate-800">Secure Auth</h2>
          <p className="text-slate-500 text-sm">Role-based access control protecting modules across the system.</p>
        </Link>

        <Link href="/task/123/camera" className="flat-card p-6 flex flex-col gap-3 group border border-emerald-100">
          <Video className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-bold text-slate-800">Live Camera</h2>
          <p className="text-slate-500 text-sm">HTML5 MediaDevices integrated with geo-watermarking and hash generation for attendance.</p>
        </Link>

        <div className="flat-card p-6 flex flex-col gap-3 group opacity-80 cursor-not-allowed">
          <Map className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-bold text-slate-800">Geofencing Core</h2>
          <p className="text-slate-500 text-sm">PostgreSQL distance operations to ensure volunteers are inside designated zones.</p>
        </div>

        <div className="flat-card p-6 flex flex-col gap-3 group opacity-80 cursor-not-allowed">
          <Users className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-bold text-slate-800">HR Intelligence</h2>
          <p className="text-slate-500 text-sm">Leave management, BullMQ PDF generation for Payroll slips, and logic structure.</p>
        </div>
      </div>

      <footer className="text-center text-sm text-slate-400 font-medium pt-8 border-t border-slate-200">
        System Initialized • Backend: NestJS/Prisma • Frontend: Next.js/Tailwind
      </footer>
    </div>
  );
}
