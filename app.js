const $ = (id) => document.getElementById(id);
let offers = [];
let sort = "depart";
let exSort = "depart";
let exState = null;
let demo = true;
let nearby = false;
let liveUrl = "";

const label = (a) => `${a.city} (${a.code})`;
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" });
// Data kaip YYYY-MM-DD, imama tiesiai iš ISO eilutės (oro uosto vietos data, ne naršyklės laiko juostos)
const fmtDate = (iso) => iso.slice(0, 10);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https:\/\//.test(u) ? esc(u) : "#");
const fmtDur =(m) => `${Math.floor(m / 60)} val. ${String(m % 60).padStart(2, "0")} min.`;

// Rikiavimas: pagal datą (ankstyviausia pirma), kainą arba trukmę; lygiais – pagal kainą
const when = (o) => Date.parse(o.departIso);
function byKey(kind, duration) {
  const key = { depart: when, price: (o) => o.price, duration }[kind];
  return (a, b) => key(a) - key(b) || a.price - b.price || when(a) - when(b);
}

// Oro uostų pasiūlymai laukeliuose
$("airports").innerHTML = AIRPORTS.map((a) => `<option value="${label(a)}">${a.country}</option>`).join("");

function findAirport(text) {
  const t = text.trim().toLowerCase();
  const code = t.match(/\(([a-z]{3})\)/)?.[1] ?? (t.length === 3 ? t : null);
  return AIRPORTS.find((a) => a.code.toLowerCase() === code) ?? AIRPORTS.find((a) => a.city.toLowerCase().startsWith(t));
}

// Datos
const iso = (d) => d.toISOString().slice(0, 10);
const today = new Date();
$("date").min = iso(today);
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
  if (!navigator.geolocation) return ($("status").textContent = "Naršyklė nepalaiko vietos nustatymo.");
  $("status").textContent = "Nustatoma jūsų vieta…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const a = nearestAirport(pos.coords.latitude, pos.coords.longitude);
      input.value = label(a);
      $("status").textContent = `Artimiausias oro uostas: ${a.city} (${a.code})`;
    },
    () => ($("status").textContent = "Nepavyko nustatyti vietos. Įveskite išvykimo miestą ranka."),
    { timeout: 8000 }
  );
}
$("locate").addEventListener("click", () => locateInto($("from")));
$("exLocate").addEventListener("click", () => locateInto($("exFrom")));

$("swap").addEventListener("click", () => {
  [$("from").value, $("to").value] = [$("to").value, $("from").value];
});

// Paieška
$("search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const from = findAirport($("from").value), to = findAirport($("to").value);
  if (!from || !to) return ($("status").textContent = "Pasirinkite oro uostus iš pasiūlymų sąrašo.");
  if (from.code === to.code) return ($("status").textContent = "Išvykimo ir atvykimo vietos negali sutapti.");

  $("results").innerHTML = "";
  $("toolbar").hidden = true;
  $("liveLink").hidden = true;
  $("status").textContent = `Ieškoma skrydžių ${from.city} → ${to.city}…`;
  const isReturn = document.querySelector("input[name=trip]:checked").value === "return";
  let result;
  try {
    result = await searchFlights({
      from: from.code, to: to.code, date: $("date").value, adults: +$("adults").value || 1,
      returnDate: isReturn ? $("returnDate").value : "",
    });
  } catch (err) {
    return ($("status").textContent = "Nepavyko gauti skrydžių. Bandykite dar kartą.");
  }
  offers = result.offers;
  demo = result.demo;
  nearby = !!result.nearby;
  liveUrl = result.liveUrl || "";
  offers.forEach((o) => (o.from = from.code, o.to = to.code));
  $("demoNote").hidden = !demo;
  $("priceNote").hidden = demo || offers.length === 0;
  $("demoNote").innerHTML = (result.notice ? `${result.notice} ` : "") +
    "Rodomi <strong>demo duomenys</strong>, ne tikros kainos. Įrašykite Travelpayouts raktus į <code>.env</code> (žr. README).";
  render();
  showLive(from, to);
});

