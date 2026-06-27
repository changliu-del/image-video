'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Loader2 } from 'lucide-react';
import { useActionState } from 'react';
import { updatePassword } from '@/app/(login)/actions';
import type { DashboardLocale } from '@/lib/dashboard/content';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';

type PasswordState = {
  error?: string;
  success?: string;
};

const securityCopy: Record<
  DashboardLocale,
  {
    title: string;
    passwordTitle: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    updating: string;
    updatePassword: string;
  }
> = {
  pt: {
    title: 'Configurações de segurança',
    passwordTitle: 'Senha',
    currentPassword: 'Senha atual',
    newPassword: 'Nova senha',
    confirmNewPassword: 'Confirmar nova senha',
    updating: 'Atualizando...',
    updatePassword: 'Atualizar senha',
  },
  en: {
    title: 'Security settings',
    passwordTitle: 'Password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmNewPassword: 'Confirm new password',
    updating: 'Updating...',
    updatePassword: 'Update password',
  },
  zh: {
    title: '安全设置',
    passwordTitle: '密码',
    currentPassword: '当前密码',
    newPassword: '新密码',
    confirmNewPassword: '确认新密码',
    updating: '更新中...',
    updatePassword: '更新密码',
  },
};

export default function SecurityPage() {
  const locale = useDashboardLocale();
  const copy = securityCopy[locale];
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium bold text-gray-900 mb-6">
        {copy.title}
      </h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{copy.passwordTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={passwordAction}>
            <input type="hidden" name="locale" value={locale} />
            <div>
              <Label htmlFor="current-password" className="mb-2">
                {copy.currentPassword}
              </Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="new-password" className="mb-2">
                {copy.newPassword}
              </Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="mb-2">
                {copy.confirmNewPassword}
              </Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            {passwordState.error && (
              <p className="text-red-500 text-sm">{passwordState.error}</p>
            )}
            {passwordState.success && (
              <p className="text-green-500 text-sm">{passwordState.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPasswordPending}
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {copy.updating}
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  {copy.updatePassword}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
