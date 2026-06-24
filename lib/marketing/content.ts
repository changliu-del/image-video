export const locales = ['en', 'pt'] as const;

export type Locale = (typeof locales)[number] | 'zh';

type NavItem = {
  label: string;
  href: string;
  localized?: boolean;
};

type FaqItem = {
  question: string;
  answer: string;
};

type FeatureItem = {
  title: string;
  text: string;
};

type ExampleItem = {
  title: string;
  category: string;
  text: string;
  mediaType: 'video' | 'image';
  asset?: string;
};

type ProcessItem = {
  stat: string;
  label: string;
};

type MarketingContent = {
  locale: Locale;
  localeLabel: string;
  nav: {
    home: string;
    textToImage: string;
    pricing: string;
    login: string;
    language: string;
    openMenu: string;
    closeMenu: string;
  };
  navItems: NavItem[];
  footer: {
    description: string;
    resources: string;
    resourceLabel: string;
    languages: string;
    legal: string;
    privacy: string;
    terms: string;
    partners: string;
    contact: string;
    copyright: string;
  };
  auth: {
    metadata: {
      title: string;
      description: string;
    };
    title: string;
    subtitle: string;
    loginTab: string;
    registerTab: string;
    emailLabel: string;
    passwordLabel: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    verificationCodeLabel: string;
    verificationCodePlaceholder: string;
    sendVerificationCode: string;
    sendingVerificationCode: string;
    verificationCodeSent: string;
    showPassword: string;
    hidePassword: string;
    signIn: string;
    register: string;
    loading: string;
    switchToRegisterPrompt: string;
    switchToRegister: string;
    switchToLoginPrompt: string;
    switchToLogin: string;
    benefits: string[];
    errors: {
      invalidCredentials: string;
      registerFailed: string;
      invalidVerificationCode: string;
      rateLimited: string;
      invalidEmail: string;
      weakPassword: string;
      fallback: string;
    };
  };
  home: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      description: string;
      primaryAction: string;
      secondaryAction: string;
      previewTitle: string;
      previewText: string;
      previewItems: string[];
      stats: ProcessItem[];
    };
    examples: {
      eyebrow: string;
      title: string;
      description: string;
      videoLabel: string;
      imageLabel: string;
      promptLabel: string;
      items: ExampleItem[];
    };
    templates: {
      eyebrow: string;
      title: string;
      description: string;
      actionLabel: string;
    };
    workflow: {
      eyebrow: string;
      title: string;
      description: string;
      steps: FeatureItem[];
    };
    system: {
      eyebrow: string;
      title: string;
      description: string;
      stats: ProcessItem[];
      steps: FeatureItem[];
    };
    what: {
      eyebrow: string;
      title: string;
      description: string;
      items: FeatureItem[];
    };
    how: {
      title: string;
      description: string;
      steps: string[];
    };
    features: {
      title: string;
      description: string;
      items: FeatureItem[];
    };
    faq: {
      title: string;
      items: FaqItem[];
    };
    cta: {
      title: string;
      description: string;
      action: string;
    };
  };
  textToImage: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      description: string;
      promptLabel: string;
      promptPlaceholder: string;
      settingsTitle: string;
      settingsMeta: string;
      settingsAction: string;
      generate: string;
      credit: string;
      chips: string[];
    };
    examples: {
      eyebrow: string;
      title: string;
      description: string;
      videoLabel: string;
      imageLabel: string;
      promptLabel: string;
      items: ExampleItem[];
    };
    system: {
      eyebrow: string;
      title: string;
      description: string;
      stats: ProcessItem[];
      steps: FeatureItem[];
    };
  };
  pricing: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      description: string;
      badges: string[];
      stats: ProcessItem[];
    };
    tabs: {
      yearly: string;
      monthly: string;
      onetime: string;
      save: string;
      secure: string;
      buy: string;
      popular: string;
      perMonth: string;
    };
    plans: PricingPlan[];
    value: {
      items: FeatureItem[];
      title: string;
      points: string[];
      includedTitle: string;
      included: string[];
    };
    faq: {
      title: string;
      items: FaqItem[];
    };
  };
};

export type PricingPlan = {
  name: string;
  description: string;
  yearly: {
    price: string;
    oldPrice?: string;
    credits: string;
  };
  monthly: {
    price: string;
    oldPrice?: string;
    credits: string;
  };
  onetime: {
    price: string;
    oldPrice?: string;
    credits: string;
  };
  features: string[];
  highlighted?: boolean;
};

const ptVideoExamples: ExampleItem[] = [
  {
    title: 'Primeira perspectiva da modelo',
    category: 'Filmagem realista / luz lateral suave / close-up',
    text: 'Cena vertical com câmera próxima, expressão natural e ritmo de social commerce.',
    mediaType: 'video',
    asset: '/resources/example1.mp4',
  },
  {
    title: 'Apresentação real do produto',
    category: 'Cena real / luz solar / aproximação lenta',
    text: 'Movimento lento de câmera para revelar caimento, material e presença do produto.',
    mediaType: 'video',
    asset: '/resources/example2.mp4',
  },
  {
    title: 'Vídeo promocional industrial',
    category: 'Plano industrial / macro extremo / movimento contínuo',
    text: 'Close cinematográfico de materiais, textura e detalhe para produtos técnicos.',
    mediaType: 'video',
    asset: '/resources/example3.mp4',
  },
  {
    title: 'Explicação e apresentação do produto',
    category: 'Luz suave / explicação / cena simulada',
    text: 'Uma tomada premium que combina rotação, partículas e leitura clara do produto.',
    mediaType: 'video',
    asset: '/resources/example4.mp4',
  },
  {
    title: 'Lookbook de moda em movimento',
    category: 'Movimento de modelo / luz de estúdio / social short',
    text: 'Cortes verticais para coleções, lançamentos e anúncios com visual editorial.',
    mediaType: 'video',
    asset: '/resources/example5.mp4',
  },
  {
    title: 'Miragem de tricô no deserto',
    category: 'Alta-costura / fundo realista',
    text: 'Editorial de moda com textura, vento, luz natural e atmosfera de campanha.',
    mediaType: 'video',
    asset: '/resources/example6.mp4',
  },
];

