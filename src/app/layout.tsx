import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "LA Housing & Homelessness Map | Neoliberal Housing Logic in the United States",
  description:
    "An interactive map and policy timeline exploring how neoliberal housing logic has shaped homelessness policy in Los Angeles and the broader United States.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <NavBar />
        <main className="mx-auto min-h-[calc(100vh-56px)] max-w-6xl px-4 py-8 sm:py-8 py-2">
          {children}
        </main>
      </body>
    </html>
  );
}

