import {
  normalizeDashboardLocale,
  type DashboardLocale,
} from '@/lib/dashboard/content';

export type AdminLocale = DashboardLocale;

export const adminStatusLabels: Record<AdminLocale, Record<string, string>> = {
  pt: {
    active: 'Ativo',
    admin: 'Admin',
    admin_adjust: 'Ajuste manual',
    archived: 'Arquivado',
    apparel_image: 'Imagem de produto',
    capture: 'Captura',
    deleted: 'Excluído',
    draft: 'Rascunho',
    failed: 'Falhou',
    final_image: 'Imagem final',
    final_video: 'Vídeo final',
    inactive: 'Inativo',
    image_to_video: 'Imagem para vídeo',
    member: 'Membro',
    ops: 'Operações',
    pending: 'Pendente',
    purchase: 'Compra',
    published: 'Publicado',
    queued: 'Na fila',
    rendering: 'Renderizando',
    reserve: 'Reserva',
    refund: 'Reembolso',
    running: 'Executando',
    submitting: 'Enviando',
    succeeded: 'Concluído',
    try_on: 'Provador',
    upload: 'Upload',
    uploaded: 'Enviado',
  },
  en: {
    active: 'Active',
    admin: 'Admin',
    admin_adjust: 'Manual adjustment',
    archived: 'Archived',
    apparel_image: 'Product image',
    capture: 'Capture',
    deleted: 'Deleted',
    draft: 'Draft',
    failed: 'Failed',
    final_image: 'Final image',
    final_video: 'Final video',
    inactive: 'Inactive',
    image_to_video: 'Image to video',
    member: 'Member',
    ops: 'Ops',
    pending: 'Pending',
    purchase: 'Purchase',
    published: 'Published',
    queued: 'Queued',
    rendering: 'Rendering',
    reserve: 'Reserve',
    refund: 'Refund',
    running: 'Running',
    submitting: 'Submitting',
    succeeded: 'Succeeded',
    try_on: 'Try-on',
    upload: 'Upload',
    uploaded: 'Uploaded',
  },
  zh: {
    active: '活跃',
    admin: '管理员',
    admin_adjust: '人工调整',
    archived: '已归档',
    apparel_image: '商品图',
    capture: '结算',
    deleted: '已删除',
    draft: '草稿',
    failed: '失败',
    final_image: '成品图',
    final_video: '成品视频',
    inactive: '停用',
    image_to_video: '图生视频',
    member: '成员',
    ops: '运营',
    pending: '待处理',
    purchase: '充值',
    published: '已发布',
    queued: '排队中',
    rendering: '渲染中',
    reserve: '预留',
    refund: '返还',
    running: '运行中',
    submitting: '提交中',
    succeeded: '成功',
    try_on: '智能试衣',
    upload: '用户上传',
    uploaded: '已上传',
  },
};

export type AdminCommonCopy = {
  actions: string;
  archive: string;
  cancel: string;
  close: string;
  create: string;
  delete: string;
  deleteFailed: string;
  edit: string;
  loadFailed: string;
  loading: string;
  next: string;
  noData: string;
  noRecords: string;
  page: string;
  previous: string;
  publish: string;
  refresh: string;
  reset: string;
  restore: string;
  restoreFailed: string;
  save: string;
  saveFailed: string;
  saveChanges: string;
  search: string;
  select: string;
  total: string;
  upload: string;
  viewDetails: string;
  confirmDelete: (value: string, title: string) => string;
};

type AdminManagementCopy = {
  title: string;
  description: string;
  searchPlaceholder: string;
  columns: Record<string, string>;
  fields: Record<string, string>;
  filters?: Record<string, string>;
};

type AdminTemplatesCopy = {
  title: string;
  description: string;
  emptyText: string;
  searchPlaceholder: string;
  create: string;
  modalCreate: string;
  modalEdit: string;
  modalDetails: string;
  currentAsset: string;
  uploadAsset: string;
  tags: string;
  selectSavedTemplate: string;
  invalidJson: string;
  confirmDelete: (slug: string) => string;
  columns: Record<string, string>;
  fields: Record<string, string>;
  placeholders: Record<string, string>;
  typeOptions: Record<string, string>;
  uploadRoleOptions: Record<string, string>;
  errors: Record<string, string>;
};

type AdminLibraryCopy = {
  title: string;
  description: string;
  emptyText: string;
  searchPlaceholder: string;
  addAsset: string;
  createAction: string;
  modalCreate: string;
  modalEdit: string;
  modalDetails: string;
  advancedFields: string;
  noFileSelected: string;
  selectedFile: string;
  uploadFile: string;
  openAssetUrl: string;
  useCases: string;
  confirmRemove: (title: string) => string;
  columns: Record<string, string>;
  fields: Record<string, string>;
  placeholders: Record<string, string>;
  kindOptions: Record<string, string>;
  useCaseOptions: Record<string, string>;
  errors: Record<string, string>;
};

type AdminDashboardCopy = {
  title: string;
  description: string;
  rangeTitle: string;
  from: string;
  to: string;
  apply: string;
  refresh: string;
  loading: string;
  loadFailed: string;
  loginEstimate: string;
  presets: Record<'today' | 'last7' | 'last30' | 'last90', string>;
  gauges: Record<
    | 'registrations'
    | 'login'
    | 'visits'
    | 'activeUsers'
    | 'generation'
    | 'recharge'
    | 'failedJobs'
    | 'abnormalRecharge',
    {
      label: string;
      hint: string;
    }
  >;
  sections: {
    funnel: string;
    trend: string;
    generationMix: string;
    rechargeRisk: string;
  };
  metrics: Record<
    | 'totalUsers'
    | 'newUsers'
    | 'activeUsers'
    | 'uploadUsers'
    | 'generationUsers'
    | 'payingUsers'
    | 'visitEvents'
    | 'uploadedAssets'
    | 'generationJobs'
    | 'failedJobs'
    | 'successRate'
    | 'purchaseEvents'
    | 'purchasedCredits'
    | 'creditEvents'
    | 'refundEvents'
    | 'runningJobs',
    string
  >;
  anomalies: Record<string, string>;
  funnelStages: Record<string, string>;
  diagnosis: {
    watch: string;
    steady: string;
    empty: Record<string, string>;
    weak: Record<string, string>;
    healthy: Record<string, string>;
  };
  risk: {
    action: string;
    conversion: string;
    defaultAction: string;
    dropoff: string;
    impact: string;
    noRiskAction: string;
    noRiskImpact: string;
    noRiskTitle: string;
    signals: string;
  };
  riskActions: Record<string, string>;
  riskImpacts: Record<string, string>;
  riskSeverity: Record<
    'critical' | 'high' | 'medium' | 'low' | 'info',
    string
  >;
  generationTypes: Record<string, string>;
};

export const ADMIN_TAB_KEYS = [
  'overview',
  'templates',
  'library-assets',
  'users',
  'assets',
  'generation-jobs',
  'credit-ledger',
  'help',
] as const;

export type AdminTabKey = (typeof ADMIN_TAB_KEYS)[number];

type AdminHelpItem = {
  key: AdminTabKey;
  title: string;
  purpose: string;
  dailyActions: string[];
  keyFields: string[];
  riskSignals: string[];
};

type AdminHelpSection = {
  title: string;
  items: string[];
};

type AdminHelpCopy = {
  title: string;
  description: string;
  principlesTitle: string;
  principles: string[];
  rhythmTitle: string;
  rhythms: AdminHelpSection[];
  maintenanceTitle: string;
  maintenance: string[];
  labels: Record<
    'purpose' | 'dailyActions' | 'keyFields' | 'riskSignals',
    string
  >;
  items: AdminHelpItem[];
};

export type AdminContent = {
  common: AdminCommonCopy;
  shell: {
    title: string;
    forbiddenTitle: string;
    forbiddenDescription: string;
  };
  tabs: Record<AdminTabKey, string>;
  dashboard: AdminDashboardCopy;
  management: Record<
    'users' | 'assets' | 'generation-jobs' | 'credit-ledger',
    AdminManagementCopy
  >;
  templates: AdminTemplatesCopy;
  libraryAssets: AdminLibraryCopy;
  help: AdminHelpCopy;
  statusLabels: Record<string, string>;
};

