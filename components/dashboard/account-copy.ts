import type { DashboardLocale } from '@/lib/dashboard/content';
import type { SubscriptionInterval, SubscriptionTier } from '@/lib/payments/catalog';

type PlanCopy = {
  description: string;
  features: string[];
};

type PackageCopy = {
  description: string;
  features: string[];
};

type BillingCopy = {
  badge: string;
  title: string;
  intro: string;
  buyExtra: string;
  balance: string;
  balanceHint: string;
  currentPlan: string;
  noActivePlan: string;
  inactive: string;
  cadence: string;
  selectPlan: string;
  cadenceHint: string;
  mockTitle: string;
  mockBody: string;
  mockSuccess: string;
  mockCanceled: string;
  loadError: string;
  retry: string;
  manageBilling: string;
  cancelPlan: string;
  intervalTabs: Record<SubscriptionInterval, string>;
  intervalLabels: Record<SubscriptionInterval, string>;
  intervalHint: string;
  recommended: string;
  current: string;
  pricePeriod: Record<SubscriptionInterval, string>;
  effectiveMonthly: string;
  save: string;
  switchLater: string;
  creditsPerMonth: string;
  choose: string;
  currentButton: string;
  activating: string;
  plans: Record<SubscriptionTier, PlanCopy>;
};

type CreditsCopy = {
  badge: string;
  title: string;
  intro: string;
  balance: string;
  balanceHint: string;
  subscription: string;
  inactive: string;
  viewPlans: string;
  createVideo: string;
  loadError: string;
  retry: string;
  flexible: string;
  purchasedCredits: string;
  buy: string;
  adding: string;
  ledgerTitle: string;
  ledgerSubtitle: string;
  ledgerColumns: {
    reason: string;
    delta: string;
    balance: string;
    created: string;
  };
  emptyLedger: string;
  reasons: Record<string, string>;
  packages: Record<string, PackageCopy>;
};

type ProfileCopy = {
  eyebrow: string;
  title: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  subscriptionPlan: string;
  noActivePlan: string;
  inactive: string;
  managePlans: string;
  creditBalance: string;
  creditHint: string;
  buyCredits: string;
  accountProfile: string;
  saving: string;
  save: string;
};

