import en from "./messages/en.json";
import fr from "./messages/fr.json";
import es from "./messages/es.json";
import ar from "./messages/ar.json";

export const messages = { en, fr, es, ar };
export type Locale = keyof typeof messages;