function showLive(from, to) {
  const el = $("liveLink");
  el.hidden = demo || !liveUrl;
  if (el.hidden) return;
  const date = $("date").value;
  el.innerHTML = `Neradote savo skrydžio? Talpykloje būna ne visi. <a href="${safeUrl(liveUrl)}" target="_blank" rel="noopener noreferrer">` +
    `Peržiūrėti visus skrydžius ${esc(from.code)} → ${esc(to.code)} ${esc(date)} (gyva paieška) ↗</a>`;
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
  let list = offers.filter((o) => !$("directOnly").checked || o.stops === 0);
  list = [...list].sort(byKey(sort, (o) => o.durationMin));

  $("toolbar").hidden = offers.length === 0;
  const exactN = list.filter((o) => o.exact).length;
  $("status").textContent = !list.length
    ? "Pagal šiuos kriterijus skrydžių nerasta. Pabandykite kitą datą arba artimiausią didesnį miestą."
    : demo
      ? `Rasta skrydžių: ${list.length}`
      : exactN
        ? `Jūsų dienai: ${exactN} · kitomis artimomis dienomis: ${list.length - exactN}`
        : `Pasirinktai dienai kainų nerasta, rodome artimiausias datas (${list.length}).`;
  const cheapest = Math.min(...list.map((o) => o.price));

  $("results").innerHTML = list.map((o) => `
    <article class="offer">
      <div>
        <div class="airline">${esc(o.airline)}${o.exact ? '<span class="tag">Jūsų data</span>' : ""}${o.price === cheapest ? '<span class="tag">Pigiausias</span>' : ""}</div>
        <div class="times">
          <span class="t">${o.departLocal ?? fmtTime(o.departIso)}</span>
          <span class="line"><span>${fmtDur(o.durationMin)}</span></span>
          ${o.departLocal ? "" : `<span class="t">${fmtTime(o.arriveIso)}</span>`}
        </div>
        <div class="meta">${o.from} → ${o.to} · ${o.stops === 0 ? "Tiesioginis" : `${o.stops} persėdimas`}${
          o.returnIso ? ` · Grįžimas ${fmtDate(o.returnIso)}` : ""}${demo ? "" : ` · ${fmtDate(o.departIso)}`}</div>
      </div>
      <div class="buy">
        <div class="price">${o.price} ${o.currency === "EUR" || !o.currency ? "€" : o.currency}</div>
        <a href="${safeUrl(o.url)}" target="_blank" rel="noopener noreferrer">${demo ? `Pirkti pas ${esc(o.airline)} ↗` : "Tikrinti kainą ir pirkti ↗"}</a>
      </div>
    </article>`).join("");
}

// ---- Režimai: paieška / „Kur nuskristi?“ ----
function setMode(explore) {
  $("modeSearch").classList.toggle("active", !explore);
  $("modeExplore").classList.toggle("active", explore);
  $("search").hidden = explore;
  $("explore").hidden = !explore;
  $("toolbar").hidden = true;
  $("exToolbar").hidden = true;
  $("liveLink").hidden = true;
  exState = null;
  $("results").innerHTML = "";
  $("status").textContent = "";
  $("demoNote").hidden = true;
  $("priceNote").hidden = true;
}
$("modeSearch").addEventListener("click", () => setMode(false));
$("modeExplore").addEventListener("click", () => setMode(true));

// Mėnesių sąrašas: „Bet kada“ + kiti 12 mėnesių
$("exMonth").innerHTML = '<option value="">Bet kada</option>' + Array.from({ length: 12 }, (_, i) => {
  const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
  const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `<option value="${value}">${d.toLocaleDateString("lt-LT", { year: "numeric", month: "long" })}</option>`;
}).join("");

$("explore").addEventListener("submit", async (e) => {
  e.preventDefault();
  const from = findAirport($("exFrom").value);
  if (!from) return ($("status").textContent = "Pasirinkite išvykimo oro uostą iš pasiūlymų sąrašo.");
  const budget = Math.max(0, +$("exBudget").value || 0);
  $("results").innerHTML = "";
  $("exToolbar").hidden = true;
  $("status").textContent = `Ieškoma krypčių iš ${from.city}…`;
  let result;
  try {
    result = await exploreFlights({ from: from.code, month: $("exMonth").value, budget, direct: $("exDirect").checked });
  } catch (err) {
    return ($("status").textContent = "Nepavyko gauti krypčių. Bandykite dar kartą.");
  }
  demo = result.demo;
  $("demoNote").hidden = !demo;
  $("demoNote").innerHTML = (result.notice ? `${result.notice} ` : "") +
    "Rodomi <strong>demo duomenys</strong>, ne tikros kainos. Įrašykite Travelpayouts raktus į <code>.env</code> (žr. README).";
  $("priceNote").hidden = demo || result.destinations.length === 0;
  exState = { list: result.destinations, from, budget };
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
  const { from, budget } = exState;
  const list = [...exState.list].sort(byKey(exSort));
  const cheapest = Math.min(...list.map((o) => o.price));
  $("exToolbar").hidden = list.length === 0;
  $("status").textContent = list.length
    ? `Kryptys iš ${from.city}${budget ? ` iki ${budget} €` : ""}: ${list.length}`
    : "Pagal šiuos kriterijus krypčių nerasta. Padidinkite biudžetą, pasirinkite „Bet kada“ arba kitą oro uostą.";
  $("results").innerHTML = list.map((o) => `
    <article class="offer dest">
      <div>
        <div class="name">${esc(destName(o.dest))}${o.price === cheapest ? '<span class="tag">Pigiausia</span>' : ""}</div>
        <div class="meta">${from.code} → ${esc(o.dest)} · ${fmtDate(o.departIso)} · ${o.stops === 0 ? "Tiesioginis" : `${o.stops} persėdimas`} · ${esc(o.airline)}</div>
      </div>
      <div class="buy">
        <div class="price">nuo ${o.price} ${o.currency === "EUR" || !o.currency ? "€" : o.currency}</div>
        <a href="${safeUrl(o.url)}" target="_blank" rel="noopener noreferrer">${demo ? `Pirkti pas ${esc(o.airline)} ↗` : "Tikrinti kainą ir pirkti ↗"}</a>
      </div>
    </article>`).join("");
}