const enVideoExamples: ExampleItem[] = [
  {
    title: 'Model first-person scene',
    category: 'Realistic footage / soft side light / close-up',
    text: 'A vertical scene with close camera work, natural expression, and social commerce rhythm.',
    mediaType: 'video',
    asset: '/resources/example1.mp4',
  },
  {
    title: 'Real product presentation',
    category: 'Live scene / sunlight / slow push-in',
    text: 'Slow camera movement reveals fit, material, and product presence.',
    mediaType: 'video',
    asset: '/resources/example2.mp4',
  },
  {
    title: 'Industrial product promo',
    category: 'Industrial shot / extreme macro / continuous motion',
    text: 'A cinematic close-up of materials, texture, and detail for technical products.',
    mediaType: 'video',
    asset: '/resources/example3.mp4',
  },
  {
    title: 'Product explainer showcase',
    category: 'Soft light / explanation / simulated scene',
    text: 'A premium take combining rotation, particles, and a clear product read.',
    mediaType: 'video',
    asset: '/resources/example4.mp4',
  },
  {
    title: 'Fashion lookbook in motion',
    category: 'Model movement / studio light / social short',
    text: 'Vertical cuts for collections, launches, and ads with an editorial feel.',
    mediaType: 'video',
    asset: '/resources/example5.mp4',
  },
  {
    title: 'Knitwear desert mirage',
    category: 'High fashion / realistic background',
    text: 'A fashion editorial with texture, wind, natural light, and campaign atmosphere.',
    mediaType: 'video',
    asset: '/resources/example6.mp4',
  },
];

const zhVideoExamples: ExampleItem[] = [
  {
    title: '模特第一视角场景',
    category: '真实拍摄 / 柔和侧光 / 近景',
    text: '竖屏近景镜头，表情自然，适合社媒电商节奏。',
    mediaType: 'video',
    asset: '/resources/example1.mp4',
  },
  {
    title: '真实商品展示',
    category: '实景 / 日光 / 缓慢推进',
    text: '用缓慢镜头展示版型、材质和商品存在感。',
    mediaType: 'video',
    asset: '/resources/example2.mp4',
  },
  {
    title: '工业风商品宣传片',
    category: '工业镜头 / 极致微距 / 连续运动',
    text: '用电影感微距呈现技术类商品的材质、纹理和细节。',
    mediaType: 'video',
    asset: '/resources/example3.mp4',
  },
  {
    title: '商品讲解展示',
    category: '柔光 / 讲解 / 模拟场景',
    text: '结合旋转、粒子和清晰商品识别的高级展示镜头。',
    mediaType: 'video',
    asset: '/resources/example4.mp4',
  },
  {
    title: '动态时尚 Lookbook',
    category: '模特运动 / 棚拍光 / 社媒短片',
    text: '面向系列上新和广告投放的竖屏时尚短片。',
    mediaType: 'video',
    asset: '/resources/example5.mp4',
  },
  {
    title: '沙漠针织大片',
    category: '高级时装 / 真实背景',
    text: '用纹理、风感和自然光营造广告大片氛围。',
    mediaType: 'video',
    asset: '/resources/example6.mp4',
  },
];

const ptImageExamples: ExampleItem[] = [
  {
    title: 'SKU em fundo branco para marketplace',
    category: 'Fundo branco / sombra realista / marketplace',
    text: 'Produto centralizado, escala correta, sombra limpa e espaço pronto para catálogo.',
    mediaType: 'image',
    asset: '/resources/example1.png',
  },
  {
    title: 'Imagem hero de kit de beleza',
    category: 'Estúdio premium / composição de kit / luz suave',
    text: 'Composição organizada, luz suave e hierarquia visual para loja e campanha.',
    mediaType: 'image',
    asset: '/resources/example2.png',
  },
  {
    title: 'Detalhe de moda com pontos de venda',
    category: 'Detalhe de material / colagem / argumentos de venda',
    text: 'Close comercial para destacar tecido, função e acabamento em módulos de PDP.',
    mediaType: 'image',
    asset: '/resources/example3.png',
  },
  {
    title: 'Banner promocional de alimentos e bebidas',
    category: 'Gelado e fresco / gotas / campanha de verão',
    text: 'Produto central, clima de campanha e fundo energético para social e marketplace.',
    mediaType: 'image',
    asset: '/resources/example4.png',
  },
  {
    title: 'Pôster de lançamento tech',
    category: 'Blueprint tech / macro / lançamento',
    text: 'Imagem fria e detalhada para destacar design, material e sensação premium.',
    mediaType: 'image',
    asset: '/resources/example5.png',
  },
  {
    title: 'Imagem lifestyle para casa',
    category: 'Cena real / luz natural em casa / uso cotidiano',
    text: 'Cenário autêntico com luz natural e produto em uso para páginas de venda.',
    mediaType: 'image',
    asset: '/resources/example6.png',
  },
];

const enImageExamples: ExampleItem[] = [
  {
    title: 'Marketplace SKU on white',
    category: 'White background / realistic shadow / marketplace-ready',
    text: 'Centered product, correct scale, clean shadow, and catalog-ready whitespace.',
    mediaType: 'image',
    asset: '/resources/example1.png',
  },
  {
    title: 'Beauty kit hero image',
    category: 'Premium studio / kit composition / soft light',
    text: 'Organized composition, soft light, and clear visual hierarchy for campaigns.',
    mediaType: 'image',
    asset: '/resources/example2.png',
  },
  {
    title: 'Fashion detail with selling points',
    category: 'Material detail / collage / product claims',
    text: 'Commercial close-ups that turn fabric, function, and finish into PDP modules.',
    mediaType: 'image',
    asset: '/resources/example3.png',
  },
  {
    title: 'Food and beverage promo banner',
    category: 'Cold and fresh / droplets / summer campaign',
    text: 'Centered product, campaign mood, and energetic background for social and marketplace.',
    mediaType: 'image',
    asset: '/resources/example4.png',
  },
  {
    title: 'Tech launch poster',
    category: 'Tech blueprint / macro / launch',
    text: 'Cool detailed visuals for design, material, and premium product feel.',
    mediaType: 'image',
    asset: '/resources/example5.png',
  },
  {
    title: 'Home lifestyle image',
    category: 'Real scene / natural home light / everyday use',
    text: 'Authentic setting with natural light and product-in-use framing for sales pages.',
    mediaType: 'image',
    asset: '/resources/example6.png',
  },
];

const zhImageExamples: ExampleItem[] = [
  {
    title: '白底 Marketplace SKU',
    category: '白底 / 真实阴影 / 适合平台',
    text: '商品居中、比例准确、阴影干净，适合目录和主图使用。',
    mediaType: 'image',
    asset: '/resources/example1.png',
  },
  {
    title: '美妆套装 Hero 图',
    category: '高级棚拍 / 套装构图 / 柔光',
    text: '用清晰层级、柔和光线和套装陈列服务店铺与活动页。',
    mediaType: 'image',
    asset: '/resources/example2.png',
  },
  {
    title: '服装卖点细节图',
    category: '材质细节 / 拼贴 / 卖点表达',
    text: '把面料、功能和做工转化成详情页可用的商业模块。',
    mediaType: 'image',
    asset: '/resources/example3.png',
  },
  {
    title: '食品饮料促销横幅',
    category: '冰爽 / 水滴 / 夏季活动',
    text: '商品居中，搭配强活动感背景，适合社媒和平台投放。',
    mediaType: 'image',
    asset: '/resources/example4.png',
  },
  {
    title: '科技新品发布海报',
    category: '科技蓝图 / 微距 / 发布',
    text: '用冷色细节突出设计、材质和高端质感。',
    mediaType: 'image',
    asset: '/resources/example5.png',
  },
  {
    title: '家居生活方式图',
    category: '真实场景 / 自然光 / 日常使用',
    text: '自然光下的真实使用场景，适合商品页和品牌内容。',
    mediaType: 'image',
    asset: '/resources/example6.png',
  },
];

