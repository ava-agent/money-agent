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
      className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-100 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <div className="mt-4 flex items-center text-sm text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        查看详情
        <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
