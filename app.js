const $ = (id) => document.getElementById(id);
let offers = [];
let sort = "depart";
let exSort = "depart";
let exState = null;
let demo = true;
let nearby = false;
let liveUrl = "";
let searchedDate = "";
let lastSearch = null;   // { from, to } – kad kalbos keitimas galėtų perpiešti nuorodą
let lastNotice = "";     // paskutinis serverio pranešimas (verčiamas rodant)
let shown = null;        // "search" | "explore" | null – kas dabar rodoma rezultatuose

const label = (a) => `${airportCity(a)} (${a.code})`;
const fmtTime = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
// Data kaip YYYY-MM-DD, imama tiesiai iš ISO eilutės (oro uosto vietos data, ne naršyklės laiko juostos)
const fmtDate = (iso) => iso.slice(0, 10);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https:\/\//.test(u) ? esc(u) : "#");
const fmtDur = (m) => (LANG === "en"
  ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`
  : `${Math.floor(m / 60)} val. ${String(m % 60).padStart(2, "0")} min.`);
const money = (o) => (o.currency === "EUR" || !o.currency ? "€" : o.currency);

// Rikiavimas: pagal datą (ankstyviausia pirma), kainą arba trukmę; lygiais – pagal kainą
const when = (o) => Date.parse(o.departIso);
function byKey(kind, duration) {
  const key = { depart: when, price: (o) => o.price, duration }[kind];
  return (a, b) => key(a) - key(b) || a.price - b.price || when(a) - when(b);
}

// Oro uostų pasiūlymai laukeliuose (pagal pasirinktą kalbą)
function fillAirports() {
  $("airports").innerHTML = AIRPORTS.map((a) => `<option value="${esc(label(a))}">${esc(airportCountry(a))}</option>`).join("");
}

function findAirport(text) {
  const t0 = text.trim().toLowerCase();
  const code = t0.match(/\(([a-z]{3})\)/)?.[1] ?? (t0.length === 3 ? t0 : null);
  const names = (a) => [a.city, EN_CITY[a.code]].filter(Boolean).map((n) => n.toLowerCase());
  return AIRPORTS.find((a) => a.code.toLowerCase() === code) ?? AIRPORTS.find((a) => names(a).some((n) => n.startsWith(t0)));
}

// Datos
const iso = (d) => d.toISOString().slice(0, 10);
const today = new Date();
$("date").min = iso(today);
// „Kur nuskristi?“ ir „Savaitgalis“: nebūtina data (tuščia = bet kada)
$("exDate").min = iso(today);
$("wkDate").min = iso(today);
$("date").value = iso(new Date(today.getTime() + 14 * 864e5));
$("returnDate").min = $("date").value;

document.querySelectorAll("input[name=trip]").forEach((r) =>
  r.addEventListener("change", () => {
    const isReturn = document.querySelector("input[name=trip]:checked").value === "return";
    $("returnField").hidden = !isReturn;
    if (isReturn && !$("returnDate").value) $("returnDate").value = iso(new Date(new Date($("date").value).getTime() + 7 * 864e5));
  })
);

// Vietos nustatymas -> artimiausias oro uostas
function nearestAirport(lat, lon) {
  return AIRPORTS.reduce((best, a) => (haversineKm({ lat, lon }, a) < haversineKm({ lat, lon }, best) ? a : best));
}
function locateInto(input) {
  if (!navigator.geolocation) return ($("status").textContent = t("locUnsupported"));
  $("status").textContent = t("locating");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const a = nearestAirport(pos.coords.latitude, pos.coords.longitude);
      input.value = label(a);
      $("status").textContent = t("nearestAirport", { name: label(a) });
    },
    () => ($("status").textContent = t("locFail")),
    { timeout: 8000 }
  );
}
$("locate").addEventListener("click", () => locateInto($("from")));
$("exLocate").addEventListener("click", () => locateInto($("exFrom")));
$("wkLocate").addEventListener("click", () => locateInto($("wkFrom")));

$("swap").addEventListener("click", () => {
  [$("from").value, $("to").value] = [$("to").value, $("from").value];
});

// Demo pranešimas (su serverio klaida, jei buvo)
function setDemoNote() {
  $("demoNote").innerHTML = (lastNotice ? `${esc(errText(lastNotice))} ` : "") + t("demo");
}

// Paieška
$("search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const from = findAirport($("from").value), to = findAirport($("to").value);
  if (!from || !to) return ($("status").textContent = t("pickAirports"));
  if (from.code === to.code) return ($("status").textContent = t("sameAirport"));

  $("results").innerHTML = "";
  shown = null;
  $("toolbar").hidden = true;
  $("liveLink").hidden = true;
  $("calendarBox").hidden = true;
  $("status").textContent = t("searching", { from: airportCity(from), to: airportCity(to) });
  const isReturn = document.querySelector("input[name=trip]:checked").value === "return";
  let result;
  try {
    result = await searchFlights({
      from: from.code, to: to.code, date: $("date").value, adults: +$("adults").value || 1,
      returnDate: isReturn ? $("returnDate").value : "",
    });
  } catch (err) {
    return ($("status").textContent = t("failFlights"));
  }
  offers = result.offers;
  demo = result.demo;
  nearby = !!result.nearby;
  searchedDate = $("date").value;
  liveUrl = result.liveUrl || "";
  lastSearch = { from, to };
  lastNotice = result.notice || "";
  offers.forEach((o) => (o.from = from.code, o.to = to.code));
  $("demoNote").hidden = !demo;
  $("priceNote").hidden = demo || offers.length === 0;
  setDemoNote();
  render();
  showLive();
  renderCalendar($("date").value);
});

function showLive() {
  const el = $("liveLink");
  el.hidden = demo || !liveUrl || !lastSearch;
  if (el.hidden) return;
  const { from, to } = lastSearch;
  el.innerHTML = `${t("liveText")} <a href="${safeUrl(liveUrl)}" target="_blank" rel="noopener noreferrer">` +
    `${esc(t("liveLink", { from: from.code, to: to.code, date: searchedDate }))}</a>`;
}

document.querySelectorAll("#sortChips .chip").forEach((c) =>
  c.addEventListener("click", () => {
    sort = c.dataset.sort;
    document.querySelectorAll("#sortChips .chip").forEach((x) => x.classList.toggle("active", x === c));
    render();
  })
);
$("directOnly").addEventListener("change", render);

function render() {
  shown = "search";
  let list = offers.filter((o) => !$("directOnly").checked || o.stops === 0);
  list = [...list].sort(byKey(sort, (o) => o.durationMin));

  $("toolbar").hidden = offers.length === 0;
  const exactN = list.filter((o) => o.exact).length;
  $("status").textContent = !list.length
    ? t("noResults")
    : demo
      ? t("foundN", { n: list.length })
      : exactN
        ? t("yourDay", { a: exactN, b: list.length - exactN })
        : t("noneForDay", { n: list.length });
  const cheapest = Math.min(...list.map((o) => o.price));

  const card = (o) => `
    <article class="offer">
      <div>
        <div class="airline">${esc(o.airline)}${o.exact ? `<span class="tag">${t("tagYourDate")}</span>` : ""}${o.price === cheapest ? `<span class="tag">${t("tagCheapest")}</span>` : ""}</div>
        <div class="times">
          <span class="t">${o.timeUnknown ? fmtDate(o.departIso) : (o.departLocal ?? fmtTime(o.departIso))}</span>
          <span class="line"><span>${o.durationMin ? fmtDur(o.durationMin) : t("timeUnknown")}</span></span>
          ${o.departLocal || o.timeUnknown ? "" : `<span class="t">${fmtTime(o.arriveIso)}</span>`}
        </div>
        <div class="meta">${o.from} → ${o.to} · ${stopsText(o.stops)}${
          o.returnIso ? ` · ${t("metaDepart", { d: fmtDate(o.departIso) })} · ${t("metaReturn", { d: fmtDate(o.returnIso) })}` : demo ? "" : ` · ${fmtDate(o.departIso)}`}</div>
      </div>
      <div class="buy">
        <div class="price">${o.price} ${money(o)}</div>
        <div class="pl">${o.returnIso ? t("priceRound") : t("priceOne")}</div>
        <a href="${safeUrl(o.url)}" target="_blank" rel="noopener noreferrer">${demo ? t("buyAirline", { a: esc(o.airline) }) : t("checkBuy")}</a>
      </div>
    </article>`;

  // Pirmiausia jūsų pasirinkta data, po jos – kitos siūlomos datos
  const head = (title, n) => `<h3 class="grouphead">${esc(title)}<span>${n}</span></h3>`;
  if (demo) {
    $("results").innerHTML = list.map(card).join("");
    return;
  }
  const exact = list.filter((o) => o.exact);
  const others = list.filter((o) => !o.exact);
  $("results").innerHTML =
    (exact.length ? head(t("groupYourDate", { d: searchedDate }), exact.length) + exact.map(card).join("") : "") +
    (others.length ? head(exact.length ? t("groupOthers") : t("groupNone"), others.length) + others.map(card).join("") : "");
}

// ---- Režimai: paieška / „Kur nuskristi?“ ----
function setMode(name) {
  if (name === true) name = "explore";
  if (name === false) name = "search";
  [["modeSearch", "search"], ["modeExplore", "explore"], ["modeWeekend", "weekend"]]
    .forEach(([id, key]) => $(id).classList.toggle("active", key === name));
  $("search").hidden = name !== "search";
  $("explore").hidden = name !== "explore";
  $("weekend").hidden = name !== "weekend";
  $("toolbar").hidden = true;
  $("exToolbar").hidden = true;
  $("liveLink").hidden = true;
  $("calendarBox").hidden = true;
  exState = null;
  shown = null;
  $("results").innerHTML = "";
  $("status").textContent = "";
  $("demoNote").hidden = true;
  $("priceNote").hidden = true;
}
$("modeSearch").addEventListener("click", () => setMode("search"));
$("modeExplore").addEventListener("click", () => setMode("explore"));
$("modeWeekend").addEventListener("click", () => setMode("weekend"));

$("explore").addEventListener("submit", async (e) => {
  e.preventDefault();
  const from = findAirport($("exFrom").value);
  if (!from) return ($("status").textContent = t("pickFrom"));
  const budget = Math.max(0, +$("exBudget").value || 0);
  $("results").innerHTML = "";
  shown = null;
  $("exToolbar").hidden = true;
  $("status").textContent = t("searchingDest", { from: airportCity(from) });
  let result;
  try {
    result = await exploreFlights({ from: from.code, date: $("exDate").value, budget, direct: $("exDirect").checked });
  } catch (err) {
    return ($("status").textContent = t("failDest"));
  }
  demo = result.demo;
  lastNotice = result.notice || "";
  $("demoNote").hidden = !demo;
  setDemoNote();
  $("priceNote").hidden = demo || result.destinations.length === 0;
  exState = { kind: "explore", list: result.destinations, from, budget };
  renderExplore();
});

$("weekend").addEventListener("submit", async (e) => {
  e.preventDefault();
  const from = findAirport($("wkFrom").value);
  if (!from) return ($("status").textContent = t("pickFrom"));
  const budget = Math.max(0, +$("wkBudget").value || 0);
  const wkDay = $("wkDate").value;
  if (wkDay && ![5, 6].includes(new Date(`${wkDay}T12:00:00Z`).getUTCDay())) return ($("status").textContent = t("weekendDayWarn"));
  $("results").innerHTML = "";
  shown = null;
  $("exToolbar").hidden = true;
  $("status").textContent = t("searchingWeekend", { from: airportCity(from) });
  let result;
  try {
    result = await weekendFlights({ from: from.code, date: wkDay, budget, direct: $("wkDirect").checked });
  } catch (err) {
    return ($("status").textContent = t("failWeekend"));
  }
  demo = result.demo;
  lastNotice = result.notice || "";
  $("demoNote").hidden = !demo;
  setDemoNote();
  $("priceNote").hidden = demo || result.destinations.length === 0;
  exState = { kind: "weekend", list: result.destinations, from, budget };
  renderExplore();
});

document.querySelectorAll("#exSortChips .chip").forEach((c) =>
  c.addEventListener("click", () => {
    exSort = c.dataset.sort;
    document.querySelectorAll("#exSortChips .chip").forEach((x) => x.classList.toggle("active", x === c));
    if (exState) renderExplore();
  })
);

function renderExplore() {
  shown = "explore";
  const { from, budget, kind } = exState;
  const weekend = kind === "weekend";
  const list = [...exState.list].sort(byKey(exSort));
  const cheapest = Math.min(...list.map((o) => o.price));
  $("exToolbar").hidden = list.length === 0;
  const budgetText = budget ? t("destBudget", { b: budget }) : "";
  $("status").textContent = list.length
    ? t(weekend ? "weekendStatus" : "destStatus", { from: airportCity(from), budget: budgetText, n: list.length })
    : t(weekend ? "noWeekend" : "noDest");
  const wd = (isoDay) => WEEKDAYS[LANG][new Date(`${isoDay.slice(0, 10)}T12:00:00Z`).getUTCDay()];
  $("results").innerHTML = list.map((o) => {
    const dates = weekend
      ? `${wd(o.departIso)} ${fmtDate(o.departIso)} → ${wd(o.returnIso)} ${fmtDate(o.returnIso)} · ${nightsText(o.nights)}`
      : fmtDate(o.departIso);
    return `
    <article class="offer dest">
      <div>
        <div class="name">${esc(destName(o.dest))}${o.price === cheapest ? `<span class="tag">${t("tagCheapestF")}</span>` : ""}</div>
        <div class="meta">${from.code} → ${esc(o.dest)} · ${dates} · ${stopsText(o.stops)} · ${esc(o.airline)}</div>
      </div>
      <div class="buy">
        <div class="price">${t("priceFrom", { p: `${o.price} ${money(o)}` })}</div>
        ${weekend ? `<div class="pl">${t("priceRound")}</div>` : ""}
        <a href="${safeUrl(o.url)}" target="_blank" rel="noopener noreferrer">${demo ? t("buyAirline", { a: esc(o.airline) }) : t("checkBuy")}</a>
      </div>
    </article>`;
  }).join("");
}

// ---- Kainų kalendorius: pigiausia kaina kiekvienai dienai aplink pasirinktą datą ----
const WEEKDAYS = { lt: ["Sk", "Pr", "An", "Tr", "Kt", "Pn", "Št"], en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] };
const addDays = (isoDay, n) => iso(new Date(new Date(`${isoDay}T12:00:00Z`).getTime() + n * 864e5));

function renderCalendar(selected) {
  const box = $("calendarBox");
  box.hidden = demo || offers.length === 0;
  if (box.hidden) return;
  const cheapestByDay = new Map();
  for (const o of offers) {
    const day = o.departIso.slice(0, 10);
    if (!cheapestByDay.has(day) || o.price < cheapestByDay.get(day)) cheapestByDay.set(day, o.price);
  }
  const todayIso = iso(new Date());
  let start = addDays(selected, -3);
  if (start < todayIso) start = todayIso;
  const days = Array.from({ length: 21 }, (_, i) => addDays(start, i));
  const prices = days.map((d) => cheapestByDay.get(d)).filter((p) => p != null);
  const min = prices.length ? Math.min(...prices) : null;
  $("calTitle").textContent = t("calTitle", { a: days[0].slice(0, 7), b: days[days.length - 1].slice(0, 7) }) +
    (min != null ? t("calMin", { m: min }) : "");
  $("calendar").innerHTML = days.map((d) => {
    const p = cheapestByDay.get(d);
    const wd = WEEKDAYS[LANG][new Date(`${d}T12:00:00Z`).getUTCDay()];
    const cls = ["day", d === selected ? "sel" : "", p == null ? "none" : "", p != null && p === min ? "cheap" : ""].join(" ").trim();
    return `<button type="button" class="${cls}" data-day="${d}" role="option" aria-selected="${d === selected}" title="${d}">` +
      `<small>${wd} ${d.slice(5, 7)}</small><b>${d.slice(8, 10)}</b><span>${p != null ? `${p} €` : "—"}</span></button>`;
  }).join("");
  const sel = $("calendar").querySelector(".sel");
  if (sel) sel.scrollIntoView({ inline: "center", block: "nearest" });
}

$("calendar").addEventListener("click", (e) => {
  const btn = e.target.closest(".day");
  if (!btn) return;
  const oldDate = $("date").value;
  const newDay = btn.dataset.day;
  if (newDay === oldDate) return;
  $("date").value = newDay;
  // „Į abi puses“: paliekame tą pačią kelionės trukmę
  if (document.querySelector("input[name=trip]:checked").value === "return" && $("returnDate").value) {
    const stay = Math.round((new Date($("returnDate").value) - new Date(oldDate)) / 864e5);
    $("returnDate").value = addDays(newDay, Math.max(stay, 1));
  }
  $("search").requestSubmit();
});

// ---- Kalbos keitimas ----
function setLang(code) {
  window.LANG = code;
  try { localStorage.setItem("lang", code); } catch (e) { /* privatus režimas */ }
  applyStatic();
  fillAirports();
  if (!$("demoNote").hidden) setDemoNote();
  if (shown === "search") {
    render();
    showLive();
    if (!$("calendarBox").hidden) renderCalendar($("date").value);
  } else if (shown === "explore" && exState) {
    renderExplore();
  }
}
document.querySelectorAll(".lang").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

// Pradinis užpildymas pagal išsaugotą / naršyklės kalbą
applyStatic();
fillAirports();
