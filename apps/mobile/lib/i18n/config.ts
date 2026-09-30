import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import vi from "../../locales/vi.json";
import en from "../../locales/en.json";

const i18n = new I18n({ vi, en });

i18n.locale = Localization.getLocales()[0]?.languageCode ?? "vi";
i18n.enableFallback = true;
i18n.defaultLocale = "vi";

export default i18n;
