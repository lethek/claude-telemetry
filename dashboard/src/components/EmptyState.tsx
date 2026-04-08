interface EmptyStateProps {
  illustration: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ illustration, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-5 text-slate-600">{illustration}</div>
      <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      <p className="mt-1.5 max-w-xs text-xs text-slate-500">{description}</p>
      {action && (
        <a
          href={action.href}
          className="mt-4 rounded-lg bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
