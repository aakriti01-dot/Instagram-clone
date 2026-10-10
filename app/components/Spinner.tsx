export default function Spinner({
  className = "h-4 w-4 border-2 border-[var(--line)] border-t-[var(--blush)]",
}: {
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block shrink-0 animate-spin rounded-full ${className}`}
    />
  );
}
