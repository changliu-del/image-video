type WanxiangTemplateType = 'image_to_image' | 'try_on';
type WanxiangLocale = 'pt' | 'en';
type LocalizedText = Record<WanxiangLocale, string>;

type WanxiangLocalizationInput = {
  category: string;
  prompt: string;
  sourceCategory: string;
  title: string;
  type: WanxiangTemplateType;
};

type PhraseTranslations = {
  en: string;
  pt: string;
};

const categoryLabels: Record<string, PhraseTranslations> = {
  goods_display_window: {
    en: 'product display',
    pt: 'vitrine de produto',
  },
  goods_nature: {
    en: 'natural landscape',
    pt: 'paisagem natural',
  },
  goods_festival: {
    en: 'festive atmosphere',
    pt: 'clima de data comemorativa',
  },
  goods_architecture: {
    en: 'architecture scene',
    pt: 'cena arquitetonica',
  },
  goods_abstract: {
    en: 'abstract concept',
    pt: 'conceito abstrato',
  },
  goods_interior: {
    en: 'indoor space',
    pt: 'espaco interno',
  },
  tryon_solid_background: {
    en: 'solid-color background',
    pt: 'fundo de cor solida',
  },
  tryon_outdoor_commercial: {
    en: 'outdoor commercial shoot',
    pt: 'ensaio comercial externo',
  },
  tryon_indoor_commercial: {
    en: 'indoor commercial shoot',
    pt: 'ensaio comercial interno',
  },
  tryon_outdoor_casual: {
    en: 'outdoor casual shoot',
    pt: 'ensaio casual externo',
  },
  tryon_indoor_casual: {
    en: 'indoor casual shoot',
    pt: 'ensaio casual interno',
  },
};

