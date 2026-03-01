"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Map" },
  { href: "/policies", label: "Policies" },
  { href: "/sources", label: "Sources" },
  { href: "/about", label: "About" },
  { href: "/admin", label: "Admin" },
];

// NavBar component with responsive mobile menu. 
// It's a full-screen overlay on mobile and a horizontal nav on desktop. 
export function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.pointerEvents = "none";
    } else {
      document.body.style.overflow = "auto";
      document.body.style.pointerEvents = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.pointerEvents = "auto";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3 gap-4">
          <button
            onClick={toggleMenu}
            className="sm:hidden flex flex-col gap-1.5 cursor-pointer flex-shrink-0 relative w-6 h-6"
            aria-label="Toggle menu"
          >
            <div className={`absolute top-0 left-0 h-0.5 w-6 bg-zinc-900 transition-all duration-300 ease-in-out ${
              menuOpen ? 'rotate-45 translate-y-[11px]' : ''
            }`}></div>
            <div className={`absolute top-[9px] left-0 h-0.5 w-6 bg-zinc-900 transition-all duration-300 ease-in-out ${
              menuOpen ? 'opacity-0' : ''
            }`}></div>
            <div className={`absolute bottom-0 left-0 h-0.5 w-6 bg-zinc-900 transition-all duration-300 ease-in-out ${
              menuOpen ? '-rotate-45 -translate-y-[11px]' : ''
            }`}></div>
          </button>

          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              HIST 12B · Final Project
            </span>
            <span className="text-sm font-semibold text-zinc-900">
              Neoliberal Housing Logic &amp; Homelessness in Los Angeles
            </span>
          </div>

          <nav className="hidden gap-4 text-sm text-zinc-700 sm:flex flex-shrink-0">
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

      {/* Mobile Menu Overlay */}
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 pointer-events-auto transition-opacity duration-300 ease-in-out ${
            menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMenu}
        ></div>

        {/* Full Screen Menu */}
        <nav 
          className={`fixed inset-0 z-50 sm:hidden flex flex-col items-center justify-center bg-white/20 backdrop-blur-md pointer-events-auto transition-all duration-300 ease-in-out ${
            menuOpen 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <button
            onClick={closeMenu}
            className="absolute top-6 right-6 text-white text-3xl font-light transition-transform duration-200 hover:scale-110"
            aria-label="Close menu"
          >
            ✕
          </button>

          <div className="flex flex-col gap-8 text-center">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`text-2xl font-semibold transition-all duration-200 ${
                    active
                      ? "text-white underline underline-offset-4"
                      : "text-white/70 hover:text-white hover:scale-105"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </>
    </>
  );
}