const pt: MarketingContent = {
  locale: 'pt',
  localeLabel: 'Português',
  nav: {
    home: 'Início',
    textToImage: 'Texto para Imagem',
    pricing: 'Preços',
    login: 'Entrar',
    language: 'Alterar idioma',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
  },
  navItems: [
    { label: 'Início', href: '' },
    { label: 'Templates', href: '/templates' },
    { label: 'Preços', href: '/pricing' },
    { label: 'Estúdio', href: '/dashboard', localized: false },
  ],
  footer: {
    description:
      'gptimage é um estúdio de IA para e-commerce: crie imagens, vídeos e assets de campanha com rapidez e consistência.',
    resources: 'Recursos',
    resourceLabel: 'Gerador de assets gptimage',
    languages: 'Idiomas',
    legal: 'Legal',
    privacy: 'Política de Privacidade',
    terms: 'Termos de Serviço',
    partners: 'Partners',
    contact: 'Contato',
    copyright: '© 2026 gptimage. All rights reserved.',
  },
  auth: {
    metadata: {
      title: 'Entrar no gptimage — Commerce AI Studio',
      description:
        'Entre ou crie sua conta no gptimage para gerar imagens, vídeos e assets de e-commerce com IA.',
    },
    title: 'Entre no gptimage',
    subtitle: 'Use seu e-mail e senha para acessar seu workspace',
    loginTab: 'Entrar',
    registerTab: 'Registrar',
    emailLabel: 'E-mail',
    passwordLabel: 'Senha',
    emailPlaceholder: 'voce@exemplo.com',
    passwordPlaceholder: 'Pelo menos 8 caracteres',
    verificationCodeLabel: 'Código de verificação',
    verificationCodePlaceholder: '6 dígitos',
    sendVerificationCode: 'Enviar código',
    sendingVerificationCode: 'Enviando',
    verificationCodeSent:
      'Se este e-mail puder criar uma conta, enviamos um código de verificação.',
    showPassword: 'Mostrar senha',
    hidePassword: 'Ocultar senha',
    signIn: 'Entrar',
    register: 'Criar conta',
    loading: 'Carregando...',
    switchToRegisterPrompt: 'Novo no gptimage?',
    switchToRegister: 'Criar conta',
    switchToLoginPrompt: 'Já tem uma conta?',
    switchToLogin: 'Entrar',
    benefits: [
      'Imagens de produto',
      'Vídeos verticais',
      'Créditos de boas-vindas',
      'Checkout seguro',
    ],
    errors: {
      invalidCredentials: 'E-mail ou senha incorretos. Tente novamente.',
      registerFailed: 'Falha ao criar a conta. Tente novamente.',
      invalidVerificationCode:
        'Código de verificação inválido ou expirado.',
      rateLimited: 'Muitas tentativas. Aguarde e tente novamente.',
      invalidEmail: 'Digite um e-mail válido.',
      weakPassword: 'A senha deve ter pelo menos 8 caracteres.',
      fallback: 'Não foi possível concluir. Tente novamente.',
    },
  },
  home: {
    metadata: {
      title: 'gptimage — Plataforma de assets com IA para e-commerce',
      description:
        'Gere vídeos de produto, imagens comerciais e materiais de marketing para e-commerce com IA.',
    },
    hero: {
      eyebrow: 'Templates de commerce para o Brasil',
      title: 'Escolha um modelo. Troque pelo seu produto. Gere criativos que vendem.',
      description:
        'Comece com modelos em PT-BR para Pix, WhatsApp, marketplace e anúncios. Gere imagens baratas primeiro e transforme em vídeo quando fizer sentido para o seu produto.',
      primaryAction: 'Explorar templates',
      secondaryAction: 'Ver templates de imagem',
      previewTitle: 'Prompt editável',
      previewText:
        'Cada modelo abre com prompt editável e direção criativa pronta para o mercado brasileiro.',
      previewItems: [
        'Prompts em português brasileiro para ofertas, prova social e lançamento.',
        'Direções de compra para Pix, WhatsApp, marketplace e loja própria.',
        'Templates livres para editar antes de gastar créditos em vídeo.',
      ],
      stats: [
        { stat: '74', label: 'templates no catalogo' },
        { stat: '1', label: 'crédito para imagem' },
        { stat: 'PT-BR', label: 'prompts locais' },
      ],
    },
    examples: {
      eyebrow: 'Biblioteca Criativa de Commerce AI',
      title: 'Exemplos de commerce com alta conversão',
      description:
        'Combine vídeos de produto, cenas lifestyle, motion para social e exibição 360 para cada SKU.',
      videoLabel: 'Vídeo',
      imageLabel: 'Imagem',
      promptLabel: 'Prompt',
      items: ptVideoExamples,
    },
    templates: {
      eyebrow: 'Biblioteca de templates',
      title: 'Comece pelo tipo de vídeo que vende o produto',
      description:
        'Cada card mostra categoria e visual do template. Nos detalhes, o vendedor vê o preview, aplica o prompt e troca pela imagem do próprio produto.',
      actionLabel: 'Usar modelo',
    },
    workflow: {
      eyebrow: 'Caminho de baixo custo',
      title: 'Imagem primeiro, vídeo depois',
      description:
        'A experiência respeita o hábito de quem vende online: testar uma imagem barata, ajustar a mensagem e só então subir para vídeo.',
      steps: [
        {
          title: 'Comece com imagem',
          text: 'Use modelos de banner, PDP e promoção para criar uma base visual com baixo custo.',
        },
        {
          title: 'Edite o prompt livremente',
          text: 'O template sugere prompt e estrutura, mas o usuário pode reescrever tudo.',
        },
        {
          title: 'Transforme em vídeo',
          text: 'Quando a imagem aprovar a ideia, use image-to-video para movimento e variações.',
        },
      ],
    },
    system: {
      eyebrow: 'Sistema Criativo de Commerce',
      title: 'De uma foto de produto a assets para todo o funil',
      description:
        'O fluxo organiza entendimento do produto, expansão de cena, motion e preparo de campanhas em um só lugar.',
      stats: [
        { stat: '3x', label: 'modos de asset' },
        { stat: '24h', label: 'ritmo de lançamento' },
        { stat: 'SKU', label: 'produção em lote' },
      ],
      steps: [
        {
          title: 'Leitura do produto',
          text: 'Identifica assunto, material, embalagem e ângulos úteis para marketplace.',
        },
        {
          title: 'Expansão criativa',
          text: 'Gera fundos brancos, cenas, pôsteres e direções para vídeos curtos.',
        },
        {
          title: 'Lotes de assets',
          text: 'Cria conjuntos multiformato para cada SKU e cada canal de venda.',
        },
        {
          title: 'Reuso em campanha',
          text: 'Adapta assets para PDPs, anúncios, social e lojas DTC.',
        },
      ],
    },
    what: {
      eyebrow: 'Resultados reais de vendedores reais',
      title: 'O que o gptimage faz pela sua loja?',
      description:
        'Uma plataforma de IA feita para e-commerce: envie uma imagem de produto, descreva a ideia e receba assets prontos para uso.',
      items: [
        {
          title: 'Exibição dinâmica de produtos',
          text: 'Transforme fotos estáticas em vídeos fluidos que aumentam atenção e conversão.',
        },
        {
          title: 'Fluxo simples',
          text: 'Envie, descreva e gere sem timeline de edição ou curva de aprendizado longa.',
        },
        {
          title: 'Resultado profissional',
          text: 'Exporte assets em resoluções e formatos adequados aos principais canais.',
        },
      ],
    },
    how: {
      title: 'Três passos para criar seu asset',
      description: 'Do upload ao download em poucos minutos:',
      steps: [
        'Envie uma imagem clara do produto ou digite uma descrição.',
        'Descreva estilo, cena, fundo, ângulo e intenção comercial.',
        'A IA gera o asset. Baixe e publique diretamente.',
      ],
    },
    features: {
      title: 'Recursos centrais para e-commerce',
      description:
        'Da fotografia de produto às campanhas, gptimage cobre o fluxo de assets para lojas digitais.',
      items: [
        {
          title: 'Geração de vídeo de produto',
          text: 'Transforme imagens estáticas em vídeos para páginas de produto, redes sociais e anúncios.',
        },
        {
          title: 'Prompts em linguagem natural',
          text: 'Descreva o resultado desejado de forma simples e ajuste a direção criativa.',
        },
        {
          title: 'Exportação em alta resolução',
          text: 'Crie assets em formatos e resoluções adequados aos principais marketplaces.',
        },
        {
          title: 'Fluxo mínimo',
          text: 'Sem ferramentas complexas: reduza custo de produção e tempo de aprovação.',
        },
        {
          title: 'Download e compartilhamento rápidos',
          text: 'Baixe em um clique e use diretamente na loja ou nos canais sociais.',
        },
        {
          title: 'Segurança de dados',
          text: 'Boas práticas protegem imagens de produto, prompts e assets gerados.',
        },
      ],
    },
    faq: {
      title: 'Perguntas frequentes',
      items: [
        {
          question: 'Os templates limitam o prompt?',
          answer:
            'Não. O template só preenche uma boa base com descrição, prompt e direção visual. O usuário pode editar o prompt inteiro.',
        },
        {
          question: 'Preciso gerar vídeo logo no primeiro passo?',
          answer:
            'Não. A ideia é começar com imagem de baixo custo e transformar em vídeo quando o criativo fizer sentido.',
        },
        {
          question: 'Os hooks são pensados para o Brasil?',
          answer:
            'Sim. Os exemplos priorizam PT-BR, Pix, WhatsApp, marketplace e linguagem direta de social commerce.',
        },
        {
          question: 'O que acontece ao clicar em um modelo?',
          answer:
            'Nesta primeira versão, o usuário entra ou cria conta para continuar com o modelo escolhido.',
        },
      ],
    },
    cta: {
      title: 'Comece com um template e adapte para o seu produto',
      description:
        'Transforme ideias de promoção, prova social e demonstração em criativos prontos para testar.',
      action: 'Entrar e usar templates',
    },
  },
  textToImage: {
    metadata: {
      title: 'gptimage Texto para Imagem — Gerador de assets para e-commerce',
      description:
        'Gere imagens profissionais de produto a partir de descrições com o gptimage.',
    },
    hero: {
      eyebrow: 'Estúdio de Imagem de Produto com IA',
      title: 'Texto para imagem de produto',
      description:
        'Descreva a cena, a composição e o estilo. A IA cria imagens de e-commerce prontas para PDPs, banners e anúncios.',
      promptLabel: 'Prompt',
      promptPlaceholder:
        'Descreva o produto, a cena, a composição, o fundo e o uso comercial...',
      settingsTitle: 'Configurações de geração',
      settingsMeta: 'Flux · 1 crédito',
      settingsAction: 'Abrir configurações',
      generate: 'Gerar imagem',
      credit: '1 crédito',
      chips: [
        'Fundo branco',
        'Detalhe da PDP',
        'Cena lifestyle',
        'Banner promocional',
        'Anúncio social',
      ],
    },
    examples: {
      eyebrow: 'Biblioteca Criativa de Commerce AI',
      title: 'Exemplos de commerce com alta conversão',
      description:
        'Crie imagem principal, detalhes de PDP, pôsteres de marca e banners de campanha.',
      videoLabel: 'Vídeo',
      imageLabel: 'Imagem',
      promptLabel: 'Prompt',
      items: ptImageExamples,
    },
    system: {
      eyebrow: 'Estúdio de Imagem de Produto',
      title: 'Imagens profissionais vão além de beleza',
      description:
        'O estúdio foca no fluxo comercial: fundo branco, lifestyle, visuais de venda, pôsteres e banners.',
      stats: [
        { stat: '3x', label: 'modos de asset' },
        { stat: '24h', label: 'ritmo de lançamento' },
        { stat: 'SKU', label: 'produção em lote' },
      ],
      steps: [
        {
          title: 'Pronto para marketplace',
          text: 'Prioriza fundo, sombra, escala e embalagem legível.',
        },
        {
          title: 'Clima de marca',
          text: 'Usa luz, fundo e composição para reforçar posicionamento.',
        },
        {
          title: 'Pontos de venda',
          text: 'Transforma materiais, funções e casos de uso em módulos de PDP.',
        },
        {
          title: 'Aprovável',
          text: 'Reduz ruído visual e aproxima o resultado das regras de anúncio.',
        },
      ],
    },
  },
  pricing: {
    metadata: {
      title: 'Preços gptimage — Planos flexíveis para e-commerce',
      description:
        'Conheça os planos do gptimage para gerar imagens, vídeos e campanhas com IA.',
    },
    hero: {
      eyebrow: 'Capacidade de Commerce AI',
      title: 'Planos pensados para a produção de e-commerce',
      description:
        'Planeje capacidade para lançamentos, criativos de anúncios, imagens de produto e vídeos premium com créditos previsíveis.',
      badges: [
        'Imagens + vídeos por lançamento',
        'Reduza custos de produção externa',
        'Créditos liberados após o pagamento',
      ],
      stats: [
        { stat: '20+', label: 'direções de asset' },
        { stat: '4K', label: 'saída HD' },
        { stat: '90%', label: 'menos operação criativa' },
      ],
    },
    tabs: {
      yearly: 'Anual',
      monthly: 'Mensal',
      onetime: 'Avulso',
      save: 'Economize 20%',
      secure: 'Veja planos e créditos no workspace',
      buy: 'Abrir planos',
      popular: 'Mais popular',
      perMonth: 'por mês',
    },
    plans: [
      {
        name: 'Basic',
        description: 'Para lojas que querem começar a testar assets com IA.',
        yearly: {
          price: 'US$9.58',
          credits: '150 créditos por mês, cobrança anual',
        },
        monthly: {
          price: 'US$12',
          credits: '150 créditos por mês',
        },
        onetime: {
          price: 'US$9',
          credits: '100 créditos avulsos',
        },
        features: ['Todas as ferramentas criativas', 'Imagem, vídeo e try-on', 'Ideal para testes'],
      },
      {
        name: 'Plus',
        description: 'Para lançamentos recorrentes e produção diária de anúncios.',
        yearly: {
          oldPrice: 'US$39',
          price: 'US$31.17',
          credits: '600 créditos por mês, cobrança anual',
        },
        monthly: {
          price: 'US$39',
          credits: '600 créditos por mês',
        },
        onetime: {
          price: 'US$39',
          credits: '500 créditos avulsos',
        },
        features: ['Mais margem para campanhas', 'Imagem, vídeo e try-on', 'Recomendado para uso semanal'],
        highlighted: true,
      },
      {
        name: 'Pro',
        description: 'Para marcas, equipes e testes criativos frequentes.',
        yearly: {
          oldPrice: 'US$99',
          price: 'US$79.17',
          credits: '1500 créditos por mês, cobrança anual',
        },
        monthly: {
          price: 'US$99',
          credits: '1500 créditos por mês',
        },
        onetime: {
          price: 'US$99',
          credits: '1500 créditos avulsos',
        },
        features: ['Para lotes de SKU', 'Maior reserva de créditos', 'Testes criativos frequentes'],
      },
    ],
    value: {
      items: [
        {
          title: 'Lotes de lançamento',
          text: 'Gere imagem principal, visuais de PDP e vídeos promocionais juntos.',
        },
        {
          title: 'Teste de anúncios',
          text: 'Explore estilos e cenários para acelerar testes criativos.',
        },
        {
          title: 'Fluxo de equipe',
          text: 'Planeje produção com créditos e reduza terceirizações pontuais.',
        },
      ],
      title: 'Por que os planos se pagam rápido',
      points: [
        'Uma sessão terceirizada raramente cobre todos os formatos de canal.',
        'gptimage expande várias cenas e assets em torno do mesmo SKU.',
        'Testes criativos mais rápidos reduzem perdas em anúncios e lançamentos.',
      ],
      includedTitle: 'Incluído após a compra',
      included: [
        'Acesso completo às ferramentas de imagem e vídeo',
        'Créditos funcionam entre modelos disponíveis',
        'Feito para imagens hero, PDPs e vídeos sociais',
        'Histórico no workspace para revisar e reutilizar',
      ],
    },
    faq: {
      title: 'Assinatura e cobrança',
      items: [
        {
          question: 'Posso cancelar a qualquer momento?',
          answer:
            'Sim. O plano permanece ativo até o fim do ciclo de cobrança.',
        },
        {
          question: 'Há planos mensais e anuais?',
          answer:
            'Sim. Mensal para flexibilidade e anual para melhor economia.',
        },
        {
          question: 'Posso trocar de plano?',
          answer: 'Sim, você pode fazer upgrade ou downgrade a qualquer momento.',
        },
        {
          question: 'Existe limite de criações?',
          answer:
            'Cada plano possui créditos. Você pode comprar mais créditos quando precisar.',
        },
        {
          question: 'Preciso instalar algo?',
          answer: 'Não. gptimage funciona totalmente no navegador.',
        },
      ],
    },
  },
};

