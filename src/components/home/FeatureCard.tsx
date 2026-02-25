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
      className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </Link>
  );
}