export const adminContent: Record<AdminLocale, AdminContent> = {
  pt: {
    common: {
      actions: 'Ações',
      archive: 'Arquivar',
      cancel: 'Cancelar',
      close: 'Fechar',
      create: 'Criar',
      delete: 'Excluir',
      deleteFailed: 'Falha ao excluir',
      edit: 'Editar',
      loadFailed: 'Falha ao carregar',
      loading: 'Carregando...',
      next: 'Próxima',
      noData: 'Sem dados.',
      noRecords: 'Nenhum registro.',
      page: 'Página',
      previous: 'Anterior',
      publish: 'Publicar',
      refresh: 'Atualizar',
      reset: 'Limpar',
      restore: 'Restaurar',
      restoreFailed: 'Falha ao restaurar',
      save: 'Salvar',
      saveFailed: 'Falha ao salvar',
      saveChanges: 'Salvar alterações',
      search: 'Buscar',
      select: 'Selecionar...',
      total: 'Total',
      upload: 'Enviar',
      viewDetails: 'Ver detalhes',
      confirmDelete: (value, title) => `Excluir ${value} de ${title}?`,
    },
    shell: {
      title: 'Administração',
      forbiddenTitle: '403',
      forbiddenDescription:
        'Você não tem permissão para acessar o console administrativo.',
    },
    tabs: {
      overview: 'Visão geral',
      templates: 'Templates',
      'library-assets': 'Biblioteca',
      users: 'Usuários',
      assets: 'Arquivos',
      'generation-jobs': 'Gerações',
      'credit-ledger': 'Créditos',
      help: 'Ajuda',
    },
    dashboard: {
      title: 'Visão geral operacional',
      description:
        'Painel de saúde para comportamento, entrada de usuários, criação, créditos e risco de recarga.',
      rangeTitle: 'Intervalo',
      from: 'De',
      to: 'Até',
      apply: 'Aplicar',
      refresh: 'Atualizar',
      loading: 'Carregando painel...',
      loadFailed: 'Falha ao carregar o painel',
      loginEstimate:
        'Login usa usuários com atividade autenticada, pois ainda não há log dedicado de login.',
      presets: {
        today: 'Hoje',
        last7: '7 dias',
        last30: '30 dias',
        last90: '90 dias',
      },
      gauges: {
        registrations: {
          label: 'Registros',
          hint: 'Novas contas no intervalo',
        },
        login: {
          label: 'Login',
          hint: 'Usuários com atividade autenticada',
        },
        visits: {
          label: 'Acessos',
          hint: 'Eventos observáveis no produto',
        },
        activeUsers: {
          label: 'Usuários ativos',
          hint: 'Usuários únicos com comportamento',
        },
        generation: {
          label: 'Criação',
          hint: 'Taxa de sucesso das gerações',
        },
        recharge: {
          label: 'Recarga',
          hint: 'Créditos comprados',
        },
        failedJobs: {
          label: 'Falhas',
          hint: 'Gerações com erro',
        },
        abnormalRecharge: {
          label: 'Recarga anormal',
          hint: 'Sinais que precisam de revisão',
        },
      },
      sections: {
        funnel: 'Funil de comportamento',
        trend: 'Tendência diária',
        generationMix: 'Mix de criação',
        rechargeRisk: 'Risco de recarga',
      },
      metrics: {
        totalUsers: 'Usuários totais',
        newUsers: 'Novos usuários',
        activeUsers: 'Ativos',
        uploadUsers: 'Usuários com upload',
        generationUsers: 'Usuários criando',
        payingUsers: 'Usuários pagantes',
        visitEvents: 'Eventos de acesso',
        uploadedAssets: 'Uploads',
        generationJobs: 'Gerações',
        failedJobs: 'Falhas',
        successRate: 'Sucesso',
        purchaseEvents: 'Compras',
        purchasedCredits: 'Créditos comprados',
        creditEvents: 'Eventos de crédito',
        refundEvents: 'Reembolsos',
        runningJobs: 'Em execução',
      },
      anomalies: {
        missingStripeEvents: 'Compras sem evento Stripe',
        largePurchases: 'Compras grandes',
        manualCreditIncreases: 'Aumentos manuais',
        manualCreditDecreases: 'Reduções manuais',
        balanceMismatches: 'Saldo divergente',
      },
      funnelStages: {
        registrations: 'Registro',
        login: 'Login',
        visits: 'Acesso',
        uploads: 'Upload',
        generation: 'Criação',
        recharge: 'Recarga',
      },
      diagnosis: {
        watch: 'Verifique esta etapa e compare com a origem de tráfego.',
        steady: 'Fluxo dentro do esperado para o intervalo.',
        empty: {
          registrations: 'Sem novos registros no intervalo.',
          login: 'Sem atividade autenticada observável.',
          visits: 'Sem visitas de produto observáveis.',
          uploads: 'Sem usuários enviando materiais.',
          generation: 'Sem usuários criando no intervalo.',
          recharge: 'Sem usuários comprando créditos.',
        },
        weak: {
          registrations: 'Entrada baixa em relação à base total.',
          login: 'Queda alta antes do login. Revise aquisição e login.',
          visits: 'Usuários logados não estão avançando para uso do produto.',
          uploads: 'A etapa de envio está segurando a intenção de criação.',
          generation: 'Muitos usuários não concluem a criação após upload.',
          recharge: 'Uso não está convertendo em compra de créditos.',
        },
        healthy: {
          registrations: 'Novas contas chegando no intervalo.',
          login: 'Usuários autenticados continuam ativos.',
          visits: 'Há comportamento de produto suficiente para análise.',
          uploads: 'Upload acompanhando o interesse do produto.',
          generation: 'Criação acompanha a atividade observada.',
          recharge: 'Compra de créditos aparece no funil.',
        },
      },
      risk: {
        action: 'Ação',
        conversion: 'Conversão',
        defaultAction: 'Abra o livro de créditos e revise os eventos afetados.',
        dropoff: 'Perda',
        impact: 'Pode afetar receita, saldo ou conciliação.',
        noRiskAction: 'Nenhuma ação necessária agora.',
        noRiskImpact: 'Sem impacto detectado no intervalo.',
        noRiskTitle: 'Nenhum risco de recarga aberto',
        signals: 'sinais',
      },
      riskActions: {
        missingStripeEvents:
          'Conferir cobranças sem stripe_event_id e reconciliar com Stripe.',
        largePurchases:
          'Verificar usuário, pacote e evento de pagamento antes de liberar manualmente.',
        manualCreditIncreases:
          'Auditar ajustes manuais positivos e confirmar autorização.',
        manualCreditDecreases:
          'Confirmar motivo do desconto e comunicar suporte se necessário.',
        balanceMismatches:
          'Recalcular saldo do usuário a partir do ledger antes de novas compras.',
      },
      riskImpacts: {
        missingStripeEvents: 'Compra registrada sem evento Stripe rastreável.',
        largePurchases: 'Valor alto merece conferência operacional.',
        manualCreditIncreases: 'Crédito manual positivo altera receita reconhecida.',
        manualCreditDecreases: 'Débito manual pode gerar disputa de suporte.',
        balanceMismatches: 'Saldo atual diverge da última linha do ledger.',
      },
      riskSeverity: {
        critical: 'Crítico',
        high: 'Alto',
        medium: 'Médio',
        low: 'Baixo',
        info: 'Info',
      },
      generationTypes: {
        image_to_video: 'Imagem para vídeo',
        apparel_image: 'Imagem de produto',
        try_on: 'Provador',
      },
    },
    management: {
      users: {
        title: 'Usuários',
        description:
          'Estado da conta, créditos, assinatura e controles de função.',
        searchPlaceholder: 'Buscar email, nome, função ou assinatura...',
        columns: {
          accountStatus: 'Status da conta',
          creditBalance: 'Saldo de créditos',
          planName: 'Plano',
          subscriptionStatus: 'Assinatura',
          createdAt: 'Criado em',
          updatedAt: 'Atualizado em',
        },
        fields: {
          email: 'Email',
          name: 'Nome',
          role: 'Função',
          accountStatus: 'Status da conta',
          creditBalance: 'Saldo de créditos',
          planName: 'Plano',
          subscriptionStatus: 'Status da assinatura',
        },
      },
      assets: {
        title: 'Arquivos',
        description:
          'Mídias enviadas, ativos de template, arquivos gerados e metadados.',
        searchPlaceholder:
          'Buscar tipo de upload, status, formato MIME, usuário ou ID do arquivo...',
        columns: {
          preview: 'Preview',
          type: 'Tipo',
          mimeType: 'Tipo MIME',
          sizeBytes: 'Bytes',
          createdAt: 'Criado em',
          updatedAt: 'Atualizado em',
        },
        fields: {
          previewUrl: 'Preview',
          previewMimeType: 'MIME do preview',
          mediaKind: 'Mídia',
          status: 'Status',
          publicUrl: 'URL pública',
          mimeType: 'Tipo MIME',
          width: 'Largura',
          height: 'Altura',
          durationSeconds: 'Duração em segundos',
          createdAt: 'Criado em',
          updatedAt: 'Atualizado em',
        },
      },
      'generation-jobs': {
        title: 'Gerações',
        description:
          'Status de geração, entradas de prompt, créditos e campos de recuperação.',
        searchPlaceholder:
          'Buscar prompt/produto, template, status, tipo, usuário ou erro...',
        columns: {
          inputPreview: 'Entrada',
          finalPreview: 'Resultado',
          generationType: 'Tipo',
          inputSummary: 'Resumo',
          templateSlug: 'Template',
          durationSeconds: 'Duração',
          creditReserved: 'Créditos reservados',
          createdAt: 'Criado em',
          updatedAt: 'Atualizado em',
        },
        fields: {
          inputPreviewUrl: 'Mídia de entrada',
          inputImageUrl: 'Imagem de entrada',
          inputVideoUrl: 'Vídeo de entrada',
          finalPreviewUrl: 'Resultado',
          finalImageUrl: 'Imagem final',
          finalVideoUrl: 'Vídeo final',
          generationType: 'Tipo',
          status: 'Status',
          inputSummary: 'Resumo',
          headline: 'Título',
          sellingPoint: 'Diferencial',
          priceText: 'Texto de preço',
          ctaText: 'Texto do CTA',
          errorMessage: 'Mensagem de erro',
          durationSeconds: 'Duração',
          creditReserved: 'Créditos reservados',
          createdAt: 'Criado em',
          updatedAt: 'Atualizado em',
        },
      },
      'credit-ledger': {
        title: 'Livro de créditos',
        description: 'Movimentos de crédito e notas administrativas.',
        searchPlaceholder:
          'Buscar email/nome, motivo, evento Stripe, job, status ou nota...',
        columns: {
          userEmail: 'Email do usuário',
          userId: 'ID do usuário',
          jobId: 'ID do job',
          balanceAfter: 'Saldo após',
          stripeEventId: 'ID do evento Stripe',
          createdAt: 'Criado em',
        },
        fields: {
          delta: 'Delta',
          reason: 'Motivo',
          balanceAfter: 'Saldo após',
          userEmail: 'Email do usuário',
          userName: 'Nome do usuário',
          generationType: 'Tipo de geração',
          jobStatus: 'Status do job',
          jobTemplateSlug: 'Template do job',
          jobInputSummary: 'Resumo do job',
          metadataJson: 'Metadata JSON',
        },
        filters: {
          userId: 'ID do usuário',
          jobId: 'ID do job',
          createdAt: 'Criado em',
        },
      },
    },
    templates: {
      title: 'Templates',
      description: 'Gerencie registros do catálogo e mídias de preview.',
      emptyText: 'Nenhum template.',
      searchPlaceholder: 'Buscar título, slug, hook, tipo, status ou tag...',
      create: 'Criar',
      modalCreate: 'Criar template',
      modalEdit: 'Editar template',
      modalDetails: 'Detalhes do template',
      currentAsset: 'Ativo atual',
      uploadAsset: 'Enviar ativo',
      tags: 'Tags',
      selectSavedTemplate: 'Selecione um template salvo e um arquivo primeiro.',
      invalidJson: 'Prompt JSON e entradas padrão devem ser JSON válido.',
      confirmDelete: (slug) => `Excluir template ${slug}?`,
      columns: {
        title: 'Template',
        status: 'Status',
        type: 'Tipo',
        costCredits: 'Créditos',
        durationSeconds: 'Duração',
        tags: 'Tags',
        usageCount: 'Uso',
        updatedAt: 'Atualizado em',
      },
      fields: {
        title: 'Título',
        slug: 'Slug',
        locale: 'Idioma',
        type: 'Tipo',
        hook: 'Hook',
        cta: 'CTA',
        description: 'Descrição',
        prompt: 'Prompt',
        negativePrompt: 'Prompt negativo',
        promptJson: 'Prompt JSON',
        defaultInputsJson: 'Entradas padrão JSON',
        costCredits: 'Custo',
        durationSeconds: 'Duração',
        sortWeight: 'Peso',
        aspectRatios: 'Proporções',
      },
      placeholders: {
        slug: 'automático pelo título',
      },
      typeOptions: {
        image: 'Imagem',
        image_to_video: 'Imagem para vídeo',
        video: 'Vídeo',
      },
      uploadRoleOptions: {
        preview: 'Preview',
        thumbnail: 'Miniatura',
        source: 'Fonte',
        example: 'Exemplo',
      },
      errors: {
        load: 'Falha ao carregar',
        save: 'Falha ao salvar',
        upload: 'Falha no envio',
        delete: 'Falha ao excluir',
        publish: 'Falha ao publicar',
        archive: 'Falha ao arquivar',
        prepareUpload: 'Não foi possível preparar o envio',
        completeUpload: 'Não foi possível concluir o envio',
      },
    },
    libraryAssets: {
      title: 'Biblioteca',
      description:
        'Gerencie mídias reutilizáveis de produto, modelo, peça, cena e exemplos.',
      emptyText: 'Nenhum ativo na biblioteca.',
      searchPlaceholder:
        'Buscar título do material, tipo, status, origem, tag ou uso...',
      addAsset: 'Adicionar ativo',
      createAction: 'Enviar para biblioteca',
      modalCreate: 'Adicionar ativo da biblioteca',
      modalEdit: 'Editar ativo da biblioteca',
      modalDetails: 'Detalhes do ativo',
      advancedFields: 'Campos avançados',
      noFileSelected: 'Nenhum arquivo selecionado',
      selectedFile: 'Arquivo selecionado',
      uploadFile: 'Enviar arquivo',
      openAssetUrl: 'Abrir URL do ativo',
      useCases: 'Casos de uso',
      confirmRemove: (title) => `Remover ${title} da biblioteca?`,
      columns: {
        assetUrl: 'Preview',
        title: 'Material',
        status: 'Status',
        useCases: 'Casos de uso',
        qualityScore: 'Qualidade',
        tags: 'Tags',
        updatedAt: 'Atualizado em',
      },
      fields: {
        title: 'Título',
        locale: 'Idioma',
        kind: 'Tipo',
        status: 'Status',
        description: 'Descrição',
        tags: 'Tags',
        qualityScore: 'Qualidade',
        sortWeight: 'Peso',
        source: 'Origem',
        licenseNote: 'Nota de licença',
      },
      placeholders: {
        tags: 'product-image,fashion,ratio-9-16',
        source: 'manual / wanxiang / crawler',
        licenseNote: 'Interno, licenciado, gerado, etc.',
      },
      kindOptions: {
        product_image: 'Imagem de produto',
        model_image: 'Imagem de modelo',
        garment_image: 'Imagem de peça',
        scene_image: 'Imagem de cena',
        example_image: 'Imagem de exemplo',
        example_video: 'Vídeo de exemplo',
      },
      useCaseOptions: {
        image_to_video: 'Imagem para vídeo',
        apparel_image: 'Imagem de produto',
        try_on: 'Provador virtual',
      },
      errors: {
        load: 'Falha ao carregar',
        save: 'Falha ao salvar',
        upload: 'Falha no envio',
        delete: 'Falha ao excluir',
        publish: 'Falha ao publicar',
        archive: 'Falha ao arquivar',
        prepareUpload: 'Não foi possível preparar o envio',
        completeUpload: 'Não foi possível concluir o envio',
        selectFile: 'Selecione um arquivo primeiro.',
      },
    },
    help: {
      title: 'Ajuda operacional',
      description:
        'Guia rápido para ler cada aba do Admin, decidir a rotina diária e evitar interpretações erradas dos dados.',
      principlesTitle: 'Como usar este manual',
      principles: [
        'Abra Ajuda antes de operar uma área nova e leia a aba como processo, não como tabela técnica.',
        'Cada aba segue uso, ações diárias, campos principais e riscos; isso ajuda a transformar dado em decisão.',
        'Na primeira leitura, priorize preview, status, data, usuário, custo e erro; IDs longos ficam para investigação.',
        'Ao encontrar problema, classifique primeiro como conteúdo, mídia, geração, créditos ou acesso.',
      ],
      rhythmTitle: 'Ritmo recomendado',
      rhythms: [
        {
          title: 'Início do dia',
          items: [
            'Comece pela Visão geral e abra apenas os cards com desvio real.',
            'Revise gerações falhas, uploads quebrados e recargas suspeitas antes de editar conteúdo.',
          ],
        },
        {
          title: 'Durante campanhas',
          items: [
            'Confirme se templates publicados têm preview, CTA, custo e tags alinhados com a campanha.',
            'Use a Biblioteca para deixar materiais aprovados visíveis e arquivar duplicados.',
          ],
        },
        {
          title: 'Fechamento',
          items: [
            'Cheque ledger, saldo do usuário e eventos Stripe em casos de pagamento.',
            'Registre decisões fora do Admin quando houver ajuste manual, reembolso ou mudança de acesso.',
          ],
        },
      ],
      maintenanceTitle: 'Como manter esta coluna',
      maintenance: [
        'Atualize Ajuda sempre que uma aba ganhar campo, filtro, permissão ou regra de publicação.',
        'Escreva para operação: explique quando agir, quando não agir e qual aba confirma a hipótese.',
        'Mantenha exemplos curtos; detalhes técnicos devem ficar no campo de detalhes ou documentação de engenharia.',
        'Quando uma armadilha aparecer em suporte mais de uma vez, adicione uma frase em riscos.',
      ],
      labels: {
        purpose: 'Uso',
        dailyActions: 'Ações diárias',
        keyFields: 'Campos / painéis',
        riskSignals: 'Riscos / armadilhas',
      },
      items: [
        {
          key: 'overview',
          title: 'Visão geral',
          purpose:
            'Avaliar se registro, atividade autenticada, visitas, upload, criação e recarga estão saudáveis antes de priorizar ações do dia.',
          dailyActions: [
            'Comece por hoje ou 7 dias e compare cada etapa do funil.',
            'Abra falhas de geração e risco de recarga quando os cards subirem.',
            'Leia anomalias junto com mídia paga, deploys e mudanças de pagamento.',
          ],
          keyFields: [
            'Funil de registro, login, acesso, upload, criação e recarga.',
            'Taxa de sucesso, falhas, jobs em execução e mix de criação.',
            'Tendência diária e cards de risco de recarga.',
          ],
          riskSignals: [
            'Login é estimado por atividade autenticada, não por um log dedicado.',
            'Alta rápida em falhas costuma apontar para provider ou formato de mídia.',
            'Risco de recarga é sinal de revisão, não conclusão automática de fraude.',
          ],
        },
        {
          key: 'templates',
          title: 'Templates',
          purpose:
            'Manter receitas de geração e mídias de preview que viram entradas visíveis nos workbenches.',
          dailyActions: [
            'Criar ou editar rascunhos antes de publicar.',
            'Enviar preview, miniatura, fonte ou exemplo para explicar o resultado.',
            'Revisar custo, duração, proporção e tags antes de arquivar ou publicar.',
          ],
          keyFields: [
            'Slug, idioma, tipo, status, hook, CTA e descrição.',
            'Prompt, prompt JSON, entradas padrão JSON e prompt negativo.',
            'Créditos, duração, proporções, tags, peso e uso.',
          ],
          riskSignals: [
            'JSON inválido quebra salvamento e pode esconder erro de payload.',
            'Template publicado sem preview claro reduz confiança do usuário.',
            'Custo de créditos deve acompanhar a regra real de geração.',
          ],
        },
        {
          key: 'library-assets',
          title: 'Biblioteca',
          purpose:
            'Gerenciar mídias reutilizáveis de produto, modelo, peça, cena e exemplos que alimentam os workbenches.',
          dailyActions: [
            'Enviar arquivo, conferir preview e completar metadados básicos.',
            'Ajustar tipo, casos de uso, tags, qualidade, origem e licença.',
            'Publicar materiais aprovados e arquivar os obsoletos.',
          ],
          keyFields: [
            'Preview, título, tipo, status, idioma e casos de uso.',
            'Tags, qualidade, peso, origem e nota de licença.',
            'URL do ativo e metadados de mídia nos detalhes.',
          ],
          riskSignals: [
            'Templates são receitas; biblioteca é inventário de mídia. Não misture IDs.',
            'Vídeos precisam de tratamento próprio e não devem virar imagem quebrada.',
            'Material sem licença ou baixa qualidade não deve ser publicado.',
          ],
        },
        {
          key: 'users',
          title: 'Usuários',
          purpose:
            'Consultar conta, função, créditos e assinatura para suporte, permissões e casos de pagamento.',
          dailyActions: [
            'Buscar por email ou nome antes de alterar qualquer campo.',
            'Revisar função, status, plano e saldo antes de responder suporte.',
            'Usar a aba de créditos para explicar mudanças de saldo.',
          ],
          keyFields: [
            'Email, nome, status da conta e função.',
            'Saldo de créditos, assinatura, plano e criação.',
            'Detalhes de atualização quando houver investigação de conta.',
          ],
          riskSignals: [
            'Alterar função concede acesso operacional; revise duas vezes.',
            'Saldo do usuário deve bater com o ledger, não ser lido isoladamente.',
            'Conta inativa ou removida pode aparecer em buscas de suporte.',
          ],
        },
        {
          key: 'assets',
          title: 'Arquivos',
          purpose:
            'Rastrear uploads, ativos de template, arquivos gerados e metadados de mídia para triagem técnica.',
          dailyActions: [
            'Buscar por tipo, status, MIME, usuário ou ID do arquivo.',
            'Conferir preview antes de mexer em metadados.',
            'Usar detalhes para validar dimensões, duração e URL quando houver recuperação.',
          ],
          keyFields: [
            'Preview, tipo, status, MIME, tamanho e datas.',
            'Largura, altura, duração e tipo de mídia.',
            'URL pública apenas nos detalhes de investigação.',
          ],
          riskSignals: [
            'Arquivo pendente ou com falha não deve alimentar template ou biblioteca.',
            'Storage key e URL longa não são bons campos de primeira leitura.',
            'Preview ausente pode ser formato não suportado ou upload incompleto.',
          ],
        },
        {
          key: 'generation-jobs',
          title: 'Gerações',
          purpose:
            'Investigar cada geração do input ao resultado, incluindo status, template, custo e erro do provider.',
          dailyActions: [
            'Pesquisar por produto, prompt, template, status, usuário ou erro.',
            'Comparar preview de entrada e resultado antes de diagnosticar.',
            'Acompanhar filas, execuções longas e falhas recentes.',
          ],
          keyFields: [
            'Input, resultado, tipo, status e resumo.',
            'Template, créditos reservados, duração e datas.',
            'Mensagem de erro e campos de recuperação nos detalhes.',
          ],
          riskSignals: [
            'Job parado em queued, submitting ou running precisa de checagem rápida.',
            'Falha com crédito reservado pode exigir reembolso ou captura correta.',
            'Resumo de input ajuda triagem, mas não substitui a mídia original.',
          ],
        },
        {
          key: 'credit-ledger',
          title: 'Livro de créditos',
          purpose:
            'Fonte operacional para saldo de créditos, compras, reservas, capturas, reembolsos e ajustes manuais.',
          dailyActions: [
            'Buscar por usuário, job, evento Stripe, motivo ou data.',
            'Conferir delta e saldo após antes de explicar um caso.',
            'Auditar ajustes manuais e eventos sem rastreio de pagamento.',
          ],
          keyFields: [
            'Usuário, delta, motivo, saldo após e criação.',
            'Job, tipo de geração, status do job e template.',
            'Evento Stripe e metadata JSON para conciliação.',
          ],
          riskSignals: [
            'Não edite ledger como tabela comum; ele explica o saldo.',
            'Saldo divergente entre usuário e ledger exige reconciliação.',
            'Compra sem Stripe ou ajuste manual alto deve ser revisado.',
          ],
        },
        {
          key: 'help',
          title: 'Ajuda',
          purpose:
            'Ser a coluna de treinamento e governança do Admin para que operação saiba o que cada aba permite decidir.',
          dailyActions: [
            'Consultar antes de usar uma aba nova ou responder um caso sensível.',
            'Atualizar quando fluxo, campo, filtro, permissão ou regra operacional mudar.',
            'Revisar depois de incidentes para transformar aprendizado em regra curta.',
          ],
          keyFields: [
            'Princípios de uso, ritmo recomendado e manutenção da coluna.',
            'Uso, ações diárias, campos principais e riscos por aba.',
            'Relação entre Templates, Biblioteca, Arquivos, Gerações e Créditos.',
          ],
          riskSignals: [
            'Ajuda desatualizada vira fonte de erro operacional.',
            'Texto longo demais reduz leitura; prefira instruções curtas e verificáveis.',
            'Se a regra depende de dado técnico, indique qual aba ou detalhe confirma.',
          ],
        },
      ],
    },
    statusLabels: adminStatusLabels.pt,
  },
  en: {
    common: {
      actions: 'Actions',
      archive: 'Archive',
      cancel: 'Cancel',
      close: 'Close',
      create: 'Create',
      delete: 'Delete',
      deleteFailed: 'Delete failed',
      edit: 'Edit',
      loadFailed: 'Load failed',
      loading: 'Loading...',
      next: 'Next',
      noData: 'No data.',
      noRecords: 'No records.',
      page: 'Page',
      previous: 'Previous',
      publish: 'Publish',
      refresh: 'Refresh',
      reset: 'Reset',
      restore: 'Restore',
      restoreFailed: 'Restore failed',
      save: 'Save',
      saveFailed: 'Save failed',
      saveChanges: 'Save changes',
      search: 'Search',
      select: 'Select...',
      total: 'Total',
      upload: 'Upload',
      viewDetails: 'View details',
      confirmDelete: (value, title) => `Delete ${value} from ${title}?`,
    },
    shell: {
      title: 'Admin',
      forbiddenTitle: '403',
      forbiddenDescription:
        'You do not have permission to access the admin console.',
    },
    tabs: {
      overview: 'Overview',
      templates: 'Templates',
      'library-assets': 'Library Assets',
      users: 'Users',
      assets: 'Assets',
      'generation-jobs': 'Generation Jobs',
      'credit-ledger': 'Credit Ledger',
      help: 'Help',
    },
    dashboard: {
      title: 'Operations dashboard',
      description:
        'Health gauges for user behavior, signups, authenticated activity, generation, credits, and recharge risk.',
      rangeTitle: 'Date range',
      from: 'From',
      to: 'To',
      apply: 'Apply',
      refresh: 'Refresh',
      loading: 'Loading dashboard...',
      loadFailed: 'Failed to load dashboard',
      loginEstimate:
        'Login uses authenticated activity users because dedicated login logs do not exist yet.',
      presets: {
        today: 'Today',
        last7: '7 days',
        last30: '30 days',
        last90: '90 days',
      },
      gauges: {
        registrations: {
          label: 'Registrations',
          hint: 'New accounts in range',
        },
        login: {
          label: 'Login',
          hint: 'Users with authenticated activity',
        },
        visits: {
          label: 'Visits',
          hint: 'Observable product events',
        },
        activeUsers: {
          label: 'Active users',
          hint: 'Unique users with behavior',
        },
        generation: {
          label: 'Generation',
          hint: 'Generation success rate',
        },
        recharge: {
          label: 'Recharge',
          hint: 'Purchased credits',
        },
        failedJobs: {
          label: 'Failures',
          hint: 'Failed generation jobs',
        },
        abnormalRecharge: {
          label: 'Abnormal recharge',
          hint: 'Signals needing review',
        },
      },
      sections: {
        funnel: 'Behavior funnel',
        trend: 'Daily trend',
        generationMix: 'Generation mix',
        rechargeRisk: 'Recharge risk',
      },
      metrics: {
        totalUsers: 'Total users',
        newUsers: 'New users',
        activeUsers: 'Active',
        uploadUsers: 'Upload users',
        generationUsers: 'Creating users',
        payingUsers: 'Paying users',
        visitEvents: 'Visit events',
        uploadedAssets: 'Uploads',
        generationJobs: 'Generations',
        failedJobs: 'Failures',
        successRate: 'Success',
        purchaseEvents: 'Purchases',
        purchasedCredits: 'Purchased credits',
        creditEvents: 'Credit events',
        refundEvents: 'Refunds',
        runningJobs: 'Running',
      },
      anomalies: {
        missingStripeEvents: 'Purchases missing Stripe event',
        largePurchases: 'Large purchases',
        manualCreditIncreases: 'Manual credit increases',
        manualCreditDecreases: 'Manual credit decreases',
        balanceMismatches: 'Balance mismatches',
      },
      funnelStages: {
        registrations: 'Registration',
        login: 'Login',
        visits: 'Visit',
        uploads: 'Upload',
        generation: 'Generation',
        recharge: 'Recharge',
      },
      diagnosis: {
        watch: 'Check this step against traffic source and recent releases.',
        steady: 'Flow looks steady for this date range.',
        empty: {
          registrations: 'No new registrations in this date range.',
          login: 'No observable authenticated activity.',
          visits: 'No observable product visits.',
          uploads: 'No users uploaded materials.',
          generation: 'No users generated content in this range.',
          recharge: 'No users purchased credits.',
        },
        weak: {
          registrations: 'Signup intake is low against the total user base.',
          login: 'High drop before login. Review acquisition and auth.',
          visits: 'Authenticated users are not reaching product usage.',
          uploads: 'Upload is holding back creation intent.',
          generation: 'Many users do not complete generation after upload.',
          recharge: 'Usage is not converting into credit purchases.',
        },
        healthy: {
          registrations: 'New accounts are entering during this range.',
          login: 'Authenticated users remain active.',
          visits: 'There is enough product behavior to inspect.',
          uploads: 'Uploads are tracking product interest.',
          generation: 'Generation follows observed activity.',
          recharge: 'Credit purchases appear in the funnel.',
        },
      },
      risk: {
        action: 'Action',
        conversion: 'Conversion',
        defaultAction: 'Open the credit ledger and review affected events.',
        dropoff: 'Dropoff',
        impact: 'May affect revenue, balance, or reconciliation.',
        noRiskAction: 'No action needed right now.',
        noRiskImpact: 'No impact detected in this range.',
        noRiskTitle: 'No open recharge risk',
        signals: 'signals',
      },
      riskActions: {
        missingStripeEvents:
          'Check purchases without stripe_event_id and reconcile with Stripe.',
        largePurchases:
          'Verify user, package, and payment event before manual release.',
        manualCreditIncreases:
          'Audit positive manual adjustments and confirm authorization.',
        manualCreditDecreases:
          'Confirm the deduction reason and notify support if needed.',
        balanceMismatches:
          'Recalculate user balance from ledger before new purchases.',
      },
      riskImpacts: {
        missingStripeEvents: 'Purchase exists without a traceable Stripe event.',
        largePurchases: 'Large value needs an operational check.',
        manualCreditIncreases:
          'Positive manual credit changes recognized revenue context.',
        manualCreditDecreases: 'Manual deduction can create support disputes.',
        balanceMismatches: 'Current balance differs from the latest ledger row.',
      },
      riskSeverity: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        info: 'Info',
      },
      generationTypes: {
        image_to_video: 'Image to video',
        apparel_image: 'Product image',
        try_on: 'Try-on',
      },
    },
    management: {
      users: {
        title: 'Users',
        description: 'Account state, credits, subscription, and role controls.',
        searchPlaceholder: 'Search email, name, role, or subscription...',
        columns: {
          accountStatus: 'Account status',
          creditBalance: 'Credit Balance',
          planName: 'Plan',
          subscriptionStatus: 'Subscription',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
        fields: {
          email: 'Email',
          name: 'Name',
          role: 'Role',
          accountStatus: 'Account status',
          creditBalance: 'Credit balance',
          planName: 'Plan',
          subscriptionStatus: 'Subscription status',
        },
      },
      assets: {
        title: 'Assets',
        description:
          'Uploaded media, template assets, generated files, and metadata.',
        searchPlaceholder:
          'Search upload type, status, MIME format, user, or asset ID...',
        columns: {
          preview: 'Preview',
          type: 'Type',
          storageKey: 'Storage Key',
          mimeType: 'MIME Type',
          sizeBytes: 'Size Bytes',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
        fields: {
          previewUrl: 'Preview',
          previewMimeType: 'Preview MIME',
          mediaKind: 'Media',
          status: 'Status',
          publicUrl: 'Public URL',
          mimeType: 'MIME type',
          width: 'Width',
          height: 'Height',
          durationSeconds: 'Duration seconds',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
      },
      'generation-jobs': {
        title: 'Generation Jobs',
        description:
          'Generation status, prompt inputs, credits, and recovery fields.',
        searchPlaceholder:
          'Search prompt/product, template, status, type, user, or error...',
        columns: {
          inputPreview: 'Input',
          finalPreview: 'Result',
          generationType: 'Type',
          inputSummary: 'Input Summary',
          templateSlug: 'Template',
          durationSeconds: 'Duration',
          creditReserved: 'Reserved Credits',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
        fields: {
          inputPreviewUrl: 'Input media',
          inputImageUrl: 'Input image',
          inputVideoUrl: 'Input video',
          finalPreviewUrl: 'Result',
          finalImageUrl: 'Final image',
          finalVideoUrl: 'Final video',
          generationType: 'Type',
          status: 'Status',
          inputSummary: 'Input summary',
          headline: 'Headline',
          sellingPoint: 'Selling point',
          priceText: 'Price text',
          ctaText: 'CTA text',
          errorMessage: 'Error message',
          durationSeconds: 'Duration',
          creditReserved: 'Reserved credits',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
      },
      'credit-ledger': {
        title: 'Credit Ledger',
        description: 'Credit movements and admin metadata notes.',
        searchPlaceholder:
          'Search email/name, reason, Stripe event, job, status, or note...',
        columns: {
          userEmail: 'User email',
          userId: 'User ID',
          jobId: 'Job ID',
          balanceAfter: 'Balance After',
          stripeEventId: 'Stripe Event ID',
          createdAt: 'Created At',
        },
        fields: {
          delta: 'Delta',
          reason: 'Reason',
          balanceAfter: 'Balance after',
          userEmail: 'User email',
          userName: 'User name',
          generationType: 'Generation type',
          jobStatus: 'Job status',
          jobTemplateSlug: 'Job template',
          jobInputSummary: 'Job summary',
          metadataJson: 'Metadata JSON',
        },
        filters: {
          userId: 'User ID',
          jobId: 'Job ID',
          createdAt: 'Created',
        },
      },
    },
    templates: {
      title: 'Templates',
      description: 'Manage template catalog records and preview media.',
      emptyText: 'No templates.',
      searchPlaceholder: 'Search title, slug, hook, type, status, or tag...',
      create: 'Create',
      modalCreate: 'Create template',
      modalEdit: 'Edit template',
      modalDetails: 'Template details',
      currentAsset: 'Current asset',
      uploadAsset: 'Upload asset',
      tags: 'Tags',
      selectSavedTemplate: 'Select a saved template and a file first.',
      invalidJson: 'Prompt JSON and default inputs must be valid JSON.',
      confirmDelete: (slug) => `Delete template ${slug}?`,
      columns: {
        title: 'Template',
        status: 'Status',
        type: 'Type',
        costCredits: 'Credits',
        durationSeconds: 'Duration',
        tags: 'Tags',
        usageCount: 'Usage',
        updatedAt: 'Updated At',
      },
      fields: {
        title: 'Title',
        slug: 'Slug',
        locale: 'Locale',
        type: 'Type',
        hook: 'Hook',
        cta: 'CTA',
        description: 'Description',
        prompt: 'Prompt',
        negativePrompt: 'Negative prompt',
        promptJson: 'Prompt JSON',
        defaultInputsJson: 'Default inputs JSON',
        costCredits: 'Cost',
        durationSeconds: 'Duration',
        sortWeight: 'Weight',
        aspectRatios: 'Aspect ratios',
      },
      placeholders: {
        slug: 'auto from title',
      },
      typeOptions: {
        image: 'Image',
        image_to_video: 'Image to video',
        video: 'Video',
      },
      uploadRoleOptions: {
        preview: 'Preview',
        thumbnail: 'Thumbnail',
        source: 'Source',
        example: 'Example',
      },
      errors: {
        load: 'Load failed',
        save: 'Save failed',
        upload: 'Upload failed',
        delete: 'Delete failed',
        publish: 'Publish failed',
        archive: 'Archive failed',
        prepareUpload: 'Upload could not be prepared',
        completeUpload: 'Upload could not be completed',
      },
    },
    libraryAssets: {
      title: 'Library Assets',
      description:
        'Manage reusable product, model, garment, scene, and example media for workbenches.',
      emptyText: 'No library assets.',
      searchPlaceholder:
        'Search material title, kind, status, source, tag, or use case...',
      addAsset: 'Add asset',
      createAction: 'Upload to library',
      modalCreate: 'Add library asset',
      modalEdit: 'Edit library asset',
      modalDetails: 'Library asset details',
      advancedFields: 'Advanced fields',
      noFileSelected: 'No file selected',
      selectedFile: 'Selected file',
      uploadFile: 'Upload file',
      openAssetUrl: 'Open asset URL',
      useCases: 'Use cases',
      confirmRemove: (title) => `Remove ${title} from the library?`,
      columns: {
        assetUrl: 'Preview',
        title: 'Material',
        status: 'Status',
        useCases: 'Use Cases',
        qualityScore: 'Quality',
        tags: 'Tags',
        updatedAt: 'Updated At',
      },
      fields: {
        title: 'Title',
        locale: 'Locale',
        kind: 'Kind',
        status: 'Status',
        description: 'Description',
        tags: 'Tags',
        qualityScore: 'Quality Score',
        sortWeight: 'Sort Weight',
        source: 'Source',
        licenseNote: 'License Note',
      },
      placeholders: {
        tags: 'product-image,fashion,ratio-9-16',
        source: 'manual / wanxiang / crawler',
        licenseNote: 'Internal, licensed, generated, etc.',
      },
      kindOptions: {
        product_image: 'Product image',
        model_image: 'Model image',
        garment_image: 'Garment image',
        scene_image: 'Scene image',
        example_image: 'Example image',
        example_video: 'Example video',
      },
      useCaseOptions: {
        image_to_video: 'Image to video',
        apparel_image: 'Apparel image',
        try_on: 'Try-on',
      },
      errors: {
        load: 'Load failed',
        save: 'Save failed',
        upload: 'Upload failed',
        delete: 'Delete failed',
        publish: 'Publish failed',
        archive: 'Archive failed',
        prepareUpload: 'Upload could not be prepared',
        completeUpload: 'Upload could not be completed',
        selectFile: 'Select a file first.',
      },
    },
    help: {
      title: 'Operations help',
      description:
        'A compact guide for reading each Admin tab, choosing daily actions, and avoiding common data mistakes.',
      principlesTitle: 'How to use this handbook',
      principles: [
        'Open Help before operating an unfamiliar area and read each tab as a workflow, not a raw table.',
        'Each tab follows purpose, daily actions, key fields, and risks so operators can turn data into decisions.',
        'For first-pass scanning, prioritize preview, status, date, user, cost, and error; long IDs belong in investigations.',
        'When something looks wrong, classify it first as content, media, generation, credits, or access.',
      ],
      rhythmTitle: 'Recommended operating rhythm',
      rhythms: [
        {
          title: 'Start of day',
          items: [
            'Begin in Overview and open only cards with real movement.',
            'Review failed generations, broken uploads, and recharge risk before editing content.',
          ],
        },
        {
          title: 'Campaign work',
          items: [
            'Confirm published templates have preview media, CTA, cost, and tags aligned with the campaign.',
            'Use Library Assets to surface approved media and archive duplicates.',
          ],
        },
        {
          title: 'Closeout',
          items: [
            'Check ledger, user balance, and Stripe events for payment cases.',
            'Record decisions outside Admin when manual adjustments, refunds, or access changes are made.',
          ],
        },
      ],
      maintenanceTitle: 'How this column is managed',
      maintenance: [
        'Update Help whenever a tab gains a field, filter, permission, or publishing rule.',
        'Write for operations: explain when to act, when not to act, and which tab confirms the hypothesis.',
        'Keep examples short; technical detail belongs in row details or engineering documentation.',
        'When a support trap repeats more than once, add one sentence to risk signals.',
      ],
      labels: {
        purpose: 'Purpose',
        dailyActions: 'Daily actions',
        keyFields: 'Key fields / boards',
        riskSignals: 'Risk signals / pitfalls',
      },
      items: [
        {
          key: 'overview',
          title: 'Overview',
          purpose:
            'Check whether signup, authenticated activity, visits, upload, generation, and recharge are healthy before prioritizing the day.',
          dailyActions: [
            'Start with today or 7 days and compare each funnel step.',
            'Open generation failures and recharge risk when the cards rise.',
            'Read anomalies alongside paid traffic, deployments, and payment changes.',
          ],
          keyFields: [
            'Registration, login, visit, upload, generation, and recharge funnel.',
            'Success rate, failed jobs, running jobs, and generation mix.',
            'Daily trend and recharge risk cards.',
          ],
          riskSignals: [
            'Login is estimated from authenticated activity, not a dedicated login log.',
            'A quick failure spike usually points to provider or media format issues.',
            'Recharge risk is a review signal, not an automatic fraud conclusion.',
          ],
        },
        {
          key: 'templates',
          title: 'Templates',
          purpose:
            'Maintain generation recipes and preview media that become visible workbench entry points.',
          dailyActions: [
            'Create or edit drafts before publishing.',
            'Upload preview, thumbnail, source, or example media to explain the result.',
            'Review cost, duration, aspect ratio, and tags before archive or publish.',
          ],
          keyFields: [
            'Slug, locale, type, status, hook, CTA, and description.',
            'Prompt, prompt JSON, default inputs JSON, and negative prompt.',
            'Credits, duration, aspect ratios, tags, sort weight, and usage.',
          ],
          riskSignals: [
            'Invalid JSON blocks saving and can hide payload mistakes.',
            'A published template without clear preview media lowers user confidence.',
            'Credit cost should match the real generation reservation rule.',
          ],
        },
        {
          key: 'library-assets',
          title: 'Library Assets',
          purpose:
            'Manage reusable product, model, garment, scene, and example media that feed the workbenches.',
          dailyActions: [
            'Upload the file, check the preview, and complete core metadata.',
            'Set kind, use cases, tags, quality, source, and license note.',
            'Publish approved assets and archive outdated materials.',
          ],
          keyFields: [
            'Preview, title, kind, status, locale, and use cases.',
            'Tags, quality score, sort weight, source, and license note.',
            'Asset URL and media metadata in the detail view.',
          ],
          riskSignals: [
            'Templates are recipes; library assets are media inventory. Keep IDs separate.',
            'Videos need their own handling and should not render as broken images.',
            'Unlicensed or low-quality material should stay out of published inventory.',
          ],
        },
        {
          key: 'users',
          title: 'Users',
          purpose:
            'Inspect account, role, credits, and subscription state for support, access, and payment cases.',
          dailyActions: [
            'Search by email or name before changing anything.',
            'Review role, status, plan, and balance before answering support.',
            'Use the credit ledger to explain balance changes.',
          ],
          keyFields: [
            'Email, name, account status, and role.',
            'Credit balance, subscription, plan, and creation time.',
            'Update details when investigating account history.',
          ],
          riskSignals: [
            'Changing role grants operational access; review it twice.',
            'User balance should match the ledger and should not be read alone.',
            'Inactive or removed accounts can still appear in support searches.',
          ],
        },
        {
          key: 'assets',
          title: 'Assets',
          purpose:
            'Trace uploads, template media, generated files, and media metadata for technical triage.',
          dailyActions: [
            'Search by type, status, MIME, user, or asset ID.',
            'Check the preview before editing metadata.',
            'Use details to validate dimensions, duration, and URL during recovery.',
          ],
          keyFields: [
            'Preview, type, status, MIME, size, and timestamps.',
            'Width, height, duration, and media kind.',
            'Public URL only in investigation details.',
          ],
          riskSignals: [
            'Pending or failed assets should not feed templates or the library.',
            'Storage keys and long URLs are not good first-scan fields.',
            'Missing preview can mean unsupported format or incomplete upload.',
          ],
        },
        {
          key: 'generation-jobs',
          title: 'Generation Jobs',
          purpose:
            'Investigate each generation from input to result, including status, template, cost, and provider error.',
          dailyActions: [
            'Search by product, prompt, template, status, user, or error.',
            'Compare input and result previews before diagnosing.',
            'Watch queues, long-running jobs, and recent failures.',
          ],
          keyFields: [
            'Input, result, type, status, and summary.',
            'Template, reserved credits, duration, and timestamps.',
            'Error message and recovery fields in the detail view.',
          ],
          riskSignals: [
            'Jobs stuck in queued, submitting, or running need quick review.',
            'Failure with reserved credits may require refund or correct capture.',
            'Input summary helps triage but does not replace the original media.',
          ],
        },
        {
          key: 'credit-ledger',
          title: 'Credit Ledger',
          purpose:
            'Operational source for credit balance, purchases, reserves, captures, refunds, and manual adjustments.',
          dailyActions: [
            'Search by user, job, Stripe event, reason, or date.',
            'Check delta and balance after before explaining a case.',
            'Audit manual adjustments and payment events without trace IDs.',
          ],
          keyFields: [
            'User, delta, reason, balance after, and creation time.',
            'Job, generation type, job status, and template.',
            'Stripe event and metadata JSON for reconciliation.',
          ],
          riskSignals: [
            'Do not treat ledger as a normal editable table; it explains balance.',
            'Balance mismatch between user and ledger needs reconciliation.',
            'Missing Stripe events or large manual adjustments need review.',
          ],
        },
        {
          key: 'help',
          title: 'Help',
          purpose:
            'Act as the Admin training and governance column so operators know what each tab is meant to decide.',
          dailyActions: [
            'Read it before using an unfamiliar tab or answering a sensitive case.',
            'Update it when a workflow, field, filter, permission, or operating rule changes.',
            'Review it after incidents so repeated lessons become short rules.',
          ],
          keyFields: [
            'Operating principles, recommended rhythm, and column maintenance.',
            'Purpose, daily actions, key fields, and risks for each tab.',
            'The relationship between Templates, Library Assets, Assets, Generation Jobs, and Credit Ledger.',
          ],
          riskSignals: [
            'Outdated Help becomes a source of operational mistakes.',
            'Overlong writing reduces reading; prefer short and checkable instructions.',
            'If a rule depends on technical data, point to the tab or detail field that confirms it.',
          ],
        },
      ],
    },
    statusLabels: adminStatusLabels.en,
  },
  zh: {
    common: {
      actions: '操作',
      archive: '归档',
      cancel: '取消',
      close: '关闭',
      create: '创建',
      delete: '删除',
      deleteFailed: '删除失败',
      edit: '编辑',
      loadFailed: '加载失败',
      loading: '加载中...',
      next: '下一页',
      noData: '暂无数据。',
      noRecords: '暂无记录。',
      page: '第',
      previous: '上一页',
      publish: '发布',
      refresh: '刷新',
      reset: '重置',
      restore: '恢复',
      restoreFailed: '恢复失败',
      save: '保存',
      saveFailed: '保存失败',
      saveChanges: '保存修改',
      search: '搜索',
      select: '请选择...',
      total: '总数',
      upload: '上传',
      viewDetails: '查看详情',
      confirmDelete: (value, title) => `确认从 ${title} 删除 ${value}？`,
    },
    shell: {
      title: '后台管理',
      forbiddenTitle: '403',
      forbiddenDescription: '你没有权限访问后台管理控制台。',
    },
    tabs: {
      overview: '总览',
      templates: '模板',
      'library-assets': '素材库',
      users: '用户',
      assets: '文件',
      'generation-jobs': '生成任务',
      'credit-ledger': '算力流水',
      help: '帮助',
    },
    dashboard: {
      title: '运营驾驶舱',
      description:
        '关注用户行为、登录活跃、注册、访问、充值与异常充值风险。',
      rangeTitle: '日期范围',
      from: '开始',
      to: '结束',
      apply: '查询',
      refresh: '刷新',
      loading: '正在加载表盘...',
      loadFailed: '表盘加载失败',
      loginEstimate:
        '登录表盘使用登录后的可观测行为估算，当前还没有独立登录日志。',
      presets: {
        today: '今天',
        last7: '近 7 天',
        last30: '近 30 天',
        last90: '近 90 天',
      },
      gauges: {
        registrations: {
          label: '注册',
          hint: '范围内新增账号',
        },
        login: {
          label: '登录',
          hint: '有登录后行为的用户',
        },
        visits: {
          label: '访问',
          hint: '可观测产品行为事件',
        },
        activeUsers: {
          label: '活跃用户',
          hint: '产生行为的去重用户',
        },
        generation: {
          label: '生成',
          hint: '生成任务成功率',
        },
        recharge: {
          label: '充值',
          hint: '购买算力值',
        },
        failedJobs: {
          label: '失败',
          hint: '失败生成任务',
        },
        abnormalRecharge: {
          label: '异常充值',
          hint: '需要复核的风险信号',
        },
      },
      sections: {
        funnel: '用户行为漏斗',
        trend: '每日趋势',
        generationMix: '生成类型分布',
        rechargeRisk: '异常充值风险',
      },
      metrics: {
        totalUsers: '总用户',
        newUsers: '新增用户',
        activeUsers: '活跃',
        uploadUsers: '上传用户',
        generationUsers: '生成用户',
        payingUsers: '充值用户',
        visitEvents: '访问事件',
        uploadedAssets: '上传',
        generationJobs: '生成',
        failedJobs: '失败',
        successRate: '成功率',
        purchaseEvents: '充值笔数',
        purchasedCredits: '充值算力',
        creditEvents: '算力事件',
        refundEvents: '退款/返还',
        runningJobs: '运行中',
      },
      anomalies: {
        missingStripeEvents: '缺少 Stripe 事件',
        largePurchases: '大额充值',
        manualCreditIncreases: '人工加算力',
        manualCreditDecreases: '人工扣算力',
        balanceMismatches: '余额流水不一致',
      },
      funnelStages: {
        registrations: '注册',
        login: '登录',
        visits: '访问',
        uploads: '上传',
        generation: '生成',
        recharge: '充值',
      },
      diagnosis: {
        watch: '需要对照流量来源和近期发布变化复核。',
        steady: '该日期范围内链路表现稳定。',
        empty: {
          registrations: '当前日期范围内没有新增注册。',
          login: '没有可观测的登录后行为。',
          visits: '没有可观测的产品访问。',
          uploads: '没有用户上传素材。',
          generation: '当前日期范围内没有用户生成。',
          recharge: '没有用户购买算力。',
        },
        weak: {
          registrations: '新增注册相对用户基数偏低。',
          login: '登录前流失较高，需要检查获客和登录链路。',
          visits: '登录用户没有充分进入产品使用。',
          uploads: '上传步骤阻塞了后续生成意图。',
          generation: '上传后进入生成的用户偏少。',
          recharge: '使用行为没有有效转化为算力购买。',
        },
        healthy: {
          registrations: '日期范围内有新增账号进入。',
          login: '登录后活跃保持可观测。',
          visits: '产品访问行为足够支撑分析。',
          uploads: '上传行为跟随产品兴趣。',
          generation: '生成行为跟随活跃使用。',
          recharge: '充值行为已进入漏斗。',
        },
      },
      risk: {
        action: '行动',
        conversion: '转化',
        defaultAction: '打开算力流水，复核受影响事件。',
        dropoff: '流失',
        impact: '可能影响收入、余额或对账。',
        noRiskAction: '当前无需处理。',
        noRiskImpact: '当前范围内未发现影响。',
        noRiskTitle: '暂无待处理异常充值风险',
        signals: '信号',
      },
      riskActions: {
        missingStripeEvents:
          '检查没有 stripe_event_id 的充值，并与 Stripe 事件对账。',
        largePurchases: '复核用户、套餐和支付事件后再做人工放行。',
        manualCreditIncreases: '审计人工加算力记录，确认授权来源。',
        manualCreditDecreases: '确认扣减原因，必要时同步客服。',
        balanceMismatches: '基于流水重算用户余额后再允许新充值。',
      },
      riskImpacts: {
        missingStripeEvents: '充值记录缺少可追踪的 Stripe 事件。',
        largePurchases: '大额充值需要运营复核。',
        manualCreditIncreases: '人工加算力会影响收入识别。',
        manualCreditDecreases: '人工扣减可能产生客服争议。',
        balanceMismatches: '当前余额与最近一条流水不一致。',
      },
      riskSeverity: {
        critical: '严重',
        high: '高',
        medium: '中',
        low: '低',
        info: '信息',
      },
      generationTypes: {
        image_to_video: '图生视频',
        apparel_image: '商品图',
        try_on: '智能试衣',
      },
    },
    management: {
      users: {
        title: '用户',
        description: '账号状态、算力、订阅和角色控制。',
        searchPlaceholder: '搜索邮箱、姓名、角色或订阅状态...',
        columns: {
          accountStatus: '账号状态',
          creditBalance: '算力余额',
          planName: '套餐',
          subscriptionStatus: '订阅',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
        fields: {
          email: '邮箱',
          name: '姓名',
          role: '角色',
          accountStatus: '账号状态',
          creditBalance: '算力余额',
          planName: '套餐',
          subscriptionStatus: '订阅状态',
        },
      },
      assets: {
        title: '文件',
        description: '上传媒体、模板素材、生成文件和元数据。',
        searchPlaceholder: '搜索上传类型、状态、MIME 格式、用户或文件 ID...',
        columns: {
          preview: '预览',
          type: '类型',
          storageKey: '存储 Key',
          mimeType: 'MIME 类型',
          sizeBytes: '字节数',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
        fields: {
          previewUrl: '预览',
          previewMimeType: '预览 MIME',
          mediaKind: '媒体',
          status: '状态',
          publicUrl: '公开 URL',
          mimeType: 'MIME 类型',
          width: '宽度',
          height: '高度',
          durationSeconds: '时长秒数',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
      },
      'generation-jobs': {
        title: '生成任务',
        description: '生成状态、Prompt 输入、算力和恢复字段。',
        searchPlaceholder: '搜索商品/Prompt、模板、状态、类型、用户或错误...',
        columns: {
          inputPreview: '输入图',
          finalPreview: '成品',
          generationType: '类型',
          inputSummary: '输入摘要',
          templateSlug: '模板',
          durationSeconds: '时长',
          creditReserved: '预留算力',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
        fields: {
          inputPreviewUrl: '输入素材',
          inputImageUrl: '输入图片',
          inputVideoUrl: '输入视频',
          finalPreviewUrl: '成品预览',
          finalImageUrl: '成品图',
          finalVideoUrl: '成品视频',
          generationType: '类型',
          status: '状态',
          inputSummary: '输入摘要',
          headline: '标题',
          sellingPoint: '卖点',
          priceText: '价格文案',
          ctaText: 'CTA 文案',
          errorMessage: '错误信息',
          durationSeconds: '时长',
          creditReserved: '预留算力',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
      },
      'credit-ledger': {
        title: '算力流水',
        description: '算力变动和后台备注元数据。',
        searchPlaceholder: '搜索邮箱/姓名、原因、Stripe 事件、任务、状态或备注...',
        columns: {
          userEmail: '用户邮箱',
          userId: '用户 ID',
          jobId: '任务 ID',
          balanceAfter: '变动后余额',
          stripeEventId: 'Stripe 事件 ID',
          createdAt: '创建时间',
        },
        fields: {
          delta: '变动值',
          reason: '原因',
          balanceAfter: '变动后余额',
          userEmail: '用户邮箱',
          userName: '用户姓名',
          generationType: '生成类型',
          jobStatus: '任务状态',
          jobTemplateSlug: '任务模板',
          jobInputSummary: '任务摘要',
          metadataJson: 'Metadata JSON',
        },
        filters: {
          userId: '用户 ID',
          jobId: '任务 ID',
          createdAt: '创建时间',
        },
      },
    },
    templates: {
      title: '模板',
      description: '管理模板目录记录和预览媒体。',
      emptyText: '暂无模板。',
      searchPlaceholder: '搜索模板标题、slug、hook、类型、状态或标签...',
      create: '创建',
      modalCreate: '创建模板',
      modalEdit: '编辑模板',
      modalDetails: '模板详情',
      currentAsset: '当前素材',
      uploadAsset: '上传素材',
      tags: '标签',
      selectSavedTemplate: '请先选择已保存的模板和文件。',
      invalidJson: 'Prompt JSON 和默认输入必须是有效 JSON。',
      confirmDelete: (slug) => `确认删除模板 ${slug}？`,
      columns: {
        title: '模板',
        status: '状态',
        type: '类型',
        costCredits: '算力',
        durationSeconds: '时长',
        tags: '标签',
        usageCount: '使用量',
        updatedAt: '更新时间',
      },
      fields: {
        title: '标题',
        slug: 'Slug',
        locale: '语言',
        type: '类型',
        hook: 'Hook',
        cta: 'CTA',
        description: '描述',
        prompt: 'Prompt',
        negativePrompt: '负向 Prompt',
        promptJson: 'Prompt JSON',
        defaultInputsJson: '默认输入 JSON',
        costCredits: '成本',
        durationSeconds: '时长',
        sortWeight: '权重',
        aspectRatios: '画幅比例',
      },
      placeholders: {
        slug: '根据标题自动生成',
      },
      typeOptions: {
        image: '图片',
        image_to_video: '图生视频',
        video: '视频',
      },
      uploadRoleOptions: {
        preview: '预览',
        thumbnail: '缩略图',
        source: '源文件',
        example: '示例',
      },
      errors: {
        load: '加载失败',
        save: '保存失败',
        upload: '上传失败',
        delete: '删除失败',
        publish: '发布失败',
        archive: '归档失败',
        prepareUpload: '无法准备上传',
        completeUpload: '无法完成上传',
      },
    },
    libraryAssets: {
      title: '素材库',
      description: '管理工作台可复用的产品、模特、服装、场景和示例媒体。',
      emptyText: '暂无素材。',
      searchPlaceholder: '搜索素材标题、类型、状态、来源、标签或使用场景...',
      addAsset: '添加素材',
      createAction: '上传入库',
      modalCreate: '添加素材',
      modalEdit: '编辑素材',
      modalDetails: '素材详情',
      advancedFields: '高级字段',
      noFileSelected: '未选择文件',
      selectedFile: '已选文件',
      uploadFile: '上传文件',
      openAssetUrl: '打开素材 URL',
      useCases: '使用场景',
      confirmRemove: (title) => `确认从素材库移除 ${title}？`,
      columns: {
        assetUrl: '预览',
        title: '素材',
        status: '状态',
        useCases: '使用场景',
        qualityScore: '质量',
        tags: '标签',
        updatedAt: '更新时间',
      },
      fields: {
        title: '标题',
        locale: '语言',
        kind: '类型',
        status: '状态',
        description: '描述',
        tags: '标签',
        qualityScore: '质量分',
        sortWeight: '排序权重',
        source: '来源',
        licenseNote: '授权备注',
      },
      placeholders: {
        tags: 'product-image,fashion,ratio-9-16',
        source: 'manual / wanxiang / crawler',
        licenseNote: '内部、授权、生成等',
      },
      kindOptions: {
        product_image: '产品图',
        model_image: '模特图',
        garment_image: '服装图',
        scene_image: '场景图',
        example_image: '示例图',
        example_video: '示例视频',
      },
      useCaseOptions: {
        image_to_video: '图生视频',
        apparel_image: '商品图',
        try_on: '智能试衣',
      },
      errors: {
        load: '加载失败',
        save: '保存失败',
        upload: '上传失败',
        delete: '删除失败',
        publish: '发布失败',
        archive: '归档失败',
        prepareUpload: '无法准备上传',
        completeUpload: '无法完成上传',
        selectFile: '请先选择文件。',
      },
    },
    help: {
      title: '运营帮助',
      description:
        '按 Admin tab 梳理每天该看什么、该做什么，以及哪些字段容易被误读。',
      principlesTitle: '这份手册怎么用',
      principles: [
        '进入不熟悉的区域前先看帮助，把每个 tab 当成运营流程，而不是数据库表。',
        '每个 tab 都按用途、日常动作、关键字段和风险信号来写，帮助运营把数据变成下一步动作。',
        '首屏先看预览、状态、时间、用户、成本和错误；长 ID、URL、JSON 放到详情里排查。',
        '发现异常时，先判断问题属于内容、媒体、生成、算力还是权限，再进入对应 tab 处理。',
      ],
      rhythmTitle: '推荐运营节奏',
      rhythms: [
        {
          title: '每天开始',
          items: [
            '先看总览，只打开有真实波动的卡片，不要一上来改配置。',
            '优先复核失败生成、异常上传和充值风险，再处理内容更新。',
          ],
        },
        {
          title: '活动期间',
          items: [
            '确认已发布模板的预览、CTA、成本和标签都和活动一致。',
            '用素材库管理已审核素材，重复、过期、质量低的素材及时归档。',
          ],
        },
        {
          title: '收尾对账',
          items: [
            '支付问题要同时看算力流水、用户余额和 Stripe 事件。',
            '人工调整、退款、权限变更都要在 Admin 外留下说明，方便后续追溯。',
          ],
        },
      ],
      maintenanceTitle: '这个栏目怎么维护',
      maintenance: [
        '任何 tab 新增字段、筛选、权限或发布规则时，都同步更新 Help。',
        '文案写给运营看：说明什么时候该操作、什么时候不该操作，以及用哪个 tab 验证判断。',
        '示例保持短句，技术细节放在详情字段或工程文档里，不塞进首屏。',
        '客服或运营重复踩过两次的坑，要补进对应 tab 的风险信号。',
      ],
      labels: {
        purpose: '用途',
        dailyActions: '日常动作',
        keyFields: '关键字段/看板',
        riskSignals: '风险信号/误区',
      },
      items: [
        {
          key: 'overview',
          title: '总览',
          purpose:
            '判断注册、登录后活跃、访问、上传、生成和充值链路是否健康，给当天运营动作排优先级。',
          dailyActions: [
            '先看今天或近 7 天，再对比漏斗每一步是否突然变弱。',
            '失败任务和异常充值卡片抬升时，优先进入对应 tab 复核。',
            '把数据波动和当天投放、发布、支付配置变化放在一起看。',
          ],
          keyFields: [
            '注册、登录、访问、上传、生成、充值漏斗。',
            '生成成功率、失败任务、运行中任务和生成类型分布。',
            '每日趋势和异常充值风险卡片。',
          ],
          riskSignals: [
            '登录是用登录后行为估算的，不等于独立登录日志次数。',
            '失败率短时间抬升，通常先查 provider、素材格式或近期发布。',
            '异常充值只是复核线索，不要直接当成欺诈结论。',
          ],
        },
        {
          key: 'templates',
          title: '模板',
          purpose:
            '维护生成配方和预览素材，决定用户在工作台看到哪些创作入口。',
          dailyActions: [
            '先创建或编辑草稿，再发布到线上可见状态。',
            '上传 preview、thumbnail、source 或 example，让结果预期清楚。',
            '发布或归档前复核算力成本、时长、画幅比例和标签。',
          ],
          keyFields: [
            'Slug、语言、类型、状态、Hook、CTA 和描述。',
            'Prompt、Prompt JSON、默认输入 JSON 和负向 Prompt。',
            '算力成本、时长、画幅比例、标签、排序权重和使用量。',
          ],
          riskSignals: [
            'JSON 无效会导致保存失败，也可能掩盖 payload 配置错误。',
            '已发布模板如果没有清晰预览，会降低用户对结果的信任。',
            '前台展示成本要和真实生成预留算力保持一致。',
          ],
        },
        {
          key: 'library-assets',
          title: '素材库',
          purpose:
            '管理工作台可复用的一方素材，包括产品图、模特图、服装图、场景图和示例视频。',
          dailyActions: [
            '上传文件后先看预览，再补齐基础元数据。',
            '设置类型、使用场景、标签、质量分、来源和授权备注。',
            '通过审核的素材发布；过期、重复或低质素材及时归档。',
          ],
          keyFields: [
            '预览、标题、类型、状态、语言和使用场景。',
            '标签、质量分、排序权重、来源和授权备注。',
            '详情里的素材 URL、MIME、尺寸、时长等媒体信息。',
          ],
          riskSignals: [
            '模板是生成配方，素材库是媒体库存，两个 ID 不要混用。',
            '视频素材不能当图片直接渲染，否则会出现空预览或错位。',
            '没有授权、质量差或用途不明确的素材不要发布。',
          ],
        },
        {
          key: 'users',
          title: '用户',
          purpose:
            '查看账号、角色、算力余额和订阅状态，用于客服、权限和支付问题排查。',
          dailyActions: [
            '先按邮箱或姓名搜索，确认是同一个用户再操作。',
            '回复客服前核对角色、账号状态、套餐、订阅和余额。',
            '解释余额变化时跳到算力流水，不只看用户表余额。',
          ],
          keyFields: [
            '邮箱、姓名、账号状态和角色。',
            '算力余额、订阅状态、套餐和创建时间。',
            '账号调查时关注更新时间和详情字段。',
          ],
          riskSignals: [
            '修改角色会直接影响后台权限，操作前要二次确认。',
            '用户表余额必须能被流水解释，不能孤立判断。',
            '停用或软删除账号仍可能出现在客服排查里。',
          ],
        },
        {
          key: 'assets',
          title: '文件',
          purpose:
            '追踪用户上传、模板素材、生成文件和媒体元数据，用于文件可用性排查。',
          dailyActions: [
            '按上传类型、状态、MIME、用户或文件 ID 搜索。',
            '先看预览是否正常，再判断是否需要改元数据。',
            '恢复问题文件时查看尺寸、时长、媒体类型和公开 URL。',
          ],
          keyFields: [
            '预览、类型、状态、MIME、大小、创建和更新时间。',
            '宽度、高度、时长和媒体类型。',
            '公开 URL 放在详情里看，不作为默认扫表重点。',
          ],
          riskSignals: [
            'pending 或 failed 文件不能拿去发布模板或素材库。',
            'Storage Key 和长 URL 不是运营首屏字段，排查时再看。',
            '没有预览可能是格式不支持，也可能是上传还没完成。',
          ],
        },
        {
          key: 'generation-jobs',
          title: '生成任务',
          purpose:
            '排查每一次生成从输入到成品的状态、模板、算力成本和 provider 错误。',
          dailyActions: [
            '按商品、Prompt、模板、状态、用户或错误信息搜索。',
            '诊断前先对比输入预览和成品预览。',
            '关注排队、长时间运行和最近失败的任务。',
          ],
          keyFields: [
            '输入预览、成品预览、生成类型、状态和输入摘要。',
            '模板、预留算力、时长、创建和更新时间。',
            '详情里的错误信息和恢复字段。',
          ],
          riskSignals: [
            '任务卡在 queued、submitting 或 running 太久，需要尽快复核。',
            '失败任务如果已预留算力，可能需要退款或正确结算。',
            '输入摘要只适合快速分诊，不能替代原始素材判断。',
          ],
        },
        {
          key: 'credit-ledger',
          title: '算力流水',
          purpose:
            '作为算力余额的运营来源，追踪充值、预留、结算、退款和人工调整。',
          dailyActions: [
            '按用户、任务、Stripe 事件、原因或日期筛选。',
            '解释用户问题前，先看变动值和变动后余额。',
            '重点审计人工调整、缺少支付事件和大额变动。',
          ],
          keyFields: [
            '用户、变动值、原因、变动后余额和创建时间。',
            '任务 ID、生成类型、任务状态和任务模板。',
            'Stripe 事件 ID 和用于对账的 metadata JSON。',
          ],
          riskSignals: [
            '流水不是普通可编辑表，它是解释余额的依据。',
            '用户余额和最后一条流水不一致时，要先对账再处理。',
            '缺少 Stripe 事件或大额人工调整都需要复核。',
          ],
        },
        {
          key: 'help',
          title: '帮助',
          purpose:
            '作为 Admin 的运营培训和栏目治理入口，让运营知道每个 tab 用来判断什么、不能判断什么。',
          dailyActions: [
            '使用陌生 tab 或处理敏感客服案例前，先阅读对应说明。',
            '流程、字段、筛选、权限或运营规则变化时，同步更新帮助。',
            '事故或复盘后，把反复出现的经验沉淀成一句短规则。',
          ],
          keyFields: [
            '这份手册怎么用、推荐运营节奏和栏目维护规则。',
            '每个 tab 的用途、日常动作、关键字段和风险信号。',
            '模板、素材库、文件、生成任务和算力流水之间的边界。',
          ],
          riskSignals: [
            '帮助文案过期会直接变成运营误操作来源。',
            '写得太长反而没人读，优先保留短句、动作和验证位置。',
            '规则依赖技术数据时，要写明去哪个 tab 或详情字段确认。',
          ],
        },
      ],
    },
    statusLabels: adminStatusLabels.zh,
  },
};

export function getAdminContent(locale: string | null | undefined) {
  return adminContent[normalizeDashboardLocale(locale)];
}
