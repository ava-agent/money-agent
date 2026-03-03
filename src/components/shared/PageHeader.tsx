interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
}

export default function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="text-4xl">{icon}</span>}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
      </div>
      {description && (
        <p className="mt-2 text-lg text-gray-500 max-w-2xl">{description}</p>
      )}
      <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
    </div>
  );
}