const titlePhraseMap: Record<string, PhraseTranslations> = {
  纯色背景: { en: 'solid background', pt: 'fundo solido' },
  户外商拍: { en: 'outdoor commercial', pt: 'comercial externo' },
  室内商拍: { en: 'indoor commercial', pt: 'comercial interno' },
  户外随拍: { en: 'outdoor casual', pt: 'casual externo' },
  室内随拍: { en: 'indoor casual', pt: 'casual interno' },
  展台橱窗: { en: 'display window', pt: 'vitrine' },
  自然景观: { en: 'natural landscape', pt: 'paisagem natural' },
  节日氛围: { en: 'festive mood', pt: 'clima festivo' },
  人文建筑: { en: 'architecture', pt: 'arquitetura' },
  抽象概念: { en: 'abstract concept', pt: 'conceito abstrato' },
  室内空间: { en: 'indoor space', pt: 'espaco interno' },
  简约: { en: 'minimal', pt: 'minimalista' },
  素雅: { en: 'soft elegant', pt: 'suave elegante' },
  优雅: { en: 'elegant', pt: 'elegante' },
  典雅: { en: 'classic elegant', pt: 'classico elegante' },
  复古: { en: 'vintage', pt: 'vintage' },
  古典: { en: 'classic', pt: 'classico' },
  暖阳: { en: 'warm sunlight', pt: 'sol quente' },
  暖调: { en: 'warm tone', pt: 'tom quente' },
  暖色: { en: 'warm color', pt: 'cor quente' },
  暖黄: { en: 'warm yellow', pt: 'amarelo quente' },
  白调: { en: 'white tone', pt: 'tom branco' },
  灰白: { en: 'gray white', pt: 'cinza branco' },
  黑色: { en: 'black', pt: 'preto' },
  米色: { en: 'beige', pt: 'bege' },
  红韵: { en: 'red mood', pt: 'clima vermelho' },
  橙韵: { en: 'orange mood', pt: 'clima laranja' },
  绿色: { en: 'green', pt: 'verde' },
  清新: { en: 'fresh', pt: 'fresco' },
  蓝调: { en: 'blue tone', pt: 'tom azul' },
  紫粉: { en: 'purple pink', pt: 'roxo rosa' },
  米黄: { en: 'warm beige', pt: 'bege quente' },
  朱红: { en: 'vermilion', pt: 'vermelho vivo' },
  城市: { en: 'city', pt: 'cidade' },
  都市: { en: 'urban', pt: 'urbano' },
  街头: { en: 'street', pt: 'rua' },
  街边: { en: 'street side', pt: 'beira da rua' },
  街角: { en: 'street corner', pt: 'esquina' },
  街景: { en: 'street scene', pt: 'cena de rua' },
  海边: { en: 'seaside', pt: 'beira-mar' },
  草地: { en: 'grassland', pt: 'gramado' },
  林间: { en: 'forest', pt: 'floresta' },
  花海: { en: 'flower field', pt: 'campo de flores' },
  庭院: { en: 'courtyard', pt: 'patio' },
  绿野: { en: 'green field', pt: 'campo verde' },
  田园: { en: 'countryside', pt: 'campo' },
  雪山: { en: 'snow mountain', pt: 'montanha nevada' },
  沙漠: { en: 'desert', pt: 'deserto' },
  巨石: { en: 'boulder', pt: 'rocha gigante' },
  碧海: { en: 'blue sea', pt: 'mar azul' },
  春日: { en: 'spring day', pt: 'dia de primavera' },
  秋日: { en: 'autumn day', pt: 'dia de outono' },
  圣诞: { en: 'Christmas', pt: 'Natal' },
  古街: { en: 'old street', pt: 'rua antiga' },
  欧式: { en: 'European style', pt: 'estilo europeu' },
  砖墙: { en: 'brick wall', pt: 'parede de tijolos' },
  绿植: { en: 'green plants', pt: 'plantas verdes' },
  白墙: { en: 'white wall', pt: 'parede branca' },
  窗边: { en: 'by the window', pt: 'junto a janela' },
  窗前: { en: 'in front of window', pt: 'frente a janela' },
  居室: { en: 'living room', pt: 'sala residencial' },
  房间: { en: 'room', pt: 'quarto' },
  书房: { en: 'study room', pt: 'escritorio de leitura' },
  家居: { en: 'home interior', pt: 'interior residencial' },
  客厅: { en: 'living room', pt: 'sala de estar' },
  橱窗: { en: 'shop window', pt: 'vitrine' },
  咖啡: { en: 'coffee', pt: 'cafe' },
  时尚: { en: 'fashion', pt: 'moda' },
  暖舍: { en: 'warm house', pt: 'casa aconchegante' },
  石凳: { en: 'stone bench', pt: 'banco de pedra' },
  拱廊: { en: 'arcade', pt: 'arcada' },
  公园: { en: 'park', pt: 'parque' },
  花园: { en: 'garden', pt: 'jardim' },
  长桥: { en: 'long bridge', pt: 'ponte longa' },
  车厢: { en: 'carriage', pt: 'vagao' },
  小院: { en: 'small courtyard', pt: 'pequeno patio' },
  石台: { en: 'stone platform', pt: 'plataforma de pedra' },
  展台: { en: 'display platform', pt: 'plataforma de exposicao' },
  空间: { en: 'space', pt: 'espaco' },
  台面: { en: 'tabletop', pt: 'superficie' },
  白台: { en: 'white platform', pt: 'plataforma branca' },
  金色: { en: 'golden', pt: 'dourado' },
  玻璃: { en: 'glass', pt: 'vidro' },
  鲜花: { en: 'flowers', pt: 'flores' },
  流光: { en: 'flowing light', pt: 'luz fluida' },
  彩虹: { en: 'rainbow', pt: 'arco-iris' },
  云朵: { en: 'clouds', pt: 'nuvens' },
  奢华: { en: 'luxury', pt: 'luxo' },
  光照: { en: 'lighting', pt: 'iluminacao' },
  活力: { en: 'energy', pt: 'energia' },
  星空: { en: 'starry sky', pt: 'ceu estrelado' },
  鲸鱼: { en: 'whale', pt: 'baleia' },
  几何: { en: 'geometry', pt: 'geometria' },
  天堂: { en: 'heaven', pt: 'paraiso' },
  梦幻: { en: 'dreamy', pt: 'sonhador' },
  科技: { en: 'technology', pt: 'tecnologia' },
  悬浮: { en: 'floating', pt: 'flutuante' },
  冰雪: { en: 'ice and snow', pt: 'gelo e neve' },
  沙滩: { en: 'beach', pt: 'praia' },
  农场: { en: 'farm', pt: 'fazenda' },
  营地: { en: 'camp', pt: 'acampamento' },
  黄昏: { en: 'dusk', pt: 'anoitecer' },
  绿意: { en: 'greenery', pt: 'verde' },
  丛林: { en: 'jungle', pt: 'selva' },
  山谷: { en: 'valley', pt: 'vale' },
  圆月: { en: 'full moon', pt: 'lua cheia' },
  派对: { en: 'party', pt: 'festa' },
  浪漫: { en: 'romantic', pt: 'romantico' },
  夏日: { en: 'summer', pt: 'verao' },
  冬日: { en: 'winter day', pt: 'dia de inverno' },
  春花: { en: 'spring flowers', pt: 'flores de primavera' },
  松针: { en: 'pine needles', pt: 'agulhas de pinheiro' },
  礼盒: { en: 'gift box', pt: 'caixa de presente' },
  情人: { en: 'valentine', pt: 'namorados' },
  荷塘: { en: 'lotus pond', pt: 'lago de lotus' },
  月色: { en: 'moonlight', pt: 'luar' },
  纸屑: { en: 'confetti', pt: 'confetes' },
  气球: { en: 'balloons', pt: 'baloes' },
  万圣节: { en: 'Halloween', pt: 'Halloween' },
};

