import Link from "next/link";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

export default function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group block p-6 rounded-xl transition-all duration-300 hover:-translate-y-1 shadow-warm hover:shadow-warm-lg"
      style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
    >
      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: "var(--accent-light)" }}>
        {icon}
      </div>
      <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold transition-colors duration-200" style={{ color: "var(--foreground)" }}>
        <span className="group-hover:text-[var(--accent)]">{title}</span>
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{description}</p>
      <div className="mt-4 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" style={{ color: "var(--accent)" }}>
        Learn More
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
