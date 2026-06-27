export type ModelLocale = 'pt' | 'en' | 'zh';
export type ModelContentLocale = Exclude<ModelLocale, 'zh'>;
export type ModelLocalizedText = Record<ModelContentLocale, string>;

type PhraseTranslations = Record<ModelContentLocale, string>;

const supportedLocales = new Set<ModelLocale>(['pt', 'en', 'zh']);
const childAgePrefixPattern = /^(?:大童|中童|小童)\s*[|｜/／\-:：]\s*/;
const cjkPattern = /[\u3400-\u9fff]/;

const modelNameTranslations: Record<string, PhraseTranslations> = {
  马特奥: { en: 'Mateo', pt: 'Mateo' },
  诺埃尔: { en: 'Noel', pt: 'Noel' },
  杰斯: { en: 'Jace', pt: 'Jace' },
  娜莎: { en: 'Nasha', pt: 'Nasha' },
  苏菲: { en: 'Sophie', pt: 'Sophie' },
  斯特拉: { en: 'Stella', pt: 'Stella' },
  黛菲尔: { en: 'Daphiel', pt: 'Daphiel' },
  莉奥娜: { en: 'Leona', pt: 'Leona' },
  萨琳: { en: 'Seline', pt: 'Seline' },
  阿缇: { en: 'Attie', pt: 'Attie' },
  露西亚: { en: 'Lucia', pt: 'Lucia' },
  阿米娜: { en: 'Amina', pt: 'Amina' },
  阿瑞斯: { en: 'Ares', pt: 'Ares' },
  丹尼尔: { en: 'Daniel', pt: 'Daniel' },
  伊戈尔: { en: 'Igor', pt: 'Igor' },
  娜塔莎: { en: 'Natasha', pt: 'Natasha' },
  艾芙琳: { en: 'Evelyn', pt: 'Evelyn' },
  贝丝: { en: 'Beth', pt: 'Beth' },
  哈里森: { en: 'Harrison', pt: 'Harrison' },
  艾伯特: { en: 'Albert', pt: 'Albert' },
  阿依曼: { en: 'Aiman', pt: 'Aiman' },
  卡尔文: { en: 'Calvin', pt: 'Calvin' },
  约翰: { en: 'John', pt: 'John' },
  丽塔: { en: 'Rita', pt: 'Rita' },
  艾恩: { en: 'Ian', pt: 'Ian' },
  戈登: { en: 'Gordon', pt: 'Gordon' },
  内斯特: { en: 'Nestor', pt: 'Nestor' },
  伊莲娜: { en: 'Elena', pt: 'Elena' },
  兰迪: { en: 'Randy', pt: 'Randy' },
  尤里: { en: 'Yuri', pt: 'Yuri' },
  阿帕德: { en: 'Arpad', pt: 'Arpad' },
  伊森: { en: 'Ethan', pt: 'Ethan' },
  亚历克斯: { en: 'Alex', pt: 'Alex' },
  库珀: { en: 'Cooper', pt: 'Cooper' },
  帕布洛: { en: 'Pablo', pt: 'Pablo' },
  凯茜亚: { en: 'Cassia', pt: 'Cassia' },
  莱昂: { en: 'Leon', pt: 'Leon' },
  杰西卡: { en: 'Jessica', pt: 'Jessica' },
  罗尼: { en: 'Ronnie', pt: 'Ronnie' },
  汉克: { en: 'Hank', pt: 'Hank' },
  希贝儿: { en: 'Sybil', pt: 'Sybil' },
  霍夫曼: { en: 'Hoffman', pt: 'Hoffman' },
  乔安娜: { en: 'Joanna', pt: 'Joanna' },
  戴恩: { en: 'Dane', pt: 'Dane' },
  蕾切尔: { en: 'Rachel', pt: 'Rachel' },
  迪诺: { en: 'Dino', pt: 'Dino' },
  卡特: { en: 'Carter', pt: 'Carter' },
  米娅: { en: 'Mia', pt: 'Mia' },
  诺拉: { en: 'Nora', pt: 'Nora' },
  埃玛: { en: 'Emma', pt: 'Emma' },
  凯瑟琳: { en: 'Catherine', pt: 'Catherine' },
  汉娜: { en: 'Hannah', pt: 'Hannah' },
  乌里扬娜: { en: 'Ulyana', pt: 'Ulyana' },
  雪伦: { en: 'Sharon', pt: 'Sharon' },
  玛蒂尔达: { en: 'Matilda', pt: 'Matilda' },
  希琳: { en: 'Shirin', pt: 'Shirin' },
  琼: { en: 'Joan', pt: 'Joan' },
  劳拉: { en: 'Laura', pt: 'Laura' },
  妮可: { en: 'Nicole', pt: 'Nicole' },
  帕梅拉: { en: 'Pamela', pt: 'Pamela' },
  苏西: { en: 'Susie', pt: 'Susie' },
  诺埃里克: { en: 'Noeric', pt: 'Noeric' },
  爱丽丝: { en: 'Alice', pt: 'Alice' },
  贝拉: { en: 'Bella', pt: 'Bella' },
  海伦: { en: 'Helen', pt: 'Helen' },
  莫莉: { en: 'Molly', pt: 'Molly' },
  伊恩: { en: 'Ian', pt: 'Ian' },
  哈里: { en: 'Harry', pt: 'Harry' },
  科迪: { en: 'Cody', pt: 'Cody' },
  塞德里克: { en: 'Cedric', pt: 'Cedric' },
  诺兰: { en: 'Nolan', pt: 'Nolan' },
  黛西: { en: 'Daisy', pt: 'Daisy' },
  莉亚: { en: 'Leah', pt: 'Leah' },
};

