import type { Locale } from '@/lib/marketing/content';

type PolicySection = {
  title: string;
  body: string[];
};

type PolicyContent = {
  title: string;
  eyebrow: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
};

const policyContent: Record<'en' | 'pt', PolicyContent> = {
  en: {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    updated: 'Last updated: June 27, 2026',
    intro:
      'This Privacy Policy explains how Vendeo collects, uses, stores, and protects information when you use our AI commerce studio, including product image, video, try-on, template, account, billing, and support features.',
    sections: [
      {
        title: 'Information we collect',
        body: [
          'Account information, such as your email address, authentication details, workspace settings, and subscription or credit balance metadata.',
          'Content you provide, including prompts, uploaded product images, garment or model references, generated media, template selections, and related generation settings.',
          'Usage and technical information, such as pages viewed, feature interactions, device and browser details, IP address, logs, cookies, and similar diagnostics.',
          'Payment and billing metadata, such as checkout identifiers, plan names, credit package details, transaction status, and billing provider references. We do not store full payment card numbers.',
        ],
      },
      {
        title: 'How we use information',
        body: [
          'To provide the service, process uploads, run AI generation jobs, store generated results, manage templates, and maintain your workspace history.',
          'To manage accounts, credits, subscriptions, checkout, security, fraud prevention, support requests, and service communications.',
          'To improve reliability, performance, product quality, analytics, debugging, and abuse prevention.',
          'To comply with legal obligations, enforce our terms, and protect the rights, safety, and integrity of users and the service.',
        ],
      },
      {
        title: 'Generated content and uploads',
        body: [
          'You are responsible for the images, prompts, references, and other content you upload or submit. Do not upload content that you do not have the right to use.',
          'We may process uploaded and generated content through infrastructure providers and AI model providers solely to operate, secure, and improve the service.',
          'Private user media is intended for your workspace and should not be treated as public content unless you choose to share or publish it outside the service.',
        ],
      },
      {
        title: 'Sharing and service providers',
        body: [
          'We may share information with hosting, database, storage, analytics, email, payment, security, customer support, and AI infrastructure providers that help us operate the service.',
          'We may disclose information if required by law, legal process, or a good-faith belief that disclosure is necessary to protect users, the public, or the service.',
          'We do not sell your personal information.',
        ],
      },
      {
        title: 'Cookies and analytics',
        body: [
          'We use cookies, local storage, and similar technologies to keep you signed in, remember preferences, protect sessions, measure usage, and improve the product.',
          'You can control cookies through your browser settings, but some features may not work correctly if essential cookies are disabled.',
        ],
      },
      {
        title: 'Retention and security',
        body: [
          'We keep information for as long as needed to provide the service, maintain records, comply with legal obligations, resolve disputes, and enforce agreements.',
          'We use reasonable administrative, technical, and organizational safeguards to protect information. No online service can guarantee absolute security.',
        ],
      },
      {
        title: 'Your choices',
        body: [
          'You may request access, correction, export, deletion, or restriction of your personal information where applicable law gives you those rights.',
          'You may unsubscribe from non-essential communications, manage account settings in your workspace, or contact us for privacy requests.',
        ],
      },
      {
        title: 'International transfers',
        body: [
          'We may process and store information in countries other than where you live. When required, we use appropriate safeguards for cross-border transfers.',
        ],
      },
      {
        title: 'Children',
        body: [
          'The service is not directed to children under 13, and we do not knowingly collect personal information from children under 13.',
        ],
      },
      {
        title: 'Contact',
        body: [
          'For privacy questions or requests, contact us at support@8ilx.com.',
        ],
      },
      {
        title: 'Changes to this policy',
        body: [
          'We may update this Privacy Policy from time to time. When we make material changes, we will update the date above and provide additional notice when appropriate.',
        ],
      },
    ],
  },
  pt: {
    eyebrow: 'Legal',
    title: 'Politica de Privacidade',
    updated: 'Atualizado em: 27 de junho de 2026',
    intro:
      'Esta Politica de Privacidade explica como o Vendeo coleta, usa, armazena e protege informacoes quando voce usa nosso estudio de IA para comercio, incluindo recursos de imagem de produto, video, try-on, templates, conta, billing e suporte.',
    sections: [
      {
        title: 'Informacoes que coletamos',
        body: [
          'Informacoes de conta, como endereco de email, detalhes de autenticacao, configuracoes do workspace e metadados de assinatura ou saldo de creditos.',
          'Conteudo que voce fornece, incluindo prompts, imagens de produto enviadas, referencias de roupa ou modelo, midias geradas, templates selecionados e configuracoes de geracao relacionadas.',
          'Informacoes tecnicas e de uso, como paginas acessadas, interacoes com recursos, dados de dispositivo e navegador, endereco IP, logs, cookies e diagnosticos semelhantes.',
          'Metadados de pagamento e billing, como identificadores de checkout, nomes de planos, detalhes de pacotes de credito, status de transacao e referencias do provedor de pagamento. Nao armazenamos numeros completos de cartao.',
        ],
      },
      {
        title: 'Como usamos informacoes',
        body: [
          'Para fornecer o servico, processar uploads, executar geracoes com IA, armazenar resultados, gerenciar templates e manter seu historico no workspace.',
          'Para gerenciar contas, creditos, assinaturas, checkout, seguranca, prevencao de fraude, suporte e comunicacoes sobre o servico.',
          'Para melhorar confiabilidade, desempenho, qualidade do produto, analytics, depuracao e prevencao de abuso.',
          'Para cumprir obrigacoes legais, aplicar nossos termos e proteger direitos, seguranca e integridade dos usuarios e do servico.',
        ],
      },
      {
        title: 'Conteudo gerado e uploads',
        body: [
          'Voce e responsavel pelas imagens, prompts, referencias e outros conteudos que envia. Nao envie conteudo que voce nao tenha direito de usar.',
          'Podemos processar conteudo enviado e gerado por meio de provedores de infraestrutura e provedores de modelos de IA somente para operar, proteger e melhorar o servico.',
          'Midias privadas do usuario sao destinadas ao seu workspace e nao devem ser tratadas como conteudo publico, a menos que voce escolha compartilhar ou publicar fora do servico.',
        ],
      },
      {
        title: 'Compartilhamento e provedores',
        body: [
          'Podemos compartilhar informacoes com provedores de hospedagem, banco de dados, armazenamento, analytics, email, pagamento, seguranca, suporte ao cliente e infraestrutura de IA que ajudam a operar o servico.',
          'Podemos divulgar informacoes se exigido por lei, processo legal ou por crenca de boa-fe de que a divulgacao e necessaria para proteger usuarios, o publico ou o servico.',
          'Nao vendemos suas informacoes pessoais.',
        ],
      },
      {
        title: 'Cookies e analytics',
        body: [
          'Usamos cookies, armazenamento local e tecnologias semelhantes para manter voce conectado, lembrar preferencias, proteger sessoes, medir uso e melhorar o produto.',
          'Voce pode controlar cookies nas configuracoes do navegador, mas alguns recursos podem nao funcionar corretamente se cookies essenciais forem desativados.',
        ],
      },
      {
        title: 'Retencao e seguranca',
        body: [
          'Mantemos informacoes pelo tempo necessario para fornecer o servico, manter registros, cumprir obrigacoes legais, resolver disputas e aplicar acordos.',
          'Usamos salvaguardas administrativas, tecnicas e organizacionais razoaveis para proteger informacoes. Nenhum servico online pode garantir seguranca absoluta.',
        ],
      },
      {
        title: 'Suas escolhas',
        body: [
          'Voce pode solicitar acesso, correcao, exportacao, exclusao ou restricao das suas informacoes pessoais quando a lei aplicavel conceder esses direitos.',
          'Voce pode cancelar comunicacoes nao essenciais, gerenciar configuracoes da conta no workspace ou entrar em contato para solicitacoes de privacidade.',
        ],
      },
      {
        title: 'Transferencias internacionais',
        body: [
          'Podemos processar e armazenar informacoes em paises diferentes daquele onde voce mora. Quando exigido, usamos salvaguardas apropriadas para transferencias internacionais.',
        ],
      },
      {
        title: 'Criancas',
        body: [
          'O servico nao e direcionado a criancas menores de 13 anos, e nao coletamos intencionalmente informacoes pessoais de criancas menores de 13 anos.',
        ],
      },
      {
        title: 'Contato',
        body: [
          'Para duvidas ou solicitacoes sobre privacidade, entre em contato pelo email support@8ilx.com.',
        ],
      },
      {
        title: 'Alteracoes nesta politica',
        body: [
          'Podemos atualizar esta Politica de Privacidade periodicamente. Quando fizermos alteracoes materiais, atualizaremos a data acima e forneceremos aviso adicional quando apropriado.',
        ],
      },
    ],
  },
};

export function PrivacyPolicyPage({ locale }: { locale: Locale }) {
  const content = policyContent[locale === 'pt' ? 'pt' : 'en'];

  return (
    <main className="bg-gray-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
          {content.title}
        </h1>
        <p className="mt-4 text-sm font-medium text-white/50">
          {content.updated}
        </p>
        <p className="mt-8 text-base leading-8 text-white/68">
          {content.intro}
        </p>
        <div className="mt-12 grid gap-8">
          {content.sections.map((section) => (
            <section key={section.title} className="border-t border-white/10 pt-8">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {section.title}
              </h2>
              <div className="mt-4 grid gap-4 text-sm leading-7 text-white/62">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
