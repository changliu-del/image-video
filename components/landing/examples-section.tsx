import { examples } from "@/lib/content/landing";

export function ExamplesSection() {
  return (
    <section className="border-b bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-medium text-orange-600">Exemplos</p>
          <h2 className="text-3xl font-semibold">Videos para diferentes categorias</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {examples.map((ex) => (
            <article key={ex.title} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className={`aspect-[4/3] rounded-md ${ex.tone} p-5`}>
                <div className="flex h-full items-end">
                  <div className="w-full rounded-md bg-white/80 p-4 shadow-sm">
                    <div className={`mb-4 h-16 w-16 rounded ${ex.accent}`} />
                    <div className="h-3 w-3/4 rounded bg-gray-900" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-gray-400" />
                  </div>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{ex.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{ex.caption}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
