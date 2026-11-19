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
    <div className="surface-quiet px-5 py-12 text-center">
      <p className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ink">
        {title}
      </p>
      {body ? (
        <p className="mm mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
