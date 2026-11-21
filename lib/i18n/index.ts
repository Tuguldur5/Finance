import { mn, type Dictionary } from "./mn";

/** Supported UI locales. Add a dictionary file and a key here. */
export const SUPPORTED_LOCALES = ["mn"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "mn";

const dictionaries: Record<Locale, Dictionary> = { mn };

type FlatDictionary = Record<string, string>;

/** Flattens `{ a: { b: "text" } }` into `{ "a.b": "text" }`. */
function flatten(
  value: unknown,
  prefix = "",
  out: FlatDictionary = {},
): FlatDictionary {
  if (typeof value === "string") {
    out[prefix] = value;
    return out;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  }

  return out;
}

const flatDictionaries: Record<Locale, FlatDictionary> = {
  mn: flatten(mn),
};

export type TranslationKey = string;

export type TranslationVars = Record<string, string | number>;

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Translate a dotted key, e.g. `t("transactions.add")`.
 * Falls back to the key itself (and warns in development) when missing.
 */
export function t(
  key: TranslationKey,
  vars?: TranslationVars,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const dictionary = flatDictionaries[locale] ?? flatDictionaries[DEFAULT_LOCALE];
  const template = dictionary[key];

  if (template === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing translation key: "${key}" (${locale})`);
    }
    return key;
  }

  return interpolate(template, vars);
}

/** Scoped translator: `const tr = createTranslator("transactions"); tr("add")`. */
export function createTranslator(scope: string, locale: Locale = DEFAULT_LOCALE) {
  return (key: string, vars?: TranslationVars) =>
    t(`${scope}.${key}`, vars, locale);
}

/** Dictionary object for a locale (for iterating arrays/maps). */
export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export { mn };
export type { Dictionary };
