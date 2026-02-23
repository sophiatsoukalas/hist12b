"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Map" },
  { href: "/policies", label: "Policies" },
  { href: "/sources", label: "Sources" },
  { href: "/about", label: "About" },
  { href: "/admin", label: "Admin" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            HIST 12B · Final Project
          </span>
          <span className="text-sm font-semibold text-zinc-900">
            Neoliberal Housing Logic &amp; Homelessness in Los Angeles
          </span>
        </div>
        <nav className="hidden gap-4 text-sm text-zinc-700 sm:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1 transition-colors ${
                  active
                    ? "bg-zinc-900 text-zinc-50"
                    : "hover:bg-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

