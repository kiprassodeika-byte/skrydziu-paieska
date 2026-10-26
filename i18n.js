// Kalbos (LT / EN): vertimų žodynas, t() funkcija ir kalbos pasirinkimas.
// Naujam tekstui: pridėkite raktą į abi kalbas ir naudokite t("raktas", {kintamasis: reikšmė}).
window.DICT = {
  lt: {
    title: "HopFriday · Skrydžių paieška",
    h1: "Raskite skrydį",
    sub: "Palyginkite kainas ir nusipirkite tiesiai pas pardavėją.",
    modeSearch: "Ieškoti skrydžio",
    modeExplore: "Kur nuskristi?",
    oneway: "Į vieną pusę",
    roundtrip: "Į abi puses",
    from: "Iš",
    to: "Į",
    locate: "📍 Mano vieta",
    locateTitle: "Nustatyti mano vietą",
    placeholder: "Miestas arba kodas",
    swap: "Sukeisti vietomis",
    depart: "Išvykimas",
    ret: "Grįžimas",
    pax: "Keleiviai",
    search: "Ieškoti",
    budget: "Biudžetas (€)",
    when: "Kada",
    directOnly: "Tik tiesioginiai",
    showDest: "Rodyti kryptis",
    anytime: "Bet kada",
    calAria: "Kainos pagal dieną",
    byDate: "Pagal datą",
    cheapest: "Pigiausi",
    fastest: "Greičiausi",
    cheapestF: "Pigiausios",
    priceNote: "Kainos orientacinės: jos rastos neseniai, todėl galutinė kaina ir likę bilietai patikrinami pardavėjo puslapyje.",
    demo: "Rodomi <strong>demo duomenys</strong>, ne tikros kainos. Įrašykite Travelpayouts raktus į <code>.env</code> (žr. README).",
    credit: "Foto:",
    privacy: "Privatumo politika",
    terms: "Naudojimo sąlygos",
    affiliate: "Kai kurios nuorodos yra partnerių nuorodos: už pirkimus per jas galime gauti komisinį. Kaina jums dėl to nedidėja.",
    locUnsupported: "Naršyklė nepalaiko vietos nustatymo.",
    locating: "Nustatoma jūsų vieta…",
    nearestAirport: "Artimiausias oro uostas: {name}",
    locFail: "Nepavyko nustatyti vietos. Įveskite išvykimo miestą ranka.",
    pickAirports: "Pasirinkite oro uostus iš pasiūlymų sąrašo.",
    sameAirport: "Išvykimo ir atvykimo vietos negali sutapti.",
    searching: "Ieškoma skrydžių {from} → {to}…",
    failFlights: "Nepavyko gauti skrydžių. Bandykite dar kartą.",
    liveText: "Neradote savo skrydžio? Talpykloje būna ne visi.",
    liveLink: "Peržiūrėti visus skrydžius {from} → {to} {date} (gyva paieška) ↗",
    noResults: "Pagal šiuos kriterijus skrydžių nerasta. Pabandykite kitą datą arba artimiausią didesnį miestą.",
    foundN: "Rasta skrydžių: {n}",
    yourDay: "Jūsų dienai: {a} · kitomis artimomis dienomis: {b}",
    noneForDay: "Pasirinktai dienai kainų nerasta, rodome artimiausias datas ({n}).",
    tagLive: "Gyva kaina",
    tagYourDate: "Jūsų data",
    tagCheapest: "Pigiausias",
    tagCheapestF: "Pigiausia",
    timeUnknown: "laikas tikslinamas pardavėjo puslapyje",
    direct: "Tiesioginis",
    stopsOne: "{n} persėdimas",
    stopsFew: "{n} persėdimai",
    stopsMany: "{n} persėdimų",
    metaDepart: "Išvykimas {d}",
    metaReturn: "Grįžimas {d}",
    priceRound: "kaina į abi puses",
    priceOne: "į vieną pusę",
    buyAirline: "Pirkti pas {a} ↗",
    openGoogle: "Atidaryti Google Flights ↗",
    checkBuy: "Tikrinti kainą ir pirkti ↗",
    groupYourDate: "Jūsų data · {d}",
    groupOthers: "Kitos siūlomos datos",
    groupNone: "Šiai dienai nerasta · siūlomos artimiausios datos",
    searchingDest: "Ieškoma krypčių iš {from}…",
    pickFrom: "Pasirinkite išvykimo oro uostą iš pasiūlymų sąrašo.",
    failDest: "Nepavyko gauti krypčių. Bandykite dar kartą.",
    destStatus: "Kryptys iš {from}{budget}: {n}",
    destBudget: " iki {b} €",
    noDest: "Pagal šiuos kriterijus krypčių nerasta. Padidinkite biudžetą, pasirinkite „Bet kada“ arba kitą oro uostą.",
    priceFrom: "nuo {p}",
    calTitle: "Kainos pagal dieną · {a} – {b}",
    calMin: " · pigiausia {m} €",
    errRate: "Per daug užklausų. Pabandykite už minutės.",
    errParams: "Neteisingi paieškos parametrai.",
    errUnreach: "Nepavyko pasiekti Aviasales API.",
    errApi: "Aviasales API klaida",
    errServer: "Serveris nepasiekiamas.",
    errServerGeneric: "Serverio klaida.",
    feedbackBtn: "💬 Atsiliepimas",
    feedbackTitle: "Jūsų atsiliepimas",
    feedbackIntro: "Kas patiko, ko trūksta ar radote klaidą?",
    feedbackRating: "Įvertinimas",
    feedbackPlaceholder: "Parašykite čia…",
    feedbackContact: "El. paštas (nebūtina, jei norite atsakymo)",
    feedbackNote: "Nerašykite slaptų ar jautrių duomenų.",
    feedbackSend: "Siųsti",
    feedbackClose: "Uždaryti",
    feedbackThanks: "Ačiū! Atsiliepimas gautas.",
    feedbackError: "Nepavyko išsiųsti. Bandykite vėliau.",
    feedbackEmpty: "Parašykite bent kelis žodžius arba pasirinkite įvertinimą.",
    modeWeekend: "Savaitgalis",
    budgetRound: "Biudžetas už abi puses (€)",
    showWeekend: "Rodyti savaitgalius",
    next3: "Artimiausi 3 mėnesiai",
    weekendHint: "Išvykimas penktadienį ar šeštadienį, grįžimas sekmadienį ar pirmadienį. Kaina už abi puses.",
    searchingWeekend: "Ieškoma savaitgalio kelionių iš {from}…",
    failWeekend: "Nepavyko gauti savaitgalio kelionių. Bandykite dar kartą.",
    weekendStatus: "Savaitgalio kelionės iš {from}{budget}: {n}",
    noWeekend: "Savaitgalio kelionių nerasta. Padidinkite biudžetą, pasirinkite „Artimiausi 3 mėnesiai“ arba kitą oro uostą.",
    nightOne: "{n} naktis",
    nightFew: "{n} naktys",
    nightMany: "{n} naktų",
  },
  en: {
    title: "HopFriday · Flight search",
    h1: "Find your flight",
    sub: "Compare prices and buy directly from the seller.",
    modeSearch: "Search flights",
    modeExplore: "Where to fly?",
    oneway: "One way",
    roundtrip: "Round trip",
    from: "From",
    to: "To",
    locate: "📍 My location",
    locateTitle: "Detect my location",
    placeholder: "City or code",
    swap: "Swap",
    depart: "Departure",
    ret: "Return",
    pax: "Passengers",
    search: "Search",
    budget: "Budget (€)",
    when: "When",
    directOnly: "Direct only",
    showDest: "Show destinations",
    anytime: "Any time",
    calAria: "Prices by day",
    byDate: "By date",
    cheapest: "Cheapest",
    fastest: "Fastest",
    cheapestF: "Cheapest",
    priceNote: "Prices are indicative: they were found recently, so the final price and seat availability are confirmed on the seller's page.",
    demo: "Showing <strong>demo data</strong>, not real prices. Add your Travelpayouts keys to <code>.env</code> (see README).",
    credit: "Photo:",
    privacy: "Privacy policy",
    terms: "Terms of use",
    affiliate: "Some links are affiliate links: we may earn a commission on purchases made through them. It doesn't increase your price.",
    locUnsupported: "Your browser doesn't support location detection.",
    locating: "Detecting your location…",
    nearestAirport: "Nearest airport: {name}",
    locFail: "Couldn't detect your location. Enter the departure city manually.",
    pickAirports: "Pick airports from the suggestions.",
    sameAirport: "Departure and arrival can't be the same.",
    searching: "Searching flights {from} → {to}…",
    failFlights: "Couldn't load flights. Try again.",
    liveText: "Can't find your flight? The cache doesn't have everything.",
    liveLink: "View all flights {from} → {to} {date} (live search) ↗",
    noResults: "No flights match these filters. Try another date or a larger nearby city.",
    foundN: "Flights found: {n}",
    yourDay: "Your day: {a} · other nearby days: {b}",
    noneForDay: "No prices for your day; showing the nearest dates ({n}).",
    tagLive: "Live price",
    tagYourDate: "Your date",
    tagCheapest: "Cheapest",
    tagCheapestF: "Cheapest",
    timeUnknown: "time confirmed on the seller's page",
    direct: "Direct",
    stopsOne: "{n} stop",
    stopsFew: "{n} stops",
    stopsMany: "{n} stops",
    metaDepart: "Departure {d}",
    metaReturn: "Return {d}",
    priceRound: "round-trip price",
    priceOne: "one way",
    buyAirline: "Buy from {a} ↗",
    openGoogle: "Open Google Flights ↗",
    checkBuy: "Check price and buy ↗",
    groupYourDate: "Your date · {d}",
    groupOthers: "Other suggested dates",
    groupNone: "Nothing for this day · nearest suggested dates",
    searchingDest: "Searching destinations from {from}…",
    pickFrom: "Pick a departure airport from the suggestions.",
    failDest: "Couldn't load destinations. Try again.",
    destStatus: "Destinations from {from}{budget}: {n}",
    destBudget: " up to {b} €",
    noDest: "No destinations match. Raise your budget, choose “Any time”, or pick another airport.",
    priceFrom: "from {p}",
    calTitle: "Prices by day · {a} – {b}",
    calMin: " · cheapest {m} €",
    errRate: "Too many requests. Try again in a minute.",
    errParams: "Invalid search parameters.",
    errUnreach: "Couldn't reach the Aviasales API.",
    errApi: "Aviasales API error",
    errServer: "Server unavailable.",
    errServerGeneric: "Server error.",
    feedbackBtn: "💬 Feedback",
    feedbackTitle: "Your feedback",
    feedbackIntro: "What did you like, what's missing, or did you find a bug?",
    feedbackRating: "Rating",
    feedbackPlaceholder: "Write here…",
    feedbackContact: "Email (optional, if you'd like a reply)",
    feedbackNote: "Please don't include secret or sensitive data.",
    feedbackSend: "Send",
    feedbackClose: "Close",
    feedbackThanks: "Thank you! Feedback received.",
    feedbackError: "Couldn't send. Please try later.",
    feedbackEmpty: "Write at least a few words or choose a rating.",
    modeWeekend: "Weekend",
    budgetRound: "Round-trip budget (€)",
    showWeekend: "Show weekend trips",
    next3: "Next 3 months",
    weekendHint: "Depart Friday or Saturday, return Sunday or Monday. Price is for the round trip.",
    searchingWeekend: "Searching weekend trips from {from}…",
    failWeekend: "Couldn't load weekend trips. Try again.",
    weekendStatus: "Weekend trips from {from}{budget}: {n}",
    noWeekend: "No weekend trips found. Raise your budget, choose “Next 3 months”, or pick another airport.",
    nightOne: "{n} night",
    nightFew: "{n} nights",
    nightMany: "{n} nights",
  },
};

