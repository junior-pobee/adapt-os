import { describe, expect, it } from "vitest";
import { isSupportedCurrency, supportedCurrencies } from "./currency";
import { localeDirection, resolveLocale } from "./locale";

describe("global platform settings", () => {
  it("includes Ghanaian and international currencies", () => {
    expect(supportedCurrencies).toContain("GHS");
    expect(supportedCurrencies).toContain("USD");
    expect(supportedCurrencies).toContain("EUR");
  });
  it("validates currency codes", () => {
    expect(isSupportedCurrency("GHS")).toBe(true);
    expect(isSupportedCurrency("XXX")).toBe(false);
  });
  it("resolves locales and writing directions", () => {
    expect(resolveLocale("fr-CA")).toBe("fr");
    expect(resolveLocale("unknown")).toBe("en");
    expect(localeDirection("ar")).toBe("rtl");
  });
});
