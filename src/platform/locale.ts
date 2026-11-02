import type { Locale } from "@/i18n/messages";
const rtlLocales: readonly Locale[] = ["ar"];
export const localeDirection = (locale: Locale): "ltr" | "rtl" => rtlLocales.includes(locale) ? "rtl" : "ltr";
export const resolveLocale = (locale?: string | null): Locale => {
  if (!locale) return "en";
  const normalized = locale.toLowerCase().split("-")[0];
  return normalized === "fr" || normalized === "es" || normalized === "ar" ? normalized : "en";
};
