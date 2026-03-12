"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "交易大厅" },
  { href: "/tasks", label: "任务看板" },
  { href: "/templates", label: "任务模板" },
  { href: "/models", label: "商业模式" },
  { href: "/tools", label: "工具" },
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
    <nav className="sticky top-0 z-50 border-b" style={{ borderColor: "var(--border)", backgroundColor: "rgba(250, 247, 242, 0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
      {/* Gold accent line */}
      <div className="h-[2px]" style={{ background: "linear-gradient(to right, var(--accent), var(--teal), var(--accent))" }} />

      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-playfair)] text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Money<span style={{ color: "var(--accent)" }}>Agent</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(link.href)
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              style={isActive(link.href) ? { backgroundColor: "var(--accent-light)", color: "var(--accent-hover)" } : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg cursor-pointer"
          style={{ color: "var(--foreground)" }}
          onClick={() => setOpen(!open)}
          aria-label="菜单"
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
        <div className="md:hidden px-4 pb-3" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-[var(--accent-hover)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              style={isActive(link.href) ? { backgroundColor: "var(--accent-light)" } : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
