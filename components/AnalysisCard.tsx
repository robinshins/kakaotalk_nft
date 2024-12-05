'use client';

interface AnalysisCardProps {
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function AnalysisCard({
  title,
  description,
  onClick,
  disabled
}: AnalysisCardProps) {
  return (
    <button
      className={`p-6 rounded-lg border text-left transition-all w-full
        ${disabled 
          ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed border-gray-200 dark:border-gray-700' 
          : 'bg-white dark:bg-gray-900 hover:shadow-lg hover:border-yellow-400 dark:hover:border-yellow-400 border-gray-200 dark:border-gray-700'
        }`}
      onClick={onClick}
      disabled={disabled}
    >
      <h3 className="text-lg font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </button>
  );
} 