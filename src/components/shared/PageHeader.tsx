interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
}

export default function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-3">
        {icon && <span className="text-4xl">{icon}</span>}
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          {title}
        </h1>
      </div>
      {description && (
        <p className="mt-2 text-lg leading-relaxed max-w-2xl" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      )}
      <div className="accent-line mt-5" />
    </div>
  );
}