const promptPhraseMap: Record<string, PhraseTranslations> = {
  产品摄影: { en: 'product photography', pt: 'fotografia de produto' },
  广告摄影: { en: 'advertising photography', pt: 'fotografia publicitaria' },
  极简风格: { en: 'minimal style', pt: 'estilo minimalista' },
  高端: { en: 'premium', pt: 'premium' },
  商业: { en: 'commercial', pt: 'comercial' },
  生活方式: { en: 'lifestyle', pt: 'lifestyle' },
  时尚摄影: { en: 'fashion photography', pt: 'fotografia de moda' },
  中景镜头: { en: 'medium shot', pt: 'plano medio' },
  中景: { en: 'medium shot', pt: 'plano medio' },
  全身照: { en: 'full-body shot', pt: 'foto de corpo inteiro' },
  半身照: { en: 'half-body shot', pt: 'foto de meio corpo' },
  模特: { en: 'model', pt: 'modelo' },
  站立: { en: 'standing', pt: 'em pe' },
  坐在: { en: 'sitting on', pt: 'sentada em' },
  倚靠: { en: 'leaning against', pt: 'encostada em' },
  姿态: { en: 'pose', pt: 'pose' },
  姿势: { en: 'pose', pt: 'pose' },
  放松: { en: 'relaxed', pt: 'relaxada' },
  自然: { en: 'natural', pt: 'natural' },
  优雅: { en: 'elegant', pt: 'elegante' },
  自信: { en: 'confident', pt: 'confiante' },
  平静: { en: 'calm', pt: 'calma' },
  双臂: { en: 'both arms', pt: 'os dois bracos' },
  手臂: { en: 'arm', pt: 'braco' },
  双手: { en: 'both hands', pt: 'as duas maos' },
  一只手: { en: 'one hand', pt: 'uma mao' },
  另一只手: { en: 'the other hand', pt: 'a outra mao' },
  身体两侧: { en: 'at the sides of the body', pt: 'ao lado do corpo' },
  头部: { en: 'head', pt: 'cabeca' },
  目光: { en: 'gaze', pt: 'olhar' },
  看向镜头: { en: 'looking at the camera', pt: 'olhando para a camera' },
  背景: { en: 'background', pt: 'fundo' },
  场景: { en: 'scene', pt: 'cena' },
  房间: { en: 'room', pt: 'quarto' },
  窗户: { en: 'window', pt: 'janela' },
  墙壁: { en: 'wall', pt: 'parede' },
  地面: { en: 'floor', pt: 'piso' },
  木地板: { en: 'wood floor', pt: 'piso de madeira' },
  白墙: { en: 'white wall', pt: 'parede branca' },
  绿植: { en: 'green plants', pt: 'plantas verdes' },
  花朵: { en: 'flowers', pt: 'flores' },
  树木: { en: 'trees', pt: 'arvores' },
  草地: { en: 'grass', pt: 'grama' },
  海浪: { en: 'waves', pt: 'ondas' },
  沙滩: { en: 'beach', pt: 'praia' },
  城市: { en: 'city', pt: 'cidade' },
  建筑: { en: 'architecture', pt: 'arquitetura' },
  光线: { en: 'lighting', pt: 'iluminacao' },
  灯光: { en: 'lighting', pt: 'iluminacao' },
  明亮: { en: 'bright', pt: 'clara' },
  均匀: { en: 'even', pt: 'uniforme' },
  柔和: { en: 'soft', pt: 'suave' },
  漫射: { en: 'diffused', pt: 'difusa' },
  温暖: { en: 'warm', pt: 'quente' },
  亮度适中: { en: 'balanced brightness', pt: 'brilho equilibrado' },
  色彩饱和度自然: {
    en: 'natural color saturation',
    pt: 'saturacao de cor natural',
  },
  对比度柔和: { en: 'soft contrast', pt: 'contraste suave' },
  白色: { en: 'white', pt: 'branco' },
  黑色: { en: 'black', pt: 'preto' },
  灰色: { en: 'gray', pt: 'cinza' },
  米色: { en: 'beige', pt: 'bege' },
  蓝色: { en: 'blue', pt: 'azul' },
  绿色: { en: 'green', pt: 'verde' },
  红色: { en: 'red', pt: 'vermelho' },
  金色: { en: 'gold', pt: 'dourado' },
  木质: { en: 'wooden', pt: 'de madeira' },
  石头: { en: 'stone', pt: 'pedra' },
  大理石: { en: 'marble', pt: 'marmore' },
  混凝土: { en: 'concrete', pt: 'concreto' },
  玻璃: { en: 'glass', pt: 'vidro' },
  展台: { en: 'display platform', pt: 'plataforma de exposicao' },
  台面: { en: 'tabletop', pt: 'superficie' },
  平台: { en: 'platform', pt: 'plataforma' },
  空间: { en: 'space', pt: 'espaco' },
  室内: { en: 'indoor', pt: 'interno' },
  户外: { en: 'outdoor', pt: 'externo' },
  氛围: { en: 'atmosphere', pt: 'atmosfera' },
  色调: { en: 'color tone', pt: 'tom de cor' },
  干净: { en: 'clean', pt: 'limpo' },
  简洁: { en: 'clean and simple', pt: 'simples e limpo' },
  质感: { en: 'texture', pt: 'textura' },
  真实: { en: 'realistic', pt: 'realista' },
};