const en: MarketingContent = {
  ...pt,
  locale: 'en',
  localeLabel: 'English',
  nav: {
    home: 'Home',
    textToImage: 'Text to Image',
    pricing: 'Pricing',
    login: 'Sign in',
    language: 'Change language',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  navItems: [
    { label: 'Home', href: '' },
    { label: 'Templates', href: '/templates' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Workbench', href: '/dashboard', localized: false },
  ],
  footer: {
    ...pt.footer,
    resources: 'Resources',
    languages: 'Languages',
    legal: 'Legal',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    contact: 'Contact',
  },
  auth: {
    ...pt.auth,
    metadata: {
      title: 'Sign in to gptimage — Commerce AI Studio',
      description:
        'Sign in or create a gptimage account to generate e-commerce images, videos, and campaign assets with AI.',
    },
    title: 'Sign in to gptimage',
    subtitle: 'Use your email and password to access your workspace',
    loginTab: 'Sign in',
    registerTab: 'Register',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'At least 8 characters',
    verificationCodeLabel: 'Verification code',
    verificationCodePlaceholder: '6 digits',
    sendVerificationCode: 'Send code',
    sendingVerificationCode: 'Sending',
    verificationCodeSent:
      'If this email can create an account, we sent a verification code.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    signIn: 'Sign in',
    register: 'Create account',
    loading: 'Loading...',
    switchToRegisterPrompt: 'New to gptimage?',
    switchToRegister: 'Create account',
    switchToLoginPrompt: 'Already have an account?',
    switchToLogin: 'Sign in',
    benefits: [
      'Product images',
      'Vertical videos',
      'Welcome credits',
      'Secure checkout',
    ],
    errors: {
      invalidCredentials: 'Invalid email or password. Please try again.',
      registerFailed: 'Failed to create your account. Please try again.',
      invalidVerificationCode:
        'Verification code is invalid or expired.',
      rateLimited: 'Too many attempts. Please wait and try again.',
      invalidEmail: 'Enter a valid email address.',
      weakPassword: 'Password must be at least 8 characters.',
      fallback: 'Something went wrong. Please try again.',
    },
  },
  home: {
    ...pt.home,
    metadata: {
      title: 'gptimage — AI commerce asset studio',
      description:
        'Generate product videos, commercial images, and campaign assets for e-commerce with AI.',
    },
    hero: {
      ...pt.home.hero,
      eyebrow: 'Commerce templates for Brazil',
      title: 'Choose a template. Replace it with your product. Generate creatives that sell.',
      description:
        'Start with PT-BR templates for Pix, WhatsApp, marketplaces, and ads. Create low-cost images first, then turn them into video when it makes sense for the product.',
      primaryAction: 'Explore templates',
      secondaryAction: 'Explore image templates',
      previewTitle: 'Editable prompt',
      previewText:
        'Every template starts with an editable prompt and creative direction for the Brazilian market.',
      previewItems: [
        'Brazilian Portuguese prompts for offers, social proof, and launches.',
        'Buying-direction ideas for Pix, WhatsApp, marketplaces, and DTC stores.',
        'Templates stay editable before you spend credits on video.',
      ],
      stats: [
        { stat: '74', label: 'catalog templates' },
        { stat: '1', label: 'image credit' },
        { stat: 'PT-BR', label: 'local prompts' },
      ],
    },
    examples: {
      ...pt.home.examples,
      eyebrow: 'Commerce AI Creative Library',
      title: 'High-converting commerce examples',
      description:
        'Cover product videos, lifestyle scenes, social motion, and PDP-ready product showcases for every SKU.',
      videoLabel: 'Video',
      imageLabel: 'Image',
      promptLabel: 'Prompt',
      items: enVideoExamples,
    },
    templates: {
      ...pt.home.templates,
      eyebrow: 'Template library',
      title: 'Start with the kind of video that sells the product',
      description:
        'Each card shows the template category and visual. Details reveal the preview and prompt before sellers adapt it with their own product image.',
      actionLabel: 'Use template',
    },
    workflow: {
      ...pt.home.workflow,
      eyebrow: 'Low-cost path',
      title: 'Image first, video after',
      description:
        'The experience matches how sellers already work: test a cheap image, tune the message, then upgrade to video.',
      steps: [
        {
          title: 'Start with image',
          text: 'Use banner, PDP, and promotion templates to create a low-cost visual base.',
        },
        {
          title: 'Edit the prompt freely',
          text: 'The template suggests a prompt and structure, but the user can rewrite everything.',
        },
        {
          title: 'Turn it into video',
          text: 'Once the image validates the idea, use image-to-video for motion and variants.',
        },
      ],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          question: 'Do templates limit the prompt?',
          answer:
            'No. A template only fills a strong starting point with description, prompt, and visual direction. Users can edit the entire prompt.',
        },
        {
          question: 'Do I need to generate video first?',
          answer:
            'No. The path starts with a low-cost image and upgrades to video when the creative direction makes sense.',
        },
        {
          question: 'Are the hooks designed for Brazil?',
          answer:
            'Yes. The examples prioritize PT-BR, Pix, WhatsApp, marketplaces, and direct social-commerce language.',
        },
        {
          question: 'What happens when I click a template?',
          answer:
            'In this first version, the user signs in or creates an account to continue with the selected model.',
        },
      ],
    },
    cta: {
      title: 'Start with a template and adapt it to your product',
      description:
        'Turn promotion, social proof, and demo ideas into creatives ready to test.',
      action: 'Sign in and use templates',
    },
  },
  textToImage: {
    ...pt.textToImage,
    metadata: {
      title: 'gptimage Text to Image — E-commerce asset generator',
      description:
        'Generate professional product images from descriptions with gptimage.',
    },
    hero: {
      ...pt.textToImage.hero,
      eyebrow: 'AI Product Image Studio',
      title: 'Text to product image',
      description:
        'Describe the scene, composition, and style. gptimage creates e-commerce images for PDPs, banners, and ads.',
      promptLabel: 'Prompt',
      promptPlaceholder:
        'Describe the product, scene, composition, background, and commercial use...',
      settingsTitle: 'Generation settings',
      settingsAction: 'Open settings',
      generate: 'Generate image',
      credit: '1 credit',
      chips: ['White background', 'PDP detail', 'Lifestyle scene', 'Promo banner', 'Social ad'],
    },
    examples: {
      ...pt.textToImage.examples,
      eyebrow: 'Commerce AI Creative Library',
      title: 'High-converting commerce examples',
      description:
        'Create main images, PDP detail modules, brand posters, and campaign banners.',
      videoLabel: 'Video',
      imageLabel: 'Image',
      promptLabel: 'Prompt',
      items: enImageExamples,
    },
  },
  pricing: {
    ...pt.pricing,
    metadata: {
      title: 'gptimage Pricing — Flexible plans for e-commerce',
      description:
        'Explore gptimage plans for generating AI images, videos, and campaigns.',
    },
    hero: {
      ...pt.pricing.hero,
      eyebrow: 'Commerce AI Capacity',
      title: 'Plans built for e-commerce production',
      description:
        'Plan capacity for launches, ad creatives, product images, and premium videos with predictable credits.',
      badges: [
        'Images + videos per launch',
        'Reduce external production costs',
        'Credits available after checkout',
      ],
      stats: [
        { stat: '3', label: 'subscription tiers' },
        { stat: '2', label: 'billing cycles' },
        { stat: '1', label: 'credit wallet' },
      ],
    },
    tabs: {
      ...pt.pricing.tabs,
      yearly: 'Yearly',
      monthly: 'Monthly',
      onetime: 'One-time',
      save: 'Save 20%',
      secure: 'Open plans and credits in the workspace',
      buy: 'Open plans',
      popular: 'Most popular',
      perMonth: 'per month',
    },
    plans: [
      {
        name: 'Basic',
        description: 'For stores starting to test AI creative assets.',
        yearly: {
          price: 'US$9.58',
          credits: '150 credits per month, billed yearly',
        },
        monthly: {
          price: 'US$12',
          credits: '150 credits per month',
        },
        onetime: {
          price: 'US$9',
          credits: '100 one-time credits',
        },
        features: ['All creative tools', 'Image, video, and try-on', 'Best for tests'],
      },
      {
        name: 'Plus',
        description: 'For recurring launches and weekly ad production.',
        yearly: {
          oldPrice: 'US$39',
          price: 'US$31.17',
          credits: '600 credits per month, billed yearly',
        },
        monthly: {
          price: 'US$39',
          credits: '600 credits per month',
        },
        onetime: {
          price: 'US$39',
          credits: '500 one-time credits',
        },
        features: ['More room for campaigns', 'Image, video, and try-on', 'Recommended for weekly use'],
        highlighted: true,
      },
      {
        name: 'Pro',
        description: 'For brands, SKU batches, and frequent creative tests.',
        yearly: {
          oldPrice: 'US$99',
          price: 'US$79.17',
          credits: '1500 credits per month, billed yearly',
        },
        monthly: {
          price: 'US$99',
          credits: '1500 credits per month',
        },
        onetime: {
          price: 'US$99',
          credits: '1500 one-time credits',
        },
        features: ['Built for SKU batches', 'Largest credit reserve', 'Frequent creative testing'],
      },
    ],
    value: {
      items: [
        {
          title: 'Launch batches',
          text: 'Generate hero images, PDP visuals, and short product videos together.',
        },
        {
          title: 'Ad testing',
          text: 'Explore styles and scenes faster before scaling paid campaigns.',
        },
        {
          title: 'Workspace flow',
          text: 'Plan recurring production with credits and avoid one-off outsourcing.',
        },
      ],
      title: 'Why the plans are easy to budget',
      points: [
        'Subscriptions provide predictable monthly creative capacity.',
        'Top-up credits are available when a campaign needs more output.',
        'The workspace keeps plan, balance, and usage history in one place.',
      ],
      includedTitle: 'Included in the workspace',
      included: [
        'Full access to image, video, and try-on tools',
        'Monthly and annual Basic, Plus, and Pro plans',
        'One-time credit purchases for extra capacity',
        'Credit ledger for reviewing account activity',
      ],
    },
    faq: {
      title: 'Subscription and credits',
      items: [
        {
          question: 'Are there monthly and annual plans?',
          answer: 'Yes. Basic, Plus, and Pro are available with monthly or annual billing.',
        },
        {
          question: 'Can I buy credits without changing plans?',
          answer: 'Yes. Use the workspace credits page to buy one-time top-ups.',
        },
        {
          question: 'Will checkout charge real money now?',
          answer: 'No. Checkout is mocked for this development phase.',
        },
        {
          question: 'Where do I manage my plan?',
          answer: 'The public pricing page leads to the workspace Plans page.',
        },
        {
          question: 'Do credits work across tools?',
          answer: 'Yes. The same wallet is used by image, video, and try-on generations.',
        },
      ],
    },
  },
};

