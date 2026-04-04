import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FieldOps Admin",
  description: "Full-Stack Field Operations + HR Intelligence Platform",
};

import { ClientProviders } from './ClientProviders';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#FAF9F6] text-slate-800 font-sans antialiased selection:bg-emerald-500 selection:text-white">
        <ClientProviders>
          <main className="min-h-screen w-full flex flex-col">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