export const billingCopy: Record<DashboardLocale, BillingCopy> = {
  pt: {
    badge: 'Planos e saldo',
    title: 'Escolha o plano para seu ritmo de criação',
    intro:
      'Os pagamentos estão em modo mock nesta fase. A assinatura libera a cota mensal imediatamente, e os mesmos price ids podem ser ligados ao billing real depois.',
    buyExtra: 'Comprar créditos extras',
    balance: 'Saldo',
    balanceHint: 'créditos disponíveis',
    currentPlan: 'Plano atual',
    noActivePlan: 'Sem plano ativo',
    inactive: 'assinatura inativa',
    cadence: 'Cadência',
    selectPlan: 'Escolha um plano',
    cadenceHint: 'os créditos aparecem como cota mensal',
    mockTitle: 'Modo de pagamento mock',
    mockBody:
      'O checkout ainda não cobra dinheiro. Ele atualiza o plano, adiciona créditos e grava o ledger para validar o fluxo completo do workspace.',
    mockSuccess: 'Assinatura mock ativada e créditos adicionados.',
    mockCanceled: 'Assinatura mock cancelada. O saldo restante continua disponível.',
    loadError: 'O status da conta não carregou. Os planos continuam disponíveis.',
    retry: 'Tentar novamente',
    manageBilling: 'Gerenciar billing',
    cancelPlan: 'Cancelar plano mock',
    intervalTabs: { month: 'Mensal', year: 'Anual' },
    intervalLabels: { month: 'Cobrança mensal', year: 'Cobrança anual' },
    intervalHint:
      'Planos anuais mantêm a renovação mensal de créditos com menor preço efetivo por mês.',
    recommended: 'Recomendado',
    current: 'Atual',
    pricePeriod: { month: 'mês', year: 'ano' },
    effectiveMonthly: 'efetivo por mês',
    save: 'economize',
    switchLater: 'cancele ou troque depois no billing',
    creditsPerMonth: 'créditos por mês de billing',
    choose: 'Escolher',
    currentButton: 'Plano atual',
    activating: 'Ativando...',
    plans: {
      basic: {
        description: 'Para testar vídeos de produto, imagens de campanha e try-on.',
        features: [
          '60 créditos renovam a cada mês de billing',
          'Todas as ferramentas de imagem e vídeo ecommerce',
          'Bom para 12 vídeos básicos de 5s',
        ],
      },
      plus: {
        description: 'Para lançamentos semanais e produção recorrente de criativos.',
        features: [
          '180 créditos renovam a cada mês de billing',
          'Fila prioritária no modo de produção futuro',
          'Bom para 36 vídeos básicos de 5s',
        ],
      },
      pro: {
        description: 'Para marcas com lotes de SKU e testes frequentes de vídeo.',
        features: [
          '480 créditos renovam a cada mês de billing',
          'Maior cota de assinatura mock',
          'Bom para 96 vídeos básicos de 5s',
        ],
      },
    },
  },
  en: {
    badge: 'Plans and balance',
    title: 'Choose the plan for your creative workload',
    intro:
      'Payments are mocked in this phase. Subscriptions grant the monthly credit allowance immediately, and real billing can be wired later through the same price ids.',
    buyExtra: 'Buy extra credits',
    balance: 'Balance',
    balanceHint: 'available credits',
    currentPlan: 'Current plan',
    noActivePlan: 'No active plan',
    inactive: 'subscription inactive',
    cadence: 'Cadence',
    selectPlan: 'Select a plan',
    cadenceHint: 'credits are shown as monthly allowance',
    mockTitle: 'Mock payment mode',
    mockBody:
      'Checkout does not charge money yet. It updates the account plan, adds credits, and writes a ledger entry so the workspace flow is testable end to end.',
    mockSuccess: 'Mock subscription activated and credits were added.',
    mockCanceled: 'Mock subscription was canceled. Your remaining credit balance stays available.',
    loadError: 'Account status did not load. Plans remain available.',
    retry: 'Retry',
    manageBilling: 'Manage billing',
    cancelPlan: 'Cancel mock plan',
    intervalTabs: { month: 'Monthly', year: 'Annual' },
    intervalLabels: { month: 'Monthly billing', year: 'Yearly billing' },
    intervalHint:
      'Annual plans keep monthly credit refresh semantics and use a lower effective monthly price.',
    recommended: 'Recommended',
    current: 'Current',
    pricePeriod: { month: 'month', year: 'year' },
    effectiveMonthly: 'effective monthly',
    save: 'save',
    switchLater: 'cancel or switch later in billing',
    creditsPerMonth: 'credits per billing month',
    choose: 'Choose',
    currentButton: 'Current plan',
    activating: 'Activating...',
    plans: {
      basic: {
        description: 'For testing product videos, campaign images, and try-on flows.',
        features: [
          '60 credits refresh every billing month',
          'All ecommerce image and video tools',
          'Good for 12 basic 5s videos',
        ],
      },
      plus: {
        description: 'For weekly launches and repeat ad creative production.',
        features: [
          '180 credits refresh every billing month',
          'Priority queue in future production mode',
          'Good for 36 basic 5s videos',
        ],
      },
      pro: {
        description: 'For brands producing SKU batches and frequent video tests.',
        features: [
          '480 credits refresh every billing month',
          'Highest mock subscription allowance',
          'Good for 96 basic 5s videos',
        ],
      },
    },
  },
  zh: {
    badge: '订阅与余额',
    title: '按创作需求选择订阅计划',
    intro:
      '当前为测试支付模式，不会真实扣款。订阅会立即发放当月算力值，后续接入真实支付时会复用同一套价格配置。',
    buyExtra: '购买额外算力值',
    balance: '余额',
    balanceHint: '可用算力值',
    currentPlan: '当前计划',
    noActivePlan: '暂无有效计划',
    inactive: '订阅未激活',
    cadence: '周期',
    selectPlan: '选择一个计划',
    cadenceHint: '这里展示的是每月发放额度',
    mockTitle: '测试支付模式',
    mockBody:
      '当前支付流程不会真实扣款，只会更新账户计划、增加算力值并写入流水，方便完整验证工作台链路。',
    mockSuccess: '测试订阅已开通，算力值已发放。',
    mockCanceled: '测试订阅已取消，剩余算力值仍可继续使用。',
    loadError: '账户状态加载失败，订阅计划仍可继续选择。',
    retry: '重试',
    manageBilling: '管理账单',
    cancelPlan: '取消测试计划',
    intervalTabs: { month: '月付', year: '年付' },
    intervalLabels: { month: '月付计划', year: '年付计划' },
    intervalHint: '年付计划仍按月发放算力值，但折算月费更低。',
    recommended: '推荐',
    current: '当前',
    pricePeriod: { month: '月', year: '年' },
    effectiveMonthly: '折算每月',
    save: '节省',
    switchLater: '之后可在账单里取消或切换',
    creditsPerMonth: '算力值 / 账单月',
    choose: '选择',
    currentButton: '当前计划',
    activating: '开通中...',
    plans: {
      basic: {
        description: '适合测试商品视频、活动图和试衣流程。',
        features: [
          '每个账单月发放 60 算力值',
          '可使用全部电商图片和视频工具',
          '约可生成 12 条基础 5 秒视频',
        ],
      },
      plus: {
        description: '适合每周上新和持续产出广告素材。',
        features: [
          '每个账单月发放 180 算力值',
          '正式上线后优先排队',
          '约可生成 36 条基础 5 秒视频',
        ],
      },
      pro: {
        description: '适合批量 SKU 和高频视频测试的品牌团队。',
        features: [
          '每个账单月发放 480 算力值',
          '测试模式下最高订阅额度',
          '约可生成 96 条基础 5 秒视频',
        ],
      },
    },
  },
};

