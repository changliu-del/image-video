import {
  BadgeDollarSign,
  CheckCircle2,
  Clock,
  Film,
  Layers,
  MessageSquareText,
  Palette,
  ShoppingBag,
  Sparkles,
  Upload,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';

// ---- Examples ----
export interface ExampleItem {
  title: string;
  caption: string;
  tone: string;
  accent: string;
}

export const examples: ExampleItem[] = [
  {
    title: 'Cosmeticos',
    caption: 'Luz suave, reflexos limpos e movimento de vitrine.',
    tone: 'bg-rose-100',
    accent: 'bg-rose-500',
  },
  {
    title: 'Tecnologia',
    caption: 'Produto em destaque com ritmo de anuncio social.',
    tone: 'bg-indigo-100',
    accent: 'bg-indigo-500',
  },
  {
    title: 'Moda',
    caption: 'Cortes verticais para colecoes e lancamentos rapidos.',
    tone: 'bg-emerald-100',
    accent: 'bg-emerald-500',
  },
];

// ---- Capabilities ----
export interface CapabilityItem {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const capabilities: CapabilityItem[] = [
  {
    icon: ShoppingBag,
    title: 'Imagem de produto para video',
    text: 'Envie uma foto e gere uma peca curta pronta para campanha.',
  },
  {
    icon: Palette,
    title: 'Estilos comerciais',
    text: 'Use modelos para lancamento, best seller ou promocao relampago.',
  },
  {
    icon: Layers,
    title: 'Formatos para canais',
    text: 'Crie versoes 9:16, 1:1 e 16:9 para social, loja e landing pages.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Creditos transparentes',
    text: 'Cada geracao reserva creditos antes de chamar a API de video.',
  },
];

// ---- Steps ----
export interface StepItem {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const steps: StepItem[] = [
  {
    icon: Upload,
    title: 'Carregue a imagem',
    text: 'Escolha uma foto clara do produto e informe o nome da campanha.',
  },
  {
    icon: WandSparkles,
    title: 'Ajuste o briefing',
    text: 'Defina headline, beneficio principal, preco e chamada para acao.',
  },
  {
    icon: Film,
    title: 'Receba o video',
    text: 'Acompanhe a fila, renderizacao e resultado final no dashboard.',
  },
];

// ---- FAQ ----
export interface FaqItem {
  question: string;
  answer: string;
}

export const faqs: FaqItem[] = [
  {
    question: 'Preciso editar video manualmente?',
    answer: 'Nao. O fluxo gera o video e aplica os textos de campanha em uma etapa separada.',
  },
  {
    question: 'Posso criar varios videos?',
    answer: 'Sim. O produto trabalha por creditos, entao cada job fica registrado e auditavel.',
  },
  {
    question: 'Onde vejo meu saldo?',
    answer: 'O saldo fica no seu dashboard pessoal e tambem pode ser ajustado pelo admin.',
  },
];

// ---- Hero badges ----
export const aspectRatios = ['9:16', '1:1', '16:9'];
