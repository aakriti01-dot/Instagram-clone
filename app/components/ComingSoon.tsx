export default function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-28 text-center sm:max-w-xl">
      <span className="font-serif text-2xl italic text-[var(--ink)]">
        {title}
      </span>
      <p className="max-w-xs text-sm text-[var(--ink-soft)]">{description}</p>
    </main>
  );
}
