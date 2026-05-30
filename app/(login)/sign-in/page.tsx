import { redirect } from 'next/navigation';
import {
  getLegacyLoginHref,
  type LegacyLoginSearchParams,
} from '../legacy-login-url';

type SignInPageProps = {
  searchParams: Promise<LegacyLoginSearchParams>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  redirect(getLegacyLoginHref('signin', await searchParams));
}