const titleCharacterMap: Record<string, PhraseTranslations> = {
  暗: { en: 'dark', pt: 'escuro' },
  亮: { en: 'bright', pt: 'claro' },
  明: { en: 'bright', pt: 'claro' },
  白: { en: 'white', pt: 'branco' },
  黑: { en: 'black', pt: 'preto' },
  红: { en: 'red', pt: 'vermelho' },
  橙: { en: 'orange', pt: 'laranja' },
  黄: { en: 'yellow', pt: 'amarelo' },
  绿: { en: 'green', pt: 'verde' },
  青: { en: 'cyan', pt: 'ciano' },
  蓝: { en: 'blue', pt: 'azul' },
  紫: { en: 'purple', pt: 'roxo' },
  粉: { en: 'pink', pt: 'rosa' },
  金: { en: 'gold', pt: 'dourado' },
  银: { en: 'silver', pt: 'prata' },
  石: { en: 'stone', pt: 'pedra' },
  岩: { en: 'rock', pt: 'rocha' },
  木: { en: 'wood', pt: 'madeira' },
  水: { en: 'water', pt: 'agua' },
  花: { en: 'flower', pt: 'flor' },
  树: { en: 'tree', pt: 'arvore' },
  云: { en: 'cloud', pt: 'nuvem' },
  月: { en: 'moon', pt: 'lua' },
  星: { en: 'star', pt: 'estrela' },
  海: { en: 'sea', pt: 'mar' },
  山: { en: 'mountain', pt: 'montanha' },
  城: { en: 'city', pt: 'cidade' },
  街: { en: 'street', pt: 'rua' },
  室: { en: 'room', pt: 'sala' },
  居: { en: 'home', pt: 'casa' },
  窗: { en: 'window', pt: 'janela' },
  角: { en: 'corner', pt: 'canto' },
  台: { en: 'platform', pt: 'plataforma' },
  桌: { en: 'table', pt: 'mesa' },
  墙: { en: 'wall', pt: 'parede' },
  桥: { en: 'bridge', pt: 'ponte' },
  门: { en: 'door', pt: 'porta' },
  光: { en: 'light', pt: 'luz' },
  影: { en: 'shadow', pt: 'sombra' },
  风: { en: 'style', pt: 'estilo' },
  情: { en: 'mood', pt: 'clima' },
  意: { en: 'mood', pt: 'clima' },
  时: { en: 'time', pt: 'tempo' },
  尚: { en: 'fashion', pt: 'moda' },
  雅: { en: 'elegance', pt: 'elegancia' },
  静: { en: 'quiet', pt: 'calmo' },
  净: { en: 'clean', pt: 'limpo' },
  美: { en: 'beautiful', pt: 'belo' },
  可: { en: 'cute', pt: 'fofo' },
  爱: { en: 'lovely', pt: 'amavel' },
  梦: { en: 'dream', pt: 'sonho' },
  幻: { en: 'fantasy', pt: 'fantasia' },
  春: { en: 'spring', pt: 'primavera' },
  夏: { en: 'summer', pt: 'verao' },
  秋: { en: 'autumn', pt: 'outono' },
  冬: { en: 'winter', pt: 'inverno' },
};

