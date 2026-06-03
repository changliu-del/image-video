import { redirect } from 'next/navigation';

type CreatePageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  const locale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const suffix = locale ? `?locale=${encodeURIComponent(locale)}` : '';

  redirect(`/create/video${suffix}`);
}
