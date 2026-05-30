import { redirect } from 'next/navigation';
import {
  getLegacyLoginHref,
  type LegacyLoginSearchParams,
} from '../legacy-login-url';

type SignUpPageProps = {
  searchParams: Promise<LegacyLoginSearchParams>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  redirect(getLegacyLoginHref('signup', await searchParams));
}