const zh: MarketingContent = {
  ...pt,
  locale: 'zh',
  localeLabel: '中文',
  nav: {
    home: '首页',
    textToImage: '文生图',
    pricing: '价格',
    login: '登录',
    language: '切换语言',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
  },
  navItems: [
    { label: '首页', href: '' },
    { label: '模板', href: '/templates' },
    { label: '价格', href: '/pricing' },
    { label: '工作台', href: '/dashboard', localized: false },
  ],
  footer: {
    ...pt.footer,
    resources: '资源',
    resourceLabel: 'gptimage 素材生成器',
    languages: '语言',
    legal: '法律',
    privacy: '隐私政策',
    terms: '服务条款',
    contact: '联系',
  },
  auth: {
    ...pt.auth,
    metadata: {
      title: '登录 gptimage — 电商 AI 工作室',
      description: '登录或注册 gptimage，用 AI 生成电商图片、视频和营销素材。',
    },
    title: '登录 gptimage',
    subtitle: '使用邮箱和密码访问你的工作台',
    loginTab: '登录',
    registerTab: '注册',
    emailLabel: '邮箱',
    passwordLabel: '密码',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: '至少 8 个字符',
    verificationCodeLabel: '验证码',
    verificationCodePlaceholder: '6 位数字',
    sendVerificationCode: '发送验证码',
    sendingVerificationCode: '发送中',
    verificationCodeSent: '如果该邮箱可以创建账号，我们已发送验证码。',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
    signIn: '登录',
    register: '创建账号',
    loading: '处理中...',
    switchToRegisterPrompt: '还没有账号？',
    switchToRegister: '创建账号',
    switchToLoginPrompt: '已有账号？',
    switchToLogin: '登录',
    benefits: ['商品图片', '竖版视频', '新用户算力值', '安全支付'],
    errors: {
      invalidCredentials: '邮箱或密码不正确，请重试。',
      registerFailed: '账号创建失败，请重试。',
      invalidVerificationCode: '验证码无效或已过期。',
      rateLimited: '尝试次数过多，请稍后再试。',
      invalidEmail: '请输入有效邮箱。',
      weakPassword: '密码至少需要 8 个字符。',
      fallback: '暂时无法完成操作，请重试。',
    },
  },
  home: {
    ...pt.home,
    metadata: {
      title: 'gptimage — 面向电商的 AI 素材工作室',
      description: '用 AI 生成电商商品视频、商品图和营销素材。',
    },
    hero: {
      ...pt.home.hero,
      eyebrow: '面向巴西电商的模板',
      title: '选择模板，换成你的商品，生成能卖货的素材。',
      description:
        '从 PT-BR 模板开始，覆盖 Pix、WhatsApp、电商平台和广告。先低成本生成图片，合适时再升级为视频。',
      primaryAction: '浏览模板',
      secondaryAction: '查看图片模板',
      previewTitle: '可编辑提示词',
      previewText: '每个模板都预置适合巴西市场的提示词和创意结构。',
      previewItems: [
        '面向促销、用户口碑和上新的巴西葡语提示词。',
        '适合 Pix、WhatsApp、电商平台和独立站的购买方向。',
        '在消耗视频算力值前，模板和提示词都可以自由修改。',
      ],
      stats: [
        { stat: '74', label: '个模板' },
        { stat: '1', label: '图片算力值' },
        { stat: 'PT-BR', label: '本地话术' },
      ],
    },
    examples: {
      ...pt.home.examples,
      eyebrow: '电商 AI 创意库',
      title: '高转化电商案例',
      description:
        '覆盖商品视频、生活方式场景、社媒动效和详情页商品展示，适配每个 SKU。',
      videoLabel: '视频',
      imageLabel: '图片',
      promptLabel: '提示词',
      items: zhVideoExamples,
    },
    templates: {
      ...pt.home.templates,
      eyebrow: '模板库',
      title: '先选择最适合卖这个商品的视频类型',
      description:
        '卡片只展示模板类目和缩略图。打开详情后可查看预览和提示词，再用自己的商品图继续编辑。',
      actionLabel: '使用模板',
    },
    workflow: {
      ...pt.home.workflow,
      eyebrow: '低成本路径',
      title: '先图片，后视频',
      description:
        '这条体验贴合电商卖家的真实习惯：先用便宜图片测试创意，调好文案，再升级成视频。',
      steps: [
        {
          title: '从图片开始',
          text: '使用横幅、详情页和促销模板，低成本生成视觉基础。',
        },
        {
          title: '自由编辑提示词',
          text: '模板提供提示词和结构，但用户可以重写全部内容。',
        },
        {
          title: '升级成视频',
          text: '当图片验证方向后，再用图生视频加入运动和变体。',
        },
      ],
    },
    faq: {
      title: '常见问题',
      items: [
        {
          question: '模板会限制提示词吗？',
          answer:
            '不会。模板只是预填一个好的起点，包括说明、提示词和视觉方向，用户可以编辑完整提示词。',
        },
        {
          question: '必须一开始就生成视频吗？',
          answer:
            '不需要。产品路径是先低成本生成图片，确认创意方向后再升级成视频。',
        },
        {
          question: '这些卖点文案是面向巴西的吗？',
          answer:
            '是的。示例优先考虑 PT-BR、Pix、WhatsApp、电商平台和直接的社媒电商表达。',
        },
        {
          question: '点击模板后会发生什么？',
          answer: '第一版中，用户会登录或注册，然后继续使用所选模板。',
        },
      ],
    },
    cta: {
      title: '从模板开始，再适配你的商品',
      description: '把促销、评价和演示创意变成可以马上测试的素材。',
      action: '登录并使用模板',
    },
  },
  textToImage: {
    ...pt.textToImage,
    metadata: {
      title: 'gptimage 文生图 — 电商素材生成器',
      description: '用文字描述生成专业商品图和电商素材。',
    },
    hero: {
      ...pt.textToImage.hero,
      eyebrow: 'AI 商品图工作室',
      title: '文字生成商品图片',
      description:
        '描述场景、构图和风格，生成可用于详情页、横幅和广告的电商图片。',
      promptLabel: '提示词',
      promptPlaceholder: '描述商品、场景、构图、背景和商业用途...',
      settingsTitle: '生成设置',
      settingsAction: '打开设置',
      generate: '生成图片',
      credit: '1 算力值',
      chips: ['白底图', '详情页细节', '生活方式场景', '促销横幅', '社媒广告'],
    },
    examples: {
      ...pt.textToImage.examples,
      eyebrow: '电商 AI 创意库',
      title: '高转化电商案例',
      description: '生成主图、详情页细节、品牌海报和活动横幅等商业素材。',
      videoLabel: '视频',
      imageLabel: '图片',
      promptLabel: '提示词',
      items: zhImageExamples,
    },
  },
  pricing: {
    ...pt.pricing,
    metadata: {
      title: 'gptimage 价格 — 面向电商的灵活套餐',
      description: '了解 gptimage 的 AI 图片、视频和营销素材生成套餐。',
    },
    hero: {
      ...pt.pricing.hero,
      eyebrow: '电商 AI 产能',
      title: '为电商内容生产设计的套餐',
      description:
        '用可预期的算力值规划上新、广告创意、商品图和高质量视频产能。',
      badges: ['每次上新覆盖图片+视频', '降低外包制作成本', '付款后算力值可用'],
      stats: [
        { stat: '3', label: '订阅档位' },
        { stat: '2', label: '付费周期' },
        { stat: '1', label: '算力值余额' },
      ],
    },
    tabs: {
      ...pt.pricing.tabs,
      yearly: '年付',
      monthly: '月付',
      onetime: '单次购买',
      save: '节省 20%',
      secure: '在工作台查看订阅和算力值',
      buy: '进入订阅',
      popular: '最受欢迎',
      perMonth: '每月',
    },
    plans: [
      {
        name: 'Basic',
        description: '适合刚开始测试 AI 商品素材的店铺。',
        yearly: {
          price: 'US$9.58',
          credits: '每月 150 算力值，按年付费',
        },
        monthly: {
          price: 'US$12',
          credits: '每月 150 算力值',
        },
        onetime: {
          price: 'US$9',
          credits: '100 个一次性算力值',
        },
        features: ['包含全部创作工具', '支持图片、视频和试衣', '适合小规模测试'],
      },
      {
        name: 'Plus',
        description: '适合持续上新和每周广告素材生产。',
        yearly: {
          oldPrice: 'US$39',
          price: 'US$31.17',
          credits: '每月 600 算力值，按年付费',
        },
        monthly: {
          price: 'US$39',
          credits: '每月 600 算力值',
        },
        onetime: {
          price: 'US$39',
          credits: '500 个一次性算力值',
        },
        features: ['更适合活动批量生产', '支持图片、视频和试衣', '推荐给每周使用的卖家'],
        highlighted: true,
      },
      {
        name: 'Pro',
        description: '适合品牌、SKU 批量生产和高频创意测试。',
        yearly: {
          oldPrice: 'US$99',
          price: 'US$79.17',
          credits: '每月 1500 算力值，按年付费',
        },
        monthly: {
          price: 'US$99',
          credits: '每月 1500 算力值',
        },
        onetime: {
          price: 'US$99',
          credits: '1500 个一次性算力值',
        },
        features: ['适合 SKU 批量生产', '最大订阅算力值额度', '支持高频创意测试'],
      },
    ],
    value: {
      items: [
        {
          title: '上新批量生产',
          text: '围绕同一个 SKU 同时生成主图、详情页视觉和短视频。',
        },
        {
          title: '广告测试',
          text: '更快探索不同风格和场景，再决定是否放大投放。',
        },
        {
          title: '工作台管理',
          text: '订阅、余额、额外充值和流水都集中在用户工作台里。',
        },
      ],
      title: '为什么算力值套餐更容易规划',
      points: [
        '订阅提供可预期的每月创作额度。',
        '活动临时需要更多产能时，可以单独购买算力值。',
        '工作台会展示当前计划、余额和算力流水。',
      ],
      includedTitle: '工作台内包含',
      included: [
        '图片、视频和智能试衣工具',
        'Basic、Plus、Pro 的月付和年付订阅',
        '额外算力值购买入口',
        '用于查看账户变化的算力流水',
      ],
    },
    faq: {
      title: '订阅和算力值',
      items: [
        {
          question: '是否支持月付和年付？',
          answer: '支持。Basic、Plus、Pro 都有月付和年付两个周期。',
        },
        {
          question: '不改订阅也能买算力值吗？',
          answer: '可以。进入工作台算力页即可购买一次性算力包。',
        },
        {
          question: '现在会真的扣款吗？',
          answer: '不会。当前为测试支付模式，不会产生真实费用。',
        },
        {
          question: '在哪里管理订阅？',
          answer: '价格页会引导到工作台里的订阅计划页。',
        },
        {
          question: '算力值能用于哪些工具？',
          answer: '同一个算力值余额可用于图片、视频和智能试衣生成。',
        },
      ],
    },
  },
};

const contentByLocale: Record<Locale, MarketingContent> = {
  pt,
  en,
  zh,
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as (typeof locales)[number]);
}

export function getMarketingContent(locale: Locale) {
  return contentByLocale[locale];
}

export function getLocalizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`;
}
