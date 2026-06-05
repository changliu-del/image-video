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
  confirmDelete: (name: string) => string;
  columns: Record<string, string>;
  fields: Record<string, string>;
  categoryOptions: Record<string, string>;
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
  confirmRemove: (title: string) => string;
  columns: Record<string, string>;
  fields: Record<string, string>;
  placeholders: Record<string, string>;
  categoryOptions: Record<string, string>;
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
    | 'retention'
    | 'generation'
    | 'failedJobs',
    {
      label: string;
      hint: string;
    }
  >;
  sections: {
    funnel: string;
    trend: string;
    generationMix: string;
  };
  metrics: Record<
    | 'totalUsers'
    | 'newUsers'
    | 'activeUsers'
    | 'existingUsers'
    | 'activeUserDays'
    | 'retainedUsers'
    | 'retention'
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
  funnelStages: Record<string, string>;
  diagnosis: {
    watch: string;
    steady: string;
    empty: Record<string, string>;
    weak: Record<string, string>;
    healthy: Record<string, string>;
  };
  risk: {
    conversion: string;
    dropoff: string;
  };
  riskSeverity: Record<
    'critical' | 'high' | 'medium' | 'low' | 'info',
    string
  >;
  calculationNotes: {
    generationQueue: string;
  };
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
  markdown?: string;
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
  topicOptionLabel: (tabTitle: string) => string;
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
        'Acompanha atividade, retenção, funil de registro para criação e saúde da fila de geração.',
      rangeTitle: 'Intervalo',
      from: 'De',
      to: 'Até',
      apply: 'Aplicar',
      refresh: 'Atualizar',
      loading: 'Carregando painel...',
      loadFailed: 'Falha ao carregar o painel',
      loginEstimate:
        'Atividade usa uploads e gerações autenticadas, pois ainda não há analytics dedicado de sessão.',
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
          label: 'Taxa ativa',
          hint: 'Usuários com comportamento observável sobre a base total',
        },
        retention: {
          label: 'Retenção',
          hint: 'Usuários existentes que voltaram a ficar ativos',
        },
        generation: {
          label: 'Criação',
          hint: 'Taxa de sucesso das gerações',
        },
        failedJobs: {
          label: 'Falhas',
          hint: 'Gerações com erro',
        },
      },
      sections: {
        funnel: 'Funil registro -> criação',
        trend: 'Atividade e criação',
        generationMix: 'Mix de criação',
      },
      metrics: {
        totalUsers: 'Usuários totais',
        newUsers: 'Novos usuários',
        activeUsers: 'Ativos',
        existingUsers: 'Usuários existentes',
        activeUserDays: 'Dias ativos',
        retainedUsers: 'Usuários retidos',
        retention: 'Retenção',
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
          active: 'Sem atividade autenticada observável.',
          retention: 'Nenhum usuário existente voltou a ficar ativo.',
          visits: 'Sem visitas de produto observáveis.',
          uploads: 'Sem usuários enviando materiais.',
          generation: 'Sem usuários criando no intervalo.',
          recharge: 'Sem usuários comprando créditos.',
        },
        weak: {
          registrations: 'Entrada baixa em relação à base total.',
          login: 'Queda alta antes do login. Revise aquisição e login.',
          active: 'Atividade autenticada abaixo do esperado.',
          retention: 'Retenção baixa para a base existente.',
          visits: 'Usuários logados não estão avançando para uso do produto.',
          uploads: 'A etapa de envio está segurando a intenção de criação.',
          generation: 'Poucos usuários ativos chegam à criação.',
          recharge: 'Uso não está convertendo em compra de créditos.',
        },
        healthy: {
          registrations: 'Novas contas chegando no intervalo.',
          login: 'Usuários autenticados continuam ativos.',
          active: 'Atividade autenticada observável no intervalo.',
          retention: 'Usuários existentes voltaram a ficar ativos.',
          visits: 'Há comportamento de produto suficiente para análise.',
          uploads: 'Upload acompanhando o interesse do produto.',
          generation: 'Criação acompanha a atividade observada.',
          recharge: 'Compras ficam no ledger de créditos.',
        },
      },
      calculationNotes: {
        generationQueue:
          'Congestionamento = jobs queued + submitting + running dividido pelo total de generation_jobs no intervalo; travado = job ativo sem avanço por 15 minutos.',
      },
      risk: {
        conversion: 'Conversão',
        dropoff: 'Perda',
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
        searchPlaceholder: 'Email, nome, função...',
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
        searchPlaceholder: 'Tipo, status, usuário, ID...',
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
        searchPlaceholder: 'Prompt, template, status...',
        columns: {
          inputPreview: 'Entrada',
          finalPreview: 'Resultado',
          generationType: 'Tipo',
          inputSummary: 'Resumo',
          templateId: 'Template ID',
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
        searchPlaceholder: 'Usuário, motivo, job...',
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
          jobTemplateId: 'Template ID do job',
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
      searchPlaceholder: 'Nome, categoria, tag...',
      create: 'Criar',
      modalCreate: 'Criar template',
      modalEdit: 'Editar template',
      modalDetails: 'Detalhes do template',
      currentAsset: 'Ativo atual',
      uploadAsset: 'Enviar ativo',
      tags: 'Tags',
      selectSavedTemplate: 'Selecione um template salvo e um arquivo primeiro.',
      confirmDelete: (name) => `Excluir template ${name}?`,
      columns: {
        name: 'Template',
        category: 'Categoria',
        costCredits: 'Créditos',
        durationSeconds: 'Duração',
        tags: 'Tags',
        usageCount: 'Uso',
        updatedAt: 'Atualizado em',
      },
      fields: {
        name: 'Nome',
        id: 'ID',
        category: 'Categoria',
        description: 'Descrição',
        prompt: 'Prompt',
        negativePrompt: 'Prompt negativo',
        costCredits: 'Custo',
        durationSeconds: 'Duração',
        sortWeight: 'Peso',
        aspectRatios: 'Proporções',
      },
      categoryOptions: {
        image_to_image: 'Imagem',
        image_to_video: 'Imagem para vídeo',
        try_on: 'Provador',
      },
      uploadRoleOptions: {
        preview: 'Preview',
        source: 'Fonte',
        example: 'Exemplo',
      },
      errors: {
        load: 'Falha ao carregar',
        save: 'Falha ao salvar',
        upload: 'Falha no envio',
        delete: 'Falha ao excluir',
        prepareUpload: 'Não foi possível preparar o envio',
        completeUpload: 'Não foi possível concluir o envio',
      },
    },
    libraryAssets: {
      title: 'Biblioteca',
      description:
        'Gerencie mídias reutilizáveis por workbench.',
      emptyText: 'Nenhum ativo na biblioteca.',
      searchPlaceholder: 'Título, categoria, MIME...',
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
      confirmRemove: (title) => `Remover ${title} da biblioteca?`,
      columns: {
        assetUrl: 'Preview',
        title: 'Material',
        category: 'Categoria',
        sortWeight: 'Peso',
        usageCount: 'Uso',
        updatedAt: 'Atualizado em',
      },
      fields: {
        title: 'Título',
        category: 'Categoria',
        description: 'Descrição',
        sortWeight: 'Peso',
        usageCount: 'Uso',
        mimeType: 'MIME',
        sizeBytes: 'Tamanho',
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
      },
      placeholders: {},
      categoryOptions: {
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
      title: 'Ajuda',
      description:
        'Guia rápido para ler cada aba do Admin, decidir a rotina diária e evitar interpretações erradas dos dados.',
      topicOptionLabel: (tabTitle) => `Guia de ${tabTitle}`,
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
            'Revise falhas de geração e fila congestionada antes de editar conteúdo.',
          ],
        },
        {
          title: 'Durante campanhas',
          items: [
            'Confirme se templates têm categoria, preview, custo e tags alinhados com a campanha.',
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
            'Avaliar atividade, retenção, funil de registro para criação e fila de geração antes de priorizar ações do dia.',
          dailyActions: [
            'Comece por hoje ou 7 dias e compare cada etapa do funil.',
            'Abra falhas de geração e jobs em execução quando os cards subirem.',
            'Leia variações junto com mídia paga, deploys e mudanças de produto.',
          ],
          keyFields: [
            'Funil de registro, atividade, criação e sucesso.',
            'Taxa de atividade, retenção, falhas, jobs em execução e mix de criação.',
            'Tendência diária de atividade, retenção e geração.',
          ],
          riskSignals: [
            'Atividade e retenção são estimadas por uploads e gerações autenticadas.',
            'Alta rápida em falhas costuma apontar para provider ou formato de mídia.',
            'Pagamentos devem ser analisados no ledger de créditos, fora do funil de usuários.',
          ],
        },
        {
          key: 'templates',
          title: 'Templates',
          markdown: `# Templates

## Uso

Templates sao receitas de criacao. Operacao usa esta pagina para manter nome, categoria, descricao, prompt, custo, tags e midias de preview que aparecem nos workbenches.

## Onde operar e conferir

### Lista no Admin

![Admin template list](/admin-help/placements/template-admin-list.png)

- Use a busca para encontrar por nome, categoria ou tag antes de criar outro template parecido.
- A tabela mostra categoria, custo, duracao, tags, uso e ultima atualizacao para decidir o que revisar primeiro.
- O botao Criar abre o formulario. Upload de preview, source ou example fica dentro do detalhe ou edicao.

### Formulario de criacao e edicao

![Admin template form](/admin-help/placements/template-admin-form.png)

- Preencha primeiro nome, categoria e descricao.
- Depois revise prompt, prompt negativo, custo, duracao, proporcoes, tags e sortWeight.
- Em templates ja salvos, envie preview, source ou example para explicar o resultado esperado.

### Biblioteca de templates no frontend

![Frontend templates page](/admin-help/placements/templates-page.png)

- O usuario encontra templates por busca, categoria, tags e ordenacao.
- Nome, descricao e preview precisam explicar rapidamente o uso.
- Tags e sortWeight definem a navegacao e a prioridade dentro da biblioteca.

### Workbench de criacao

![Creation workbench template placement](/admin-help/placements/video-workbench.png)

- A categoria decide em qual fluxo o template e validado: imagem, imagem para video ou provador.
- Prompt e negativePrompt precisam bater com a experiencia real de geracao.
- CostCredits, aspectRatios e durationSeconds precisam bater com a cobranca e com a promessa feita ao usuario.

## Campos que a operacao precisa revisar

- Nome: texto claro para Admin, busca e frontend.
- ID: identificador tecnico usado por links, tarefas e busca. O sistema gera e usa esse valor; operacao nao precisa criar slug.
- Categoria: define o fluxo de criacao em que o template deve ser conferido.
- Descricao: explica cenario de uso, limite e resultado esperado; tambem substitui o antigo hook.
- Prompt e prompt negativo: instrucoes reais para geracao; nao publique texto temporario.
- Custo, duracao e proporcoes: expectativa de credito, tempo de video e formato visual.
- Tags e sortWeight: busca, filtro, organizacao e prioridade.
- Preview, source e example: midias que ajudam o usuario e a operacao a reconhecer o template.

## Checklist

- Nao crie duplicado sem buscar por nome, categoria e tags.
- Nao deixe template sem preview compreensivel quando ele for importante para navegacao.
- Prompt, custo, duracao e proporcao precisam bater com a geracao real.
- Depois de salvar, confira a biblioteca de templates e o workbench correspondente.`,
          purpose:
            'Manter receitas de geração e mídias de preview que viram entradas visíveis nos workbenches.',
          dailyActions: [
            'Criar ou editar templates com nome, categoria, descrição e prompt completos.',
            'Enviar preview, fonte ou exemplo para explicar o resultado.',
            'Revisar custo, duração, proporção e tags antes de usar em campanhas.',
          ],
          keyFields: [
            'ID, nome, categoria, descrição e tags.',
            'Prompt e prompt negativo.',
            'Créditos, duração, proporções, tags, peso e uso.',
          ],
          riskSignals: [
            'Categoria errada faz o template aparecer no workbench errado.',
            'Template sem preview claro reduz confiança do usuário.',
            'Custo de créditos deve acompanhar a regra real de geração.',
          ],
        },
        {
          key: 'library-assets',
          title: 'Biblioteca',
          markdown: `# Biblioteca

## Uso

Ativos da biblioteca sao midias reutilizaveis. O upload cria o registro no Admin; depois de publicado com o caso de uso correto, o material aparece no workbench certo.

## Fluxo de operacao

- Envie PNG, JPG, WEBP, MP4 ou WEBM.
- Confira o preview antes de salvar.
- Revise titulo, idioma, tipo, descricao, casos de uso e tags.
- Preencha qualidade, peso, origem e licenca quando necessario.
- Publique somente depois de confirmar qualidade, autorizacao e posicao no frontend.

## Onde o usuario ve

### Workbench de video

![Video workbench material placement](/admin-help/placements/library-video-key.png)

- Caminho: workspace de criacao, aba de video.
- O usuario ve: botoes de referencia e material para compor o video.
- O operador confere: use case de video, preview claro e midia pronta para ser usada.

### Workbench de produto

![Apparel workbench material placement](/admin-help/placements/library-apparel-key.png)

- Caminho: workspace de produto, botao de escolher da biblioteca.
- O usuario ve: materiais de produto reutilizaveis para iniciar a composicao.
- O operador confere: clareza, proporcao, qualidade e tags.

### Workbench de prova virtual

![Try-on workbench material placement](/admin-help/placements/library-try-on-key.png)

- Caminho: workspace de prova virtual, area de modelo, roupa e material.
- O usuario ve: modelos, roupas ou exemplos disponiveis para selecionar.
- O operador confere: se o material esta na categoria correta e se a licenca esta clara.

## Checklist

- Upload concluido nao significa visivel no frontend; status ainda importa.
- useCase errado coloca midia na pagina errada.
- Video precisa de poster ou thumbnail real antes de entrar em grid de imagem.
- Qualidade, origem e licenca precisam estar resolvidas antes de publicar.`,
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
            'Vídeos precisam de tratamento próprio e não devem virar imagem quebrada.',
            'Material sem licença ou baixa qualidade não deve ser publicado.',
            'Caso de uso incorreto coloca material aprovado no workbench errado.',
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
        'Tracks activity, retention, the registration-to-generation funnel, and generation queue health.',
      rangeTitle: 'Date range',
      from: 'From',
      to: 'To',
      apply: 'Apply',
      refresh: 'Refresh',
      loading: 'Loading dashboard...',
      loadFailed: 'Failed to load dashboard',
      loginEstimate:
        'Activity uses authenticated uploads and generation jobs because dedicated session analytics do not exist yet.',
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
          label: 'Active rate',
          hint: 'Users with observable behavior over total users',
        },
        retention: {
          label: 'Retention',
          hint: 'Existing users who returned to active usage',
        },
        generation: {
          label: 'Generation',
          hint: 'Generation success rate',
        },
        failedJobs: {
          label: 'Failures',
          hint: 'Failed generation jobs',
        },
      },
      sections: {
        funnel: 'Registration -> generation funnel',
        trend: 'Activity and generation',
        generationMix: 'Generation mix',
      },
      metrics: {
        totalUsers: 'Total users',
        newUsers: 'New users',
        activeUsers: 'Active',
        existingUsers: 'Existing users',
        activeUserDays: 'Active days',
        retainedUsers: 'Retained users',
        retention: 'Retention',
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
          active: 'No observable authenticated activity.',
          retention: 'No existing users returned to active usage.',
          visits: 'No observable product visits.',
          uploads: 'No users uploaded materials.',
          generation: 'No users generated content in this range.',
          recharge: 'No users purchased credits.',
        },
        weak: {
          registrations: 'Signup intake is low against the total user base.',
          login: 'High drop before login. Review acquisition and auth.',
          active: 'Authenticated activity is below expectation.',
          retention: 'Retention is low for the existing user base.',
          visits: 'Authenticated users are not reaching product usage.',
          uploads: 'Upload is holding back creation intent.',
          generation: 'Too few active users reach generation.',
          recharge: 'Usage is not converting into credit purchases.',
        },
        healthy: {
          registrations: 'New accounts are entering during this range.',
          login: 'Authenticated users remain active.',
          active: 'Authenticated activity is observable in this range.',
          retention: 'Existing users returned to active usage.',
          visits: 'There is enough product behavior to inspect.',
          uploads: 'Uploads are tracking product interest.',
          generation: 'Generation follows observed activity.',
          recharge: 'Credit purchases belong in the credit ledger.',
        },
      },
      calculationNotes: {
        generationQueue:
          'Congestion = queued + submitting + running jobs divided by total generation_jobs in the range; stuck = an active job with no progress for 15 minutes.',
      },
      risk: {
        conversion: 'Conversion',
        dropoff: 'Dropoff',
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
        searchPlaceholder: 'Email, name, role...',
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
        searchPlaceholder: 'Type, status, user, ID...',
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
        searchPlaceholder: 'Prompt, template, status...',
        columns: {
          inputPreview: 'Input',
          finalPreview: 'Result',
          generationType: 'Type',
          inputSummary: 'Input Summary',
          templateId: 'Template ID',
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
        searchPlaceholder: 'User, reason, job...',
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
          jobTemplateId: 'Job template ID',
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
      searchPlaceholder: 'Name, category, tag...',
      create: 'Create',
      modalCreate: 'Create template',
      modalEdit: 'Edit template',
      modalDetails: 'Template details',
      currentAsset: 'Current asset',
      uploadAsset: 'Upload asset',
      tags: 'Tags',
      selectSavedTemplate: 'Select a saved template and a file first.',
      confirmDelete: (name) => `Delete template ${name}?`,
      columns: {
        name: 'Template',
        category: 'Category',
        costCredits: 'Credits',
        durationSeconds: 'Duration',
        tags: 'Tags',
        usageCount: 'Usage',
        updatedAt: 'Updated At',
      },
      fields: {
        name: 'Name',
        id: 'ID',
        category: 'Category',
        description: 'Description',
        prompt: 'Prompt',
        negativePrompt: 'Negative prompt',
        costCredits: 'Cost',
        durationSeconds: 'Duration',
        sortWeight: 'Weight',
        aspectRatios: 'Aspect ratios',
      },
      categoryOptions: {
        image_to_image: 'Image',
        image_to_video: 'Image to video',
        try_on: 'Try-on',
      },
      uploadRoleOptions: {
        preview: 'Preview',
        source: 'Source',
        example: 'Example',
      },
      errors: {
        load: 'Load failed',
        save: 'Save failed',
        upload: 'Upload failed',
        delete: 'Delete failed',
        prepareUpload: 'Upload could not be prepared',
        completeUpload: 'Upload could not be completed',
      },
    },
    libraryAssets: {
      title: 'Library Assets',
      description:
        'Manage reusable media by workbench.',
      emptyText: 'No library assets.',
      searchPlaceholder: 'Title, category, MIME...',
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
      confirmRemove: (title) => `Remove ${title} from the library?`,
      columns: {
        assetUrl: 'Preview',
        title: 'Material',
        category: 'Category',
        sortWeight: 'Weight',
        usageCount: 'Usage',
        updatedAt: 'Updated At',
      },
      fields: {
        title: 'Title',
        category: 'Category',
        description: 'Description',
        sortWeight: 'Sort Weight',
        usageCount: 'Usage',
        mimeType: 'MIME',
        sizeBytes: 'Size',
        createdAt: 'Created At',
        updatedAt: 'Updated At',
      },
      placeholders: {},
      categoryOptions: {
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
      title: 'Help',
      description:
        'A compact guide for reading each Admin tab, choosing daily actions, and avoiding common data mistakes.',
      topicOptionLabel: (tabTitle) => `${tabTitle} guide`,
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
            'Review failed generations and queue congestion before editing content.',
          ],
        },
        {
          title: 'Campaign work',
          items: [
            'Confirm templates have category, preview media, cost, and tags aligned with the campaign.',
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
            'Check activity, retention, the registration-to-generation funnel, and generation queue health before prioritizing the day.',
          dailyActions: [
            'Start with today or 7 days and compare each funnel step.',
            'Open generation failures and running jobs when the cards rise.',
            'Read movement alongside paid traffic, deployments, and product changes.',
          ],
          keyFields: [
            'Registration, activity, generation, and successful generation funnel.',
            'Activity rate, retention, failures, running jobs, and generation mix.',
            'Daily activity, retention, and generation trends.',
          ],
          riskSignals: [
            'Activity and retention are estimated from authenticated uploads and generation jobs.',
            'A quick failure spike usually points to provider or media format issues.',
            'Payments belong in the credit ledger, outside the user funnel.',
          ],
        },
        {
          key: 'templates',
          title: 'Templates',
          markdown: `# Templates

## Purpose

Templates are creation recipes. Operators use this page to maintain the name, category, description, prompt, cost, tags, and preview media that appear in workbenches.

## Where to operate and verify

### Admin list

![Admin template list](/admin-help/placements/template-admin-list.png)

- Search by name, category, or tag before creating another similar template.
- The table shows category, credit cost, duration, tags, usage, and last update so operators can decide what to review first.
- Create opens the form. Preview, source, or example uploads happen from detail or edit views.

### Create and edit form

![Admin template form](/admin-help/placements/template-admin-form.png)

- Fill name, category, and description first.
- Then review prompt, negative prompt, cost, duration, aspect ratios, tags, and sortWeight.
- For saved templates, upload preview, source, or example media to explain the expected result.

### Frontend template library

![Frontend templates page](/admin-help/placements/templates-page.png)

- Users find templates through search, category, tags, and sorting.
- Name, description, and preview must explain the use case quickly.
- Tags and sortWeight decide browsing organization and priority.

### Creation workbench

![Creation workbench template placement](/admin-help/placements/video-workbench.png)

- Category decides which creation flow must be checked: image, image to video, or try-on.
- Prompt and negativePrompt must match the real generation experience.
- CostCredits, aspectRatios, and durationSeconds must match billing and the promise shown to users.

## Fields operators need to review

- Name: clear text for Admin, search, and frontend.
- ID: technical identifier used by links, tasks, and search. The system generates and uses this value; operations does not need to create a slug.
- Category: creation flow where the template should be verified.
- Description: scenario, limitation, and expected result; it also replaces the old hook.
- Prompt and negative prompt: real generation instructions; do not publish placeholder text.
- Cost, duration, and aspect ratios: credit expectation, video length, and visual format.
- Tags and sortWeight: search, filtering, organization, and priority.
- Preview, source, and example: media that helps users and operators recognize the template.

## Checklist

- Do not create a duplicate without searching by name, category, and tags.
- Do not leave important browsing templates without understandable preview media.
- Prompt, cost, duration, and aspect ratio must match the real generation flow.
- After saving, check the frontend template library and the matching workbench.`,
          purpose:
            'Maintain generation recipes and preview media that become visible workbench entry points.',
          dailyActions: [
            'Create or edit templates with complete name, category, description, and prompt.',
            'Upload preview, source, or example media to explain the result.',
            'Review cost, duration, aspect ratio, and tags before using templates in campaigns.',
          ],
          keyFields: [
            'ID, name, category, description, and tags.',
            'Prompt and negative prompt.',
            'Credits, duration, aspect ratios, tags, sort weight, and usage.',
          ],
          riskSignals: [
            'Wrong category makes the template appear in the wrong workbench.',
            'A template without clear preview media lowers user confidence.',
            'Credit cost should match the real generation reservation rule.',
          ],
        },
        {
          key: 'library-assets',
          title: 'Library Assets',
          markdown: `# Library Assets

## Purpose

Library assets are reusable media. Uploading creates the Admin record; publishing it with the right use case makes the material appear in the matching workbench.

## Operating flow

- Upload a PNG, JPG, WEBP, MP4, or WEBM file.
- Check the preview before saving.
- Review title, locale, kind, description, use cases, and tags.
- Fill quality, sort weight, source, and license note when needed.
- Publish only after quality, rights, and frontend placement are clear.

## Where users see it

### Video workbench

![Video workbench material placement](/admin-help/placements/library-video-key.png)

- Path: creation workspace, video tab.
- Users see: reference buttons and reusable material for composing a video.
- Operators check: video use case, clear preview, and usable media.

### Product image workbench

![Apparel workbench material placement](/admin-help/placements/library-apparel-key.png)

- Path: product image workspace, choose-from-library entry.
- Users see: reusable product materials for starting a composition.
- Operators check: clarity, ratio, quality, and tags.

### Try-on workbench

![Try-on workbench material placement](/admin-help/placements/library-try-on-key.png)

- Path: try-on workspace, model, garment, and material areas.
- Users see: selectable models, garments, or examples.
- Operators check: correct category and clear rights notes.

## Checklist

- A completed upload is not automatically frontend-visible; status still matters.
- A wrong useCase places media on the wrong page.
- Video needs a real poster or thumbnail before entering image grids.
- Quality, source, and license should be resolved before publishing.`,
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
            'Videos need their own handling and should not render as broken images.',
            'Unlicensed or low-quality material should stay out of published inventory.',
            'A wrong use case places approved material on the wrong workbench.',
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
      title: '管理后台',
      forbiddenTitle: '403',
      forbiddenDescription: '你没有权限访问管理后台。',
    },
    tabs: {
      overview: '总览',
      templates: '模板',
      'library-assets': '素材库',
      users: '用户',
      assets: '媒体文件',
      'generation-jobs': '生成任务',
      'credit-ledger': '算力流水',
      help: '帮助',
    },
    dashboard: {
      title: '运营数据概览',
      description:
        '查看活跃率、留存率、注册到生成漏斗和生成队列健康。',
      rangeTitle: '日期范围',
      from: '开始',
      to: '结束',
      apply: '查询',
      refresh: '刷新',
      loading: '正在加载数据概览...',
      loadFailed: '数据概览加载失败',
      loginEstimate:
        '活跃率使用上传和生成等登录后可观测产品行为估算，当前还没有独立会话分析。',
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
          label: '活跃率',
          hint: '有可观测产品行为的用户占总用户比例',
        },
        retention: {
          label: '留存率',
          hint: '老用户中再次产生可观测行为的比例',
        },
        generation: {
          label: '生成',
          hint: '生成任务成功率',
        },
        failedJobs: {
          label: '失败',
          hint: '失败生成任务',
        },
      },
      sections: {
        funnel: '注册到生成漏斗',
        trend: '活跃与生成趋势',
        generationMix: '生成类型分布',
      },
      metrics: {
        totalUsers: '总用户',
        newUsers: '新增用户',
        activeUsers: '活跃',
        existingUsers: '老用户',
        activeUserDays: '活跃天数',
        retainedUsers: '留存用户',
        retention: '留存',
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
        creditEvents: '算力流水',
        refundEvents: '退款/返还',
        runningJobs: '运行中',
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
          active: '没有可观测的产品行为。',
          retention: '没有老用户回访并产生行为。',
          visits: '没有可观测的产品访问。',
          uploads: '没有用户上传素材。',
          generation: '当前日期范围内没有用户生成。',
          recharge: '没有用户购买算力。',
        },
        weak: {
          registrations: '新增注册相对用户基数偏低。',
          login: '登录前流失较高，需要检查获客和登录链路。',
          active: '活跃率低于预期。',
          retention: '老用户留存偏低。',
          visits: '登录用户没有充分进入产品使用。',
          uploads: '上传步骤阻塞了后续生成意图。',
          generation: '活跃用户进入生成的比例偏低。',
          recharge: '使用行为没有有效转化为算力购买。',
        },
        healthy: {
          registrations: '日期范围内有新增账号进入。',
          login: '登录后活跃保持可观测。',
          active: '范围内有可观测产品行为。',
          retention: '老用户回访并产生了有效行为。',
          visits: '产品访问行为足够支撑分析。',
          uploads: '上传行为跟随产品兴趣。',
          generation: '生成行为跟随活跃使用。',
          recharge: '充值行为归入算力流水查看。',
        },
      },
      calculationNotes: {
        generationQueue:
          '拥挤度 = queued + submitting + running 任务数 / 范围内 generation_jobs 总数；卡住任务 = 15 分钟没有推进的活跃任务。',
      },
      risk: {
        conversion: '转化',
        dropoff: '流失',
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
        description: '管理账号状态、算力余额、订阅和角色。',
        searchPlaceholder: '搜索邮箱、姓名、角色...',
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
        title: '媒体文件',
        description: '管理用户上传、模板素材、生成文件和媒体元数据。',
        searchPlaceholder: '搜索类型、状态、用户或 ID...',
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
          publicUrl: '公开链接',
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
        description: '查看生成状态、提示词输入、算力消耗和恢复字段。',
        searchPlaceholder: '搜索提示词、模板或状态...',
        columns: {
          inputPreview: '输入图',
          finalPreview: '成品',
          generationType: '类型',
          inputSummary: '输入摘要',
          templateId: '模板 ID',
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
        searchPlaceholder: '搜索用户、原因或任务...',
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
          jobTemplateId: '任务模板 ID',
          jobInputSummary: '任务摘要',
          metadataJson: '元数据 JSON',
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
      searchPlaceholder: '搜索名称、类别或标签...',
      create: '创建',
      modalCreate: '创建模板',
      modalEdit: '编辑模板',
      modalDetails: '模板详情',
      currentAsset: '当前素材',
      uploadAsset: '上传素材',
      tags: '标签',
      selectSavedTemplate: '请先选择已保存的模板和文件。',
      confirmDelete: (name) => `确认删除模板 ${name}？`,
      columns: {
        name: '模板',
        category: '类别',
        costCredits: '消耗算力',
        durationSeconds: '时长',
        tags: '标签',
        usageCount: '使用量',
        updatedAt: '更新时间',
      },
      fields: {
        name: '名称',
        id: 'ID',
        category: '类别',
        description: '描述',
        prompt: '提示词',
        negativePrompt: '负向提示词',
        costCredits: '成本',
        durationSeconds: '时长',
        sortWeight: '排序权重',
        aspectRatios: '画幅比例',
      },
      categoryOptions: {
        image_to_image: '图片',
        image_to_video: '图生视频',
        try_on: '智能试衣',
      },
      uploadRoleOptions: {
        preview: '预览',
        source: '源文件',
        example: '示例',
      },
      errors: {
        load: '加载失败',
        save: '保存失败',
        upload: '上传失败',
        delete: '删除失败',
        prepareUpload: '无法准备上传',
        completeUpload: '无法完成上传',
      },
    },
    libraryAssets: {
      title: '素材库',
      description: '按工作台管理可复用媒体。',
      emptyText: '暂无素材。',
      searchPlaceholder: '搜索标题、类别或 MIME...',
      addAsset: '添加素材',
      createAction: '上传入库',
      modalCreate: '添加素材',
      modalEdit: '编辑素材',
      modalDetails: '素材详情',
      advancedFields: '高级字段',
      noFileSelected: '未选择文件',
      selectedFile: '已选文件',
      uploadFile: '上传文件',
      openAssetUrl: '打开素材链接',
      confirmRemove: (title) => `确认从素材库移除 ${title}？`,
      columns: {
        assetUrl: '预览',
        title: '素材',
        category: '类别',
        sortWeight: '排序权重',
        usageCount: '使用量',
        updatedAt: '更新时间',
      },
      fields: {
        title: '标题',
        category: '类别',
        description: '描述',
        sortWeight: '排序权重',
        usageCount: '使用量',
        mimeType: 'MIME',
        sizeBytes: '大小',
        createdAt: '创建时间',
        updatedAt: '更新时间',
      },
      placeholders: {},
      categoryOptions: {
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
      title: '帮助',
      description:
        '选择一个后台栏目，按真实操作顺序查看入口、字段含义、保存后会出现在哪里，以及上线前要检查什么。',
      topicOptionLabel: (tabTitle) => `${tabTitle}页面讲解`,
      principlesTitle: '这份手册怎么用',
      principles: [
        '先在左侧“帮助”下拉里选择要操作的页面讲解，再照着“实操步骤”做，不要把帮助当成数据字典。',
        '字段说明只写运营必须知道的含义：为什么要填、填错会影响哪里、最终会被哪个前台页面读取。',
        '模板保存后按类别进入对应工作台；有状态的表如素材库，才需要额外确认草稿、发布和归档状态。',
        '遇到问题时按链路排查：模板决定创作入口，素材库提供可复用媒体，媒体文件确认上传状态，生成任务确认执行结果，算力流水解释余额。',
      ],
      rhythmTitle: '推荐运营节奏',
      rhythms: [
        {
          title: '上新前',
          items: [
            '先准备模板或素材的预览，再补字段；模板保存后验证，素材发布前验证。',
            '用对应工作台确认用户能看到正确入口或素材。',
          ],
        },
        {
          title: '日常巡检',
          items: [
            '先看总览，再处理失败生成、异常队列和明显低质素材。',
            '客服问题从用户、生成任务、算力流水三处交叉确认。',
          ],
        },
        {
          title: '下架和复盘',
          items: [
            '过期模板先降低排序或删除前确认历史排查需求；过期素材优先归档。',
            '把重复踩坑补进对应 tab 的风险信号。',
          ],
        },
      ],
      maintenanceTitle: '这个栏目怎么维护',
      maintenance: [
        '新增字段时同步写清楚字段含义、必填场景、错误后果和最终展示位置。',
        '新增上传、发布、归档、删除等动作时，用步骤写法更新，不写抽象原则。',
        '如果某个字段只用于排查，不在首屏出现，要写明去详情里看。',
        '客服或运营重复踩过两次的坑，要补进对应 tab 的检查点。',
      ],
      labels: {
        purpose: '这个 tab 做什么 / 结果在哪里',
        dailyActions: '实操步骤',
        keyFields: '字段含义',
        riskSignals: '发布前检查 / 常见误区',
      },
      items: [
        {
          key: 'overview',
          title: '总览',
          purpose:
            '用来决定今天先处理什么。它不创建内容，只把注册、活跃、生成、失败、队列和留存放在一起，帮助判断是内容问题、素材问题、生成问题还是支付问题。',
          dailyActions: [
            '先切今天或近 7 天，看漏斗哪一步掉得最明显。',
            '失败任务升高时，打开“生成任务”搜索最近失败和错误信息。',
            '运行中任务变多时，先判断是否队列堵塞，再决定是否暂停活动或联系技术排查。',
            '活动或发布当天，把总览波动和新模板、新素材、投放时间一起看。',
          ],
          keyFields: [
            '注册到生成漏斗：看新用户是否真的走到创作，不解释支付。',
            '活跃率和留存率：由登录后上传、生成等产品行为估算，用来判断用户是否回来使用。',
            '失败任务：短时间升高时优先查生成任务和服务商错误。',
            '运行中任务：长时间高位代表队列或 provider 可能卡住。',
            '生成类型分布：判断用户主要在用图生视频、商品图还是智能试衣。',
          ],
          riskSignals: [
            '不要只凭总览改模板或素材，要到对应 tab 看具体记录。',
            '支付和余额不在漏斗里解释，要去“算力流水”和“用户”。',
            '投放、上线、服务商故障都会造成波动，先定位事件时间。',
          ],
        },
        {
          key: 'templates',
          title: '模板',
          markdown: `# 模板操作手册

## 一、引言

### 编写目的

本文用于指导运营在管理后台维护模板。模板是一套生成配方，会按类别作为用户的一键创作入口出现在模板库或对应创作工作台里。

### 注意事项

- 模板不是素材。模板控制生成配方、提示词、画幅、时长和算力成本；素材库管理可复用图片或视频。
- 模板保存后要按用户路径检查：先看前台模板库页面是否方便发现和理解，再看对应创作工作台能否正确选择并生成。
- 一张模板表维护名称、描述、类别、提示词、成本、画幅、时长、标签和预览素材，不再维护 slug、语言、状态、hook、CTA 或 JSON 预设。
- 类别控制模板进入哪个工作台，标签主要服务用户浏览和运营筛选。
- 算力成本、时长和画幅比例必须和真实生成规则一致，不能只为了展示好看而随意填写。

## 二、系统整体界面介绍

### 系统登录与入口

- 系统 URL：使用管理员提供的后台域名进入系统。
- 登录方式：使用管理员账号登录后进入管理后台。
- 功能入口：左侧菜单选择“管理后台 > 模板”。
- 前台验证位置：前台模板库页面，以及图生视频、商品图、智能试衣等创作工作台。

### 模板管理列表页面介绍

![模板管理列表页](/admin-help/placements/template-admin-list.png)

模板管理列表是运营每天查找、创建和复核模板的入口。截图里本地环境暂无模板，但页面结构就是线上运营要看的结构：搜索框用于按名称、ID、类别或标签定位模板；“创建”用于新增模板；列表列位用于快速判断模板类别、消耗算力、时长、标签、使用量和更新时间；操作列用于查看、编辑、上传素材或删除。

运营在列表页先看三件事：是否已经有相似模板、模板类别是否符合工作台入口、更新时间和使用量是否需要复核。不要只凭名称判断模板能不能上线，必须进详情或编辑表单看提示词、成本和预览素材。

### 模板编辑表单页面介绍

![模板编辑表单](/admin-help/placements/template-admin-form.png)

模板编辑表单是补齐字段和生成配置的地方。顶部字段负责前台展示和基础归类：名称、类别、描述。继续向下滚动后会看到提示词、负向提示词、成本、时长、排序权重、画幅比例、标签和上传素材。只有已保存模板才能上传 preview、source 或 example。

### 前台模板库页面介绍

![前台模板库页面](/admin-help/placements/templates-page.png)

前台模板库是用户浏览和筛选模板的页面。运营保存后要检查名称是否能说明用途、预览是否看得懂、标签是否能被筛选到、排序是否符合活动优先级。这里主要验证“用户能不能发现并理解模板”。

### 创作工作台页面介绍

![创作工作台模板入口](/admin-help/placements/video-workbench.png)

创作工作台验证模板是否真的能用于生成。运营要按 category 进入对应工作台：image_to_video 看图生视频，image_to_image 看图片生成，try_on 看智能试衣。这里重点检查默认提示词、上传要求、画幅、时长、算力说明和生成按钮是否符合模板承诺。

## 三、功能介绍

### 创建和编辑模板

- 新建模板时先填写名称、类别和描述。
- 再填写提示词、负向提示词、成本、画幅、时长、排序权重和标签。
- 需要解释效果时，上传 preview、source 或 example。
- 保存后检查预览和字段是否完整，再到对应工作台验证。

### 字段说明

- 名称：运营和用户都能看到的模板名称。要写成可理解的结果或用途，不要只写内部代号。
- ID：系统生成的模板唯一标识，用于跳转、任务记录和定位。运营不需要额外维护 slug。
- 类别：决定模板要去哪个工作台验证。image_to_video 看图生视频；image_to_image 看图片生成；try_on 看智能试衣。类别填错时，运营会在错误页面找模板。
- 描述：解释适合的商品、渠道、活动目标或限制条件，也承担原来 hook 的浏览说明作用。描述太泛会影响用户选择。
- 提示词：正向生成要求，是模板效果的核心。不能只写展示文案，必须能指导真实生成。
- 负向提示词：用于排除不想要的画面、风格或错误结果。常见问题可以沉淀在这里。
- 成本：用户生成时看到和预留的算力成本说明，必须和后端真实扣费规则一致。
- 时长：视频模板的默认时长。图片模板通常不需要时长；视频时长要和 provider 支持能力一致。
- 画幅比例：用户可选或默认生成比例。保存前要确认预览素材和生成结果都适配这些比例。
- 标签：用于搜索、筛选、活动分组和运营排查。用短标签，不要写成长句。
- 排序权重：同类模板的人工排序加权。活动主推可以临时调高，活动结束后要调回。
- 上传素材：preview 用于展示结果预期，source 用于源素材，example 用于示例结果。重要模板没有清晰预览时不要放到活动入口。
- 使用量和更新时间：用于判断模板是否还在被用户使用，以及最近是否有人改动。高使用模板修改前要更谨慎。

### 保存和验证模板

- 保存前先检查展示字段，再检查生成配置。
- 保存后到模板库和对应工作台验证是否出现。
- 过期或错误模板可以删除；删除前确认没有还需要排查的历史任务。

## 四、业务操作指引

### 如何管理模板

新增模板：进入“模板”页面，点击创建，填写名称、类别、描述、提示词、画幅、时长、标签和算力成本，再补齐 preview、source 或 example。

查询模板：通过名称、ID、类别或标签查找模板。找不到时先确认是否在正确工作台类别下查询。

修改模板：先判断要改的是展示效果还是生成配置。展示效果通常修改名称、描述、预览、标签和排序；生成配置通常修改提示词、画幅、时长和算力成本。

删除模板：删除前确认模板不是当前活动入口，也不会影响历史任务排查。只是临时不想主推时，优先调低排序权重或移除相关标签。

保存后验证：保存后先看前台模板库是否能被搜索和筛选到，再进入对应创作工作台检查模板入口、默认提示词、画幅时长和算力说明是否正确。`,
          purpose:
            '维护用户在工作台看到的创作入口和生成配方。模板会按类别进入对应创作页面的模板/灵感列表，影响名称、预览、提示词、画幅、时长和消耗算力。',
          dailyActions: [
            '点击“创建”维护名称、类别、描述和提示词。',
            '进入已保存模板，上传 preview、source 或 example，让用户能看懂结果预期。',
            '复核成本、时长、画幅比例和标签后再用于活动入口。',
            '保存后到对应工作台查看模板是否出现，过期模板降低排序或删除。',
          ],
          keyFields: [
            'ID：系统生成的模板唯一标识，用于跳转、任务记录和定位。',
            '名称、描述、类别：用户看到的浏览信息，以及模板进入哪个工作台。',
            'Prompt 和负向 Prompt：真正给生成服务的配置。',
            '算力成本：用户点击生成时会按这个成本展示和预留，必须和后端真实规则一致。',
            '时长和画幅比例：影响视频长度和生成尺寸，也影响用户预期。',
            '标签和排序权重：决定前台分类、搜索和展示顺序。',
          ],
          riskSignals: [
            '类别填错会让模板进入错误工作台。',
            '没有清晰预览的模板不要作为主推入口，用户不知道会生成什么。',
            '算力成本填错会直接影响扣费解释和客服处理。',
            '删除模板前确认没有历史排查需求。',
          ],
        },
        {
          key: 'library-assets',
          title: '素材库',
          markdown: `# 素材库操作手册

## 一、引言

### 编写目的

本文用于指导运营在管理后台维护可复用媒体素材。素材库里的图片和视频会被创作工作台调用，帮助用户更快选择商品、模特、服饰、参考素材或示例素材。

### 注意事项

- 素材不是模板。素材是可复用媒体文件，模板是生成配方。
- 文件上传成功不等于前台可见。只有 status 为发布，并且使用场景选对，用户才会在对应工作台看到它。
- 视频素材进入图片格子前需要真实封面或缩略图。
- 质量、来源和授权备注没有确认清楚时，不要发布。

## 二、系统整体界面介绍

### 系统登录与入口

- 系统 URL：使用管理员提供的后台域名进入系统。
- 登录方式：使用管理员账号登录后进入管理后台。
- 功能入口：左侧菜单选择“管理后台 > 素材库”。
- 前台验证位置：图生视频、商品图、智能试衣等创作工作台。

### 素材库页面介绍

素材库页面用于上传、编辑、发布和归档媒体素材。运营在这里维护文件预览、基础信息、使用场景、质量排序、来源和授权备注。

- 上传与预览：上传 PNG、JPG、WEBP、MP4 或 WEBM 后，先确认预览是否正常。
- 基础信息：标题、语言、类型、状态、描述。
- 使用场景：决定素材会进入图生视频、商品图还是智能试衣。
- 运营管理：标签、质量分、排序权重、来源、授权备注。

### 图生视频工作台页面介绍

![图生视频工作台素材位置](/admin-help/placements/library-video-key.png)

- 打开位置：创作工作台里的“图生视频”。
- 用户看到：出镜商品、出镜模特、参考素材等可选入口。
- 运营检查：使用场景适合视频，预览清楚，素材可以直接用于生成。

### 商品图工作台页面介绍

![商品图工作台素材位置](/admin-help/placements/library-apparel-key.png)

- 打开位置：创作工作台里的“商品图”。
- 用户看到：“从素材库选择”入口，用已有商品素材开始制作。
- 运营检查：图片清晰，比例适合商品图，标题、标签和质量分能帮助筛选。

### 智能试衣工作台页面介绍

![智能试衣工作台素材位置](/admin-help/placements/library-try-on-key.png)

- 打开位置：创作工作台里的“智能试衣”。
- 用户看到：模特、服饰和参考素材的选择入口。
- 运营检查：素材类型放对，模特图和服饰图不要混，来源和授权备注清楚。

## 三、功能介绍

### 上传素材

- 点击新增素材，选择 PNG、JPG、WEBP、MP4 或 WEBM 文件。
- 上传后先看预览。预览打不开、主体被裁切、清晰度不足时，不要发布。
- 系统可能根据文件名自动猜标题、类型、标签和使用场景，运营需要逐项复核。

### 编辑素材信息

- 标题：使用运营能看懂的名称，不要只保留乱码文件名。
- 语言：选择素材服务的语言版本。
- 类型：标明产品图、模特图、服装图、场景图、示例图或示例视频。
- 描述：说明适合什么商品、场景、风格或限制。
- 标签：用于搜索、分类和后续推荐，不要写成长句。

### 设置使用场景

- image_to_video：素材会用于图生视频相关入口。
- apparel_image：素材会用于商品图相关入口。
- try_on：素材会用于智能试衣相关入口。
- 使用场景选错会让素材出现在错误页面，尤其模特图和服饰图不要混。

### 管理质量、排序和授权

- 质量分：0 到 100，越高越适合优先展示。低质素材不要靠排序权重硬推。
- 排序权重：同类素材的人工排序加权，活动主推可以调高，活动结束后要复原或归档。
- 来源和授权备注：记录 manual、crawler、wanxiang、内部授权、生成素材等来源，避免版权不清的素材上线。

## 四、业务操作指引

### 如何管理素材库

新增素材：进入“素材库”页面，点击新增素材，上传文件，确认预览正常，再填写标题、语言、类型、描述、使用场景和标签。

查询素材：通过标题、类型、状态、语言、标签或使用场景查找素材。前台找不到素材时，先检查是否发布、语言是否正确、使用场景是否选对。

修改素材：需要调整展示时，修改标题、描述、标签、质量分和排序权重；需要调整出现位置时，修改使用场景；需要处理版权问题时，补来源和授权备注。

删除或下架素材：不建议直接删除已上线素材。需要下架时改为归档，归档后前台不可见，但仍保留后台记录。

发布后验证：发布后进入对应工作台检查素材是否出现。图生视频看视频素材入口，商品图看“从素材库选择”，智能试衣看模特、服饰和参考素材入口。`,
          purpose:
            '上传和管理可复用媒体素材。新上传保存后先是 Admin 里的素材记录；状态发布后，才会按“使用场景”出现在对应工作台：图生视频、商品图或智能试衣。',
          dailyActions: [
            '进入“素材库”，点击“新增素材”，先选择 PNG、JPG、WEBP、MP4 或 WEBM 文件。',
            '看左侧预览是否正常。预览不正常时不要发布，先换文件或查媒体文件状态。',
            '系统会根据文件名自动猜标题、类型、标签和使用场景，但运营需要逐项复核。',
            '补标题、语言、类型、描述、使用场景和标签，必要时展开高级字段补质量分、排序权重、来源和授权备注。',
            '先保存为草稿；确认质量、授权和展示位置后，由有权限的人发布。',
            '发布后到对应工作台检查：image_to_video 看 /create/video，apparel_image 看 /create/apparel，try_on 看 /create/try-on。',
          ],
          keyFields: [
            '上传文件：真正写入 R2 的原始媒体。支持图片和视频；文件决定预览、MIME、大小、尺寸、时长。',
            '预览：发布前第一检查点。看不清、打不开、比例明显不对时不要发布。',
            '标题：运营可读名称，会用于 Admin 搜索和前台素材列表理解，不能只写文件名乱码。',
            '语言：素材服务的默认语言版本。多语言素材要按实际使用区域选择。',
            '类型：产品图、模特图、服装图、场景图、示例图、示例视频，用来告诉工作台这是什么素材。',
            '状态：draft 只在 Admin；published 会进入公开素材 API；archived 从前台下架。',
            '描述：说明适合什么商品、场景、风格或限制，帮助运营二次筛选。',
            '使用场景：image_to_video 出现在图生视频；apparel_image 出现在商品图；try_on 出现在智能试衣。',
            '标签：逗号分隔，用于搜索、分类和后续推荐，不要塞长句。',
            '质量分：0 到 100，越高越适合优先展示；低质素材不要靠排序权重硬推。',
            '排序权重：同类素材的人工排序加权，活动主推可以调高，活动结束要复原或归档。',
            '来源和授权备注：记录 manual、crawler、wanxiang、内部授权、生成素材等来源，避免版权不清的素材上线。',
          ],
          riskSignals: [
            '草稿不会出现在前台。保存后找不到素材时，先检查是否 published。',
            '使用场景选错会让素材出现在错误工作台，尤其模特图和服装图通常应该给 try_on。',
            '视频素材不要当图片素材使用，否则前台可能没有图片缩略图。',
            '版权不清、低清晰度、主体被裁切、商品和模特不适配的素材不要发布。',
            '素材标题、类型、使用场景和授权备注不清楚时，不要发布。',
          ],
        },
        {
          key: 'users',
          title: '用户',
          purpose:
            '处理客服、权限和支付排查。用户 tab 显示账号是谁、能不能登录、是什么角色、当前余额和订阅状态；余额原因要去算力流水解释。',
          dailyActions: [
            '先按邮箱或姓名搜索，确认是同一个用户再操作。',
            '看账号状态、角色、套餐、订阅和余额，判断是权限问题还是计费问题。',
            '需要解释余额变化时，复制用户信息到“算力流水”继续查。',
            '只有确认需要后台权限时才改角色，普通客服问题不要改角色。',
          ],
          keyFields: [
            '邮箱和姓名：确认用户身份，避免同名误操作。',
            '账号状态：判断账号是否可用、停用或被删除。',
            '角色：member 是普通用户，ops 可做运营，admin 可做用户、发布、删除等高权限操作。',
            '算力余额：当前结果值，不解释原因。',
            '订阅状态和套餐：判断用户是否处在付费、取消或异常状态。',
            '创建和更新时间：用于判断新用户、老用户或近期是否被改过。',
          ],
          riskSignals: [
            '改角色会直接改变后台权限，发布和删除能力尤其要确认。',
            '余额必须能被算力流水解释，不要只看用户表余额就答复。',
            '停用或软删除用户可能仍出现在排查结果里，先看状态再判断。',
          ],
        },
        {
          key: 'assets',
          title: '媒体文件',
          purpose:
            '排查所有底层媒体文件，包括用户上传、模板媒体、素材库上传和生成结果。它告诉你文件是否真的上传成功、能不能预览、MIME 和尺寸是否合理。',
          dailyActions: [
            '按上传类型、状态、MIME、用户或文件 ID 搜索。',
            '先看预览，再看 status 是否 uploaded。',
            '如果模板或素材库看不到图，回到这里确认对应 asset 是否 pending 或 failed。',
            '恢复问题文件时只在详情里查看公开链接、尺寸、时长和媒体类型。',
          ],
          keyFields: [
            '预览：判断文件是否能被前台展示。',
            '类型：区分普通上传、模板素材、生成结果或素材库文件。',
            '状态：pending 未完成，uploaded 可用，failed 不可用。',
            'MIME 和大小：判断格式是否符合上传入口要求。',
            '宽度、高度、时长和媒体类型：用于排查比例、视频时长和渲染问题。',
            '公开链接：只用于恢复和技术排查，不是运营扫表字段。',
          ],
          riskSignals: [
            'pending 或 failed 文件不能拿去发布模板或素材库。',
            '没有预览可能是格式不支持，也可能是上传还没完成。',
            '不要把存储 key 或长 URL 当作运营判断依据。',
          ],
        },
        {
          key: 'generation-jobs',
          title: '生成任务',
          purpose:
            '排查每一次生成从用户输入到最终结果的链路。它回答“用户点了什么、用了哪个模板、扣了多少算力、服务商返回什么错误、结果在哪里”。',
          dailyActions: [
            '按用户、商品、提示词、模板、状态或错误信息搜索。',
            '先对比输入预览和成品预览，再判断是素材问题还是服务商问题。',
            'queued、submitting、running 太久时，优先查 provider 和队列。',
            '失败任务要看是否预留或结算了算力，必要时到算力流水核对。',
          ],
          keyFields: [
            '输入预览：用户提交的图、视频或关键输入，排查质量问题先看这里。',
            '成品预览：生成成功后用户看到的结果。',
            '生成类型：图生视频、商品图、智能试衣等，用来定位对应工作台。',
            '状态：queued、submitting、running 是处理中，succeeded 成功，failed 失败。',
            '输入摘要：快速看商品名、提示词、模板 ID、画幅等，不替代原始素材。',
            '模板：关联生成配方，模板问题要回到模板 tab 修改。',
            '预留算力：这次生成占用的算力，余额争议要去算力流水核对。',
            '错误信息：provider 或系统返回的失败原因。',
          ],
          riskSignals: [
            '不要只看状态文字，必须结合输入预览、成品预览和错误信息。',
            '失败但扣费异常时，不能手动猜，要到算力流水查 delta 和 reason。',
            '模板、素材、provider、用户输入都可能导致失败，按链路逐步排查。',
          ],
        },
        {
          key: 'credit-ledger',
          title: '算力流水',
          purpose:
            '解释用户余额为什么变成现在这样。充值、预留、结算、退款、失败返还和人工调整都应该在这里形成流水。',
          dailyActions: [
            '按用户、任务、Stripe 事件、原因或日期筛选。',
            '从时间顺序看 delta 和 balanceAfter，解释余额变化。',
            '遇到支付问题，同时对照用户 tab 的当前余额和 Stripe 事件。',
            '人工调整、退款和大额变动要记录背景，方便后续追溯。',
          ],
          keyFields: [
            '用户：流水归属的账号。',
            '变动值 delta：正数增加算力，负数扣减算力。',
            '原因 reason：购买、预留、结算、退款、人工调整等业务原因。',
            '变动后余额 balanceAfter：这条流水完成后的余额。',
            '任务 ID、生成类型、任务状态和模板：解释生成扣费或返还。',
            'Stripe 事件 ID：支付对账用，缺失时要警惕人工或异常来源。',
            'metadata JSON：只在对账和技术排查时看。',
          ],
          riskSignals: [
            '流水不是普通表，不应随便编辑或删除。',
            '用户当前余额和最后一条流水对不上时，先停止答复，做对账。',
            '缺少 Stripe 事件、大额人工调整、重复扣费都需要复核。',
          ],
        },
        {
          key: 'help',
          title: '帮助',
          purpose:
            '帮助本身是后台使用说明，不是业务数据页。它应该告诉运营怎么填、怎么查、保存后去哪里验证。',
          dailyActions: [
            '进入帮助后先用左侧“帮助”下拉选择要操作的页面讲解。',
            '如果字段、按钮、权限或前台展示位置变了，同步更新对应说明。',
            '每次复盘把“踩坑点”写进发布前检查，不要只写在聊天记录里。',
          ],
          keyFields: [
            '帮助下拉：选择总览、模板、素材库、用户、媒体文件、生成任务或算力流水页面讲解。',
            '实操步骤：按真实后台动作排序。',
            '字段含义：说明字段为什么填、怎么填、影响哪里。',
            '发布前检查：记录容易误操作的地方。',
            '素材库字段示意图：对照上传弹窗看每个字段的位置。',
          ],
          riskSignals: [
            '帮助过期会直接造成误发布、误扣费解释或错误权限操作。',
            '不要写空泛原则，要写“点哪里、填什么、最后去哪看”。',
            '如果一句话不能指导运营完成动作，就应该改写。',
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