export const creditsCopy: Record<DashboardLocale, CreditsCopy> = {
  pt: {
    badge: 'Carteira de créditos',
    title: 'Compre créditos extras quando uma campanha precisar de mais margem',
    intro:
      'Créditos avulsos ficam separados da cota da assinatura. No modo mock eles entram imediatamente no mesmo saldo usado pelas gerações.',
    balance: 'Saldo disponível',
    balanceHint: 'créditos prontos para usar',
    subscription: 'Assinatura',
    inactive: 'assinatura inativa',
    viewPlans: 'Ver planos',
    createVideo: 'Criar vídeo',
    loadError: 'O saldo da conta não carregou. Os pacotes continuam disponíveis.',
    retry: 'Tentar novamente',
    flexible: 'Flexível',
    purchasedCredits: 'créditos comprados',
    buy: 'Comprar',
    adding: 'Adicionando créditos...',
    ledgerTitle: 'Ledger de créditos',
    ledgerSubtitle: 'Últimas mudanças de saldo desta conta.',
    ledgerColumns: {
      reason: 'Motivo',
      delta: 'Delta',
      balance: 'Saldo',
      created: 'Criado em',
    },
    emptyLedger: 'Ainda não há atividade de créditos.',
    reasons: {
      purchase: 'Compra',
      reserve: 'Reserva',
      capture: 'Captura',
      refund: 'Reembolso',
      admin_adjust: 'Ajuste',
    },
    packages: {
      starter: {
        description: 'Um top-up pequeno para testes de prompt e experimentos de produto.',
        features: ['20 créditos comprados', 'Não expiram no modo mock', 'Bom para 4 vídeos básicos de 5s'],
      },
      creator: {
        description: 'Mais margem para um lote semanal de imagens e clipes de produto.',
        features: ['80 créditos comprados', 'Não expiram no modo mock', 'Bom para 16 vídeos básicos de 5s'],
      },
      scale: {
        description: 'Reserva maior para lotes de catálogo e testes de campanha.',
        features: ['240 créditos comprados', 'Não expiram no modo mock', 'Bom para 48 vídeos básicos de 5s'],
      },
    },
  },
  en: {
    badge: 'Credit wallet',
    title: 'Buy extra credits when a campaign needs more room',
    intro:
      'Top-up credits are separate from the subscription plan allowance. In this mock phase they are added immediately and remain in the same available balance used by generation jobs.',
    balance: 'Available balance',
    balanceHint: 'credits ready to spend',
    subscription: 'Subscription',
    inactive: 'subscription inactive',
    viewPlans: 'View subscription plans',
    createVideo: 'Create a video',
    loadError: 'Account balance did not load. Credit packages remain available.',
    retry: 'Retry',
    flexible: 'Flexible',
    purchasedCredits: 'purchased credits',
    buy: 'Buy',
    adding: 'Adding credits...',
    ledgerTitle: 'Credit ledger',
    ledgerSubtitle: 'Latest balance changes for this account.',
    ledgerColumns: {
      reason: 'Reason',
      delta: 'Delta',
      balance: 'Balance',
      created: 'Created',
    },
    emptyLedger: 'No credit activity yet.',
    reasons: {
      purchase: 'Purchase',
      reserve: 'Reserve',
      capture: 'Capture',
      refund: 'Refund',
      admin_adjust: 'Adjustment',
    },
    packages: {
      starter: {
        description: 'A small top-up for prompt tests and product experiments.',
        features: ['20 purchased credits', 'Never expire in mock mode', 'Good for 4 basic 5s videos'],
      },
      creator: {
        description: 'Extra room for a weekly batch of product images and clips.',
        features: ['80 purchased credits', 'Never expire in mock mode', 'Good for 16 basic 5s videos'],
      },
      scale: {
        description: 'A larger reserve for catalog batches and campaign tests.',
        features: ['240 purchased credits', 'Never expire in mock mode', 'Good for 48 basic 5s videos'],
      },
    },
  },
  zh: {
    badge: '算力余额',
    title: '当活动需要更多额度时，直接购买额外算力值',
    intro:
      '单次购买的算力值独立于订阅月额度。测试支付模式下会立即到账，并进入生成任务共用的可用余额。',
    balance: '可用余额',
    balanceHint: '可立即使用的算力值',
    subscription: '订阅',
    inactive: '订阅未激活',
    viewPlans: '查看订阅计划',
    createVideo: '创建视频',
    loadError: '账户余额加载失败，算力包仍可继续购买。',
    retry: '重试',
    flexible: '灵活',
    purchasedCredits: '购买算力值',
    buy: '购买',
    adding: '购买中...',
    ledgerTitle: '算力流水',
    ledgerSubtitle: '这个账户最近的余额变动。',
    ledgerColumns: {
      reason: '原因',
      delta: '变化',
      balance: '余额',
      created: '时间',
    },
    emptyLedger: '还没有算力值流水。',
    reasons: {
      purchase: '购买',
      reserve: '预扣',
      capture: '结算',
      refund: '退回',
      admin_adjust: '调整',
    },
    packages: {
      starter: {
        description: '适合提示词测试和小规模商品实验的轻量补充。',
        features: ['20 算力值', '测试模式下不会过期', '约可生成 4 条基础 5 秒视频'],
      },
      creator: {
        description: '适合每周一批商品图和视频素材的额外额度。',
        features: ['80 算力值', '测试模式下不会过期', '约可生成 16 条基础 5 秒视频'],
      },
      scale: {
        description: '适合目录批量生产和活动测试的更大储备。',
        features: ['240 算力值', '测试模式下不会过期', '约可生成 48 条基础 5 秒视频'],
      },
    },
  },
};