const phraseTranslations: Record<string, PhraseTranslations> = {
  儿童: { en: 'Child', pt: 'Crianca' },
  青年: { en: 'Young adult', pt: 'Jovem' },
  中年: { en: 'Middle-aged', pt: 'Meia-idade' },
  老年: { en: 'Senior', pt: 'Idoso' },
  女: { en: 'Female', pt: 'Feminino' },
  男: { en: 'Male', pt: 'Masculino' },
  欧美: { en: 'Western', pt: 'Ocidental' },
  温暖: { en: 'Warm', pt: 'Caloroso' },
  微笑: { en: 'Smile', pt: 'Sorriso' },
  短卷发: { en: 'Short curls', pt: 'Cachos curtos' },
  甜美: { en: 'Sweet', pt: 'Delicado' },
  长卷发: { en: 'Long curls', pt: 'Cachos longos' },
  清纯: { en: 'Fresh', pt: 'Suave' },
  冷酷: { en: 'Cool', pt: 'Marcante' },
  双麻花辫: { en: 'Twin braids', pt: 'Trancas duplas' },
  自然: { en: 'Natural', pt: 'Natural' },
  阳光: { en: 'Sunny', pt: 'Solar' },
  俊美: { en: 'Handsome', pt: 'Bonito' },
  短直发: { en: 'Short straight hair', pt: 'Cabelo curto liso' },
  卷边: { en: 'Curled ends', pt: 'Pontas enroladas' },
  古典: { en: 'Classic', pt: 'Classico' },
  长直发: { en: 'Long straight hair', pt: 'Cabelo longo liso' },
  复古长卷: { en: 'Vintage long curls', pt: 'Cachos longos vintage' },
  酷飒: { en: 'Edgy', pt: 'Estiloso' },
  丸子头: { en: 'Bun', pt: 'Coque' },
  冷艳: { en: 'Striking', pt: 'Marcante' },
  油头: { en: 'Slicked hair', pt: 'Cabelo penteado' },
  侧梳: { en: 'Side-parted hair', pt: 'Cabelo repartido' },
  削边: { en: 'Undercut', pt: 'Undercut' },
  硬朗: { en: 'Rugged', pt: 'Robusto' },
  寸头: { en: 'Buzz cut', pt: 'Corte raspado' },
  中性: { en: 'Androgynous', pt: 'Androgino' },
  高马尾: { en: 'High ponytail', pt: 'Rabo alto' },
  温婉: { en: 'Gentle', pt: 'Gentil' },
  儒雅: { en: 'Refined', pt: 'Refinado' },
  潮酷: { en: 'Trendy', pt: 'Moderno' },
  浪漫: { en: 'Romantic', pt: 'Romantico' },
};

