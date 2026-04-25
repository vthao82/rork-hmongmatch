import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { STRINGS, StringKey } from "@/constants/i18n";

export type Lang = "en" | "hmn";

const KEY = "hmongmatch.lang.v1";

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [lang, setLang] = useState<Lang>("en");
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY);
        if (v === "en" || v === "hmn") setLang(v);
      } catch (e) {
        console.log("lang hydrate error", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const change = useCallback(async (l: Lang) => {
    setLang(l);
    try {
      await AsyncStorage.setItem(KEY, l);
    } catch (e) {
      console.log("lang save error", e);
    }
  }, []);

  const t = useCallback(
    (k: StringKey, vars?: Record<string, string | number>) => {
      const table = STRINGS[lang] ?? STRINGS.en;
      let raw = table[k] ?? STRINGS.en[k] ?? String(k);
      if (vars) {
        Object.keys(vars).forEach((vk) => {
          raw = raw.replace(new RegExp(`\\{${vk}\\}`, "g"), String(vars[vk]));
        });
      }
      return raw;
    },
    [lang]
  );

  return useMemo(() => ({ lang, setLang: change, t, hydrated }), [lang, change, t, hydrated]);
});

export function useT() {
  const { t } = useLanguage();
  return t;
}
