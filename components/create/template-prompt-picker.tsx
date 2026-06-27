'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { getTemplateCategoryLabel } from '@/lib/templates/catalog';
import {
  normalizePublicTemplateCategories,
  normalizePublicTemplateDetail,
  normalizePublicTemplateItems,
  type PublicTemplateDetailItem,
  type PublicTemplateItem,
  type PublicTemplateType,
} from '@/lib/templates/public-client';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { cn } from '@/lib/utils';

type SupportedTemplateType = Extract<
  PublicTemplateType,
  'image_to_image' | 'try_on'
>;

type TemplatePickerCopy = {
  empty: string;
  error: string;
  loading: string;
  retry: string;
};

const templatePickerCopy: Record<string, TemplatePickerCopy> = {
  pt: {
    empty: 'Nenhum template nesta categoria.',
    error: 'Não foi possível carregar os templates.',
    loading: 'Carregando templates',
    retry: 'Tentar novamente',
  },
  en: {
    empty: 'No templates in this category.',
    error: 'Templates could not be loaded.',
    loading: 'Loading templates',
    retry: 'Retry',
  },
  zh: {
    empty: '当前分类暂无模板。',
    error: '模板加载失败。',
    loading: '加载模板中',
    retry: '重试',
  },
};

export function TemplatePromptPicker({
  disabled,
  onApply,
  selectedTemplateId,
  type,
}: {
  disabled?: boolean;
  onApply: (template: PublicTemplateDetailItem) => void;
  selectedTemplateId?: string | null;
  type: SupportedTemplateType;
}) {
  const locale = useDashboardLocale();
  const copy = templatePickerCopy[locale] ?? templatePickerCopy.en;
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PublicTemplateItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isApplyingTemplateId, setIsApplyingTemplateId] = useState<
    string | null
  >(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const selectedId = selectedTemplateId ?? '';
  const hasCategory = Boolean(activeCategory);
  const isLoading = isLoadingCategories || isLoadingTemplates;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadCategories() {
      setIsLoadingCategories(true);
      setLoadError(false);

      try {
        const params = new URLSearchParams({
          locale,
          pageSize: '1',
          type,
        });
        const response = await fetch(`/api/templates?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('template-categories-load-failed');
        }

        const body = await response.json();
        const nextCategories = normalizePublicTemplateCategories(body);

        if (!cancelled) {
          setCategories(nextCategories);
          setActiveCategory((current) =>
            current && nextCategories.includes(current)
              ? current
              : nextCategories[0] ?? null
          );
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setActiveCategory(null);
          setTemplates([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setIsLoadingCategories(false);
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locale, reloadKey, type]);

  useEffect(() => {
    if (!activeCategory) return;

    let cancelled = false;
    const controller = new AbortController();

    async function loadTemplates() {
      setIsLoadingTemplates(true);
      setLoadError(false);

      try {
        const params = new URLSearchParams({
          category: activeCategory!,
          locale,
          pageSize: '24',
          type,
        });
        const response = await fetch(`/api/templates?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('templates-load-failed');
        }

        const body = await response.json();
        const nextTemplates = normalizePublicTemplateItems(body);

        if (!cancelled) {
          setTemplates(nextTemplates);
        }
      } catch {
        if (!cancelled) {
          setTemplates([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setIsLoadingTemplates(false);
      }
    }

    void loadTemplates();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeCategory, locale, type]);

  async function applyTemplate(template: PublicTemplateItem) {
    if (disabled) return;

    setIsApplyingTemplateId(template.id);
    setLoadError(false);

    try {
      const response = await fetch(
        `/api/templates/${encodeURIComponent(template.id)}?${new URLSearchParams(
          { locale }
        )}`
      );

      if (!response.ok) {
        throw new Error('template-detail-load-failed');
      }

      const detail = normalizePublicTemplateDetail(await response.json());
      if (!detail) {
        throw new Error('template-detail-invalid');
      }

      onApply(detail);
    } catch {
      setLoadError(true);
    } finally {
      setIsApplyingTemplateId(null);
    }
  }

  return (
    <div className="space-y-3">
      {loadError ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{copy.error}</span>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-700 underline underline-offset-2"
          >
            <RefreshCw className="size-3" />
            {copy.retry}
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm font-semibold text-gray-400">
          <Loader2 className="size-4 animate-spin" />
          {copy.loading}
        </div>
      ) : !hasCategory || templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
          {copy.empty}
        </div>
      ) : (
        <div className="grid grid-cols-[82px_1fr] gap-3">
          <div className="space-y-1.5">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                disabled={disabled || isLoadingCategories}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'min-h-8 w-full rounded-lg px-2 py-1 text-left text-xs font-bold leading-4 transition disabled:cursor-not-allowed disabled:opacity-60',
                  activeCategory === category
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-500 hover:bg-indigo-50/70 hover:text-indigo-600'
                )}
              >
                {getTemplateCategoryLabel(category, locale)}
              </button>
            ))}
          </div>
          <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {templates.map((template) => {
              const isSelected = selectedId === template.id;
              const isApplying = isApplyingTemplateId === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  aria-label={template.title}
                  disabled={disabled || Boolean(isApplyingTemplateId)}
                  onClick={() => applyTemplate(template)}
                  className={cn(
                    'group min-w-0 rounded-lg border bg-white p-1.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-100'
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/40'
                  )}
                >
                  <span className="relative block aspect-square overflow-hidden rounded-md bg-gray-100">
                    {template.thumbnailUrl ? (
                      <img
                        src={template.thumbnailUrl}
                        alt=""
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-gray-300">
                        <ImageIcon className="size-5" />
                      </span>
                    )}
                    {isApplying ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-indigo-600">
                        <Loader2 className="size-5 animate-spin" />
                      </span>
                    ) : isSelected ? (
                      <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                        <CheckCircle2 className="size-3.5" />
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 block truncate text-xs font-bold text-gray-700">
                    {template.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
