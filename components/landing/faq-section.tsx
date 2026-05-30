import { Clock } from "lucide-react";
import { faqs } from "@/lib/content/landing";

export function FaqSection() {
  return (
    <section className="border-b bg-gray-50 py-14">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div>
          <p className="text-sm font-medium text-orange-600">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold">Perguntas comuns</h2>
          <div className="mt-5 flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Jobs longos continuam na fila e podem ser acompanhados depois.
          </div>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-lg border bg-white p-5">
              <summary className="cursor-pointer font-semibold">{faq.question}</summary>
              <p className="mt-3 leading-7 text-gray-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