const phraseKeys = Object.keys(phraseTranslations).sort(
  (left, right) => right.length - left.length
);

export const modelGenderTagOptions = ['女', '男'] as const;
export const modelAgeTagOptions = ['儿童', '青年', '中年', '老年'] as const;

export type ModelCategoryParts = {
  age: string;
  gender: string;
  style: string;
  tags: string[];
};

type ModelCategoryFilterInput = {
  age?: string | null;
  gender?: string | null;
  style?: string | null;
};

const modelGenderTagSet = new Set<string>(modelGenderTagOptions);
const modelAgeTagSet = new Set<string>(modelAgeTagOptions);

function toStringValue(value: unknown) {
  return value == null ? '' : String(value);
}

function toRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function collapseSpaces(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function titleCase(value: string) {
  return collapseSpaces(value)
    .split(' ')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function hasCjk(value: string) {
  return cjkPattern.test(value);
}

export function normalizeModelLocale(locale: string): ModelLocale {
  return supportedLocales.has(locale as ModelLocale)
    ? (locale as ModelLocale)
    : 'en';
}

export function stripModelAgePrefix(title: unknown) {
  return toStringValue(title).trim().replace(childAgePrefixPattern, '').trim();
}

export function modelCategoryTags(category: unknown) {
  return toStringValue(category)
    .split(/[\/,，、]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeModelCategoryFilter(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function parseModelCategoryParts(category: unknown): ModelCategoryParts {
  const tags = modelCategoryTags(category);
  const gender = tags.find((tag) => modelGenderTagSet.has(tag)) ?? '';
  const age = tags.find((tag) => modelAgeTagSet.has(tag)) ?? '';
  const style =
    tags.find((tag) => !modelGenderTagSet.has(tag) && !modelAgeTagSet.has(tag)) ??
    '';

  return {
    age,
    gender,
    style,
    tags,
  };
}

export function buildModelCategoryFromParts(input: ModelCategoryFilterInput) {
  return [input.gender, input.age, input.style]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)
    .join('/');
}

export function modelCategoryMatchesFilters(
  category: unknown,
  filters: ModelCategoryFilterInput
) {
  const parts = parseModelCategoryParts(category);
  const matches = (filter: string | null | undefined, value: string) => {
    const normalized = normalizeModelCategoryFilter(filter);
    return !normalized || value === normalized || parts.tags.includes(normalized);
  };

  return (
    matches(filters.gender, parts.gender) &&
    matches(filters.age, parts.age) &&
    matches(filters.style, parts.style)
  );
}

function localizePhrase(value: string, locale: ModelContentLocale) {
  return phraseTranslations[value]?.[locale] ?? '';
}

export function localizeModelCategoryTag(tag: unknown, localeInput: string) {
  const value = toStringValue(tag).trim();
  if (!value) return '';

  const locale = normalizeModelLocale(localeInput);
  if (locale === 'zh') return value;

  return localizePhrase(value, locale) || (!hasCjk(value) ? value : '');
}

function translateModelText(value: unknown, locale: ModelContentLocale) {
  let output = toStringValue(value).trim();
  if (!output) return '';

  output = output
    .replace(/风格\s*[：:]/g, locale === 'en' ? 'Style: ' : 'Estilo: ')
    .replace(/特征\s*[：:]/g, locale === 'en' ? 'Traits: ' : 'Caracteristicas: ');

  for (const key of phraseKeys) {
    output = output.split(key).join(phraseTranslations[key][locale]);
  }

  return output
    .split(/\n+/)
    .map((line) =>
      collapseSpaces(
        line
          .replace(/[，、]/g, ', ')
          .replace(/\//g, ' / ')
          .replace(/\s*,\s*/g, ', ')
          .replace(/\s*\/\s*/g, ' / ')
      )
    )
    .filter((line) => line && !hasCjk(line))
    .join('\n');
}

function localizedTraitTitle(category: unknown, locale: ModelContentLocale) {
  const { age, gender } = parseModelCategoryParts(category);
  const ageLabel = age ? localizePhrase(age, locale) : '';
  const genderLabel = gender ? localizePhrase(gender, locale) : '';

  if (locale === 'pt') {
    return titleCase(['Modelo', genderLabel, ageLabel].filter(Boolean).join(' '));
  }

  return titleCase([ageLabel, genderLabel, 'Model'].filter(Boolean).join(' '));
}

export function localizeModelCategoryTags(
  category: unknown,
  localeInput: string
) {
  const locale = normalizeModelLocale(localeInput);
  const tags = modelCategoryTags(category);

  if (locale === 'zh') return tags;

  return tags
    .map((tag) => localizeModelCategoryTag(tag, locale))
    .filter(Boolean)
    .slice(0, 8);
}

function usefulLocalizedText(value: string, locale: ModelLocale) {
  const normalized = stripModelAgePrefix(value);
  if (!normalized) return false;
  return locale === 'zh' || !hasCjk(normalized);
}

function translationFor(translations: unknown, locale: ModelLocale) {
  const value = toRecord(translations)[locale];
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveModelTitle(input: {
  category?: unknown;
  locale: string;
  title: unknown;
  translations?: unknown;
}) {
  const locale = normalizeModelLocale(input.locale);
  const rawTitle = stripModelAgePrefix(input.title);
  const translatedTitle = stripModelAgePrefix(
    translationFor(input.translations, locale)
  );

  if (usefulLocalizedText(translatedTitle, locale)) return translatedTitle;
  if (locale === 'zh') return rawTitle;

  return (
    modelNameTranslations[rawTitle]?.[locale] ??
    localizedTraitTitle(input.category, locale)
  );
}

function localizedDescription(input: {
  category?: unknown;
  locale: ModelContentLocale;
  prompt?: unknown;
  title: string;
}) {
  const translatedDetails = translateModelText(input.prompt, input.locale);
  const tags = localizeModelCategoryTags(input.category, input.locale);
  const traits = tags.length > 0 ? tags.join(', ') : '';

  const intro =
    input.locale === 'en'
      ? `Virtual try-on model "${input.title}".`
      : `Modelo para prova virtual "${input.title}".`;
  const traitLine =
    traits && input.locale === 'en'
      ? `Traits: ${traits}.`
      : traits
        ? `Caracteristicas: ${traits}.`
        : '';

  return [intro, translatedDetails || traitLine].filter(Boolean).join('\n');
}

export function resolveModelPrompt(input: {
  category?: unknown;
  locale: string;
  prompt: unknown;
  title: unknown;
  titleText?: unknown;
  translations?: unknown;
}) {
  const locale = normalizeModelLocale(input.locale);
  const prompt = toStringValue(input.prompt).trim();

  if (locale === 'zh') return prompt;

  const translatedPrompt = translationFor(input.translations, locale);
  if (usefulLocalizedText(translatedPrompt, locale)) return translatedPrompt;

  return localizedDescription({
    category: input.category,
    locale,
    prompt: input.prompt,
    title: resolveModelTitle({
      category: input.category,
      locale,
      title: input.title,
      translations: input.titleText,
    }),
  });
}

export function buildModelTemplateLocalization(input: {
  category: unknown;
  prompt: unknown;
  title: unknown;
}): {
  prompt: ModelLocalizedText;
  title: ModelLocalizedText;
} {
  const enTitle = resolveModelTitle({
    category: input.category,
    locale: 'en',
    title: input.title,
  });
  const ptTitle = resolveModelTitle({
    category: input.category,
    locale: 'pt',
    title: input.title,
  });
  return {
    title: {
      pt: ptTitle,
      en: enTitle,
    },
    prompt: {
      pt: localizedDescription({
        category: input.category,
        locale: 'pt',
        prompt: input.prompt,
        title: ptTitle,
      }),
      en: localizedDescription({
        category: input.category,
        locale: 'en',
        prompt: input.prompt,
        title: enTitle,
      }),
    },
  };
}
