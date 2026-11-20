"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "en" | "mm";

const messages = {
  en: {
    nav_home: "Home",
    nav_plan: "Plan",
    nav_stops: "Stops",
    nav_routes: "Routes",
    nav_fav: "Saved",
    nav_nearby: "Nearby",
    brand_sub: "Yangon bus routes",
    brand_tagline: "Find Yangon bus lines and stops quickly",
    search_routes_ph: "Search line 100, Sule, တောင်ဒဂုံ…",
    search_stops_ph: "Search stop (EN / မြန်မာ)",
    search: "Search",
    trip_planner: "Trip planner",
    nearby_stops: "Nearby stops",
    browse_routes: "Browse all {n} routes",
    popular_routes: "Popular routes",
    see_all: "See all",
    built_for_phone: "Built for your phone",
    home_aside:
      "Search by line number or stop name (EN/MM). Works on phones, tablets, and computers.",
    bullet_routes: "{n} YBS routes from open data",
    bullet_planner: "A→B planner with up to 3 transfers + walk tuning",
    bullet_maps: "Stop maps with OpenStreetMap",
    bullet_static: "Static data — not live bus tracking",
    footer_note: "Static YBS route data — not live tracking. Verify before travel.",
    plan_eta_title: "Times are estimates",
    plan_eta_body:
      "Arrival times come from distance and typical speeds — not live GPS. Buses may be earlier or later. Confirm on the street before you travel.",
    plan_eta_badge: "Static estimate · not live",
    admin_disabled_title: "Admin unavailable",
    admin_disabled_body:
      "The data editor is turned off on this server. Set ADMIN_UI_ENABLED=true (with a strong ADMIN_TOKEN) to enable it.",
    all_routes: "All routes",
    all_routes_sub: "Filter by QR / agency / keyword",
    stop_search: "Stop search",
    stop_search_sub: "Pick a stop to see every line that passes there",
    routes_through: "Routes through this stop",
    no_routes_stop: "No routes found for this stop.",
    type_to_search: "Type a stop name to begin",
    no_stops_found: "No stops found",
    searching: "Searching…",
    check_side: "Check side",
    favorites: "Saved",
    favorites_sub: "Lines and stops you star on this device",
    fav_routes: "Saved lines",
    fav_stops: "Saved stops",
    no_fav_routes: "No saved lines yet. Star a line on its detail page.",
    no_fav_stops: "No saved stops yet. Star a stop from Stop search.",
    save: "Save",
    saved: "Saved",
    empty_routes: "No routes match your filters.",
    empty_plans: "No trips found with these settings.",
    empty_nearby: "No stops within 1.2 km.",
    loading: "Loading…",
    install_title: "Install YBS Finder",
    install_body: "Add to your home screen for faster access.",
    install_cta: "Install",
    install_ios:
      "On iPhone: Share → Add to Home Screen",
    install_dismiss: "Not now",
    language: "Language",
    clear: "Clear",
    use_in_planner: "Use in planner",
    routes_count: "{n} routes",
    places_named: "{n} places named this",
  },
  mm: {
    nav_home: "ပင်မ",
    nav_plan: "လမ်းရှာ",
    nav_stops: "မှတ်တိုင်",
    nav_routes: "လိုင်းများ",
    nav_fav: "သိမ်း",
    nav_nearby: "အနီး",
    brand_sub: "ရန်ကုန် ဘတ်စ်လိုင်းများ",
    brand_tagline: "ရန်ကုန် ဘတ်စ်လိုင်းနှင့် မှတ်တိုင်များကို မြန်မြန်ရှာပါ",
    search_routes_ph: "လိုင်း ၁၀၀၊ ဆူးလေ၊ တောင်ဒဂုံ…",
    search_stops_ph: "မှတ်တိုင်ရှာ (EN / မြန်မာ)",
    search: "ရှာရန်",
    trip_planner: "လမ်းကြောင်းရှာ",
    nearby_stops: "အနီးဆုံးမှတ်တိုင်",
    browse_routes: "လိုင်းအားလုံး {n} ခု",
    popular_routes: "လူသုံးများသော လိုင်းများ",
    see_all: "အားလုံး",
    built_for_phone: "ဖုန်းအတွက် ဦးစားပေး",
    home_aside:
      "လိုင်းနံပါတ် သို့မဟုတ် မှတ်တိုင်နာမည် (EN/MM) ဖြင့် ရှာနိုင်သည်။ ဖုန်း၊ တက်ဘလက်၊ ကွန်ပျူတာ အားလုံးတွင် သုံးနိုင်သည်။",
    bullet_routes: "open data မှ YBS လိုင်း {n} ခု",
    bullet_planner: "A→B လမ်းရှာ (၃ ခါလဲအထိ + လမ်းလျှောက်ချိန်)",
    bullet_maps: "OpenStreetMap ဖြင့် မှတ်တိုင်မြေပုံ",
    bullet_static: "Static data — live tracking မဟုတ်",
    footer_note:
      "Static YBS data ဖြစ်သည် — live tracking မဟုတ်။ အသုံးမပြုမီ စစ်ဆေးပါ။",
    plan_eta_title: "အချိန်သည် ခန့်မှန်းချက်သာ",
    plan_eta_body:
      "ရောက်ရှိချိန်ကို အကွာအဝေးနှင့် ပုံမှန်အမြန်နှုန်းဖြင့် ခန့်မှန်းထားသည် — live GPS မဟုတ်ပါ။ ဘတ်စ်စော/နောက်ကျနိုင်သည်။ မထွက်မီ လမ်းပေါ်တွင် အတည်ပြုပါ။",
    plan_eta_badge: "ခန့်မှန်း · live မဟုတ်",
    admin_disabled_title: "Admin ပိတ်ထားသည်",
    admin_disabled_body:
      "ဤဆာဗာတွင် data editor ပိတ်ထားသည်။ ဖွင့်ရန် ADMIN_UI_ENABLED=true နှင့် strong ADMIN_TOKEN ထည့်ပါ။",
    all_routes: "လိုင်းအားလုံး",
    all_routes_sub: "QR / agency / keyword ဖြင့် စစ်ထုတ်နိုင်သည်",
    stop_search: "မှတ်တိုင်ရှာ",
    stop_search_sub: "မှတ်တိုင်ရွေးပြီး ဖြတ်သွားသည့် လိုင်းအားလုံးကို ကြည့်ပါ",
    routes_through: "ဤမှတ်တိုင်ကို ဖြတ်သော လိုင်းများ",
    no_routes_stop: "ဤမှတ်တိုင်အတွက် လိုင်းမတွေ့ပါ။",
    type_to_search: "မှတ်တိုင်နာမည် ရိုက်၍ စတင်ပါ",
    no_stops_found: "မှတ်တိုင်မတွေ့ပါ",
    searching: "ရှာနေသည်…",
    check_side: "ဘက်စစ်ပါ",
    favorites: "သိမ်းထားသည်များ",
    favorites_sub: "ဤစက်တွင် သိမ်းထားသော လိုင်း / မှတ်တိုင်များ",
    fav_routes: "သိမ်းလိုင်းများ",
    fav_stops: "သိမ်းမှတ်တိုင်များ",
    no_fav_routes: "သိမ်းလိုင်း မရှိသေးပါ။ လိုင်းအသေးစိတ်တွင် ကြယ်နှိပ်ပါ။",
    no_fav_stops: "သိမ်းမှတ်တိုင် မရှိသေးပါ။ မှတ်တိုင်ရှာမှ ကြယ်နှိပ်ပါ။",
    save: "သိမ်းရန်",
    saved: "သိမ်းပြီး",
    empty_routes: "စစ်ထုတ်ချက်နှင့် ကိုက်ညီသော လိုင်းမရှိပါ။",
    empty_plans: "ဤဆက်တင်ဖြင့် လမ်းကြောင်းမတွေ့ပါ။",
    empty_nearby: "၁.၂ ကီလိုမီတာ အတွင်း မှတ်တိုင်မရှိပါ။",
    loading: "ဖွင့်နေသည်…",
    install_title: "YBS Finder ထည့်သွင်းရန်",
    install_body: "ပိုမြန်စွာ ဖွင့်နိုင်ရန် Home Screen သို့ ထည့်ပါ။",
    install_cta: "ထည့်သွင်းမည်",
    install_ios: "iPhone: Share → Add to Home Screen",
    install_dismiss: "နောက်မှ",
    language: "ဘာသာ",
    clear: "ဖျက်",
    use_in_planner: "လမ်းရှာတွင် သုံးမည်",
    routes_count: "လိုင်း {n} ခု",
    places_named: "ဤအမည် {n} နေရာ",
  },
} as const;

export type MessageKey = keyof typeof messages.en;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "ybs-finder-locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "mm") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "mm" ? "my" : "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      let text: string = messages[locale][key] ?? messages.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
