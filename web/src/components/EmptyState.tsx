export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/50 px-5 py-10 text-center">
      <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-ink">
        {title}
      </p>
      {body ? <p className="mm mx-auto mt-2 max-w-sm text-sm text-ink-soft">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
