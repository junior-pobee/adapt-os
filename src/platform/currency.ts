export const supportedCurrencies = ["GHS","USD","EUR","GBP","NGN","KES","ZAR","XOF","XAF","EGP","MAD","CAD","AUD","NZD","INR","JPY","CNY","SGD","AED","SAR","CHF","BRL","MXN","TRY","SEK","NOK","DKK","PLN","KRW","IDR"] as const;
export type SupportedCurrency = typeof supportedCurrencies[number];
export const isSupportedCurrency = (value: string): value is SupportedCurrency => (supportedCurrencies as readonly string[]).includes(value);
