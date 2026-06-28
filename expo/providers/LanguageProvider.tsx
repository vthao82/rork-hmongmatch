import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useMemo } from "react";
import { STRINGS, StringKey } from "@/constants/i18n";

// English-only build — Hmoob translation is deprecated.
export type Lang = "en";

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const lang: Lang = "en";

  const setLang = useCallback(async (_l: Lang) => {
    /* no-op: app is English-only */
  }, []);

  const t = useCallback(
    (k: StringKey, vars?: Record<string, string | number>) => {
      const table = STRINGS.en;
      let raw = table[k] ?? String(k);
      if (vars) {
        Object.keys(vars).forEach((vk) => {
          raw = raw.replace(new RegExp(`\\{${vk}\\}`, "g"), String(vars[vk]));
        });
      }
      return raw;
    },
    []
  );

  return useMemo(() => ({ lang, setLang, t, hydrated: true }), [setLang, t]);
});

export function useT() {
  const { t } = useLanguage();
  return t;
}
