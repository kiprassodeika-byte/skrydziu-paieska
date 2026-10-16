const $ = (id) => document.getElementById(id);
let offers = [];
let sort = "price";
let demo = true;
let nearby = false;

const label = (a) => `${a.city} (${a.code})`;
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso) => new Date(iso).toLocaleDateString("lt-LT", { month: "short", day: "numeric" });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https:\/\//.test(u) ? esc(u) : "#");
const fmtDur =(m) => `${Math.floor(m / 60)} val. ${String(m % 60).padStart(2, "0")} min.`;

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
$("locate").addEventListener("click", () => {
  if (!navigator.geolocation) return ($("status").textContent = "Naršyklė nepalaiko vietos nustatymo.");
  $("status").textContent = "Nustatoma jūsų vieta…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const a = nearestAirport(pos.coords.latitude, pos.coords.longitude);
      $("from").value = label(a);
      $("status").textContent = `Artimiausias oro uostas: ${a.city} (${a.code})`;
    },
    () => ($("status").textContent = "Nepavyko nustatyti vietos. Įveskite išvykimo miestą ranka."),
    { timeout: 8000 }
  );
});

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
  offers.forEach((o) => (o.from = from.code, o.to = to.code));
  $("demoNote").hidden = !demo;
  $("priceNote").hidden = demo || offers.length === 0;
  $("demoNote").innerHTML = (result.notice ? `${result.notice} ` : "") +
    "Rodomi <strong>demo duomenys</strong>, ne tikros kainos. Įrašykite Travelpayouts raktus į <code>.env</code> (žr. README).";
  render();
});

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
  const key = { price: (o) => o.price, duration: (o) => o.durationMin, depart: (o) => o.departIso }[sort];
  list = [...list].sort((a, b) => (key(a) > key(b) ? 1 : -1));

  $("toolbar").hidden = offers.length === 0;
  $("status").textContent = !list.length
    ? "Pagal šiuos kriterijus skrydžių nerasta. Pabandykite kitą datą arba artimiausią didesnį miestą."
    : nearby
      ? `Pasirinktai dienai kainų nerasta, rodome artimiausias datas (${list.length}).`
      : `Rasta skrydžių: ${list.length}`;
  const cheapest = Math.min(...list.map((o) => o.price));

  $("results").innerHTML = list.map((o) => `
    <article class="offer">
      <div>
        <div class="airline">${esc(o.airline)}${o.price === cheapest ? '<span class="tag">Pigiausias</span>' : ""}</div>
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
