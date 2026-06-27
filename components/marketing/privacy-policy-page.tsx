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
    title: 'Política de Privacidade',
    updated: 'Atualizado em: 27 de junho de 2026',
    intro:
      'Esta Política de Privacidade explica como o Vendeo coleta, usa, armazena e protege informações quando você usa nosso estúdio de IA para e-commerce, incluindo recursos de imagem de produto, vídeo, provador virtual, templates, conta, pagamento e suporte.',
    sections: [
      {
        title: 'Informações que coletamos',
        body: [
          'Informações da conta, como endereço de e-mail, dados de autenticação, configurações da área de trabalho e metadados de assinatura ou saldo de créditos.',
          'Conteúdo que você fornece, incluindo prompts, imagens de produto enviadas, referências de roupa ou modelo, mídias geradas, templates selecionados e configurações de geração relacionadas.',
          'Informações técnicas e de uso, como páginas acessadas, interações com recursos, dados de dispositivo e navegador, endereço IP, logs, cookies e diagnósticos semelhantes.',
          'Metadados de pagamento e cobrança, como identificadores de checkout, nomes de planos, detalhes de pacotes de crédito, status de transação e referências do provedor de pagamento. Não armazenamos números completos de cartão.',
        ],
      },
      {
        title: 'Como usamos as informações',
        body: [
          'Para fornecer o serviço, processar uploads, executar gerações com IA, armazenar resultados, gerenciar templates e manter seu histórico na área de trabalho.',
          'Para gerenciar contas, créditos, assinaturas, checkout, segurança, prevenção de fraude, suporte e comunicações sobre o serviço.',
          'Para melhorar confiabilidade, desempenho, qualidade do produto, análises, depuração e prevenção de abuso.',
          'Para cumprir obrigações legais, aplicar nossos termos e proteger direitos, segurança e integridade dos usuários e do serviço.',
        ],
      },
      {
        title: 'Conteúdo gerado e uploads',
        body: [
          'Você é responsável pelas imagens, prompts, referências e outros conteúdos que envia. Não envie conteúdo que você não tenha direito de usar.',
          'Podemos processar conteúdo enviado e gerado por meio de provedores de infraestrutura e provedores de modelos de IA somente para operar, proteger e melhorar o serviço.',
          'Mídias privadas do usuário são destinadas à sua área de trabalho e não devem ser tratadas como conteúdo público, a menos que você escolha compartilhar ou publicar fora do serviço.',
        ],
      },
      {
        title: 'Compartilhamento e provedores',
        body: [
          'Podemos compartilhar informações com provedores de hospedagem, banco de dados, armazenamento, análises, e-mail, pagamento, segurança, suporte ao cliente e infraestrutura de IA que ajudam a operar o serviço.',
          'Podemos divulgar informações se exigido por lei, processo legal ou por crença de boa-fé de que a divulgação é necessária para proteger usuários, o público ou o serviço.',
          'Não vendemos suas informações pessoais.',
        ],
      },
      {
        title: 'Cookies e análises',
        body: [
          'Usamos cookies, armazenamento local e tecnologias semelhantes para manter você conectado, lembrar preferências, proteger sessões, medir uso e melhorar o produto.',
          'Você pode controlar cookies nas configurações do navegador, mas alguns recursos podem não funcionar corretamente se cookies essenciais forem desativados.',
        ],
      },
      {
        title: 'Retenção e segurança',
        body: [
          'Mantemos informações pelo tempo necessário para fornecer o serviço, manter registros, cumprir obrigações legais, resolver disputas e aplicar acordos.',
          'Usamos salvaguardas administrativas, técnicas e organizacionais razoáveis para proteger informações. Nenhum serviço online pode garantir segurança absoluta.',
        ],
      },
      {
        title: 'Suas escolhas',
        body: [
          'Você pode solicitar acesso, correção, exportação, exclusão ou restrição das suas informações pessoais quando a lei aplicável conceder esses direitos.',
          'Você pode cancelar comunicações não essenciais, gerenciar configurações da conta na área de trabalho ou entrar em contato para solicitações de privacidade.',
        ],
      },
      {
        title: 'Transferências internacionais',
        body: [
          'Podemos processar e armazenar informações em países diferentes daquele onde você mora. Quando exigido, usamos salvaguardas apropriadas para transferências internacionais.',
        ],
      },
      {
        title: 'Crianças',
        body: [
          'O serviço não é direcionado a crianças menores de 13 anos, e não coletamos intencionalmente informações pessoais de crianças menores de 13 anos.',
        ],
      },
      {
        title: 'Contato',
        body: [
          'Para dúvidas ou solicitações sobre privacidade, entre em contato pelo e-mail support@8ilx.com.',
        ],
      },
      {
        title: 'Alterações nesta política',
        body: [
          'Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos alterações materiais, atualizaremos a data acima e forneceremos aviso adicional quando apropriado.',
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
