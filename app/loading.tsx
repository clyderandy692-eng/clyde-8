export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6" aria-busy="true">
      <div className="flex w-full max-w-sm flex-col gap-5" aria-label="Chargement de la page">
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
        <div className="flex flex-col gap-3">
          <div className="h-9 w-4/5 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted/60" />
      </div>
    </main>
  )
}
