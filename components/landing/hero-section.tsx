import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aspectRatios } from "@/lib/content/landing";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b bg-gray-50">
      <div className="mx-auto grid min-h-[82vh] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-700">
            <Sparkles className="h-4 w-4 text-orange-600" />
            Studio de video para produtos
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] text-gray-950 sm:text-5xl lg:text-6xl">
            Transforme uma foto de produto em video comercial com IA
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Crie videos curtos para ecommerce, anuncios e redes sociais com briefing simples, modelos de campanha e acompanhamento do job em tempo real.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/generate">Comecar agora<ArrowRight className="h-5 w-5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">Ver creditos<PlayCircle className="h-5 w-5" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm text-gray-600">
            {aspectRatios.map((ratio) => (
              <div key={ratio} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />{ratio}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-full rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Generate Studio</p>
                <p className="text-lg font-semibold">Campanha Flash Sale</p>
              </div>
              <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">Ready</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-lg border bg-gray-50 p-3">
                <div className="aspect-[4/5] rounded-md bg-orange-100 p-4">
                  <div className="h-full rounded-md bg-white shadow-sm">
                    <div className="mx-auto h-16 w-16 translate-y-10 rounded-full bg-orange-500" />
                    <div className="mx-auto mt-16 h-24 w-20 rounded-md bg-gray-900" />
                    <div className="mx-auto mt-4 h-3 w-24 rounded-full bg-gray-300" />
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-gray-950 p-4 text-white">
                <div className="min-h-[260px] rounded-md bg-gray-800 p-4">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex justify-end">
                      <span className="rounded bg-orange-500 px-2 py-1 text-xs font-semibold">NOVO</span>
                    </div>
                    <div>
                      <div className="mb-3 h-24 rounded-md bg-white/10" />
                      <p className="text-xl font-semibold leading-snug">Produto em movimento</p>
                      <p className="mt-2 text-sm text-gray-300">Luz premium, camera suave, CTA pronto.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-300">
                  <span className="rounded bg-white/10 px-2 py-2">Queued</span>
                  <span className="rounded bg-white/10 px-2 py-2">Render</span>
                  <span className="rounded bg-white/10 px-2 py-2">Export</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
