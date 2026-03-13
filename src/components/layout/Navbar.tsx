"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "交易所" },
  { href: "/tasks", label: "任务" },
  { href: "/templates", label: "模板" },
  { href: "/guide", label: "API 指南" },
  { href: "/about", label: "关于" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(15, 15, 19, 0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
      {/* Accent line */}
      <div className="h-[2px]" style={{ background: "linear-gradient(to right, #ff6b35, #00d4aa, #ff6b35)" }} />

      {/* Developer CTA banner */}
      <div className="text-center py-1.5 text-xs" style={{ background: "rgba(255,107,53,0.08)", borderBottom: "1px solid rgba(255,107,53,0.1)" }}>
        <Link href="/guide" className="hover:underline" style={{ color: "#ff6b35" }}>
          为 AI Agent 构建应用 — 阅读 API 指南 &rarr;
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight" style={{ color: "#ffffff" }}>
          <span className="text-lg">🦀</span>
          <span className="font-mono">CLAW<span style={{ color: "#ff6b35" }}>X</span></span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(link.href)
                  ? ""
                  : "hover:text-white"
              }`}
              style={isActive(link.href) ? { backgroundColor: "rgba(255,107,53,0.12)", color: "#ff6b35" } : { color: "rgba(255,255,255,0.5)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg cursor-pointer"
          style={{ color: "rgba(255,255,255,0.7)" }}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", backgroundColor: "#0f0f13" }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-sm font-medium transition-colors"
              style={isActive(link.href) ? { backgroundColor: "rgba(255,107,53,0.12)", color: "#ff6b35" } : { color: "rgba(255,255,255,0.5)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
