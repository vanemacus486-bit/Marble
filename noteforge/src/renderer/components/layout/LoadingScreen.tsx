export default function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Loading vault...
        </p>
      </div>
    </div>
  )
}
