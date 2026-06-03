export function DashboardPageSkeleton() {
  return (
    <main className="flex-1 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="h-6 w-36 animate-pulse rounded-full bg-indigo-50" />
          <div className="mt-4 h-8 w-full max-w-xl animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded bg-gray-100" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="mt-4 h-8 w-20 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-4 w-28 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="min-h-[360px] rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="size-11 animate-pulse rounded-lg bg-gray-100" />
              <div className="mt-5 h-7 w-28 animate-pulse rounded bg-gray-100" />
              <div className="mt-4 h-5 w-full animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-5 w-4/5 animate-pulse rounded bg-gray-100" />
              <div className="mt-6 h-10 w-32 animate-pulse rounded bg-gray-100" />
              <div className="mt-6 grid gap-3">
                <div className="h-5 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-5 w-5/6 animate-pulse rounded bg-gray-100" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