(function () {
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) { /* privatus režimas */ }
  const browser = (navigator.language || "lt").toLowerCase().startsWith("lt") ? "lt" : "en";
  window.LANG = saved === "lt" || saved === "en" ? saved : browser;
})();

window.t = function (key, vars) {
  let s = (DICT[LANG] && DICT[LANG][key]) ?? DICT.lt[key] ?? key;
  for (const k in vars || {}) s = s.split(`{${k}}`).join(vars[k]);
  return s;
};

window.locale = () => (LANG === "en" ? "en-GB" : "lt-LT");

window.stopsText = function (n) {
  if (n === 0) return t("direct");
  if (LANG === "en") return t(n === 1 ? "stopsOne" : "stopsFew", { n });
  return t(n === 1 ? "stopsOne" : n < 10 ? "stopsFew" : "stopsMany", { n });
};

window.nightsText = function (n) {
  if (LANG === "en") return t(n === 1 ? "nightOne" : "nightFew", { n });
  return t(n === 1 ? "nightOne" : n < 10 ? "nightFew" : "nightMany", { n });
};

// Serverio (lietuviškus) klaidų tekstus paverčiame pasirinkta kalba
window.errText = function (msg) {
  if (!msg) return "";
  if (msg.includes("Per daug užklausų")) return t("errRate");
  if (msg.includes("Neteisingi paieškos parametrai")) return t("errParams");
  if (msg.includes("Nepavyko pasiekti Aviasales")) return t("errUnreach");
  if (msg.startsWith("Aviasales API klaida")) {
    const code = msg.match(/\d{3}/)?.[0];
    return code ? `${t("errApi")} ${code}` : t("errApi");
  }
  if (msg.includes("Serveris nepasiekiamas")) return t("errServer");
  if (msg.includes("Serverio klaida")) return t("errServerGeneric");
  return msg;
};

// Statinio HTML tekstų pritaikymas: data-i18n (tekstas), data-i18n-html, data-i18n-placeholder, -title, -aria
window.applyStatic = function () {
  document.documentElement.lang = LANG;
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
  document.querySelectorAll("[data-i18n-title]").forEach((el) => (el.title = t(el.dataset.i18nTitle)));
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
  document.querySelectorAll(".lang").forEach((b) => b.classList.toggle("active", b.dataset.lang === LANG));
};