export const profileCopy: Record<DashboardLocale, ProfileCopy> = {
  pt: {
    eyebrow: 'Centro pessoal',
    title: 'Informações pessoais',
    name: 'Nome',
    namePlaceholder: 'Digite seu nome',
    email: 'Email',
    emailPlaceholder: 'Digite seu email',
    subscriptionPlan: 'Plano de assinatura',
    noActivePlan: 'Sem plano ativo',
    inactive: 'Escolha um plano para liberar créditos recorrentes',
    managePlans: 'Gerenciar planos',
    creditBalance: 'Saldo de créditos',
    creditHint: 'Disponível para gerações de imagem, vídeo e try-on.',
    buyCredits: 'Comprar créditos',
    accountProfile: 'Perfil da conta',
    saving: 'Salvando...',
    save: 'Salvar alterações',
  },
  en: {
    eyebrow: 'Personal center',
    title: 'Personal information',
    name: 'Name',
    namePlaceholder: 'Enter your name',
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    subscriptionPlan: 'Subscription plan',
    noActivePlan: 'No active plan',
    inactive: 'Choose a plan to unlock recurring credits',
    managePlans: 'Manage plans',
    creditBalance: 'Credit balance',
    creditHint: 'Available for image, video, and try-on generations.',
    buyCredits: 'Buy credits',
    accountProfile: 'Account profile',
    saving: 'Saving...',
    save: 'Save changes',
  },
  zh: {
    eyebrow: '个人中心',
    title: '个人信息',
    name: '姓名',
    namePlaceholder: '请输入姓名',
    email: '邮箱',
    emailPlaceholder: '请输入邮箱',
    subscriptionPlan: '订阅计划',
    noActivePlan: '暂无有效计划',
    inactive: '选择订阅计划后会获得每月算力值',
    managePlans: '管理订阅计划',
    creditBalance: '算力值余额',
    creditHint: '可用于图片、视频和试衣生成。',
    buyCredits: '购买算力值',
    accountProfile: '账号资料',
    saving: '保存中...',
    save: '保存修改',
  },
};

export const subscriptionStatusLabels: Record<DashboardLocale, Record<string, string>> = {
  pt: {
    active: 'ativa',
    trialing: 'em teste',
    canceled: 'cancelada',
    incomplete: 'incompleta',
    past_due: 'em atraso',
  },
  en: {
    active: 'active',
    trialing: 'trialing',
    canceled: 'canceled',
    incomplete: 'incomplete',
    past_due: 'past due',
  },
  zh: {
    active: '已激活',
    trialing: '试用中',
    canceled: '已取消',
    incomplete: '未完成',
    past_due: '已逾期',
  },
};
