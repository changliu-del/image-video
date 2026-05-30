import { steps } from "@/lib/content/landing";

export function HowItWorksSection() {
  return (
    <section className="border-b bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium text-orange-600">Como funciona</p>
          <h2 className="mt-2 text-3xl font-semibold">Da imagem ao video em tres passos</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-lg border p-5">
              <div className="flex items-center justify-between">
                <step.icon className="h-6 w-6 text-orange-600" />
                <span className="text-sm font-semibold text-gray-400">0{index + 1}</span>
              </div>
              <h3 className="mt-5 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
