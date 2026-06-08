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
    false: 'Não',
    garment: 'Roupa',
    generated_image: 'Imagem gerada',
    generated_video: 'Vídeo gerado',
    hidden: 'Oculto',
    inactive: 'Inativo',
    image_to_video: 'Imagem para vídeo',
    input: 'Entrada',
    member: 'Membro',
    model: 'Modelo',
    ops: 'Operações',
    ops_library_used: 'Biblioteca usada',
    output: 'Saída',
    pending: 'Pendente',
    purchase: 'Compra',
    published: 'Publicado',
    queued: 'Na fila',
    reference: 'Referência',
    rendering: 'Renderizando',
    reserve: 'Reserva',
    refund: 'Reembolso',
    running: 'Executando',
    submitting: 'Enviando',
    succeeded: 'Concluído',
    true: 'Sim',
    try_on: 'Provador',
    user_upload: 'Upload do usuário',
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
    false: 'No',
    garment: 'Garment',
    generated_image: 'Generated image',
    generated_video: 'Generated video',
    hidden: 'Hidden',
    inactive: 'Inactive',
    image_to_video: 'Image to video',
    input: 'Input',
    member: 'Member',
    model: 'Model',
    ops: 'Ops',
    ops_library_used: 'Library used',
    output: 'Output',
    pending: 'Pending',
    purchase: 'Purchase',
    published: 'Published',
    queued: 'Queued',
    reference: 'Reference',
    rendering: 'Rendering',
    reserve: 'Reserve',
    refund: 'Refund',
    running: 'Running',
    submitting: 'Submitting',
    succeeded: 'Succeeded',
    true: 'Yes',
    try_on: 'Try-on',
    user_upload: 'User upload',
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
    false: '否',
    garment: '服饰',
    generated_image: '生成图片',
    generated_video: '生成视频',
    hidden: '已隐藏',
    inactive: '停用',
    image_to_video: '图生视频',
    input: '输入',
    member: '成员',
    model: '模特',
    ops: '运营',
    ops_library_used: '使用官方素材',
    output: '输出',
    pending: '待处理',
    purchase: '充值',
    published: '已发布',
    queued: '排队中',
    reference: '参考',
    rendering: '渲染中',
    reserve: '预留',
    refund: '返还',
    running: '运行中',
    submitting: '提交中',
    succeeded: '成功',
    true: '是',
    try_on: '智能试衣',
    user_upload: '用户上传',
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
  reorder: string;
  orderModalTitle: string;
  orderDescription: string;
  saveOrder: string;
  orderEmpty: string;
  moveUp: string;
  moveDown: string;
  selectSavedTemplate: string;
  confirmDelete: (name: string) => string;
  columns: Record<string, string>;
  fields: Record<string, string>;
  categoryOptions: Record<string, string>;
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
  'user-media',
  'users',
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
    'users' | 'user-media' | 'generation-jobs' | 'credit-ledger',
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
      'user-media': 'Histórico do usuário',
      users: 'Usuários',
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
      'user-media': {
        title: 'Histórico do usuário',
        description:
          'Mídias privadas que usuários enviaram, geraram ou reutilizaram nos workbenches.',
        searchPlaceholder: 'Email, título, origem, fluxo...',
        columns: {
          preview: 'Preview',
          assetId: 'ID do material',
          title: 'Material',
          userEmail: 'Email do usuário',
          source: 'Origem',
          generationType: 'Fluxo',
          visibility: 'Visibilidade',
          usedCount: 'Uso',
          lastUsedAt: 'Último uso',
          updatedAt: 'Atualizado em',
        },
        fields: {
          previewUrl: 'Preview',
          previewMimeType: 'MIME do preview',
          mediaKind: 'Mídia',
          title: 'Título',
          userEmail: 'Email do usuário',
          userName: 'Nome do usuário',
          source: 'Origem',
          generationType: 'Fluxo',
          role: 'Papel',
          visibility: 'Visibilidade',
          isFavorite: 'Favorito',
          usedCount: 'Uso',
          libraryTitle: 'Material oficial vinculado',
          jobStatus: 'Status da geração',
          lastUsedAt: 'Último uso',
          createdAt: 'Criado em',
          updatedAt: 'Atualizado em',
        },
      },
      'generation-jobs': {
        title: 'Gerações',
        description:
          'Status de geração, entradas de prompt, créditos e campos de recuperação.',
        searchPlaceholder: 'Prompt, status, user...',
        columns: {
          id: 'gen_id',
          inputPreview: 'Entrada',
          finalPreview: 'Resultado',
          generationType: 'Tipo',
          inputSummary: 'Resumo',
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
          generationType: 'Tipo',
          status: 'Status',
          inputSummary: 'Resumo',
          headline: 'Título',
          sellingPoint: 'Diferencial',
          priceText: 'Texto de preço',
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
      description: 'Gerencie titulo, tipo, categoria, midias e prompt dos templates.',
      emptyText: 'Nenhum template.',
      searchPlaceholder: 'ID, titulo, tipo, categoria ou prompt...',
      create: 'Criar',
      modalCreate: 'Criar template',
      modalEdit: 'Editar template',
      modalDetails: 'Detalhes do template',
      currentAsset: 'Ativo atual',
      uploadAsset: 'Enviar ativo',
      tags: 'Tags',
      reorder: 'Ordenar',
      orderModalTitle: 'Ordenar templates',
      orderDescription:
        'A ordem vale apenas dentro do tipo e da categoria selecionados.',
      saveOrder: 'Salvar ordem',
      orderEmpty: 'Nenhum template neste tipo e categoria.',
      moveUp: 'Mover para cima',
      moveDown: 'Mover para baixo',
      selectSavedTemplate: 'Selecione um template salvo e um arquivo primeiro.',
      confirmDelete: (name) => `Excluir template ${name}?`,
      columns: {
        id: 'ID',
        title: 'Titulo',
        titleTranslations: 'Traducoes do titulo',
        type: 'Tipo',
        category: 'Categoria',
        sortOrder: 'Ordem',
        prompt: 'Prompt',
        updatedAt: 'Atualizado em',
      },
      fields: {
        id: 'ID',
        title: 'Titulo',
        type: 'Tipo',
        category: 'Categoria',
        thumbnailAssetId: 'ID do asset da miniatura',
        previewAssetId: 'ID do asset do preview',
        thumbnailUrl: 'URL da miniatura',
        previewUrl: 'URL do preview',
        prompt: 'Prompt',
        promptTranslations: 'Traducoes do prompt',
        sortOrder: 'Ordem',
      },
      categoryOptions: {
        image_to_image: 'Imagem',
        image_to_video: 'Imagem para vídeo',
      },
      errors: {
        load: 'Falha ao carregar',
        save: 'Falha ao salvar',
        upload: 'Falha no envio',
        delete: 'Falha ao excluir',
        loadOrder: 'Falha ao carregar ordem',
        saveOrder: 'Falha ao salvar ordem',
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
        assetId: 'ID do material',
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
        'Na primeira leitura, priorize IDs, status, data, usuário, custo e erro; previews ficam nos detalhes.',
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

Templates agora sao registros pequenos de imagem para video. A tabela de templates guarda type, categoria de negocio, thumbnail_asset_id, preview_asset_id, prompt e sort_order. A biblioteca da home reutiliza os mesmos registros do workbench de imagem para video, enquanto a API entrega URLs prontas para a interface.

## Onde operar e conferir

### Lista no Admin

![Admin template list](/admin-help/placements/template-admin-list.png)

- Use a busca para encontrar por id, type, category ou prompt antes de criar outro template parecido.
- A tabela mostra id, type, category, ordem, prompt e updated_at para decidir o que revisar primeiro.
- O botao Criar abre o formulario. Upload de preview fica dentro do detalhe ou edicao.
- O botao Ordenar abre a lista do type e category escolhidos para ajustar a sequencia visivel ao usuario.

### Formulario de criacao e edicao

![Admin template form](/admin-help/placements/template-admin-form.png)

- Preencha type, category, thumbnail_asset_id, preview_asset_id e prompt.
- type=image_to_video e o valor usado pela home e pelo workbench de video.
- category e a classificacao de negocio dentro desse type, por exemplo product, fashion ou food.
- sort_order e ajustado pela acao Ordenar e vale apenas dentro do mesmo type e category.
- Em templates ja salvos, envie ou selecione a miniatura e o preview para explicar o resultado esperado.

### Biblioteca de templates no frontend

![Frontend templates page](/admin-help/placements/templates-page.png)

- O usuario encontra templates por category e busca textual.
- A lista recebe thumbnailUrl da API e mostra a miniatura.
- O detalhe recebe previewUrl e prompt para mostrar o preview principal e preencher o workbench.

### Workbench de criacao

![Creation workbench template placement](/admin-help/placements/video-workbench.png)

- O workbench de video carrega os mesmos templates com type=image_to_video.
- Ao escolher um template, o prompt entra no campo editavel do usuario.
- O template salvo deve funcionar com uma imagem de produto real.

## Campos que a operacao precisa revisar

- ID: identificador gerado pelo sistema para links, tarefas e busca. Use para localizar um template em suporte ou investigacao.
- type: tipo de capacidade. Hoje a home e o workbench usam type=image_to_video.
- category: classificacao de negocio. Nao use category para representar pagina ou workbench.
- sort_order: ordem do template dentro do mesmo type e category; a API aplica a ordem na lista, mas nao publica esse campo.
- thumbnail_asset_id: asset da miniatura da lista; a API publica como thumbnailUrl.
- preview_asset_id: asset do video ou imagem principal; a API de detalhe publica como previewUrl.
- prompt: instrucao real de geracao; nao publique texto temporario.
- created_at e updated_at: auditoria basica de criacao e ultima alteracao.

## Checklist

- Nao crie duplicado sem buscar por id, category e prompt.
- Nao deixe template sem preview compreensivel quando ele for importante para navegacao.
- O prompt precisa bater com a geracao real.
- Depois de salvar, confira a biblioteca de templates e o workbench de video.`,
          purpose:
            'Manter templates mínimos de imagem para vídeo usados pela home e pelo workbench de vídeo.',
          dailyActions: [
            'Criar, editar e ordenar templates por type e category.',
            'Enviar ou selecionar miniatura e preview para explicar o resultado.',
            'Conferir a biblioteca da home e o workbench de vídeo depois de salvar.',
          ],
          keyFields: [
            'id, type, category, sort_order, created_at e updated_at.',
            'thumbnail_asset_id e preview_asset_id.',
            'prompt.',
          ],
          riskSignals: [
            'type errado faz o template sumir da home e do workbench de vídeo.',
            'Template sem preview claro reduz confiança do usuário.',
            'category muito genérica dificulta a navegação.',
          ],
        },
        {
          key: 'library-assets',
          title: 'Biblioteca',
          markdown: `# Biblioteca

## Uso

Ativos da biblioteca sao midias reutilizaveis. O upload cria o registro no Admin; a categoria define em qual workbench o material aparece.

## Fluxo de operacao

- Envie PNG, JPG, WEBP, MP4 ou WEBM.
- Confira o preview antes de salvar.
- Revise titulo, categoria, descricao e peso de ordenacao.
- Salve e confira o material no workbench da categoria escolhida.

## Onde o usuario ve

### Workbench de video

![Video workbench material placement](/admin-help/placements/library-video-key.png)

- Caminho: workspace de criacao, aba de video.
- O usuario ve: botoes de referencia e material para compor o video.
- O operador confere: categoria de video, preview claro e midia pronta para ser usada.

### Workbench de produto

![Apparel workbench material placement](/admin-help/placements/library-apparel-key.png)

- Caminho: workspace de produto, botao de escolher da biblioteca.
- O usuario ve: materiais de produto reutilizaveis para iniciar a composicao.
- O operador confere: clareza, proporcao e se a categoria e produto.

### Workbench de prova virtual

![Try-on workbench material placement](/admin-help/placements/library-try-on-key.png)

- Caminho: workspace de prova virtual, area de modelo, roupa e material.
- O usuario ve: modelos, roupas ou exemplos disponiveis para selecionar.
- O operador confere: se o material esta na categoria correta.

## Checklist

- A categoria errada coloca midia na pagina errada.
- Video precisa de poster ou thumbnail real antes de entrar em grid de imagem.
- Para tirar do frontend, remova o registro da biblioteca.`,
          purpose:
            'Gerenciar mídias reutilizáveis de produto, modelo, peça, cena e exemplos que alimentam os workbenches.',
          dailyActions: [
            'Enviar arquivo, conferir preview e completar metadados básicos.',
            'Ajustar categoria, descrição e peso de ordenação.',
            'Remover materiais obsoletos quando não devem aparecer no frontend.',
          ],
          keyFields: [
            'ID do material, título, categoria e descrição.',
            'Peso de ordenação e uso.',
            'Preview, URL do ativo e metadados de mídia nos detalhes.',
          ],
          riskSignals: [
            'Vídeos precisam de tratamento próprio e não devem virar imagem quebrada.',
            'Categoria incorreta coloca material no workbench errado.',
            'Materiais obsoletos devem ser removidos da biblioteca.',
          ],
        },
        {
          key: 'user-media',
          title: 'Histórico do usuário',
          purpose:
            'Consultar mídias privadas que usuários enviaram, geraram ou reutilizaram, sem operar a tabela técnica de assets.',
          dailyActions: [
            'Buscar por email, título, origem ou fluxo antes de responder suporte.',
            'Abrir detalhes para conferir preview, origem, visibilidade e último uso.',
            'Ocultar ou remover do histórico quando houver pedido de suporte ou material inválido.',
          ],
          keyFields: [
            'ID do material, usuário, título, origem e fluxo.',
            'Visibilidade, favorito, uso e último uso.',
            'Material oficial vinculado e status da geração nos detalhes.',
          ],
          riskSignals: [
            'Este histórico é dado privado de usuário; não use cache público nem trate como catálogo oficial.',
            'Excluir no Admin deve ser soft delete por visibilidade.',
            'A tabela assets é apenas base técnica; operação deve usar Biblioteca ou Histórico do usuário.',
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
          key: 'generation-jobs',
          title: 'Gerações',
          purpose:
            'Investigar cada geração do input ao resultado, incluindo status, template, custo e erro do provider.',
          dailyActions: [
            'Pesquisar por produto, prompt, template, status, usuário ou erro.',
            'Abrir detalhes para comparar preview de entrada e resultado antes de diagnosticar.',
            'Acompanhar filas, execuções longas e falhas recentes.',
          ],
          keyFields: [
            'gen_id, tipo, status e resumo.',
            'Input e resultado ficam nos detalhes.',
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
      'user-media': 'User History',
      users: 'Users',
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
      'user-media': {
        title: 'User History',
        description:
          'Private media users uploaded, generated, or reused in workbenches.',
        searchPlaceholder: 'Email, title, source, flow...',
        columns: {
          preview: 'Preview',
          assetId: 'Material ID',
          title: 'Material',
          userEmail: 'User email',
          source: 'Source',
          generationType: 'Flow',
          visibility: 'Visibility',
          usedCount: 'Uses',
          lastUsedAt: 'Last used',
          updatedAt: 'Updated At',
        },
        fields: {
          previewUrl: 'Preview',
          previewMimeType: 'Preview MIME',
          mediaKind: 'Media',
          title: 'Title',
          userEmail: 'User email',
          userName: 'User name',
          source: 'Source',
          generationType: 'Flow',
          role: 'Role',
          visibility: 'Visibility',
          isFavorite: 'Favorite',
          usedCount: 'Uses',
          libraryTitle: 'Linked official material',
          jobStatus: 'Generation status',
          lastUsedAt: 'Last used',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
      },
      'generation-jobs': {
        title: 'Generation Jobs',
        description:
          'Generation status, prompt inputs, credits, and recovery fields.',
        searchPlaceholder: 'Prompt, status, user...',
        columns: {
          id: 'gen_id',
          inputPreview: 'Input',
          finalPreview: 'Result',
          generationType: 'Type',
          inputSummary: 'Input Summary',
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
          generationType: 'Type',
          status: 'Status',
          inputSummary: 'Input summary',
          headline: 'Headline',
          sellingPoint: 'Selling point',
          priceText: 'Price text',
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
      description: 'Manage template title, type, category, media, and prompt.',
      emptyText: 'No templates.',
      searchPlaceholder: 'ID, title, type, category, or prompt...',
      create: 'Create',
      modalCreate: 'Create template',
      modalEdit: 'Edit template',
      modalDetails: 'Template details',
      currentAsset: 'Current asset',
      uploadAsset: 'Upload asset',
      tags: 'Tags',
      reorder: 'Reorder',
      orderModalTitle: 'Template order',
      orderDescription:
        'Order only applies inside the selected type and category.',
      saveOrder: 'Save order',
      orderEmpty: 'No templates in this type and category.',
      moveUp: 'Move up',
      moveDown: 'Move down',
      selectSavedTemplate: 'Select a saved template and a file first.',
      confirmDelete: (name) => `Delete template ${name}?`,
      columns: {
        id: 'ID',
        title: 'Title',
        titleTranslations: 'Title translations',
        type: 'Type',
        category: 'Category',
        sortOrder: 'Order',
        prompt: 'Prompt',
        updatedAt: 'Updated At',
      },
      fields: {
        id: 'ID',
        title: 'Title',
        type: 'Type',
        category: 'Category',
        thumbnailAssetId: 'Thumbnail asset ID',
        previewAssetId: 'Preview asset ID',
        thumbnailUrl: 'Thumbnail URL',
        previewUrl: 'Preview URL',
        prompt: 'Prompt',
        promptTranslations: 'Prompt translations',
        sortOrder: 'Order',
      },
      categoryOptions: {
        image_to_image: 'Image',
        image_to_video: 'Image to video',
      },
      errors: {
        load: 'Load failed',
        save: 'Save failed',
        upload: 'Upload failed',
        delete: 'Delete failed',
        loadOrder: 'Order could not be loaded',
        saveOrder: 'Order could not be saved',
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
        assetId: 'Material ID',
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
        'For first-pass scanning, prioritize IDs, status, date, user, cost, and error; previews belong in details.',
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
            'Use Library Assets to surface reusable media and remove duplicates.',
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
        'Update Help whenever a tab gains a field, filter, permission, or operating rule.',
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

Templates are now small image-to-video records. The templates table stores type, business category, thumbnail_asset_id, preview_asset_id, prompt, and sort_order. The homepage template library reuses the same records as the image-to-video workbench, while the API returns ready-to-render URLs.

## Where to operate and verify

### Admin list

![Admin template list](/admin-help/placements/template-admin-list.png)

- Search by id, type, category, or prompt before creating another similar template.
- The table shows id, type, category, order, prompt, and updated_at so operators can decide what to review first.
- Create opens the form. Preview uploads happen from detail or edit views.
- Reorder opens the selected type and category so operators can adjust the visible sequence.

### Create and edit form

![Admin template form](/admin-help/placements/template-admin-form.png)

- Fill type, category, thumbnail_asset_id, preview_asset_id, and prompt.
- type=image_to_video is the value used by the homepage and video workbench.
- category is the business classification inside that type, for example product, fashion, or food.
- sort_order is changed through Reorder and only applies inside the same type and category.
- For saved templates, upload or select thumbnail and preview media to explain the expected result.

### Frontend template library

![Frontend templates page](/admin-help/placements/templates-page.png)

- Users find templates through category and text search.
- The list API returns thumbnailUrl for the card thumbnail.
- The detail API returns previewUrl and prompt for the main preview and workbench fill.

### Creation workbench

![Creation workbench template placement](/admin-help/placements/video-workbench.png)

- The video workbench loads the same templates with type=image_to_video.
- When a user chooses a template, the prompt fills the editable prompt field.
- The saved template must work with a real product image.

## Fields operators need to review

- ID: system-generated identifier for links, tasks, and search. Use it to locate a template in support or investigation.
- type: capability type. Today the homepage and workbench use type=image_to_video.
- category: business classification. Do not use category to represent a page or workbench.
- sort_order: order inside the same type and category; the API applies it to list results but does not publish the field.
- thumbnail_asset_id: asset used for the list thumbnail; the API publishes it as thumbnailUrl.
- preview_asset_id: asset used for the main video or image; the detail API publishes it as previewUrl.
- prompt: real generation instruction; do not publish placeholder text.
- created_at and updated_at: basic creation and last-edit audit.

## Checklist

- Do not create a duplicate without searching by id, category, and prompt.
- Do not leave important browsing templates without understandable preview media.
- The prompt must match the real generation flow.
- After saving, check the frontend template library and the video workbench.`,
          purpose:
            'Maintain minimal image-to-video templates used by the homepage and video workbench.',
          dailyActions: [
            'Create, edit, and reorder templates by type and category.',
            'Upload or select thumbnail and preview media to explain the result.',
            'Check the homepage library and video workbench after saving.',
          ],
          keyFields: [
            'id, type, category, sort_order, created_at, and updated_at.',
            'thumbnail_asset_id and preview_asset_id.',
            'prompt.',
          ],
          riskSignals: [
            'Wrong type makes the template disappear from the homepage and video workbench.',
            'A template without clear preview media lowers user confidence.',
            'A vague category makes browsing harder.',
          ],
        },
        {
          key: 'library-assets',
          title: 'Library Assets',
          markdown: `# Library Assets

## Purpose

Library assets are reusable media. Uploading creates the Admin record; the category decides which workbench shows the material.

## Operating flow

- Upload a PNG, JPG, WEBP, MP4, or WEBM file.
- Check the preview before saving.
- Review title, category, description, and sort weight.
- Save and check the material in the selected category's workbench.

## Where users see it

### Video workbench

![Video workbench material placement](/admin-help/placements/library-video-key.png)

- Path: creation workspace, video tab.
- Users see: reference buttons and reusable material for composing a video.
- Operators check: video category, clear preview, and usable media.

### Product image workbench

![Apparel workbench material placement](/admin-help/placements/library-apparel-key.png)

- Path: product image workspace, choose-from-library entry.
- Users see: reusable product materials for starting a composition.
- Operators check: clarity, ratio, and product-image category.

### Try-on workbench

![Try-on workbench material placement](/admin-help/placements/library-try-on-key.png)

- Path: try-on workspace, model, garment, and material areas.
- Users see: selectable models, garments, or examples.
- Operators check: correct category.

## Checklist

- A wrong category places media on the wrong page.
- Video needs a real poster or thumbnail before entering image grids.
- Remove obsolete materials from the library when they should leave the frontend.`,
          purpose:
            'Manage reusable product, model, garment, scene, and example media that feed the workbenches.',
          dailyActions: [
            'Upload the file, check the preview, and complete core metadata.',
            'Set category, description, and sort weight.',
            'Remove outdated materials when they should not appear on the frontend.',
          ],
          keyFields: [
            'Material ID, title, category, and description.',
            'Sort weight and usage count.',
            'Preview, asset URL, and media metadata in the detail view.',
          ],
          riskSignals: [
            'Videos need their own handling and should not render as broken images.',
            'A wrong category places material on the wrong workbench.',
            'Outdated materials should be removed from the library.',
          ],
        },
        {
          key: 'user-media',
          title: 'User History',
          purpose:
            'Inspect private media that users uploaded, generated, or reused without operating the technical assets table.',
          dailyActions: [
            'Search by email, title, source, or generation flow before answering support.',
            'Open details to check preview, source, visibility, and last use.',
            'Hide or remove history entries when support requests it or the material is invalid.',
          ],
          keyFields: [
            'Material ID, user, title, source, and generation flow.',
            'Visibility, favorite flag, usage count, and last use.',
            'Linked official library material and generation status in details.',
          ],
          riskSignals: [
            'This history is private user data; do not cache it publicly or treat it as the official catalog.',
            'Deleting from Admin should be a soft delete through visibility.',
            'The assets table is only the technical substrate; operators should use Library Assets or User History.',
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
          key: 'generation-jobs',
          title: 'Generation Jobs',
          purpose:
            'Investigate each generation from input to result, including status, template, cost, and provider error.',
          dailyActions: [
            'Search by product, prompt, template, status, user, or error.',
            'Open details to compare input and result previews before diagnosing.',
            'Watch queues, long-running jobs, and recent failures.',
          ],
          keyFields: [
            'gen_id, type, status, and summary.',
            'Input and result previews live in the detail view.',
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
      'user-media': '用户历史素材',
      users: '用户',
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
      'user-media': {
        title: '用户历史素材',
        description:
          '管理用户上传、生成或复用过的私有历史素材。',
        searchPlaceholder: '搜索邮箱、标题、来源、流程...',
        columns: {
          preview: '预览',
          assetId: '素材 ID',
          title: '素材',
          userEmail: '用户邮箱',
          source: '来源',
          generationType: '流程',
          visibility: '可见性',
          usedCount: '使用次数',
          lastUsedAt: '最近使用',
          updatedAt: '更新时间',
        },
        fields: {
          previewUrl: '预览',
          previewMimeType: '预览 MIME',
          mediaKind: '媒体',
          title: '标题',
          userEmail: '用户邮箱',
          userName: '用户姓名',
          source: '来源',
          generationType: '流程',
          role: '角色',
          visibility: '可见性',
          isFavorite: '收藏',
          usedCount: '使用次数',
          libraryTitle: '关联官方素材',
          jobStatus: '生成状态',
          lastUsedAt: '最近使用',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
      },
      'generation-jobs': {
        title: '生成任务',
        description: '查看生成状态、提示词输入、算力消耗和恢复字段。',
        searchPlaceholder: '搜索提示词、状态或用户...',
        columns: {
          id: 'gen_id',
          inputPreview: '输入图',
          finalPreview: '成品',
          generationType: '类型',
          inputSummary: '输入摘要',
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
          generationType: '类型',
          status: '状态',
          inputSummary: '输入摘要',
          headline: '标题',
          sellingPoint: '卖点',
          priceText: '价格文案',
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
      description: '管理模板的标题、类型、类目、媒体和提示词。',
      emptyText: '暂无模板。',
      searchPlaceholder: '搜索 ID、标题、类型、类目或提示词...',
      create: '创建',
      modalCreate: '创建模板',
      modalEdit: '编辑模板',
      modalDetails: '模板详情',
      currentAsset: '当前素材',
      uploadAsset: '上传素材',
      tags: '标签',
      reorder: '调整顺序',
      orderModalTitle: '模板顺序',
      orderDescription:
        '顺序只在当前选择的类型和类目内生效，不会影响其他类型或类目。',
      saveOrder: '保存顺序',
      orderEmpty: '当前类型和类目下暂无模板。',
      moveUp: '上移',
      moveDown: '下移',
      selectSavedTemplate: '请先选择已保存的模板和文件。',
      confirmDelete: (name) => `确认删除模板 ${name}？`,
      columns: {
        id: 'ID',
        title: '标题',
        titleTranslations: '标题翻译',
        type: '类型',
        category: '类目',
        sortOrder: '顺序',
        prompt: '提示词',
        updatedAt: '更新时间',
      },
      fields: {
        id: 'ID',
        title: '标题',
        type: '类型',
        category: '类目',
        thumbnailAssetId: '缩略图素材 ID',
        previewAssetId: '预览素材 ID',
        thumbnailUrl: '缩略图 URL',
        previewUrl: '预览 URL',
        prompt: '提示词',
        promptTranslations: '提示词翻译',
        sortOrder: '顺序',
      },
      categoryOptions: {
        image_to_image: '图片',
        image_to_video: '图生视频',
      },
      errors: {
        load: '加载失败',
        save: '保存失败',
        upload: '上传失败',
        delete: '删除失败',
        loadOrder: '加载顺序失败',
        saveOrder: '保存顺序失败',
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
        assetId: '素材 ID',
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
        '模板和素材都按类别进入对应工作台；素材库只维护类别和基础信息。',
        '遇到问题时按链路排查：模板决定创作入口，素材库提供可复用媒体，媒体文件确认上传状态，生成任务确认执行结果，算力流水解释余额。',
      ],
      rhythmTitle: '推荐运营节奏',
      rhythms: [
        {
          title: '上新前',
          items: [
            '先准备模板或素材的预览，再补字段；保存后到对应工作台验证。',
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
            '过期模板先降低排序或删除前确认历史排查需求；过期素材从素材库移除。',
            '把重复踩坑补进对应 tab 的风险信号。',
          ],
        },
      ],
      maintenanceTitle: '这个栏目怎么维护',
      maintenance: [
        '新增字段时同步写清楚字段含义、必填场景、错误后果和最终展示位置。',
        '新增上传、删除等动作时，用步骤写法更新，不写抽象原则。',
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

本文用于指导运营在管理后台维护模板。模板是用户选择创作方向的入口：它告诉用户适合什么商品和场景、预期生成什么效果，并把默认提示词带到图生视频工作台。

### 注意事项

- 先从用户视角判断模板：用户能不能一眼看懂用途、预览效果和适合的商品场景。
- 模板保存后要按用户路径检查：先看前台模板库页面是否方便发现和理解，再看对应创作工作台能否正确选择并生成。
- type 决定模板能力类型；category 是业务分类，不表示页面或工作台入口。
- 缩略图和主预览都来自 assets 表，模板表只保存 thumbnail_asset_id 和 preview_asset_id。
- sort_order 控制同一个 type 和 category 下的展示顺序，通过“调整顺序”维护。
- API 对前台输出 thumbnailUrl、previewUrl 和 prompt，前台不直接依赖模板表里的 asset id。

## 二、系统整体界面介绍

### 系统登录与入口

- 系统 URL：使用管理员提供的后台域名进入系统。
- 登录方式：使用管理员账号登录后进入管理后台。
- 功能入口：左侧菜单选择“管理后台 > 模板”。
- 前台验证位置：首页模板库、前台模板库页面，以及图生视频创作工作台。

### 模板管理列表页面介绍

![模板管理列表页](/admin-help/placements/template-admin-list.png)

模板管理列表页是运营每天查找、创建、排序和复核模板的入口。截图里本地环境暂无模板，但页面结构就是线上运营要看的结构：搜索框用于按 id、type、category 或 prompt 定位模板；“创建”用于新增模板；“调整顺序”用于维护当前 type 和 category 下的模板展示顺序；列表列位用于快速判断模板类型、业务类目、顺序、提示词和 updated_at；操作列用于查看、编辑、上传预览媒体或删除。

运营在列表页先看三件事：是否已经有相似模板、type 是否是当前要展示的能力、category 是否是清晰的业务分类。不要把 category 当成页面或工作台入口，首页模板库和图生视频工作台复用 type=image_to_video 这一批模板。

### 模板编辑表单页面介绍

![模板编辑表单](/admin-help/placements/template-admin-form.png)

模板编辑表单维护 type、category、thumbnail_asset_id、preview_asset_id 和 prompt。缩略图和主预览必须先作为 assets 上传或被选择，再由模板引用对应 asset id。排序不在单个编辑表单里改，通过列表上的“调整顺序”按 type/category 分组保存。

### 前台模板库页面介绍

![前台模板库页面](/admin-help/placements/templates-page.png)

前台模板库是用户浏览图生视频模板的页面。运营保存后要检查 category 是否容易理解、列表 API 输出的 thumbnailUrl 是否能作为卡片缩略图、详情 API 输出的 previewUrl 是否能展示主视频或主图、prompt 是否能说明生成方向。这里主要验证“用户能不能发现并理解模板”。

### 创作工作台页面介绍

![创作工作台模板入口](/admin-help/placements/video-workbench.png)

创作工作台验证模板是否真的能用于生成。当前模板表只在首页模板库和图生视频工作台展示，两处都读取 type=image_to_video。用户选择模板后，prompt 会进入可编辑输入框，用户仍然可以继续改写。

## 三、功能介绍

### 创建和编辑模板

- 新建模板时填写 type、category、thumbnail_asset_id、preview_asset_id 和 prompt。
- type 控制能力类型；当前首页模板库和图生视频都用 type=image_to_video。
- category 是业务分类，例如 product、fashion、food。
- sort_order 由“调整顺序”维护，只在同一个 type 和 category 下生效。
- 需要解释效果时，上传或选择缩略图 asset 和 preview asset。
- 模板保存后要按用户路径检查：首页模板库能看到，图生视频工作台能选中并带入 prompt。

### 字段说明

- ID：系统生成的模板唯一标识，用于跳转、任务记录和定位。创建后自动产生，运营复制给技术或客服定位即可。
- type：能力类型。当前首页模板库和图生视频工作台都读取 type=image_to_video。
- category：业务分类。category 是业务分类，不表示首页、工作台或展示位置。
- sort_order：同一个 type 和 category 内的模板顺序。前台列表会应用这个顺序，但不会展示这个字段。
- thumbnail_asset_id：卡片缩略图对应的 assets.id，列表 API 会输出为 thumbnailUrl。
- preview_asset_id：模板主预览对应的 assets.id，详情 API 会输出为 previewUrl。
- prompt：真实生成提示词，是模板效果的核心。不能只写展示文案，必须能指导真实生成。
- created_at 和 updated_at：创建和更新时间，用于判断最近是否有人改动。

### 保存和验证模板

- 保存前检查 type、category、thumbnail_asset_id、preview_asset_id 和 prompt 是否完整。
- 调整顺序前先确认 type 和 category，保存后只影响这一组模板。
- 保存后到首页模板库和图生视频工作台验证是否出现。
- 过期或错误模板可以删除；删除前确认没有还需要排查的历史任务。

## 四、业务操作指引

### 如何管理模板

新增模板：进入“模板”页面，点击创建，填写 type、category、thumbnail_asset_id、preview_asset_id 和 prompt，并确认两个 asset 都已上传完成。新模板会追加到当前 type/category 的末尾。

查询模板：通过 id、type、category 或 prompt 查找模板。找不到时先确认是否应该是 type=image_to_video。

修改模板：先判断要改的是媒体还是生成提示。媒体通常替换 thumbnail_asset_id 或 preview_asset_id；生成效果通常修改 prompt；归类问题修改 category。

调整模板顺序：点击“调整顺序”，选择 type 和 category，用上移/下移调整列表，再保存顺序。不要跨 type 或 category 排序。

删除模板：删除前确认模板不是当前活动入口，也不会影响历史任务排查。

保存后验证：保存后先看前台模板库是否能被搜索和按 category 筛选到，再进入图生视频工作台检查模板入口和默认 prompt 是否正确。`,
          purpose:
            '维护首页模板库和图生视频工作台共用的最小模板记录。',
          dailyActions: [
            '点击“创建”维护模板内容，点击“调整顺序”维护同一 type/category 下的展示顺序。',
            '进入已保存模板，上传或选择缩略图和主预览，让用户能看懂结果预期。',
            '保存后到首页模板库和图生视频工作台查看模板是否出现。',
          ],
          keyFields: [
            'ID：系统生成的模板唯一标识，用于跳转、任务记录和定位。',
            'type 和 category：type 是能力类型，category 是业务分类。',
            'sort_order：同一 type/category 下的展示顺序。',
            'thumbnail_asset_id 和 preview_asset_id：分别引用卡片缩略图和主预览 asset。',
            'prompt：真正给生成流程使用的默认提示词。',
            'created_at 和 updated_at：用于判断创建和最近修改时间。',
          ],
          riskSignals: [
            'type 填错会让模板从首页模板库和图生视频工作台消失。',
            '没有清晰预览的模板不要作为主推入口，用户不知道会生成什么。',
            'category 太泛会让用户难以按业务类目浏览。',
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
- 文件上传成功后，类别会决定素材进入哪个工作台。
- 视频素材进入图片格子前需要真实封面或缩略图。

## 二、系统整体界面介绍

### 系统登录与入口

- 系统 URL：使用管理员提供的后台域名进入系统。
- 登录方式：使用管理员账号登录后进入管理后台。
- 功能入口：左侧菜单选择“管理后台 > 素材库”。
- 前台验证位置：图生视频、商品图、智能试衣等创作工作台。

### 素材库页面介绍

素材库页面用于上传、编辑和删除媒体素材。运营在这里维护文件预览、标题、类别、描述和排序权重。

- 上传与预览：上传 PNG、JPG、WEBP、MP4 或 WEBM 后，先确认预览是否正常。
- 基础信息：标题、类别、描述。
- 类别：决定素材会进入图生视频、商品图还是智能试衣。
- 运营管理：排序权重和使用量。

### 图生视频工作台页面介绍

![图生视频工作台素材位置](/admin-help/placements/library-video-key.png)

- 打开位置：创作工作台里的“图生视频”。
- 用户看到：出镜商品、出镜模特、参考素材等可选入口。
- 运营检查：类别是图生视频，预览清楚，素材可以直接用于生成。

### 商品图工作台页面介绍

![商品图工作台素材位置](/admin-help/placements/library-apparel-key.png)

- 打开位置：创作工作台里的“商品图”。
- 用户看到：“从素材库选择”入口，用已有商品素材开始制作。
- 运营检查：图片清晰，比例适合商品图，标题能帮助用户理解素材。

### 智能试衣工作台页面介绍

![智能试衣工作台素材位置](/admin-help/placements/library-try-on-key.png)

- 打开位置：创作工作台里的“智能试衣”。
- 用户看到：模特、服饰和参考素材的选择入口。
- 运营检查：类别是智能试衣，素材能作为模特、服饰或参考素材使用。

## 三、功能介绍

### 上传素材

- 点击新增素材，选择 PNG、JPG、WEBP、MP4 或 WEBM 文件。
- 上传后先看预览。预览打不开、主体被裁切、清晰度不足时，不要保留在素材库。
- 系统可能根据文件名自动猜标题和类别，运营需要复核。

### 编辑素材信息

- 标题：使用运营能看懂的名称，不要只保留乱码文件名。
- 描述：说明适合什么商品、场景、风格或限制。

### 设置类别

- image_to_video：素材会用于图生视频相关入口。
- apparel_image：素材会用于商品图相关入口。
- try_on：素材会用于智能试衣相关入口。
- 类别选错会让素材出现在错误页面。

### 管理排序

- 排序权重：同类素材的人工排序加权，活动主推可以调高，活动结束后要复原。
- 使用量：详情里查看素材被使用的统计值；当前不是手工填写字段。

## 四、业务操作指引

### 如何管理素材库

新增素材：进入“素材库”页面，点击新增素材，上传文件，确认预览正常，再填写标题、类别和描述。

查询素材：通过标题、类别、MIME 或素材 ID 查找素材。前台找不到素材时，先检查底层媒体是否 uploaded、类别是否选对。

修改素材：需要调整展示时，修改标题、描述和排序权重；需要调整出现位置时，修改类别。

删除或下架素材：确认不需要前台展示时，直接从素材库删除记录。

保存后验证：保存后进入对应工作台检查素材是否出现。图生视频看视频素材入口，商品图看“从素材库选择”，智能试衣看模特、服饰和参考素材入口。`,
          purpose:
            '上传和管理可复用媒体素材。新上传保存后就是 Admin 里的素材记录，并按“类别”出现在对应工作台：图生视频、商品图或智能试衣。',
          dailyActions: [
            '进入“素材库”，点击“新增素材”，先选择 PNG、JPG、WEBP、MP4 或 WEBM 文件。',
            '看左侧预览是否正常。预览不正常时先换文件或查媒体文件状态。',
            '系统会根据文件名自动猜标题和类别，但运营需要复核。',
            '补标题、类别和描述，必要时展开高级字段补排序权重。',
            '保存后到对应工作台检查：image_to_video 看 /create/video，apparel_image 看 /create/apparel，try_on 看 /create/try-on。',
          ],
          keyFields: [
            '上传文件：真正写入 R2 的原始媒体。支持图片和视频；文件决定预览、MIME、大小、尺寸、时长。',
            '预览：第一检查点。看不清、打不开、比例明显不对时不要保留。',
            '标题：运营可读名称，会用于 Admin 搜索和前台素材列表理解，不能只写文件名乱码。',
            '类别：image_to_video 出现在图生视频；apparel_image 出现在商品图；try_on 出现在智能试衣。',
            '描述：说明适合什么商品、场景、风格或限制，帮助运营二次筛选。',
            '排序权重：同类素材的人工排序加权，活动主推可以调高，活动结束要复原。',
          ],
          riskSignals: [
            '类别选错会让素材出现在错误工作台。',
            '视频素材不要当图片素材使用，否则前台可能没有图片缩略图。',
            '低清晰度、主体被裁切、商品和模特不适配的素材不要保留在素材库。',
            '素材标题、类别和描述不清楚时，用户会难以判断能不能使用。',
          ],
        },
        {
          key: 'user-media',
          title: '用户历史素材',
          purpose:
            '查看用户自己上传、生成或复用过的私域素材记录。这里回答“某个用户历史里有什么、来源是什么、是否还可见”，不再让运营直接操作底层 assets 表。',
          dailyActions: [
            '客服排查前先按邮箱、标题、来源或生成类型搜索，确认是同一个用户的素材。',
            '打开详情看预览、来源、可见性和最后使用时间，再判断是上传问题、生成问题还是素材复用问题。',
            '用户要求隐藏或素材明显无效时，通过可见性做软删除，不要误动官方素材库。',
          ],
          keyFields: [
            '素材 ID、用户、标题、来源和生成类型：快速确认素材是谁的、从哪里来的。',
            '预览只在详情里看，避免列表页加载大量图片。',
            '可见性、收藏、使用次数和最后使用时间：判断素材是否还在用户历史里活跃。',
            '关联运营素材和生成任务状态：在详情里定位是否来自官方素材库或某次生成。',
          ],
          riskSignals: [
            '用户历史素材是用户私域数据，不能按官方素材库缓存或展示。',
            'Admin 删除应落到可见性的软删除，避免误删底层文件和其他引用。',
            'assets 表只是技术底座；运营日常只看“运营素材库”和“用户历史素材”。',
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
          key: 'generation-jobs',
          title: '生成任务',
          purpose:
            '排查每一次生成从用户输入到最终结果的链路。它回答“用户点了什么、用了哪个模板、扣了多少算力、服务商返回什么错误、结果在哪里”。',
          dailyActions: [
            '按用户、商品、提示词、模板、状态或错误信息搜索。',
            '打开详情对比输入预览和成品预览，再判断是素材问题还是服务商问题。',
            'queued、submitting、running 太久时，优先查 provider 和队列。',
            '失败任务要看是否预留或结算了算力，必要时到算力流水核对。',
          ],
          keyFields: [
            'gen_id：列表首列，用来定位具体生成任务。',
            '输入预览：详情里看用户提交的图、视频或关键输入。',
            '成品预览：详情里看生成成功后用户看到的结果。',
            '生成类型：图生视频、商品图、智能试衣等，用来定位对应工作台。',
            '状态：queued、submitting、running 是处理中，succeeded 成功，failed 失败。',
            '输入摘要：快速看商品名、提示词、模板 ID、画幅等，不替代原始素材。',
            '模板：关联生成配方，模板问题要回到模板 tab 修改。',
            '预留算力：这次生成占用的算力，余额争议要去算力流水核对。',
            '错误信息：provider 或系统返回的失败原因。',
          ],
          riskSignals: [
            '不要只看状态文字，必须进入详情结合输入预览、成品预览和错误信息。',
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
