import { isLocale, locales, type Locale } from '@/lib/marketing/content';

export type DashboardLocale = Locale;

type DashboardContent = {
  localeNames: Record<DashboardLocale, string>;
  nav: {
    home: string;
    tools: string;
    imageVideo: string;
    apparel: string;
    tryOn: string;
    personal: string;
    credits: string;
    billing: string;
    security: string;
    profileCenter: string;
  };
  header: {
    workspace: string;
    credits: string;
    buy: string;
    language: string;
  };
  userMenu: {
    account: string;
    signIn: string;
    startFree: string;
    signOut: string;
    openMenu: string;
    templateAdmin: string;
  };
};

export const dashboardLocales = locales;

export const dashboardContent: Record<DashboardLocale, DashboardContent> = {
  pt: {
    localeNames: {
      pt: 'Português',
      en: 'English',
      zh: '中文',
    },
    nav: {
      home: 'Início',
      tools: 'Área de criação',
      imageVideo: 'Imagem para vídeo',
      apparel: 'Imagem de produto',
      tryOn: 'Provador virtual',
      personal: 'Pessoal',
      credits: 'Créditos',
      billing: 'Cobrança',
      security: 'Segurança',
      profileCenter: 'Centro pessoal',
    },
    header: {
      workspace: 'Estúdio',
      credits: 'créditos',
      buy: 'Comprar',
      language: 'Idioma',
    },
    userMenu: {
      account: 'Conta',
      signIn: 'Entrar',
      startFree: 'Começar grátis',
      signOut: 'Sair',
      openMenu: 'Abrir menu do usuário',
      templateAdmin: 'Admin de templates',
    },
  },
  en: {
    localeNames: {
      pt: 'Português',
      en: 'English',
      zh: '中文',
    },
    nav: {
      home: 'Home',
      tools: 'Creation workspace',
      imageVideo: 'Image to video',
      apparel: 'Product image',
      tryOn: 'Virtual try-on',
      personal: 'Personal',
      credits: 'Credits',
      billing: 'Billing',
      security: 'Security',
      profileCenter: 'Personal center',
    },
    header: {
      workspace: 'Studio',
      credits: 'credits',
      buy: 'Buy',
      language: 'Language',
    },
    userMenu: {
      account: 'Account',
      signIn: 'Sign in',
      startFree: 'Start free',
      signOut: 'Sign out',
      openMenu: 'Open user menu',
      templateAdmin: 'Template Admin',
    },
  },
  zh: {
    localeNames: {
      pt: 'Português',
      en: 'English',
      zh: '中文',
    },
    nav: {
      home: '首页',
      tools: '创作工作台',
      imageVideo: '图生视频',
      apparel: '商品图',
      tryOn: '智能试衣',
      personal: '个人空间',
      credits: '算力值',
      billing: '账单',
      security: '安全',
      profileCenter: '个人中心',
    },
    header: {
      workspace: '工作台',
      credits: '算力值',
      buy: '购买',
      language: '语言',
    },
    userMenu: {
      account: '账号',
      signIn: '登录',
      startFree: '免费开始',
      signOut: '退出登录',
      openMenu: '打开用户菜单',
      templateAdmin: '模板后台',
    },
  },
};

export function normalizeDashboardLocale(value: string | null | undefined): DashboardLocale {
  return typeof value === 'string' && isLocale(value) ? value : 'pt';
}

export function getDashboardContent(locale: string | null | undefined) {
  return dashboardContent[normalizeDashboardLocale(locale)];
}
