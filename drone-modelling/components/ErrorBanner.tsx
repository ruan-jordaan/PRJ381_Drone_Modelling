export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      key={message}
      className="animate-shake flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
    >
      <span aria-hidden>⚠️</span>
      {message}
    </div>
  );
}
