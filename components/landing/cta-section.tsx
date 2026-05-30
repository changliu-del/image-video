import Link from "next/link";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-orange-600">
            <MessageSquareText className="h-4 w-4" />
            Pronto para publicar mais criativos?
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            Comece com uma imagem de produto e gere seu primeiro video.
          </h2>
        </div>
        <Button asChild size="lg">
          <Link href="/generate">
            Abrir Studio
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
