import {
  normalizeDashboardLocale,
  type DashboardLocale,
} from '@/lib/dashboard/content';

export type AdminLocale = DashboardLocale;

export const adminStatusLabels: Record<AdminLocale, Record<string, string>> = {
  pt: {
    active: 'Ativo',
    admin: 'Admin',
    archived: 'Arquivado',
    deleted: 'Excluído',
    draft: 'Rascunho',
    failed: 'Falhou',
    inactive: 'Inativo',
    member: 'Membro',
    ops: 'Operações',
    pending: 'Pendente',
    published: 'Publicado',
    queued: 'Na fila',
    rendering: 'Renderizando',
    running: 'Executando',
    submitting: 'Enviando',
    succeeded: 'Concluído',
    uploaded: 'Enviado',
  },
  en: {
    active: 'Active',
    admin: 'Admin',
    archived: 'Archived',
    deleted: 'Deleted',
    draft: 'Draft',
    failed: 'Failed',
    inactive: 'Inactive',
    member: 'Member',
    ops: 'Ops',
    pending: 'Pending',
    published: 'Published',
    queued: 'Queued',
    rendering: 'Rendering',
    running: 'Running',
    submitting: 'Submitting',
    succeeded: 'Succeeded',
    uploaded: 'Uploaded',
  },
  zh: {
    active: '活跃',
    admin: '管理员',
    archived: '已归档',
    deleted: '已删除',
    draft: '草稿',
    failed: '失败',
    inactive: '停用',
    member: '成员',
    ops: '运营',
    pending: '待处理',
    published: '已发布',
    queued: '排队中',
    rendering: '渲染中',
    running: '运行中',
    submitting: '提交中',
    succeeded: '成功',
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
  searchPlaceholder?: string;
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
  modalCreate: string;
  modalEdit: string;
  modalDetails: string;
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

export type AdminContent = {
  common: AdminCommonCopy;
  shell: {
    title: string;
    forbiddenTitle: string;
    forbiddenDescription: string;
  };
  tabs: Record<string, string>;
  management: Record<
    'users' | 'assets' | 'generation-jobs' | 'credit-ledger',
    AdminManagementCopy
  >;
  templates: AdminTemplatesCopy;
  libraryAssets: AdminLibraryCopy;
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
      templates: 'Templates',
      'library-assets': 'Biblioteca',
      users: 'Usuários',
      assets: 'Arquivos',
      'generation-jobs': 'Gerações',
      'credit-ledger': 'Créditos',
    },
    management: {
      users: {
        title: 'Usuários',
        description:
          'Estado da conta, créditos, assinatura e controles de função.',
        searchPlaceholder: 'Buscar email ou nome...',
        columns: {
          isAdmin: 'Flag admin',
          creditBalance: 'Saldo de créditos',
          subscriptionStatus: 'Assinatura',
          createdAt: 'Criado em',
          deletedAt: 'Excluído em',
        },
        fields: {
          email: 'Email',
          name: 'Nome',
          role: 'Função',
          creditBalance: 'Saldo de créditos',
          subscriptionStatus: 'Status da assinatura',
        },
      },
      assets: {
        title: 'Arquivos',
        description:
          'Mídias enviadas, ativos de template, arquivos gerados e metadados.',
        searchPlaceholder: 'Buscar id, chave de storage, tipo, status...',
        columns: {
          userId: 'ID do usuário',
          type: 'Tipo',
          storageKey: 'Chave de storage',
          mimeType: 'Tipo MIME',
          sizeBytes: 'Bytes',
          createdAt: 'Criado em',
        },
        fields: {
          status: 'Status',
          publicUrl: 'URL pública',
          mimeType: 'Tipo MIME',
          width: 'Largura',
          height: 'Altura',
          durationSeconds: 'Duração em segundos',
        },
      },
      'generation-jobs': {
        title: 'Gerações',
        description:
          'Status de geração, entradas de prompt, créditos e campos de recuperação.',
        searchPlaceholder: 'Buscar job, produto, status, template...',
        columns: {
          userId: 'ID do usuário',
          productName: 'Produto',
          templateSlug: 'Template',
          durationSeconds: 'Duração',
          creditReserved: 'Créditos reservados',
          createdAt: 'Criado em',
        },
        fields: {
          status: 'Status',
          productName: 'Produto',
          headline: 'Título',
          sellingPoint: 'Diferencial',
          priceText: 'Texto de preço',
          ctaText: 'Texto do CTA',
          errorMessage: 'Mensagem de erro',
        },
      },
      'credit-ledger': {
        title: 'Livro de créditos',
        description: 'Movimentos de crédito e notas administrativas.',
        columns: {
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
      searchPlaceholder: 'Buscar título, slug, status, hook...',
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
      searchPlaceholder: 'Buscar título, tipo, status, origem, tags...',
      addAsset: 'Adicionar ativo',
      modalCreate: 'Adicionar ativo da biblioteca',
      modalEdit: 'Editar ativo da biblioteca',
      modalDetails: 'Detalhes do ativo',
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
      templates: 'Templates',
      'library-assets': 'Library Assets',
      users: 'Users',
      assets: 'Assets',
      'generation-jobs': 'Generation Jobs',
      'credit-ledger': 'Credit Ledger',
    },
    management: {
      users: {
        title: 'Users',
        description: 'Account state, credits, subscription, and role controls.',
        searchPlaceholder: 'Search email or name...',
        columns: {
          isAdmin: 'Admin Flag',
          creditBalance: 'Credit Balance',
          subscriptionStatus: 'Subscription',
          createdAt: 'Created At',
          deletedAt: 'Deleted At',
        },
        fields: {
          email: 'Email',
          name: 'Name',
          role: 'Role',
          creditBalance: 'Credit balance',
          subscriptionStatus: 'Subscription status',
        },
      },
      assets: {
        title: 'Assets',
        description:
          'Uploaded media, template assets, generated files, and metadata.',
        searchPlaceholder: 'Search id, storage key, type, status...',
        columns: {
          userId: 'User ID',
          storageKey: 'Storage Key',
          mimeType: 'MIME Type',
          sizeBytes: 'Size Bytes',
          createdAt: 'Created At',
        },
        fields: {
          status: 'Status',
          publicUrl: 'Public URL',
          mimeType: 'MIME type',
          width: 'Width',
          height: 'Height',
          durationSeconds: 'Duration seconds',
        },
      },
      'generation-jobs': {
        title: 'Generation Jobs',
        description:
          'Generation status, prompt inputs, credits, and recovery fields.',
        searchPlaceholder: 'Search job id, product, status, template...',
        columns: {
          userId: 'User ID',
          productName: 'Product Name',
          templateSlug: 'Template',
          durationSeconds: 'Duration',
          creditReserved: 'Reserved Credits',
          createdAt: 'Created At',
        },
        fields: {
          status: 'Status',
          productName: 'Product name',
          headline: 'Headline',
          sellingPoint: 'Selling point',
          priceText: 'Price text',
          ctaText: 'CTA text',
          errorMessage: 'Error message',
        },
      },
      'credit-ledger': {
        title: 'Credit Ledger',
        description: 'Credit movements and admin metadata notes.',
        columns: {
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
      searchPlaceholder: 'Search title, slug, status, hook...',
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
      searchPlaceholder: 'Search title, kind, status, source, tags...',
      addAsset: 'Add asset',
      modalCreate: 'Add library asset',
      modalEdit: 'Edit library asset',
      modalDetails: 'Library asset details',
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
      templates: '模板',
      'library-assets': '素材库',
      users: '用户',
      assets: '文件',
      'generation-jobs': '生成任务',
      'credit-ledger': '算力流水',
    },
    management: {
      users: {
        title: '用户',
        description: '账号状态、算力、订阅和角色控制。',
        searchPlaceholder: '搜索邮箱或姓名...',
        columns: {
          isAdmin: '管理员标记',
          creditBalance: '算力余额',
          subscriptionStatus: '订阅',
          createdAt: '创建时间',
          deletedAt: '删除时间',
        },
        fields: {
          email: '邮箱',
          name: '姓名',
          role: '角色',
          creditBalance: '算力余额',
          subscriptionStatus: '订阅状态',
        },
      },
      assets: {
        title: '文件',
        description: '上传媒体、模板素材、生成文件和元数据。',
        searchPlaceholder: '搜索 id、存储 key、类型、状态...',
        columns: {
          userId: '用户 ID',
          storageKey: '存储 Key',
          mimeType: 'MIME 类型',
          sizeBytes: '字节数',
          createdAt: '创建时间',
        },
        fields: {
          status: '状态',
          publicUrl: '公开 URL',
          mimeType: 'MIME 类型',
          width: '宽度',
          height: '高度',
          durationSeconds: '时长秒数',
        },
      },
      'generation-jobs': {
        title: '生成任务',
        description: '生成状态、Prompt 输入、算力和恢复字段。',
        searchPlaceholder: '搜索任务 id、产品、状态、模板...',
        columns: {
          userId: '用户 ID',
          productName: '产品名',
          templateSlug: '模板',
          durationSeconds: '时长',
          creditReserved: '预留算力',
          createdAt: '创建时间',
        },
        fields: {
          status: '状态',
          productName: '产品名',
          headline: '标题',
          sellingPoint: '卖点',
          priceText: '价格文案',
          ctaText: 'CTA 文案',
          errorMessage: '错误信息',
        },
      },
      'credit-ledger': {
        title: '算力流水',
        description: '算力变动和后台备注元数据。',
        columns: {
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
      searchPlaceholder: '搜索标题、slug、状态、hook...',
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
      searchPlaceholder: '搜索标题、类型、状态、来源、标签...',
      addAsset: '添加素材',
      modalCreate: '添加素材',
      modalEdit: '编辑素材',
      modalDetails: '素材详情',
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
    statusLabels: adminStatusLabels.zh,
  },
};

export function getAdminContent(locale: string | null | undefined) {
  return adminContent[normalizeDashboardLocale(locale)];
}