function hasCjk(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

function collapseSpaces(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function titleCase(value: string) {
  const normalized = collapseSpaces(value);
  if (!normalized) return '';

  return normalized
    .split(' ')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function phraseKeys(map: Record<string, PhraseTranslations>) {
  return Object.keys(map).sort((left, right) => right.length - left.length);
}

const titlePhraseKeys = phraseKeys(titlePhraseMap);
const promptPhraseKeys = phraseKeys({ ...promptPhraseMap, ...titlePhraseMap });

function translateWithPhraseMap(
  value: string,
  locale: Exclude<WanxiangLocale, 'zh'>,
  map: Record<string, PhraseTranslations>,
  keys: string[]
) {
  let output = value;
  for (const key of keys) {
    output = output.split(key).join(` ${map[key][locale]} `);
  }

  return collapseSpaces(
    output
      .replace(/[，、]/g, ', ')
      .replace(/[。；;]/g, '. ')
      .replace(/[：:]/g, ': ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\.\s*/g, '. ')
  );
}

function translateTitleByRules(
  title: string,
  locale: Exclude<WanxiangLocale, 'zh'>
) {
  const replaced = translateWithPhraseMap(
    title,
    locale,
    titlePhraseMap,
    titlePhraseKeys
  );

  if (!hasCjk(replaced)) return titleCase(replaced);

  const words = Array.from(title)
    .map((char) => titleCharacterMap[char]?.[locale])
    .filter((word): word is string => Boolean(word));

  return titleCase(words.join(' '));
}

function translatePromptDetails(
  prompt: string,
  locale: Exclude<WanxiangLocale, 'zh'>
) {
  const map = { ...promptPhraseMap, ...titlePhraseMap };
  const replaced = translateWithPhraseMap(prompt, locale, map, promptPhraseKeys);
  const clauses = replaced
    .split(/[,.]/)
    .map((clause) => collapseSpaces(clause))
    .filter(Boolean)
    .filter((clause) => !hasCjk(clause));

  return clauses.slice(0, 8).join(', ');
}

function categoryLabel(
  category: string,
  locale: Exclude<WanxiangLocale, 'zh'>
) {
  return categoryLabels[category]?.[locale] ?? category.replace(/[_-]+/g, ' ');
}

function fallbackTitle(input: WanxiangLocalizationInput, locale: Exclude<WanxiangLocale, 'zh'>) {
  return titleCase(`${categoryLabel(input.category, locale)} template`);
}

function localizedTitle(input: WanxiangLocalizationInput, locale: WanxiangLocale) {
  const translated = translateTitleByRules(input.title, locale);
  return translated && translated !== 'Undefined'
    ? translated
    : fallbackTitle(input, locale);
}

function localizedPrompt(input: WanxiangLocalizationInput, locale: WanxiangLocale) {
  const title = localizedTitle(input, locale);
  const category = categoryLabel(input.category, locale);
  const details = translatePromptDetails(input.prompt, locale);

  if (locale === 'en') {
    if (input.type === 'try_on') {
      return [
        `Virtual try-on template "${title}" for a ${category}.`,
        details ? `Scene details: ${details}.` : null,
        'Keep the selected garments clear, preserve realistic fabric drape, use a natural model pose, balanced lighting, and a polished fashion ecommerce composition.',
      ]
        .filter(Boolean)
        .join(' ');
    }

    return [
      `Commercial product image template "${title}" for a ${category}.`,
      details ? `Scene details: ${details}.` : null,
      'Use the uploaded product as the hero subject, with realistic materials, natural shadows, clean composition, and polished ecommerce lighting.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (input.type === 'try_on') {
    return [
      `Template de prova virtual "${title}" para ${category}.`,
      details ? `Detalhes da cena: ${details}.` : null,
      'Mantenha as pecas selecionadas bem visiveis, com caimento realista do tecido, pose natural da modelo, iluminacao equilibrada e composicao de moda para ecommerce.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  return [
    `Template de imagem comercial "${title}" para ${category}.`,
    details ? `Detalhes da cena: ${details}.` : null,
    'Use o produto enviado como assunto principal, com materiais realistas, sombras naturais, composicao limpa e iluminacao de ecommerce bem acabada.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildWanxiangTemplateLocalization(
  input: WanxiangLocalizationInput
): {
  promptTranslations: LocalizedText;
  titleTranslations: LocalizedText;
} {
  return {
    titleTranslations: {
      pt: localizedTitle(input, 'pt'),
      en: localizedTitle(input, 'en'),
    },
    promptTranslations: {
      pt: localizedPrompt(input, 'pt'),
      en: localizedPrompt(input, 'en'),
    },
  };
}
