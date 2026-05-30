import { capabilities } from "@/lib/content/landing";

export function FeaturesSection() {
  return (
    <section className="border-b bg-gray-50 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium text-orange-600">Recursos</p>
            <h2 className="mt-2 text-3xl font-semibold">
              Feito para testar criativos sem montar uma equipe de video
            </h2>
            <p className="mt-4 leading-7 text-gray-600">
              O fluxo combina upload, briefing, geracao por API externa, renderizacao e historico de creditos em uma experiencia unica.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((cap) => (
              <div key={cap.title} className="rounded-lg border bg-white p-5">
                <cap.icon className="h-6 w-6 text-orange-600" />
                <h3 className="mt-4 font-semibold">{cap.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{cap.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
